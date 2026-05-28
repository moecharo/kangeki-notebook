export type Category = '映画' | '舞台' | 'LIVE';

export interface KangekiRecord {
  id: string;
  title: string;
  category: Category;
  watchedDate: string; // YYYY-MM-DD
  imageUrl: string | null;
  staffNames: string[];
  castNames: string[];
  venue: string | null;
  tags: string[];
  review: string | null;
  ticketPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
}

export interface TmdbCredits {
  cast: { name: string; order: number }[];
  crew: { name: string; job: string }[];
}
