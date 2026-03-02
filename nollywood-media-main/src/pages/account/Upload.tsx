import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Upload as UploadIcon, Image, CheckCircle, AlertTriangle, X, FileVideo, Trash2, Sparkles, Wand2, Info, ChevronRight, Zap, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    const selectedFile = files.find(f => f.type.startsWith('video/') || f.type.startsWith('audio/'));
    if (selectedFile) {
      if (selectedFile.size > 2147483648) { setError('File must be less than 2GB'); return; }
      setVideoFile(selectedFile);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2147483648) { setError('File must be less than 2GB'); return; }
      if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) { setError('Invalid file type'); return; }
      setVideoFile(file);
      setError(null);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10485760) { setError('Thumbnail must be less than 10MB'); return; }
      setThumbnailFile(file); setError(null);
    }
  };

  const extractThumbnailFromVideo = (file: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata'; video.muted = true; video.playsInline = true;
      video.onloadeddata = () => video.currentTime = Math.min(2, video.duration * 0.1);
      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth; canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(null); return; }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => { URL.revokeObjectURL(video.src); resolve(blob); }, 'image/jpeg', 0.85);
        } catch { resolve(null); }
      };
      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setError('Log in to upload'); return; }
    if (!videoFile) { setError('Select a file'); return; }
    if (!formData.creator_confirmation) { setError('Confirm ownership'); return; }

    setLoading(true); setError(null); setUploadProgress(0);

    try {
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const bucketName = (videoFile.type.startsWith('audio/')) ? 'audio-content' : 'user-content';

      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, videoFile, {
          onProgress: (percent: number) => setUploadProgress(Math.round(percent * 0.8)),
        });

      if (uploadError) throw uploadError;
      setUploadProgress(80);

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
          thumbnailPath = thumbData.path;
          thumbnailUrl = supabase.storage.from('thumbnails').getPublicUrl(thumbFileName).data.publicUrl;
        }
      }

      setUploadProgress(90);
      const videoUrl = supabase.storage.from(bucketName).getPublicUrl(fileName).data.publicUrl;

      const { error: dbError } = await supabase
        .from('user_content_uploads')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          video_filename: videoFile.name,
          video_path: fileName,
          video_url: videoUrl,
          thumbnail_path: thumbnailPath,
          thumbnail_url: thumbnailUrl,
          file_size: videoFile.size,
          status: 'processing',
          moderation_status: 'pending',
          visibility: 'private',
        });

      if (dbError) throw dbError;
      setUploadProgress(100); setSuccess(true);
      setTimeout(() => navigate('/account/my-uploads'), 2000);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center shadow-2xl"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Upload Successful</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Your content is being processed. It will be live after a safety review.
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-mono uppercase tracking-widest">
            <Loader2 className="w-4 h-4 animate-spin text-green-500" />
            Redirecting to Studio
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <UploadIcon className="w-5 h-5 text-red-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tighter">
            Creator <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">Launchpad</span>
          </h1>
        </div>
        <p className="text-slate-400 max-w-2xl">
          Deploy your cinematic creations to the Nollywood global audience. High-fidelity uploads & AI generation in one place.
        </p>
      </motion.div>

      {/* Premium Tab Bar */}
      <div className="flex p-1.5 bg-slate-950/50 backdrop-blur-md rounded-2xl border border-white/5 mb-10 w-fit">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'upload'
            ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
            : 'text-slate-500 hover:text-slate-300'
            }`}
        >
          <UploadIcon className="w-4 h-4" /> Traditional Upload
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'ai'
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
            : 'text-slate-500 hover:text-slate-300'
            }`}
        >
          <Sparkles className="w-4 h-4" /> AI Generation
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'ai' ? (
          <motion.div
            key="ai-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <AIVideoGenerator onSaved={() => navigate('/account/my-uploads')} />
          </motion.div>
        ) : (
          <motion.div
            key="upload-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Form Side */}
              <div className="lg:col-span-12 space-y-8">
                <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-5 space-y-6">
                      {/* File Dropzone */}
                      <div className="relative group">
                        <div
                          className={`relative border-2 border-dashed rounded-[32px] p-12 text-center transition-all ${dragActive
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-white/10 hover:border-white/20 bg-slate-900/50 backdrop-blur-xl shadow-2xl'
                            } ${videoFile ? 'border-green-500/50' : ''}`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          {!videoFile ? (
                            <div className="flex flex-col items-center">
                              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <FileVideo className="w-10 h-10 text-slate-400 group-hover:text-red-400 transition-colors" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">Deploy Media</h3>
                              <p className="text-slate-500 text-sm mb-6 px-4">Drag assets here or browse your local storage (Up to 2GB)</p>
                              <button
                                type="button"
                                onClick={() => videoInputRef.current?.click()}
                                className="px-8 py-3 bg-white text-black rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors shadow-xl"
                                disabled={loading}
                              >
                                Select Video File
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center py-6">
                              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                                <CheckCircle className="w-10 h-10 text-green-400" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-1 truncate max-w-xs">{videoFile.name}</h3>
                              <p className="text-slate-500 text-xs font-mono mb-8 uppercase tracking-widest">{Math.round(videoFile.size / 1024 / 1024)} MB · Ready</p>
                              <button
                                type="button"
                                onClick={() => setVideoFile(null)}
                                className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 rounded-xl text-xs font-bold transition-all uppercase tracking-widest"
                                disabled={loading}
                              >
                                Replace File
                              </button>
                            </div>
                          )}
                          <input ref={videoInputRef} type="file" accept="video/*,audio/*" onChange={handleVideoSelect} className="hidden" />
                        </div>
                      </div>

                      {/* Thumbnail Selector */}
                      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest leading-none">
                          <Image className="w-4 h-4 text-orange-400" /> Cover Imagery
                        </label>
                        {!thumbnailFile ? (
                          <button
                            type="button"
                            onClick={() => thumbnailInputRef.current?.click()}
                            className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/5 rounded-2xl hover:border-white/10 transition-colors group"
                            disabled={loading}
                          >
                            <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:bg-white/10 transition-colors">
                              <Image className="w-6 h-6 text-slate-500" />
                            </div>
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Select Thumbnail</span>
                          </button>
                        ) : (
                          <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
                            <img src={URL.createObjectURL(thumbnailFile)} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setThumbnailFile(null)}
                                className="p-3 bg-red-600 rounded-full text-white shadow-xl hover:scale-110 transition-transform"
                              >
                                <Trash2 className="w-6 h-6" />
                              </button>
                            </div>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-600 mt-4 text-center italic uppercase leading-tight font-mono">Auto-extraction will be used if left blank</p>
                        <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailSelect} className="hidden" />
                      </div>
                    </div>

                    <div className="lg:col-span-7 space-y-8">
                      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl flex flex-col h-full">
                        <div className="space-y-8 flex-1">
                          <div className="relative">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">
                              <Zap className="w-3.5 h-3.5 text-red-500" /> Production Title
                            </label>
                            <input
                              name="title"
                              type="text"
                              value={formData.title}
                              onChange={handleChange}
                              required
                              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-xl font-bold placeholder-slate-700 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-inner"
                              placeholder="Enter Cinematic Title..."
                              disabled={loading}
                            />
                            <div className="absolute top-1/2 -translate-y-1/2 right-6 px-3 py-1 rounded-md bg-white/5 text-[10px] text-slate-600 font-mono pointer-events-none uppercase">
                              {formData.title.length}/100
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">
                                <Info className="w-3.5 h-3.5 text-blue-400" /> Content Category
                              </label>
                              <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                disabled={loading}
                              >
                                <option value="">Select Category</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">
                                <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Meta Tags
                              </label>
                              <input
                                name="tags"
                                type="text"
                                value={formData.tags}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold placeholder-slate-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-inner"
                                placeholder="Action, 4K, Lagos..."
                                disabled={loading}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">
                              <History className="w-3.5 h-3.5 text-purple-400" /> Production Log (Description)
                            </label>
                            <textarea
                              name="description"
                              value={formData.description}
                              onChange={handleChange}
                              required
                              rows={6}
                              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm leading-relaxed placeholder-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-inner resize-none"
                              placeholder="Describe the cinematic experience, cast, and creative vision..."
                              disabled={loading}
                            />
                          </div>
                        </div>

                        {/* Terms & Submit Area */}
                        <div className="mt-10 pt-8 border-t border-white/5 space-y-8">
                          <div className="relative p-6 rounded-2xl bg-white/5 border border-white/5 overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                              <AlertTriangle className="w-12 h-12 text-slate-400" />
                            </div>
                            <div className="flex items-start gap-4">
                              <input
                                name="creator_confirmation"
                                type="checkbox"
                                checked={formData.creator_confirmation}
                                onChange={handleChange}
                                required
                                className="mt-1 w-5 h-5 rounded-md border-white/10 bg-black/40 text-red-600 focus:ring-red-500"
                                disabled={loading}
                              />
                              <div className="flex-1">
                                <p className="text-xs font-bold text-white uppercase tracking-widest mb-1">Affirm Ownership & Rights</p>
                                <p className="text-[10px] text-slate-500 leading-normal">By checking this, you certify that all assets are your original property and comply with global safety standards. Unauthorized copyright deployment results in account termination.</p>
                              </div>
                            </div>
                          </div>

                          {loading && (
                            <div className="space-y-4">
                              <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Deploying Asset Pack</span>
                                </div>
                                <span className="text-xl font-black text-white font-mono">{uploadProgress}%</span>
                              </div>
                              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${uploadProgress}%` }}
                                  className="h-full bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => navigate('/account')}
                              className="px-8 py-4 text-slate-500 font-bold text-sm uppercase tracking-widest hover:text-white transition-colors"
                              disabled={loading}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={loading || !videoFile}
                              className="flex-1 relative group overflow-hidden px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl text-white font-black text-lg uppercase tracking-tighter shadow-2xl hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] transition-all disabled:opacity-30 disabled:grayscale"
                            >
                              <div className="flex items-center justify-center gap-3 relative">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
                                {loading ? 'Transmitting Assets...' : 'Initialize Deployment'}
                              </div>
                            </button>
                          </div>

                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                            >
                              <AlertTriangle className="w-4 h-4" /> {error}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
