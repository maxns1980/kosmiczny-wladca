
import jwt from 'jsonwebtoken';
import type { HandlerEvent } from '@netlify/functions';

export interface AuthPayload {
    userId: string;
}

export const verifyToken = (event: HandlerEvent): AuthPayload | null => {
    const authHeader = event.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
        console.error('JWT_SECRET not set on server');
        return null;
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded as AuthPayload;
    } catch (err) {
        console.error('JWT verification failed:', err);
        return null;
    }
};
