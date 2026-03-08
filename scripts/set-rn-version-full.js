#!/usr/bin/env node
/**
 * Switch RN version + full clean + reinstall.
 * Usage: node scripts/set-rn-version-full.js [0.83]
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RN_VERSION = process.argv[2] || process.env.RN_VERSION || '0.83';
const rootDir = path.join(__dirname, '..');

const exampleDir = 'example';

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: rootDir, ...opts });
}

function rmrf(...paths) {
  for (const p of paths) {
    const full = path.join(rootDir, p);
    if (fs.existsSync(full)) {
      console.log(`Removing ${p}`);
      fs.rmSync(full, { recursive: true });
    }
  }
}

console.log(`\n=== Switching to RN ${RN_VERSION} (full clean) ===\n`);

// 1. Override package.json
run(`node scripts/set-rn-version.js ${RN_VERSION}`);

// 2. Remove node_modules (force fresh resolution)
rmrf('node_modules', `${exampleDir}/node_modules`);

// 3. Install
run('YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install');

// 4. Build lib
run('yarn prepare');

// 4b. Update example Android env (Gradle) for RN version
const gradleByRn = {
  76: '8.11.1',
  77: '8.11.1',
  78: '8.12',
  79: '8.12',
  80: '8.12',
  81: '8.12',
  82: '8.12',
  83: '8.12',
};
const minor = parseInt(RN_VERSION.split('.')[1], 10);
const gradleVersion = gradleByRn[minor] || '8.12';
const gradleWrapperPath = path.join(
  rootDir,
  exampleDir,
  'android',
  'gradle',
  'wrapper',
  'gradle-wrapper.properties'
);
if (fs.existsSync(gradleWrapperPath)) {
  let content = fs.readFileSync(gradleWrapperPath, 'utf8');
  content = content.replace(
    /distributionUrl=.*/,
    `distributionUrl=https\\://services.gradle.org/distributions/gradle-${gradleVersion}-bin.zip`
  );
  fs.writeFileSync(gradleWrapperPath, content);
  console.log(`\nUpdated example Android Gradle to ${gradleVersion}\n`);
}

// 5. Clean iOS
rmrf(
  `${exampleDir}/ios/Pods`,
  `${exampleDir}/ios/Podfile.lock`,
  `${exampleDir}/ios/build`,
  `${exampleDir}/build`
);

// 6. Clean Android
rmrf(
  `${exampleDir}/android/build`,
  `${exampleDir}/android/app/build`,
  `${exampleDir}/android/.gradle`
);

// 7. Clean Xcode DerivedData for this project
const derivedData = path.join(
  process.env.HOME || '',
  'Library/Developer/Xcode/DerivedData'
);
if (fs.existsSync(derivedData)) {
  const entries = fs.readdirSync(derivedData);
  for (const e of entries) {
    if (e.startsWith('ResquircleExample-')) {
      const full = path.join(derivedData, e);
      console.log(`Removing DerivedData/${e}`);
      fs.rmSync(full, { recursive: true });
    }
  }
}

// 8. Bundle install + Pod install (from example dir where Gemfile lives)
const examplePath = path.join(rootDir, exampleDir);
const gemfilePath = path.join(examplePath, 'Gemfile');

// Prefer rbenv over Homebrew Ruby to avoid "already initialized constant" / GemNotFound
const home = process.env.HOME || process.env.USERPROFILE || '';
const rbenvShims = path.join(home, '.rbenv', 'shims');
const rbenvBin = path.join(home, '.rbenv', 'bin');
const pathWithRbenv =
  fs.existsSync(rbenvShims) || fs.existsSync(rbenvBin)
    ? [rbenvShims, rbenvBin, process.env.PATH]
        .filter(Boolean)
        .join(path.delimiter)
    : process.env.PATH;

const bundleEnv = {
  ...process.env,
  BUNDLE_GEMFILE: gemfilePath,
  PATH: pathWithRbenv,
};

if (!fs.existsSync(gemfilePath)) {
  console.log(`\nSkipping pod install (no Gemfile in ${exampleDir})\n`);
} else if (process.platform !== 'darwin') {
  console.log(`\nSkipping pod install (not macOS)\n`);
} else {
  const podCmd =
    'bundle install && bundle exec pod install --project-directory=ios';
  console.log(`\n$ cd ${exampleDir} && ${podCmd}`);

  function runPodInstall(useLoginShell) {
    const opts = { stdio: 'inherit', cwd: examplePath, env: bundleEnv };
    if (useLoginShell) {
      const shellCmd = `cd ${JSON.stringify(examplePath)} && ${podCmd}`;
      return execSync(`/bin/zsh -l -c ${JSON.stringify(shellCmd)}`, {
        stdio: 'inherit',
        cwd: rootDir,
        env: { ...bundleEnv, HOME: process.env.HOME },
      });
    }
    execSync('bundle install', opts);
    return execSync('bundle exec pod install --project-directory=ios', opts);
  }

  try {
    runPodInstall(false);
  } catch {
    console.log(`\nRetrying with login shell (loads rbenv from .zshrc)...\n`);
    try {
      runPodInstall(true);
    } catch {
      console.error(
        `\nPod install failed. Fix Ruby (e.g. brew unlink ruby) then run:\n  cd ${exampleDir} && bundle install && bundle exec pod install --project-directory=ios\n`
      );
      process.exit(1);
    }
  }
}

console.log(
  `\n=== Done. Run:\n  cd ${exampleDir} && npx react-native run-ios\n  cd ${exampleDir} && npx react-native run-android\n`
);
