
import type { Handler } from "@netlify/functions";
import jwt from 'jsonwebtoken';

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        console.error('JWT_SECRET environment variable not set.');
        return { statusCode: 500, body: 'Server configuration error.' };
    }
    
    const { userId: clientUserId } = JSON.parse(event.body || '{}');
    const userId = clientUserId || crypto.randomUUID();

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

    return {
        statusCode: 200,
        body: JSON.stringify({ token, userId }),
        headers: { 'Content-Type': 'application/json' }
    };
};

export { handler };
