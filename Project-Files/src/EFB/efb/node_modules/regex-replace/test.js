const regexReplace = require('./index');
const fs = require('fs-extra');
const assert = require('assert');

const searchString = '<:test:>';
const replaceString = 'replace works';

const sourcePath = './test-bin';
const copyPath = './test-bin2';

describe('regexReplace', () => {
    it('should successfully regex replace searchString in file', (done) => {
        fs.copy(sourcePath, copyPath).then( async () => {
            try {
                await regexReplace(searchString, replaceString, copyPath);
            } catch (err) {
                console.error('err > regexReplace > testing', err);
            }

            const module1 = require('./test-bin2');

            assert.equal(module1, replaceString);

            const module2 = require('./test-bin2/test-bin');

            assert.equal(module2, replaceString);

            try {
                await fs.remove(copyPath);
            } catch (err) {
                console.error('err > fs.remove > testing', err);
            }
            done();
        });
    });

    it('should successfully regex replace matching filenames with replaceString recursively', (done) => {
        fs.copy(sourcePath, copyPath).then(async () => {
            try {
                await regexReplace(searchString, replaceString, copyPath);
            } catch (err) {
                console.error('err > regexReplace > testing', err);
            }

            let filesInCopiedDir;
            try {
                filesInCopiedDir = await fs.readdir(copyPath);
            } catch (err) {
                console.error('err > readdir > testing', err);
            }

            let matches = 0;

            const checkkForReplacement = (arrayOfFiles) => {
                arrayOfFiles.forEach((file) => {
                    const rgx = new RegExp(replaceString, 'g');

                    if(rgx.test(file)) {
                        matches++;
                    }
                });
            };

            checkkForReplacement(filesInCopiedDir);

            assert.equal(matches, 2);

            try {
                filesInCopiedDir = await fs.readdir(`${copyPath}/test-bin`);
            } catch (err) {
                console.error('err > readdir > testing', err);
            }

            checkkForReplacement(filesInCopiedDir);

            assert.equal(matches, 4);

            try {
                await fs.remove(copyPath);
            } catch (err) {
                console.error('err > fs.remove > testing', err);
            }
            done();
        });
    });
});