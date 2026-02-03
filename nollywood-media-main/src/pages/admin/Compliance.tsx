import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, Globe, Users, BarChart3, CheckCircle, Clock } from 'lucide-react';

interface Film {
  id: string;
  title: string;
}

interface ContentRating {
  film_id: string;
  suggested_rating: string;
  applied_rating: string | null;
  descriptors: string[];
  territories_allowed: string[];
  territories_pending: string[];
  parental_tier: string;
}

export function AdminCompliance() {
  const [films, setFilms] = useState<Film[]>([]);
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [rating, setRating] = useState<ContentRating | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilms();
  }, []);

  useEffect(() => {
    if (selectedFilm) {
      loadRating(selectedFilm.id);
    }
  }, [selectedFilm]);

  async function loadFilms() {
    const { data } = await supabase
      .from('films')
      .select('id, title')
      .limit(20);

    if (data && data.length > 0) {
      setFilms(data);
      setSelectedFilm(data[0]);
    }
    setLoading(false);
  }

  async function loadRating(filmId: string) {
    const { data } = await supabase
      .from('content_ratings')
      .select('*')
      .eq('film_id', filmId)
      .maybeSingle();

    if (data) {
      setRating(data);
    } else {
      setRating({
        film_id: filmId,
        suggested_rating: 'PG-13',
        applied_rating: null,
        descriptors: ['Mild Language', 'Romantic Scenes', 'Betrayal Theme'],
        territories_allowed: ['NG', 'GH', 'KE', 'ZA'],
        territories_pending: ['US', 'GB', 'EU'],
        parental_tier: 'teen'
      });
    }
  }

  async function applyRating() {
    if (!selectedFilm || !rating) return;

    const { error } = await supabase
      .from('content_ratings')
      .upsert({
        ...rating,
        applied_rating: rating.suggested_rating,
        reviewed_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (!error) {
      alert('Rating applied successfully!');
      loadRating(selectedFilm.id);
    }
  }

  const ratings = ['G', 'PG', 'PG-13', 'R', 'NC-17'];

  const descriptorOptions = [
    'Mild Language',
    'Strong Language',
    'Romantic Scenes',
    'Intense Sequences',
    'Betrayal Theme',
    'Urban Nightlife',
    'Alcohol Use',
    'Drug References',
    'Violence',
    'Sexual Content'
  ];

  const complianceData = [
    { territory: 'Nigeria/Ghana/Kenya', status: 'approved', color: 'bg-green-500' },
    { territory: 'South Africa', status: 'approved', color: 'bg-green-500' },
    { territory: 'United States', status: 'pending', color: 'bg-amber-500' },
    { territory: 'United Kingdom', status: 'pending', color: 'bg-amber-500' },
    { territory: 'European Union', status: 'review', color: 'bg-blue-500' }
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="mb-8">
        <nav className="text-sm text-slate-400 mb-2">
          Admin / <span className="text-white">Ratings & Compliance</span>
        </nav>
        <h1 className="text-3xl font-bold text-white">Ratings & Compliance Center</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Title
              </label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedFilm?.id || ''}
                onChange={(e) => {
                  const film = films.find(f => f.id === e.target.value);
                  if (film) setSelectedFilm(film);
                }}
              >
                {films.map((film) => (
                  <option key={film.id} value={film.id}>
                    {film.title} ({film.id})
                  </option>
                ))}
              </select>
            </div>

            {selectedFilm && rating && (
              <>
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-6 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-6 h-6 text-blue-400" />
                        <h3 className="text-xl font-semibold text-white">
                          {selectedFilm.title}
                        </h3>
                      </div>
                      <p className="text-slate-400 text-sm mb-4">ID: {selectedFilm.id}</p>

                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-sm text-slate-400 mb-1">Suggested Rating</div>
                          <div className="text-3xl font-bold text-white">
                            {rating.suggested_rating}
                          </div>
                        </div>
                        <div className="h-12 w-px bg-slate-700"></div>
                        <div className="flex-1">
                          <div className="text-sm text-slate-400 mb-2">Evidence Tags</div>
                          <div className="flex flex-wrap gap-2">
                            {rating.descriptors.slice(0, 3).map((desc, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded"
                              >
                                {desc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={applyRating}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-lg whitespace-nowrap"
                    >
                      Apply {rating.suggested_rating}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 rounded-lg p-6">
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-400" />
                      Descriptors & Scenes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {descriptorOptions.map((desc) => (
                        <button
                          key={desc}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            rating.descriptors.includes(desc)
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                          onClick={() => {
                            if (rating.descriptors.includes(desc)) {
                              setRating({
                                ...rating,
                                descriptors: rating.descriptors.filter(d => d !== desc)
                              });
                            } else {
                              setRating({
                                ...rating,
                                descriptors: [...rating.descriptors, desc]
                              });
                            }
                          }}
                        >
                          {desc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-6">
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-400" />
                      Parental Tier
                    </h4>
                    <div className="space-y-2">
                      {['kids', 'teen', 'mature'].map((tier) => (
                        <button
                          key={tier}
                          onClick={() => setRating({ ...rating, parental_tier: tier })}
                          className={`w-full p-3 rounded-lg text-left font-medium transition-colors ${
                            rating.parental_tier === tier
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {tier.charAt(0).toUpperCase() + tier.slice(1)}+
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Territories / Windows
            </h3>

            <div className="space-y-3">
              {complianceData.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{item.territory}</div>
                    <div className="text-xs text-slate-400 capitalize">{item.status}</div>
                  </div>
                  {item.status === 'approved' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              Compliance Overview
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">Approved Territories</span>
                  <span className="text-sm font-medium text-green-400">2/5</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">Pending Review</span>
                  <span className="text-sm font-medium text-amber-400">2/5</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">In Review</span>
                  <span className="text-sm font-medium text-blue-400">1/5</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
