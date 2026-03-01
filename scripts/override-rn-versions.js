// scripts/override-rn-versions.js
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

// Читаем package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Обновляем зависимости
packageJson.devDependencies = packageJson.devDependencies || {};

// Обновляем react-native
packageJson.devDependencies['react-native'] = RN_VERSION;

// Обновляем @react-native-community/cli
packageJson.devDependencies['@react-native-community/cli'] = CLI_VERSION;

// Обновляем react
packageJson.devDependencies.react = REACT_VERSION;
packageJson.devDependencies['react-test-renderer'] = REACT_VERSION;

// Функция для проверки существования версии пакета
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

// Проверяем существование @react-native/babel-preset для этой версии
const babelPresetExists = checkPackageVersion(
  '@react-native/babel-preset',
  RN_VERSION
);

if (babelPresetExists) {
  console.log(`✅ @react-native/babel-preset@${RN_VERSION} exists`);
  packageJson.devDependencies['@react-native/babel-preset'] = RN_VERSION;
} else {
  console.log(`❌ @react-native/babel-preset@${RN_VERSION} not found`);

  // Парсим версию для fallback
  const [major, minor, patch] = RN_VERSION.split('.').map(Number);

  // Стратегия fallback: пробуем увеличить patch на 1, потом уменьшить на 1
  const fallbacks = [
    `${major}.${minor}.${patch + 1}`, // следующая патч-версия
    `${major}.${minor}.${Math.max(0, patch - 1)}`, // предыдущая патч-версия
    `${major}.${minor}.0`, // первый патч этой минорной версии
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
    // Последний fallback - самая свежая версия в этой мажорной линии
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

// Сохраняем package.json
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ package.json updated successfully');
