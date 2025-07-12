import { Handler, HandlerEvent } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import { getUserState, writeUserState } from '../lib/db';
import { processOffline } from '../lib/gameLogic';
import { GameState } from '../lib/types';
import { handleAction } from '../lib/actionHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key-for-development';

const handler: Handler = async (event: HandlerEvent) => {
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
    }

    const { username } = decoded;
    if (!username) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token payload' }) };
    }

    let gameState = await getUserState(username);
    if (!gameState) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Game state not found' }) };
    }
    
    // Process offline progress before any action or state return
    const { updatedState, notifications } = processOffline(gameState);
    gameState = updatedState;

    if (event.httpMethod === 'GET') {
        // Just getting the state, save the offline-processed state
        await writeUserState(username, gameState);
        return {
            statusCode: 200,
            body: JSON.stringify({ gameState, notifications }),
        };
    }

    if (event.httpMethod === 'POST') {
        if (!event.body) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing action body' }) };
        }
        try {
            const { type, payload } = JSON.parse(event.body);
            const actionResult = handleAction(gameState, { type, payload });
            
            await writeUserState(username, actionResult.gameState);

            return {
                statusCode: 200,
                body: JSON.stringify({
                    gameState: actionResult.gameState,
                    notifications: [...notifications, ...actionResult.notifications],
                }),
            };
        } catch (error: any) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: error.message || 'Invalid action' }),
            };
        }
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
};

export { handler };
