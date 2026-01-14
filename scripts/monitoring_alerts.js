#!/usr/bin/env node
// monitoring_alerts.js v2 - check anchors and notify
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const MAPPING_PATH = process.env.MAPPING_PATH || './scores/anchor_mapping.json';
const WEBHOOK_URL = process.env.MONITOR_WEBHOOK_URL;

async function checkHealth() {
    if (!fs.existsSync(MAPPING_PATH)) {
        if (WEBHOOK_URL) await notify('🚨 CRITICAL: Anchor mapping file is MISSING.');
        process.exit(1);
    }

    const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
    const lastUpdate = new Date(mapping.generatedAt);
    const diffHours = (new Date() - lastUpdate) / (1000 * 60 * 60);

    if (diffHours > 24) {
        if (WEBHOOK_URL) await notify(`⚠️ WARNING: No anchors for ${diffHours.toFixed(1)} hours.`);
    } else {
        console.log('✅ Pipeline healthy.');
    }
}

async function notify(text) {
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
    } catch (e) { console.error('Notify failed:', e.message); }
}

checkHealth();
