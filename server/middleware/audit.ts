import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'omnisync-secret-key-2024';

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            
            // Only log actions for non-admins
            if (decoded && decoded.role !== 'admin') {
               // Obscure passwords in audit log if they exist
               let payload = req.method !== 'DELETE' ? { ...req.body } : null;
               if (payload && payload.password) {
                 payload.password = '[REDACTED]';
               }

               pool.query(
                 'INSERT INTO audit_logs (user_id, user_email, action, resource, details) VALUES ($1, $2, $3, $4, $5)',
                 [decoded.id, decoded.email, req.method, req.originalUrl.split('?')[0], JSON.stringify(payload)]
               ).catch(err => console.error('Audit Log DB Error:', err));
            }
          } catch (e) {
            // Token parsing fails, we ignore
          }
        }
      }
    });
  }
  next();
}
