// scripts/override-rn-versions.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RN_VERSION = process.env.RN_VERSION;
const REACT_VERSION = process.env.REACT_VERSION;
const CLI_VERSION = process.env.CLI_VERSION;

if (!RN_VERSION || !REACT_VERSION || !CLI_VERSION) {
  console.error('Missing required env variables');
  process.exit(1);
}

console.log(
  `Overriding versions to: RN=${RN_VERSION}, React=${REACT_VERSION}, CLI=${CLI_VERSION}`
);

function checkPackageVersion(packageName, version) {
  try {
    execSync(`npm view ${packageName}@${version} version`, {
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function resolveBabelPresetVersion(rnVersion) {
  if (checkPackageVersion('@react-native/babel-preset', rnVersion)) {
    return rnVersion;
  }
  const [major, minor, patch] = rnVersion.split('.').map(Number);
  const fallbacks = [
    `${major}.${minor}.${patch + 1}`,
    `${major}.${minor}.${Math.max(0, patch - 1)}`,
    `${major}.${minor}.0`,
  ];
  for (const fbVersion of fallbacks) {
    if (checkPackageVersion('@react-native/babel-preset', fbVersion)) {
      return fbVersion;
    }
  }
  try {
    return execSync(
      `npm view @react-native/babel-preset@${major}.${minor}.x version`,
      { stdio: 'pipe' }
    )
      .toString()
      .trim();
  } catch {
    throw new Error(`No suitable @react-native/babel-preset for ${rnVersion}`);
  }
}

function resolveOptionalPackage(packageName, preferredVersion) {
  if (checkPackageVersion(packageName, preferredVersion)) {
    return preferredVersion;
  }
  const [major, minor] = preferredVersion.split('.');
  const prefix = `${major}.${minor}.`;
  try {
    const out = execSync(`npm view ${packageName} versions --json`, {
      stdio: 'pipe',
    }).toString();
    const versions = JSON.parse(out);
    const matching = versions.filter((v) => v.startsWith(prefix));
    if (!matching.length) return null;
    matching.sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const d = (pa[i] || 0) - (pb[i] || 0);
        if (d !== 0) return d;
      }
      return 0;
    });
    return matching[matching.length - 1];
  } catch {
    return null;
  }
}

// --- Root package.json ---
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.devDependencies = packageJson.devDependencies || {};

packageJson.devDependencies['react-native'] = RN_VERSION;
packageJson.devDependencies['@react-native-community/cli'] = CLI_VERSION;
packageJson.devDependencies.react = REACT_VERSION;
packageJson.devDependencies['react-test-renderer'] = REACT_VERSION;

const babelPresetVersion = resolveBabelPresetVersion(RN_VERSION);
packageJson.devDependencies['@react-native/babel-preset'] = babelPresetVersion;
console.log(`✅ Root: @react-native/babel-preset@${babelPresetVersion}`);

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Root package.json updated');

// --- Example package.json ---
const examplePath = path.join(__dirname, '..', 'example', 'package.json');
const exampleJson = JSON.parse(fs.readFileSync(examplePath, 'utf8'));

exampleJson.dependencies = exampleJson.dependencies || {};
exampleJson.devDependencies = exampleJson.devDependencies || {};

exampleJson.dependencies.react = REACT_VERSION;
exampleJson.dependencies['react-native'] = RN_VERSION;

exampleJson.devDependencies['@react-native-community/cli'] = CLI_VERSION;
exampleJson.devDependencies['@react-native-community/cli-platform-android'] =
  CLI_VERSION;
exampleJson.devDependencies['@react-native-community/cli-platform-ios'] =
  CLI_VERSION;
exampleJson.devDependencies['@react-native/babel-preset'] = babelPresetVersion;

const metroVersion = checkPackageVersion(
  '@react-native/metro-config',
  RN_VERSION
)
  ? RN_VERSION
  : resolveOptionalPackage('@react-native/metro-config', RN_VERSION) ??
    babelPresetVersion;
exampleJson.devDependencies['@react-native/metro-config'] = metroVersion;

const tsConfigVersion = checkPackageVersion(
  '@react-native/typescript-config',
  RN_VERSION
)
  ? RN_VERSION
  : resolveOptionalPackage('@react-native/typescript-config', RN_VERSION);
if (tsConfigVersion) {
  exampleJson.devDependencies['@react-native/typescript-config'] =
    tsConfigVersion;
}

const reactMajor = parseInt(REACT_VERSION.split('.')[0], 10);
exampleJson.devDependencies['@types/react'] =
  reactMajor >= 19 ? '^19.2.0' : '^18.2.0';

fs.writeFileSync(examplePath, JSON.stringify(exampleJson, null, 2));
console.log('✅ Example package.json updated');
