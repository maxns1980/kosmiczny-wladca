
import { Handler, HandlerEvent } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import { getUserState, writeUserState } from '../lib/db';
import { getGlobalState, writeGlobalState } from '../lib/globalState';
import { processOffline } from '../lib/gameLogic';
import { GameState, GlobalState } from '../lib/types';
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

    let playerState = await getUserState(username);
    if (!playerState) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Game state not found for user' }) };
    }

    let globalState = await getGlobalState();
    
    const { updatedPlayerState, updatedGlobalState, notifications } = processOffline(playerState, globalState);
    let finalPlayerState = updatedPlayerState;
    let finalGlobalState = updatedGlobalState;
    const allNotifications = [...notifications];

    if (event.httpMethod === 'POST' && event.body) {
        try {
            const { type, payload } = JSON.parse(event.body);
            const actionResult = handleAction(finalPlayerState, finalGlobalState, { type, payload });
            finalPlayerState = actionResult.playerState;
            finalGlobalState = actionResult.globalState;
            allNotifications.push(...actionResult.notifications);
        } catch (error: any) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: error.message || 'Invalid action' }),
            };
        }
    }
    
    await writeUserState(username, finalPlayerState);
    await writeGlobalState(finalGlobalState);

    return {
        statusCode: 200,
        body: JSON.stringify({
            playerState: finalPlayerState,
            worldState: finalGlobalState,
            notifications: allNotifications,
        }),
    };
};

export { handler };
