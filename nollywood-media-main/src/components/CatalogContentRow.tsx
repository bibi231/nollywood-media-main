import { Film, FilterSpec, SortKey } from "../lib/catalog";
import { useCatalog } from "../context/CatalogProvider";
import { WatchlistButton } from "./WatchlistButton";

interface CatalogContentRowProps {
  title: string;
  where?: FilterSpec;
  sort?: SortKey;
  limit?: number;
  emptyText?: string;
  onSelect?: (film: Film) => void;
}

export function CatalogContentRow({
  title,
  where,
  sort,
  limit = 12,
  emptyText = "No titles available",
  onSelect,
}: CatalogContentRowProps) {
  const { filter } = useCatalog();
  const items = filter(where ?? {}, sort).slice(0, limit);

  if (items.length === 0) {
    return (
      <div className="mb-8 px-4">
        <h2 className="mb-4 text-2xl font-bold text-white">{title}</h2>
        <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/50">
          <p className="text-sm text-slate-500">{emptyText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 px-4">
      <h2 className="mb-4 text-2xl font-bold text-white">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
        {items.map((film) => (
          <div
            key={film.id}
            onClick={() => onSelect?.(film)}
            className="group flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-800 bg-slate-900 transition-all hover:scale-105 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20"
            style={{ width: "200px" }}
          >
            <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="absolute top-2 right-2 z-10">
                <WatchlistButton filmId={film.id} size="sm" />
              </div>
              {film.poster_url ? (
                <>
                  <img
                    src={film.poster_url}
                    alt={film.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback =
                        e.currentTarget.parentElement?.querySelector(".fallback-poster");
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-yellow-400 drop-shadow-lg">
                      {film.genre}
                    </div>
                    <h3
                      className="mt-1 line-clamp-2 text-base font-black uppercase leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                      style={{
                        textShadow:
                          "2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.5)",
                      }}
                    >
                      {film.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <span className="rounded bg-red-600 px-1.5 py-0.5">{film.rating}</span>
                      <span>{film.release_year}</span>
                    </div>
                  </div>
                </>
              ) : null}
              <div
                className={
                  film.poster_url
                    ? "fallback-poster absolute inset-0 hidden flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-3 text-center"
                    : "absolute inset-0 flex flex-col items-center justify-center p-3 text-center"
                }
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {film.genre}
                </div>
                <div className="mt-2 text-sm font-bold leading-tight">{film.title}</div>
                <div className="mt-2 text-xs text-slate-400">
                  {film.release_year} • {film.runtime_min}m
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
