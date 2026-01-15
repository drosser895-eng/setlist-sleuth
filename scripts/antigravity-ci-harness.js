/**
 * scripts/antigravity-ci-harness.js
 * 
 * Simulates Antigravity Merkle root anchoring and webhook delivery for staging validation.
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

const SERVER_WEBHOOK_URL = process.env.SERVER_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.ANTIGRAVITY_WEBHOOK_SECRET || 'test_secret';

function computeHMAC(payload, secret) {
    return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
}

async function simulateWebhook(matchId, root) {
    if (!SERVER_WEBHOOK_URL) {
        console.log(`[LOCAL] No SERVER_WEBHOOK_URL set. Skipping webhook for Match ${matchId}`);
        return;
    }

    const payload = {
        event: 'anchor.succeeded',
        data: {
            match_id: matchId,
            merkle_root: root,
            anchor_tx: `0x${crypto.randomBytes(32).toString('hex')}`,
            timestamp: new Date().toISOString()
        }
    };

    const signature = computeHMAC(payload, WEBHOOK_SECRET);

    console.log(`>>> Sending webhook to ${SERVER_WEBHOOK_URL}...`);
    try {
        const res = await fetch(SERVER_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Antigravity-Signature': signature
            },
            body: JSON.stringify(payload)
        });
        console.log(`Status: ${res.status} ${res.statusText}`);
    } catch (err) {
        console.error(`Webhook error: ${err.message}`);
    }
}

async function runHarness() {
    const args = process.argv.slice(2);
    const count = parseInt(args.find(a => a.startsWith('--count='))?.split('=')[1] || '1');
    const doWebhook = args.includes('--simulate-webhook');

    console.log(`Starting Antigravity Harness (Count: ${count})...`);

    for (let i = 0; i < count; i++) {
        const matchId = `match_${Math.floor(Math.random() * 100000)}`;
        const root = `0x${crypto.randomBytes(32).toString('hex')}`;
        
        console.log(`Anchored Root for ${matchId}: ${root}`);
        
        if (doWebhook) {
            await simulateWebhook(matchId, root);
        }
    }
    console.log('Harness run complete.');
}

runHarness().catch(console.error);
