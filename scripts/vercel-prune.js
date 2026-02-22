#!/usr/bin/env node
/**
 * On Vercel:
 * - Remove @imgly/background-removal-node to stay under the 250 MB serverless limit.
 * - Remove bcrypt (native addon) so only bcryptjs is used; avoids "invalid ELF header" on Linux.
 */
if (process.env.VERCEL) {
  const fs = require('fs');
  const path = require('path');
  const cwd = process.cwd();

  const toPrune = [
    { dir: path.join(cwd, 'node_modules', '@imgly'), name: '@imgly (250 MB limit)' },
    { dir: path.join(cwd, 'node_modules', 'bcrypt'), name: 'bcrypt (use bcryptjs on Linux)' },
  ];

  for (const { dir, name } of toPrune) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true });
        console.log('Pruned', name);
      }
    } catch (e) {
      console.warn('Could not prune', name, ':', e.message);
    }
  }
}
