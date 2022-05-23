const packageJson = require('./package.json');
const path = require('path');
const fs = require('fs-extra');

const readMePath    = path.resolve(__dirname, `./README.md`);
const readMe        = fs.readFileSync(readMePath, 'utf8');

const urlStringStart = 'https://img.shields.io/badge/npm-v';
const urlStringEnd = '-blue.svg';

const npmBadgeVersionUrl = readMe.substring(readMe.indexOf(urlStringStart), (readMe.indexOf(urlStringEnd) + urlStringEnd.length));

if(npmBadgeVersionUrl) {
    fs.writeFileSync(readMePath, readMe.replace(npmBadgeVersionUrl, urlStringStart + packageJson.version + urlStringEnd));
} else {
    throw new Error('npmBadgeVersionUrl is invalid');
}
