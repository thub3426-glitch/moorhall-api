import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import ApiError from './apiError';

interface TokenPayload {
  id: number;
  email: string;
  role: string;
  fullName?: string;
  status?: string;
}

const generateAccessToken = (payload: TokenPayload, secret: string, expiresIn = '15m'): string => {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

const generateRefreshToken = (payload: TokenPayload, secret: string, expiresIn = '30d'): string => {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

const verifyToken = (token: string, secret: string): TokenPayload => {
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid token');
    }
    throw ApiError.unauthorized('Authentication failed');
  }
};

const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};

export { generateAccessToken, generateRefreshToken, generateResetToken, verifyToken, decodeToken };
export type { TokenPayload };