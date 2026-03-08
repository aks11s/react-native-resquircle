#!/usr/bin/env node
/**
 * Switch RN version for local testing.
 * Usage: node scripts/set-rn-version.js [0.83.0]
 *    or: RN_VERSION=0.82.0 node scripts/set-rn-version.js
 *
 * After running: yarn install, then clean iOS (rm -rf example/ios/Podfile.lock Pods build) and pod install
 */
const { execSync } = require('child_process');

const RN_VERSION = process.argv[2] || process.env.RN_VERSION || '0.83.0';

// RN 0.80+ uses React 19.2, CLI 20
const minor = parseInt(RN_VERSION.split('.')[1], 10);
if (minor < 80) {
  console.error('RN 0.80+ only. Use: node scripts/set-rn-version.js 0.80.0');
  process.exit(1);
}
const [REACT_VERSION, CLI_VERSION] = ['19.2.0', '20.0.0'];

console.log(
  `Setting RN ${RN_VERSION} (React ${REACT_VERSION}, CLI ${CLI_VERSION})\n`
);

execSync('node scripts/override-rn-versions.js', {
  stdio: 'inherit',
  env: { ...process.env, RN_VERSION, REACT_VERSION, CLI_VERSION },
});
