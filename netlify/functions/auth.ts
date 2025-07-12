import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import { userExists, createUserState, getUserState } from '../lib/db';
import { GameState } from '../lib/types';

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
        let gameState: GameState | null;

        if (action === 'create') {
            if (doesUserExist) {
                return { statusCode: 409, body: JSON.stringify({ error: 'Nazwa użytkownika już istnieje.' }) };
            }
            gameState = await createUserState(username);
        } else if (action === 'login') {
            if (!doesUserExist) {
                return { statusCode: 404, body: JSON.stringify({ error: 'Użytkownik nie istnieje.' }) };
            }
            gameState = await getUserState(username);
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
        }

        if (!gameState) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Nie można załadować danych gracza.' }) };
        }
        
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });

        return {
            statusCode: 200,
            body: JSON.stringify({ token, username, gameState }),
        };

    } catch (error) {
        console.error("Auth error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};

export { handler };