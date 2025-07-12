
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
    
    const offlineResult = processOffline(gameState);
    let currentGameState = offlineResult.updatedState;
    const allNotifications = [...offlineResult.notifications];

    if (event.httpMethod === 'POST' && event.body) {
        try {
            const { type, payload } = JSON.parse(event.body);
            const actionResult = handleAction(currentGameState, { type, payload });
            currentGameState = actionResult.gameState;
            allNotifications.push(...actionResult.notifications);
        } catch (error: any) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: error.message || 'Invalid action' }),
            };
        }
    }
    
    await writeUserState(username, currentGameState);

    return {
        statusCode: 200,
        body: JSON.stringify({
            gameState: currentGameState,
            notifications: allNotifications,
        }),
    };
};

export { handler };
