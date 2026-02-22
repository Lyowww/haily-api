#!/usr/bin/env node
/**
 * On Vercel, remove @imgly/background-removal-node after install to stay under the 250 MB
 * serverless limit. The app uses dynamic import and handles missing module (cutout is skipped).
 */
if (process.env.VERCEL) {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(process.cwd(), 'node_modules', '@imgly');
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
      console.log('Pruned node_modules/@imgly for Vercel (250 MB limit).');
    }
  } catch (e) {
    console.warn('Could not prune @imgly:', e.message);
  }
}
