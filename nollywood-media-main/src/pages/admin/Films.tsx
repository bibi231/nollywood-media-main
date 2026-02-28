import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Film {
  id: string;
  title: string;
  genre: string;
  release_year: number;
  runtime_min: number;
  rating: string;
  views: number;
  created_at: string;
}

export function AdminFilms() {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFilms();
  }, []);

  const loadFilms = async () => {
    try {
      const { data, error } = await supabase
        .from('films')
        .select('id, title, genre, release_year, runtime_min, rating, views, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFilms(data || []);
    } catch (error) {
      console.error('Error loading films:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this film?')) return;

    try {
      const { error } = await supabase.from('films').delete().eq('id', id);
      if (error) throw error;
      setFilms(films.filter((f) => f.id !== id));
    } catch (error) {
      console.error('Error deleting film:', error);
      alert('Failed to delete film');
    }
  };

  const filteredFilms = films.filter((film) =>
    (film.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (film.genre || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-red-600 mx-auto"></div>
          <p className="text-slate-400">Loading films...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Films Management</h1>
          <p className="mt-2 text-slate-400">Manage your film catalog</p>
        </div>
        <Link
          to="/admin/cms/films/new"
          className="flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Film</span>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search films..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-3 pl-11 pr-4 text-white placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-800 bg-slate-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Genre
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Runtime
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Views
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredFilms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No films found
                  </td>
                </tr>
              ) : (
                filteredFilms.map((film) => (
                  <tr key={film.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {film.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{film.genre}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{film.release_year}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{film.runtime_min} min</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="rounded bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300">
                        {film.rating}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {film.views.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/admin/films/edit/${film.id}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(film.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-600 hover:text-white transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-400">
        Showing {filteredFilms.length} of {films.length} films
      </div>
    </div>
  );
}
