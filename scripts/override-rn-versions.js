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

const babelPresetExists = checkPackageVersion(
  '@react-native/babel-preset',
  RN_VERSION
);

if (babelPresetExists) {
  console.log(`✅ @react-native/babel-preset@${RN_VERSION} exists`);
  packageJson.devDependencies['@react-native/babel-preset'] = RN_VERSION;
} else {
  console.log(`❌ @react-native/babel-preset@${RN_VERSION} not found`);

  const [major, minor, patch] = RN_VERSION.split('.').map(Number);

  const fallbacks = [
    `${major}.${minor}.${patch + 1}`,
    `${major}.${minor}.${Math.max(0, patch - 1)}`,
    `${major}.${minor}.0`,
  ];

  let found = false;
  for (const fbVersion of fallbacks) {
    const fbExists = checkPackageVersion(
      '@react-native/babel-preset',
      fbVersion
    );

    if (fbExists) {
      console.log(`✅ Using fallback @react-native/babel-preset@${fbVersion}`);
      packageJson.devDependencies['@react-native/babel-preset'] = fbVersion;
      found = true;
      break;
    } else {
      console.log(`❌ Fallback ${fbVersion} not found`);
    }
  }

  if (!found) {
    console.log('⚠️ No fallback found, using latest 0.72.x version');
    try {
      const latestInLine = execSync(
        `npm view @react-native/babel-preset@${major}.${minor}.x version`,
        { stdio: 'pipe' }
      )
        .toString()
        .trim();

      console.log(
        `✅ Using latest in line: @react-native/babel-preset@${latestInLine}`
      );
      packageJson.devDependencies['@react-native/babel-preset'] = latestInLine;
    } catch {
      console.error(
        '❌ Critical: Cannot find any suitable @react-native/babel-preset'
      );
      process.exit(1);
    }
  }
}

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ package.json updated successfully');

const examplePath = 'example/package.json';
if (fs.existsSync(examplePath)) {
  const exampleJson = JSON.parse(fs.readFileSync(examplePath, 'utf8'));

  const deps = exampleJson.dependencies || {};
  deps.react = REACT_VERSION;
  deps['react-native'] = RN_VERSION;
  exampleJson.dependencies = deps;

  const devDeps = exampleJson.devDependencies || {};
  devDeps['@react-native-community/cli'] = CLI_VERSION;
  devDeps['@react-native/babel-preset'] =
    packageJson.devDependencies['@react-native/babel-preset'];
  if (devDeps['@react-native/metro-config'] !== undefined)
    devDeps['@react-native/metro-config'] = RN_VERSION;
  if (devDeps['@react-native/typescript-config'] !== undefined)
    devDeps['@react-native/typescript-config'] = RN_VERSION;
  exampleJson.devDependencies = devDeps;

  fs.writeFileSync(examplePath, JSON.stringify(exampleJson, null, 2));
  console.log('✅ example/package.json updated successfully');
}
