import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Upload as UploadIcon, Film, Image, CheckCircle, AlertTriangle, X, FileVideo, Trash2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AIVideoGenerator } from '../../components/AIVideoGenerator';

export function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    creator_confirmation: false,
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'ai'>('upload');

  const categories = [
    'Film', 'Short Film', 'Series Episode', 'Documentary',
    'Animation', 'Music Video', 'Audio Track', 'Podcast', 'Tutorial', 'Other'
  ];

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

    const files = Array.from(e.dataTransfer.files);
    const selectedFile = files.find(f => f.type.startsWith('video/') || f.type.startsWith('audio/'));

    if (selectedFile) {
      if (selectedFile.size > 2147483648) {
        setError('File must be less than 2GB');
        return;
      }
      setVideoFile(selectedFile);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2147483648) {
        setError('File must be less than 2GB');
        return;
      }
      const isAudio = formData.category === 'Audio Track' || formData.category === 'Podcast';
      if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
        setError('Please select a valid video or audio file');
        return;
      }
      setVideoFile(file);
      setError(null);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10485760) {
        setError('Thumbnail must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      setThumbnailFile(file);
      setError(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // ═══ Auto-extract thumbnail from video at 2s mark ═══
  const extractThumbnailFromVideo = (file: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        video.currentTime = Math.min(2, video.duration * 0.1); // 2s or 10% in
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(null); return; }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(video.src);
            resolve(blob);
          }, 'image/jpeg', 0.85);
        } catch {
          resolve(null);
        }
      };

      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to upload content');
      return;
    }

    if (!videoFile) {
      setError('Please select a video file to upload');
      return;
    }

    if (!formData.creator_confirmation) {
      setError('You must confirm content ownership and guidelines');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const bucketName = (videoFile.type.startsWith('audio/')) ? 'audio-content' : 'user-content';

      // ═══ STEP 1: Upload video with real progress tracking ═══
      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, videoFile, {
          onProgress: (percent: number) => setUploadProgress(Math.round(percent * 0.8)), // 0-80%
        });

      if (uploadError) throw new Error(typeof uploadError === 'string' ? uploadError : 'Upload failed');

      setUploadProgress(80);

      // ═══ STEP 2: Handle thumbnail (user-provided or auto-extracted) ═══
      let thumbnailPath = null;
      let thumbnailUrl = null;
      const thumbToUpload = thumbnailFile || (videoFile.type.startsWith('video/') ? await extractThumbnailFromVideo(videoFile) : null);

      if (thumbToUpload) {
        const thumbExt = thumbnailFile ? thumbnailFile.name.split('.').pop() : 'jpg';
        const thumbFileName = `${user.id}/${Date.now()}-thumb.${thumbExt}`;

        const { data: thumbData, error: thumbError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbFileName, thumbToUpload instanceof File ? thumbToUpload : new File([thumbToUpload], `thumb.${thumbExt}`, { type: 'image/jpeg' }));

        if (!thumbError && thumbData) {
          thumbnailPath = thumbData.path || thumbFileName;
          thumbnailUrl = thumbData.publicUrl || supabase.storage.from('thumbnails').getPublicUrl(thumbFileName).data.publicUrl;
        }
      }

      setUploadProgress(90);

      // ═══ STEP 3: Build video URL ═══
      const videoUrl = uploadResult?.publicUrl ||
        supabase.storage.from(bucketName).getPublicUrl(fileName).data.publicUrl;

      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // ═══ STEP 4: Save to database ═══
      const { data: uploadData, error: dbError } = await supabase
        .from('user_content_uploads')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          tags: tagsArray,
          video_filename: videoFile.name,
          video_path: fileName,
          video_url: videoUrl,
          thumbnail_path: thumbnailPath,
          thumbnail_url: thumbnailUrl,
          file_size: videoFile.size,
          status: 'processing',
          moderation_status: 'pending',
          visibility: 'private',
        })
        .select();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error(`Failed to save upload: ${typeof dbError === 'string' ? dbError : dbError.message || 'Database error'}`);
      }

      if (!uploadData || uploadData.length === 0) {
        throw new Error('Upload was not saved to database.');
      }

      setUploadProgress(100);
      setSuccess(true);

      setTimeout(() => {
        navigate('/account/my-uploads');
      }, 2000);
    } catch (err: any) {
      console.error('Upload error details:', err);
      let errorMessage = 'Failed to upload content';

      const errorStr = typeof err === 'string' ? err : (err.message || '');

      if (errorStr.includes('rate limit') || errorStr.includes('429')) {
        errorMessage = 'Upload rate limit reached. Please wait a few minutes before trying again.';
      } else if (errorStr.includes('File type') || errorStr.includes('not allowed')) {
        errorMessage = errorStr;
      } else if (errorStr.includes('too large') || errorStr.includes('Maximum size')) {
        errorMessage = errorStr;
      } else if (errorStr.includes('storage') || errorStr.includes('upload')) {
        errorMessage = `Storage Error: ${errorStr}. Please check your connection and try again.`;
      } else if (errorStr.includes('database') || errorStr.includes('insert')) {
        errorMessage = `Database Error: ${errorStr}. Your file may have uploaded, but was not recorded.`;
      } else {
        errorMessage = errorStr || 'An unexpected error occurred during upload.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Upload Successful!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your video has been uploaded and is pending moderation. You'll be notified once it's reviewed.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting to your uploads...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Upload Content
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Share your content with the community.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'upload'
            ? 'border-red-600 text-red-600 dark:text-red-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          <UploadIcon className="h-4 w-4" />
          Upload Video
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          data-tab="ai"
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'ai'
            ? 'border-purple-600 text-purple-600 dark:text-purple-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          <Sparkles className="h-4 w-4" />
          AI Generate
        </button>
      </div>

      {/* AI Generate Tab */}
      {activeTab === 'ai' && (
        <AIVideoGenerator onSaved={() => navigate('/account/my-uploads')} />
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Content Guidelines
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Upload original content you have rights to</li>
                  <li>• Maximum file size: 2GB</li>
                  <li>• Supported formats: MP4, WebM, MOV</li>
                  <li>• No copyrighted material without permission</li>
                  <li>• Content must comply with Terms of Service</li>
                  <li>• All uploads are reviewed before publishing</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
              <X className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 hover:text-red-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileVideo className="h-5 w-5" />
                Video File
              </h3>

              {!videoFile ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragActive
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                      <UploadIcon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium mb-2">
                      Drag and drop your video here
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      or click to browse (MP4, WebM, MOV up to 2GB)
                    </p>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                      disabled={loading}
                    >
                      Select Video File
                    </button>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={handleVideoSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileVideo className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">{videoFile.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatFileSize(videoFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVideoFile(null)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                    disabled={loading}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter video title"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Describe your video content"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.description.length}/1000 characters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="action, drama, thriller"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Separate with commas
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Image className="inline w-4 h-4 mr-1" />
                Thumbnail (Optional)
              </label>

              {!thumbnailFile ? (
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-gray-600 dark:text-gray-400"
                  disabled={loading}
                >
                  <div className="flex flex-col items-center">
                    <Image className="w-8 h-8 mb-2" />
                    <span className="text-sm">Click to select thumbnail image</span>
                    <span className="text-xs mt-1">JPG, PNG (max 10MB)</span>
                  </div>
                </button>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">{thumbnailFile.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatFileSize(thumbnailFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setThumbnailFile(null)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                    disabled={loading}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
            </div>

            {loading && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex justify-between text-sm text-blue-900 dark:text-blue-100 mb-2">
                  <span>Uploading video...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Please don't close this page while uploading...
                </p>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-start gap-3">
                <input
                  id="creator_confirmation"
                  name="creator_confirmation"
                  type="checkbox"
                  checked={formData.creator_confirmation}
                  onChange={handleChange}
                  required
                  className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="creator_confirmation" className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">I confirm that:</span>
                  <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• I own the rights to this content or have permission to upload it</li>
                    <li>• This content does not infringe on any copyrights or trademarks</li>
                    <li>• This content complies with the platform's Terms of Service</li>
                    <li>• I understand that inappropriate content will be removed</li>
                  </ul>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate('/account')}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !videoFile}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-4 w-4" />
                    Upload Video
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
