
import { Handler, HandlerEvent } from '@netlify/functions';
import jwt from 'jsonwebtoken';
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

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing request body' }) };
    }

    try {
        const { gameState: clientGameState, action } = JSON.parse(event.body);

        if (!clientGameState) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing game state in request' }) };
        }

        if (clientGameState.username !== username) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Token does not match game state owner.' }) };
        }

        // Process offline progress on the received state
        let { updatedState, notifications } = processOffline(clientGameState);
        let gameState: GameState = updatedState;

        // If there's an action, handle it on top of the offline-processed state
        if (action && action.type) {
            const actionResult = handleAction(gameState, action);
            gameState = actionResult.gameState;
            notifications.push(...actionResult.notifications);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                gameState: gameState,
                notifications,
            }),
        };
    } catch (error: any) {
        console.error("Game logic error:", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: error.message || 'Invalid action or state' }),
        };
    }
};

export { handler };
