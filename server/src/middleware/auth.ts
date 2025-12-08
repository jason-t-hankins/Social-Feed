import { Request, Response, NextFunction } from 'express';
import { extractToken, verifyToken } from '../auth';

/**
 * Express middleware to authenticate JWT tokens
 * 
 * Extracts and verifies JWT from Authorization header.
 * Attaches user info to request if valid.
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const payload = verifyToken(token);
    // Attach user info to request
    (req as any).user = payload;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional JWT authentication
 * Attaches user if token is valid, but doesn't block request
 */
export function optionalJWT(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);

  if (token) {
    try {
      const payload = verifyToken(token);
      (req as any).user = payload;
    } catch (error) {
      // Invalid token - just continue without user
      console.warn('Invalid token provided:', error);
    }
  }

  next();
}
