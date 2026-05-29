export interface User {
  id: string;
  email: string;
  subscription_status: 'free' | 'premium';
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  is_kids_mode: boolean;
}

export interface Content {
  id: string;
  title: string;
  description: string;
  type: 'movie' | 'show';
  thumbnail_url: string;
  trailer_url: string | null;
  stream_url: string;
  genre: string;
  release_year: number;
  is_featured: boolean;
  rating?: string;
  duration?: number;
  intro_start?: number;
  intro_end?: number;
  outro_start?: number;
  outro_end?: number;
}
