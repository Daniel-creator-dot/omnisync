import dotenv from 'dotenv';

dotenv.config();

// Prefer JWT_SECRET from the environment. The fallback matches the previous
// public default in auth.ts so existing sessions still verify if Render has
// no JWT_SECRET set.
export const JWT_SECRET = process.env.JWT_SECRET || 'omnisync-secret-key-2024';
