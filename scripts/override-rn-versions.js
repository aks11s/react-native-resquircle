#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rn = process.env.RN_VERSION;
const react = process.env.REACT_VERSION;
const cli = process.env.CLI_VERSION;

if (!rn || !react || !cli) {
  console.error('Need RN_VERSION, REACT_VERSION, CLI_VERSION');
  process.exit(1);
}

const rootPath = path.join(__dirname, '..', 'package.json');
const examplePath = path.join(__dirname, '..', 'example', 'package.json');

const root = JSON.parse(fs.readFileSync(rootPath, 'utf8'));
const example = JSON.parse(fs.readFileSync(examplePath, 'utf8'));

root.resolutions = {
  'react-native': rn,
  react,
  '@react-native/*': rn,
  '@react-native-community/cli': cli,
  '@react-native-community/cli-platform-android': cli,
  '@react-native-community/cli-platform-ios': cli,
};

example.dependencies['react-native'] = rn;
example.dependencies['react'] = react;

const reactMajor = react.startsWith('19') ? '19' : '18';
for (const k of Object.keys(example.devDependencies || {})) {
  if (k.startsWith('@react-native/')) example.devDependencies[k] = rn;
  if (k.startsWith('@react-native-community/cli'))
    example.devDependencies[k] = cli;
  if (k === '@types/react') example.devDependencies[k] = `^${reactMajor}.0.0`;
}

fs.writeFileSync(rootPath, JSON.stringify(root, null, 2));
fs.writeFileSync(examplePath, JSON.stringify(example, null, 2));
