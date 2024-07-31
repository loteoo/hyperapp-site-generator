#!/usr/bin/env node
const path = require('path');
const { spawn } = require('child_process');

const viteBinary = path.resolve(__dirname, 'node_modules/.bin/vite');
const viteConfig = path.resolve(__dirname, 'vite.config.ts');
const args = process.argv.slice(2).concat(['--config', viteConfig]);

spawn(viteBinary, args, {
  stdio: 'inherit',
  shell: true,
});
