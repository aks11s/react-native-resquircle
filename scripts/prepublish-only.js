#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

if (fs.existsSync('lib/typescript')) {
  execSync('del-cli "lib/**/*.d.ts.map"', { stdio: 'inherit' });
}
