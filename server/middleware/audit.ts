import { Response, NextFunction } from 'express';
import pool from '../db';
import { AuthRequest } from './auth';

export function auditMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 400) return;
      if (!req.user) return;
      const path = req.originalUrl.split('?')[0];
      if (path.includes('/auth/login')) return;

      pool.query(
        'INSERT INTO activities (user_name, action, target) VALUES ($1, $2, $3)',
        [req.user.display_name || req.user.email, `${req.method} ${path}`, req.user.email]
      ).catch((err) => console.error('Activity log error:', err.message));
    });
  }
  next();
}
