
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { db } from './db';
import type { GameState } from "../../types";
import { verifyToken } from './auth-utils';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    const auth = verifyToken(event);
    if (!auth) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const { userId } = auth;

    try {
        const { gameState } = JSON.parse(event.body || '{}') as { gameState: GameState };
        if (!gameState) {
            return { statusCode: 400, body: 'Game state is required' };
        }

        if (typeof gameState.resources?.metal !== 'number') {
            throw new Error("Invalid game state provided");
        }
        
        gameState.lastSaveTime = Date.now();
        
        await db.set(userId, gameState);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true }),
            headers: { 'Content-Type': 'application/json' },
        };

    } catch (error) {
        console.error('Error in save-game-state:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

export { handler };
