#!/usr/bin/env node

const packageJson = require('./package.json');
const regexReplace = require('./index');

const argv = process.argv;
const [ cmd, cmdFile, searchString, replaceString, path, ...options ] = argv;
const isVersionFlag = (argv[2] === '-v');

const customOptions = options.reduce((acc, value, key) => {
    switch (value) {
        case '--filename':
        case '--filenames': {
            acc.filenamesOnly = true;
            break;
        }
        case '--filecontent':
        case '--filecontents': {
            acc.fileContentsOnly = true;
            break;
        }
        default: {
            break;
        }
    }

    return acc;
}, {});

if((searchString && replaceString && path) && !isVersionFlag) {
    regexReplace(searchString, replaceString, path, customOptions);
} else if (!isVersionFlag){
    console.error('missing required arguments: (<searchString>, <replaceString>, <path>, [options])');
} else if(isVersionFlag) {
    console.log(packageJson.version);
}