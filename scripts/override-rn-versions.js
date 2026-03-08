const fs = require('fs');
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

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

packageJson.devDependencies = packageJson.devDependencies || {};
packageJson.devDependencies['react-native'] = RN_VERSION;
packageJson.devDependencies['@react-native-community/cli'] = CLI_VERSION;
packageJson.devDependencies.react = REACT_VERSION;
packageJson.devDependencies['react-test-renderer'] = REACT_VERSION;

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

function resolvePackageVersion(packageName, preferredVersion) {
  if (checkPackageVersion(packageName, preferredVersion))
    return preferredVersion;
  const [major, minor, patch] = preferredVersion.split('.').map(Number);
  const fallbacks = [
    `${major}.${minor}.${patch + 1}`,
    `${major}.${minor}.${Math.max(0, patch - 1)}`,
    `${major}.${minor}.0`,
  ];
  for (const v of fallbacks) {
    if (checkPackageVersion(packageName, v)) return v;
  }
  try {
    return execSync(`npm view ${packageName}@${major}.${minor}.x version`, {
      stdio: 'pipe',
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

const minor = parseInt(RN_VERSION.split('.')[1], 10);
if (minor < 80) {
  console.error('RN 0.80+ required. Your project uses an unsupported version.');
  process.exit(1);
}

const babelPresetVersion = resolvePackageVersion(
  '@react-native/babel-preset',
  RN_VERSION
);
if (!babelPresetVersion) {
  console.error('Cannot find suitable @react-native/babel-preset');
  process.exit(1);
}
packageJson.devDependencies['@react-native/babel-preset'] = babelPresetVersion;

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ package.json updated successfully');

function updateExamplePackage(examplePath) {
  const exampleJson = JSON.parse(fs.readFileSync(examplePath, 'utf8'));

  const deps = exampleJson.dependencies || {};
  deps.react = REACT_VERSION;
  deps['react-native'] = RN_VERSION;
  exampleJson.dependencies = deps;

  const devDeps = exampleJson.devDependencies || {};
  devDeps['@react-native-community/cli'] = CLI_VERSION;
  if (devDeps['@react-native-community/cli-platform-android'] !== undefined)
    devDeps['@react-native-community/cli-platform-android'] = CLI_VERSION;
  if (devDeps['@react-native-community/cli-platform-ios'] !== undefined)
    devDeps['@react-native-community/cli-platform-ios'] = CLI_VERSION;
  devDeps['@react-native/babel-preset'] =
    packageJson.devDependencies['@react-native/babel-preset'];
  if (devDeps['@react-native/metro-config'] !== undefined) {
    const metroVersion = resolvePackageVersion(
      '@react-native/metro-config',
      RN_VERSION
    );
    if (metroVersion) devDeps['@react-native/metro-config'] = metroVersion;
  }
  if (devDeps['@react-native/typescript-config'] !== undefined) {
    const tsVersion = resolvePackageVersion(
      '@react-native/typescript-config',
      RN_VERSION
    );
    if (tsVersion) devDeps['@react-native/typescript-config'] = tsVersion;
  }
  exampleJson.devDependencies = devDeps;

  fs.writeFileSync(examplePath, JSON.stringify(exampleJson, null, 2));
}

const examplePath = 'example/package.json';
if (fs.existsSync(examplePath)) {
  updateExamplePackage(examplePath);
  console.log('✅ example/package.json updated successfully');
}
