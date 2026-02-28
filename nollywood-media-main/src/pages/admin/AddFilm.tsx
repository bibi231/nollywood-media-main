import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Film, Check, X, Home, Image, Trash2, FileVideo, Upload as UploadIcon } from 'lucide-react';

export function AddFilm() {
  const navigate = useNavigate();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    logline: '',
    synopsis: '',
    genre: '',
    release_year: new Date().getFullYear(),
    runtime_min: '',
    rating: '',
    country: 'Nigeria',
    languages_audio: 'English',
    languages_subtitles: '',
    cast: '',
    director: '',
    studio_label: '',
    tags: '',
    status: 'published',
    scheduled_for: '',
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const genres = [
    'Action', 'Comedy', 'Drama', 'Romance', 'Thriller', 'Horror',
    'Sci-Fi', 'Animation', 'Documentary', 'Fantasy', 'Adventure', 'Mystery'
  ];

  const ratings = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR'];

  useEffect(() => {
    checkAdminRole();
  }, []);

  async function checkAdminRole() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCheckingRole(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'super_admin'])
        .maybeSingle();

      setIsAdmin(!!roleData);
      setCheckingRole(false);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setCheckingRole(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5368709120) {
        setError('Video file must be less than 5GB');
        return;
      }
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }
      setVideoFile(file);
      setError(null);
    }
  };

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10485760) {
        setError('Poster image must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      setPosterFile(file);
      setError(null);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10485760) {
        setError('Thumbnail image must be less than 10MB');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      if (!posterFile) {
        setError('Please select a poster image');
        setLoading(false);
        return;
      }

      if (!videoFile) {
        setError('Please select a video file');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      setUploadProgress(10);

      const videoExt = videoFile.name.split('.').pop();
      const videoFileName = `films/${Date.now()}-video.${videoExt}`;

      const { error: videoUploadError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, videoFile);

      if (videoUploadError) throw videoUploadError;

      setUploadProgress(40);

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(videoFileName);

      const posterExt = posterFile.name.split('.').pop();
      const posterFileName = `films/${Date.now()}-poster.${posterExt}`;

      const { error: posterUploadError } = await supabase.storage
        .from('thumbnails')
        .upload(posterFileName, posterFile);

      if (posterUploadError) throw posterUploadError;

      setUploadProgress(70);

      const { data: { publicUrl: posterUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(posterFileName);

      let thumbnailPath = null;
      let thumbnailUrl = posterUrl;

      if (thumbnailFile) {
        const thumbExt = thumbnailFile.name.split('.').pop();
        const thumbFileName = `films/${Date.now()}-thumb.${thumbExt}`;

        const { error: thumbUploadError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbFileName, thumbnailFile);

        if (!thumbUploadError) {
          thumbnailPath = thumbFileName;
          const { data: { publicUrl } } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(thumbFileName);
          thumbnailUrl = publicUrl;
        }
      }

      setUploadProgress(90);

      const filmData = {
        id: `film-${Date.now()}`,
        title: formData.title,
        logline: formData.logline,
        synopsis: formData.synopsis || formData.logline,
        genre: formData.genre,
        release_year: parseInt(formData.release_year.toString()),
        runtime_min: parseInt(formData.runtime_min),
        rating: formData.rating,
        setting_region: formData.country,
        languages_audio: formData.languages_audio,
        languages_subtitles: formData.languages_subtitles || formData.languages_audio,
        cast_members: formData.cast,
        director: formData.director,
        studio_label: formData.studio_label,
        tags: formData.tags,
        video_url: videoUrl,
        poster_url: posterUrl,
        poster_path: posterFileName,
        thumbnail_url: thumbnailUrl,
        status: formData.status,
        scheduled_for: formData.status === 'scheduled' && formData.scheduled_for ? new Date(formData.scheduled_for).toISOString() : null,
        views: 0,
        created_at: new Date().toISOString(),
      };

      const { data: insertData, error: insertError } = await supabase
        .from('films')
        .insert(filmData)
        .select();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Failed to save film: ${insertError.message}. You may need admin permissions.`);
      }

      if (!insertData || insertData.length === 0) {
        throw new Error('Film was not saved. Please check your admin permissions.');
      }

      setUploadProgress(100);
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/films');
      }, 2000);
    } catch (err: any) {
      console.error('Error adding film:', err);
      setError(err.message || 'Failed to add film');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Film Added Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            The film has been added to your catalog.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to films list...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Film</h1>
          <p className="text-gray-600">Add a new film to your catalog</p>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {!checkingRole && !isAdmin && (
        <div className="mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
          <div className="flex items-start gap-3">
            <X className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-1">Admin Access Required</p>
              <p className="text-sm text-yellow-700">
                You need admin permissions to add films. Your uploads will fail without admin role.
                Please contact an administrator to grant you access.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
          <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter film title"
              disabled={loading}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="logline"
              value={formData.logline}
              onChange={handleChange}
              required
              maxLength={150}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="One-line summary (max 150 characters)"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.logline.length}/150</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Synopsis
            </label>
            <textarea
              name="synopsis"
              value={formData.synopsis}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Detailed description"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genre <span className="text-red-500">*</span>
            </label>
            <select
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select genre</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <select
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select rating</option>
              {ratings.map(rating => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Release Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="release_year"
              value={formData.release_year}
              onChange={handleChange}
              required
              min="1900"
              max={new Date().getFullYear() + 5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Runtime (minutes) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="runtime_min"
              value={formData.runtime_min}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country/Region <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio Language <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="languages_audio"
              value={formData.languages_audio}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle Languages
            </label>
            <input
              type="text"
              name="languages_subtitles"
              value={formData.languages_subtitles}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Comma-separated"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Director
            </label>
            <input
              type="text"
              name="director"
              value={formData.director}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Studio Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="studio_label"
              value={formData.studio_label}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cast
            </label>
            <input
              type="text"
              name="cast"
              value={formData.cast}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Comma-separated cast members"
              disabled={loading}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Comma-separated tags"
              disabled={loading}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileVideo className="inline w-4 h-4 mr-1" />
              Video File <span className="text-red-500">*</span>
            </label>

            {!videoFile ? (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="w-full px-4 py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-gray-600"
                disabled={loading}
              >
                <div className="flex flex-col items-center">
                  <FileVideo className="w-10 h-10 mb-3 text-gray-400" />
                  <span className="text-sm font-medium">Click to select video file</span>
                  <span className="text-xs mt-2">MP4, WebM, MOV (max 5GB)</span>
                </div>
              </button>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileVideo className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-gray-900 font-medium">{videoFile.name}</p>
                    <p className="text-sm text-gray-600">{formatFileSize(videoFile.size)}</p>
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
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoSelect}
              className="hidden"
            />
          </div>

          {loading && (
            <div className="md:col-span-2">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between text-sm text-blue-900 mb-2">
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Please don't close this page while uploading...
                </p>
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image className="inline w-4 h-4 mr-1" />
              Poster Image <span className="text-red-500">*</span>
            </label>

            {!posterFile ? (
              <button
                type="button"
                onClick={() => posterInputRef.current?.click()}
                className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-gray-600"
                disabled={loading}
              >
                <div className="flex flex-col items-center">
                  <Image className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Click to select poster image</span>
                  <span className="text-xs mt-1">JPG, PNG, WebP (max 10MB)</span>
                </div>
              </button>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="text-gray-900 font-medium">{posterFile.name}</p>
                    <p className="text-sm text-gray-600">{formatFileSize(posterFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPosterFile(null)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                  disabled={loading}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
            <input
              ref={posterInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePosterSelect}
              className="hidden"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image className="inline w-4 h-4 mr-1" />
              Thumbnail Image (Optional)
            </label>

            {!thumbnailFile ? (
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-gray-600"
                disabled={loading}
              >
                <div className="flex flex-col items-center">
                  <Image className="w-6 h-6 mb-2" />
                  <span className="text-sm">Click to select thumbnail (uses poster if empty)</span>
                </div>
              </button>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="text-gray-900 font-medium">{thumbnailFile.name}</p>
                    <p className="text-sm text-gray-600">{formatFileSize(thumbnailFile.size)}</p>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled Premiere</option>
            </select>
          </div>

          {formData.status === 'scheduled' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Premiere Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="scheduled_for"
                value={formData.scheduled_for}
                onChange={handleChange}
                required={formData.status === 'scheduled'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/films')}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !posterFile || !videoFile}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding Film...
              </>
            ) : (
              <>
                <Film className="h-4 w-4" />
                Add Film
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
