export interface JwtPayload {
  sub: string; // user id
  email: string | null;
  role: string;
}