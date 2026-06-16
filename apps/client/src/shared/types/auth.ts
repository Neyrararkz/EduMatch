export type User = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  about: string | null;
  university: string | null;
  course: number | null;
  rating: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};