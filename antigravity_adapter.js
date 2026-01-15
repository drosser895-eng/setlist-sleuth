#!/usr/bin/env node
const fs = require('fs');
if(process.argv.includes('--dry-run')) {
  console.log('Dry run: Adapter initialized.');
  process.exit(0);
}
console.log('Antigravity Adapter: Connecting to network...');
