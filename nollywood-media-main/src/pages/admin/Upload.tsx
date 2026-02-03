import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Play, CheckCircle, XCircle, Clock, FileVideo, Trash2, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VideoUpload {
  id: string;
  film_id: string | null;
  video_filename: string;
  video_path: string;
  thumbnail_path: string | null;
  file_size: number;
  duration: number | null;
  status: string;
  progress: number;
  error_message: string | null;
  created_at: string;
}

interface Film {
  id: string;
  title: string;
}

export function AdminUpload() {
  const [uploads, setUploads] = useState<VideoUpload[]>([]);
  const [films, setFilms] = useState<Film[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFilm, setSelectedFilm] = useState<string>('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUploads();
    loadFilms();

    const subscription = supabase
      .channel('video_uploads_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'video_uploads' },
        () => {
          loadUploads();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadUploads() {
    const { data } = await supabase
      .from('video_uploads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setUploads(data);
    }
  }

  async function loadFilms() {
    const { data } = await supabase
      .from('films')
      .select('id, title')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      setFilms(data);
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('video/')
    );

    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setThumbnail(file);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one video file');
      return;
    }

    if (!selectedFilm) {
      alert('Please select a film to associate this video with');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const uploadRecord = await supabase
          .from('video_uploads')
          .insert({
            film_id: selectedFilm,
            user_id: user.id,
            video_filename: file.name,
            video_path: filePath,
            file_size: file.size,
            status: 'uploading',
            progress: 0,
          })
          .select()
          .single();

        if (uploadRecord.error) throw uploadRecord.error;

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress) => {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              setUploadProgress(percent);
            },
          });

        if (uploadError) {
          await supabase
            .from('video_uploads')
            .update({
              status: 'failed',
              error_message: uploadError.message,
            })
            .eq('id', uploadRecord.data.id);
          throw uploadError;
        }

        if (thumbnail) {
          const thumbExt = thumbnail.name.split('.').pop();
          const thumbFileName = `${Date.now()}-thumb.${thumbExt}`;
          const thumbPath = `${thumbFileName}`;

          await supabase.storage
            .from('thumbnails')
            .upload(thumbPath, thumbnail);

          await supabase
            .from('video_uploads')
            .update({ thumbnail_path: thumbPath })
            .eq('id', uploadRecord.data.id);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        await supabase
          .from('films')
          .update({ video_url: publicUrl })
          .eq('id', selectedFilm);

        await supabase
          .from('video_uploads')
          .update({
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString(),
          })
          .eq('id', uploadRecord.data.id);
      }

      alert('Upload completed successfully!');
      setSelectedFiles([]);
      setThumbnail(null);
      setSelectedFilm('');
      setUploadProgress(0);
      loadUploads();
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (upload: VideoUpload) => {
    if (!confirm(`Delete upload "${upload.video_filename}"?`)) return;

    try {
      await supabase.storage
        .from('videos')
        .remove([upload.video_path]);

      if (upload.thumbnail_path) {
        await supabase.storage
          .from('thumbnails')
          .remove([upload.thumbnail_path]);
      }

      await supabase
        .from('video_uploads')
        .delete()
        .eq('id', upload.id);

      loadUploads();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Delete failed: ${error.message}`);
    }
  };

  const statusIcons = {
    uploading: Upload,
    processing: Play,
    completed: CheckCircle,
    failed: XCircle,
    queued: Clock,
  };

  const statusColors = {
    uploading: 'text-blue-400',
    processing: 'text-amber-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
    queued: 'text-slate-400',
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="mb-8">
        <nav className="text-sm text-slate-400 mb-2">
          Admin / <span className="text-white">Upload & Ingest</span>
        </nav>
        <h1 className="text-3xl font-bold text-white">Upload & Ingest Portal</h1>
        <p className="text-slate-400 mt-2">Upload videos and associate them with films in your catalog</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Upload Video Files</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Film
              </label>
              <select
                value={selectedFilm}
                onChange={(e) => setSelectedFilm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              >
                <option value="">Choose a film...</option>
                {films.map((film) => (
                  <option key={film.id} value={film.id}>
                    {film.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() => navigate('/admin/films/new')}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                + Create new film
              </button>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center">
                <div className="p-4 bg-slate-800 rounded-full mb-4">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-white font-medium mb-2">
                  Drag and drop video files here
                </p>
                <p className="text-sm text-slate-400 mb-4">
                  Supports MP4, MOV, AVI, WebM (up to 5GB per file)
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  disabled={uploading}
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium text-slate-300">Selected Files:</h3>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileVideo className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white text-sm">{file.name}</p>
                        <p className="text-slate-400 text-xs">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                      className="text-red-400 hover:text-red-300"
                      disabled={uploading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Thumbnail (Optional)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
                  disabled={uploading}
                >
                  {thumbnail ? thumbnail.name : 'Select Thumbnail'}
                </button>
                {thumbnail && (
                  <button
                    onClick={() => setThumbnail(null)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                    disabled={uploading}
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
            </div>

            {uploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-slate-300 mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedFiles([]);
                  setThumbnail(null);
                  setSelectedFilm('');
                }}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
                disabled={uploading}
              >
                Clear
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0 || !selectedFilm}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Start Upload'}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Upload History</h2>

            <div className="space-y-3">
              {uploads.map((upload) => {
                const StatusIcon = statusIcons[upload.status as keyof typeof statusIcons] || FileVideo;
                const statusColor = statusColors[upload.status as keyof typeof statusColors] || 'text-slate-400';

                return (
                  <div key={upload.id} className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition-colors">
                    <div className="flex items-start gap-4">
                      <StatusIcon className={`w-5 h-5 mt-0.5 ${statusColor}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{upload.video_filename}</div>
                        <div className="text-sm text-slate-400">
                          {formatFileSize(upload.file_size)}
                          {upload.film_id && (
                            <>
                              {' • '}
                              <button
                                onClick={() => navigate(`/admin/films/${upload.film_id}`)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                View Film
                              </button>
                            </>
                          )}
                        </div>
                        {upload.error_message && (
                          <div className="text-sm text-red-400 mt-1">{upload.error_message}</div>
                        )}
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(upload.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right flex items-start gap-3">
                        <div>
                          <div className={`text-sm font-medium capitalize ${statusColor}`}>
                            {upload.status}
                          </div>
                          {(upload.status === 'uploading' || upload.status === 'processing') && (
                            <div className="text-xs text-slate-400">
                              {upload.progress}%
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(upload)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete upload"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {(upload.status === 'uploading' || upload.status === 'processing') && (
                      <div className="mt-3">
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                            style={{ width: `${upload.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {uploads.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <FileVideo className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No uploads yet</p>
                  <p className="text-sm mt-2">Upload your first video to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-white mb-6">Upload Guide</h2>

            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <h3 className="font-semibold text-white mb-2">Supported Formats</h3>
                <ul className="space-y-1 text-slate-400">
                  <li>• MP4 (recommended)</li>
                  <li>• MOV</li>
                  <li>• AVI</li>
                  <li>• WebM</li>
                  <li>• MKV</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">File Size Limits</h3>
                <ul className="space-y-1 text-slate-400">
                  <li>• Videos: Up to 5GB</li>
                  <li>• Thumbnails: Up to 10MB</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">Upload Process</h3>
                <ol className="space-y-1 text-slate-400 list-decimal list-inside">
                  <li>Select or create a film</li>
                  <li>Choose video file(s)</li>
                  <li>Optionally add thumbnail</li>
                  <li>Click "Start Upload"</li>
                  <li>Video will be available immediately</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">Best Practices</h3>
                <ul className="space-y-1 text-slate-400">
                  <li>• Use H.264 codec for MP4</li>
                  <li>• 1080p or higher resolution</li>
                  <li>• Consistent audio levels</li>
                  <li>• Include thumbnails for better UX</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-blue-400 text-xs">
                    <strong>Note:</strong> Videos are stored securely and served with optimized delivery. Public URLs are generated automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
