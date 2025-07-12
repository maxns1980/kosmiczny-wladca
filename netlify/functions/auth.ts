import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import { userExists, createUserState } from '../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key-for-development';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing body' }) };
    }

    try {
        const { username, action } = JSON.parse(event.body);

        if (!username || !action) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing username or action' }) };
        }
        
        const doesUserExist = await userExists(username);

        if (action === 'create') {
            if (doesUserExist) {
                return { statusCode: 409, body: JSON.stringify({ error: 'Nazwa użytkownika już istnieje.' }) };
            }
            await createUserState(username);
        } else if (action === 'login') {
            if (!doesUserExist) {
                return { statusCode: 404, body: JSON.stringify({ error: 'Użytkownik nie istnieje.' }) };
            }
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
        }
        
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });

        return {
            statusCode: 200,
            body: JSON.stringify({ token, username }),
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};

export { handler };
