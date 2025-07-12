
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { db } from './db';
import type { GameState } from "../../types";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { userId, gameState } = JSON.parse(event.body || '{}') as { userId: string, gameState: GameState };
        if (!userId || !gameState) {
            return { statusCode: 400, body: 'User ID and game state are required' };
        }

        // Basic validation
        if (typeof gameState.resources?.metal !== 'number') {
            throw new Error("Invalid game state provided");
        }
        
        // Update last save time before saving
        gameState.lastSaveTime = Date.now();
        
        await db.set(userId, gameState);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Game state saved." }),
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
