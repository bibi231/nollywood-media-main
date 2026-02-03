import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FilmData {
  id: string;
  title: string;
  poster_url: string;
  logline: string;
  synopsis: string;
  genre: string;
  release_year: number;
  runtime_min: number;
  rating: string;
  setting_region: string;
  languages_audio: string;
  languages_subtitles: string;
  cast_members: string;
  director: string;
  studio_label: string;
  tags: string;
  content_type: string;
  video_url: string;
}

export function FilmEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [formData, setFormData] = useState<FilmData>({
    id: '',
    title: '',
    poster_url: '',
    logline: '',
    synopsis: '',
    genre: '',
    release_year: new Date().getFullYear(),
    runtime_min: 0,
    rating: 'PG',
    setting_region: '',
    languages_audio: '',
    languages_subtitles: '',
    cast_members: '',
    director: '',
    studio_label: '',
    tags: '',
    content_type: 'film',
    video_url: '',
  });

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      loadFilm(id);
    }
  }, [id, isNew]);

  const loadFilm = async (filmId: string) => {
    try {
      const { data, error } = await supabase
        .from('films')
        .select('*')
        .eq('id', filmId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error('Error loading film:', error);
      alert('Failed to load film');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isNew) {
        const { error } = await supabase.from('films').insert([formData]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('films')
          .update(formData)
          .eq('id', id);
        if (error) throw error;
      }

      navigate('/admin/films');
    } catch (error: any) {
      console.error('Error saving film:', error);
      alert(`Failed to save film: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'release_year' || name === 'runtime_min' ? parseInt(value) || 0 : value,
    }));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-red-600 mx-auto"></div>
          <p className="text-slate-400">Loading film...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          to="/admin/films"
          className="mb-4 inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Films</span>
        </Link>
        <h1 className="text-3xl font-bold text-white">
          {isNew ? 'Add New Film' : 'Edit Film'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="space-y-6 rounded-lg border border-slate-800 bg-slate-900 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-slate-300 mb-2">
                Film ID *
              </label>
              <input
                type="text"
                id="id"
                name="id"
                value={formData.id}
                onChange={handleChange}
                disabled={!isNew}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white disabled:opacity-50 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="poster_url" className="block text-sm font-medium text-slate-300 mb-2">
                Poster URL
              </label>
              <input
                type="url"
                id="poster_url"
                name="poster_url"
                value={formData.poster_url}
                onChange={handleChange}
                placeholder="https://example.com/poster.jpg"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="video_url" className="block text-sm font-medium text-slate-300 mb-2">
                Video URL (MP4) *
              </label>
              <input
                type="url"
                id="video_url"
                name="video_url"
                value={formData.video_url}
                onChange={handleChange}
                required
                placeholder="https://example.com/video.mp4"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
              <p className="mt-1 text-xs text-slate-400">
                Direct link to MP4 video file. Supports standard MP4 format.
              </p>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="logline" className="block text-sm font-medium text-slate-300 mb-2">
                Logline *
              </label>
              <textarea
                id="logline"
                name="logline"
                value={formData.logline}
                onChange={handleChange}
                required
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="synopsis" className="block text-sm font-medium text-slate-300 mb-2">
                Synopsis
              </label>
              <textarea
                id="synopsis"
                name="synopsis"
                value={formData.synopsis}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label htmlFor="genre" className="block text-sm font-medium text-slate-300 mb-2">
                Genre *
              </label>
              <select
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              >
                <option value="">Select Genre</option>
                <option value="Action">Action</option>
                <option value="Comedy">Comedy</option>
                <option value="Drama">Drama</option>
                <option value="Romance">Romance</option>
                <option value="Thriller">Thriller</option>
                <option value="Horror">Horror</option>
                <option value="Fantasy">Fantasy</option>
                <option value="Documentary">Documentary</option>
              </select>
            </div>

            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-slate-300 mb-2">
                Rating *
              </label>
              <select
                id="rating"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              >
                <option value="G">G</option>
                <option value="PG">PG</option>
                <option value="PG-13">PG-13</option>
                <option value="R">R</option>
                <option value="NC-17">NC-17</option>
              </select>
            </div>

            <div>
              <label htmlFor="release_year" className="block text-sm font-medium text-slate-300 mb-2">
                Release Year *
              </label>
              <input
                type="number"
                id="release_year"
                name="release_year"
                value={formData.release_year}
                onChange={handleChange}
                required
                min="1900"
                max="2100"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label htmlFor="runtime_min" className="block text-sm font-medium text-slate-300 mb-2">
                Runtime (minutes) *
              </label>
              <input
                type="number"
                id="runtime_min"
                name="runtime_min"
                value={formData.runtime_min}
                onChange={handleChange}
                required
                min="1"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label htmlFor="setting_region" className="block text-sm font-medium text-slate-300 mb-2">
                Region *
              </label>
              <input
                type="text"
                id="setting_region"
                name="setting_region"
                value={formData.setting_region}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label htmlFor="studio_label" className="block text-sm font-medium text-slate-300 mb-2">
                Studio Label *
              </label>
              <input
                type="text"
                id="studio_label"
                name="studio_label"
                value={formData.studio_label}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label htmlFor="languages_audio" className="block text-sm font-medium text-slate-300 mb-2">
                Audio Languages *
              </label>
              <input
                type="text"
                id="languages_audio"
                name="languages_audio"
                value={formData.languages_audio}
                onChange={handleChange}
                required
                placeholder="e.g. English, Igbo, Yoruba"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label htmlFor="languages_subtitles" className="block text-sm font-medium text-slate-300 mb-2">
                Subtitle Languages *
              </label>
              <input
                type="text"
                id="languages_subtitles"
                name="languages_subtitles"
                value={formData.languages_subtitles}
                onChange={handleChange}
                required
                placeholder="e.g. English, French"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label htmlFor="director" className="block text-sm font-medium text-slate-300 mb-2">
                Director
              </label>
              <input
                type="text"
                id="director"
                name="director"
                value={formData.director}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label htmlFor="cast_members" className="block text-sm font-medium text-slate-300 mb-2">
                Cast Members
              </label>
              <input
                type="text"
                id="cast_members"
                name="cast_members"
                value={formData.cast_members}
                onChange={handleChange}
                placeholder="Comma separated"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="tags" className="block text-sm font-medium text-slate-300 mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Comma separated tags"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-slate-800">
            <Link
              to="/admin/films"
              className="rounded-lg border border-slate-700 px-6 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 rounded-lg bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Film'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
