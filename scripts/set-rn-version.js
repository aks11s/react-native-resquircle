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
// RN 0.76-0.78 typically React 18.3, CLI 15.x
// RN 0.74 typically React 18.2, CLI 14.x
const minor = parseInt(RN_VERSION.split('.')[1], 10);
const [REACT_VERSION, CLI_VERSION] =
  minor >= 80
    ? ['19.2.0', '20.0.0']
    : minor >= 76
    ? ['18.3.1', '15.0.0']
    : ['18.2.0', '14.0.0'];

console.log(
  `Setting RN ${RN_VERSION} (React ${REACT_VERSION}, CLI ${CLI_VERSION})\n`
);

execSync('node scripts/override-rn-versions.js', {
  stdio: 'inherit',
  env: { ...process.env, RN_VERSION, REACT_VERSION, CLI_VERSION },
});
