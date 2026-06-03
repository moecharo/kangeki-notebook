import type { TmdbMovie, TmdbCredits } from '@/types';

const BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

export function getPosterUrl(path: string | null): string | null {
  return path ? `${IMG_BASE}${path}` : null;
}

export async function searchMovies(query: string, apiKey: string): Promise<TmdbMovie[]> {
  const url = `${BASE}/search/movie?query=${encodeURIComponent(query)}&language=ja-JP`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) throw new Error('TMDB検索に失敗しました');
  const data = await res.json();
  return data.results as TmdbMovie[];
}

export async function getMovieCredits(movieId: number, apiKey: string): Promise<TmdbCredits> {
  const url = `${BASE}/movie/${movieId}/credits?language=ja-JP`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) throw new Error('キャスト情報の取得に失敗しました');
  return res.json() as Promise<TmdbCredits>;
}
