# regex-replace
A simple CLI/Module for regex replacing strings in files &amp; renaming files recursively

[![npm](https://img.shields.io/badge/npm-v2.3.1-blue.svg)](https://www.npmjs.com/package/regex-replace) [![Build Status](https://travis-ci.org/Donmclean/regex-replace.svg?branch=master)](https://travis-ci.org/Donmclean/regex-replace) [![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Donmclean/riko/blob/master/LICENSE)

## Getting Started
This library can be used both locally as a module or globally as a CLI.
Simply choose which you'd like via the install command below.

local: `npm install regex-replace`

global: `npm install -g regex-replace`

## Code Example

###### CLI Example
Replace filenames and file contents
```bash
regex-replace 'search string' 'replace string' './path/to/recursively/replace'
```

Replace file content only
```bash
regex-replace 'search string' 'replace string' './path/to/recursively/replace' --filecontents
```

Replace filenames only
```bash
regex-replace 'search string' 'replace string' './path/to/recursively/replace' --filenames
```

Version
```bash
regex-replace -v
```

###### Module Example
```javascript
import regexReplace from 'regex-replace';

const searchString = 'string to search for';
const replaceString = 'string to replace with';
const path = './some/path/to/recursively/replace';

const options = {
    filenamesOnly: false, //default
    fileContentsOnly: false //default
};

//promise
regexReplace(searchString, replaceString, path, options)
    .then(() => {
        //do something after successful regex replace
    })
    .catch((err) => {
        //handle errors
    });

//async/await
const doRegexReplace = async function() {
    try {
        await regexReplace(searchString, replaceString, path, options);
    } catch (err) {
        console.error('err > regexReplace > testing', err);
    }
}

//callback (no support for callbacks currently)
```

### Prerequisites

- [Node JS](https://nodejs.org) >= `6.x.x`
- [Yarn](https://yarnpkg.com) (optional but recommended)

## API Reference
###### CLI Example
- `regex-replace searchString replaceString path`
- Flags:
    - `--filename` or `--filenames` For filenames only
    - `--filecontent` or `--filecontents` For file contents only

###### Module Example
```javascript
regexReplace(searchString, replaceString, path, options)
```

- **Returns** _promise_
- **Options**:
    - filenamesOnly: `false` default
    - fileContentsOnly: `false` default


## Running the tests
- Fork or clone
- cd into `regex-replace`
- run `yarn` or `npm install`
- `npm test`

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on code of conduct, and the process for submitting pull requests.

## Versioning

[SemVer](http://semver.org/) is used for versioning. For the versions available, see the [releases on this repository](https://github.com/Donmclean/regex-replace/releases).

## Authors

* [**Don Mclean**](https://github.com/Donmclean)

See also the list of [contributors](https://github.com/Donmclean/regex-replace/contributors) who participated in this project.

## License

This project is licensed under the [MIT license](./LICENSE).

## Acknowledgments

* [replace](https://github.com/harthur/replace)
* [fs-extra](https://github.com/jprichardson/node-fs-extra)