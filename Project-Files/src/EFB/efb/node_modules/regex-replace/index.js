#!/usr/bin/env node

const fs = require('fs-extra');
const replace = require('replace');

const walkAsync = (path) => {
    return new Promise((resolve, reject) => {
        walk(path, (err, results) => {
            if(err) {
                reject(err);
            } else {
                resolve(results);
            }
        })
    });
};

const walk = function(dir, done) {
    let results = [];
    fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        let i = 0;
        (function next() {
            let file = list[i++];
            if (!file) return done(null, results);
            file = dir + '/' + file;
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    results.push(file);
                    next();
                }
            });
        })();
    });
};

const regexReplace = (searchString, replaceString, path, customOptions = {}) => {
    return new Promise( async (resolve, reject) => {
        const defaultOptions = {
            filenamesOnly: false,
            fileContentsOnly: false
        };

        const { filenamesOnly, fileContentsOnly } = Object.assign({}, defaultOptions, customOptions);

        const pathExists = await fs.pathExists(path);

        if(!pathExists) {
            console.error(`ERROR: Path (${path}) does not exist.`);
            reject(`ERROR: Path (${path}) does not exist.`);
        } else {
            let files;
            try {
                const stats = fs.lstatSync(path);

                if (stats.isDirectory()) {
                    files = await walkAsync(path);
                } else {
                    files = [path];
                }
            } catch (err) {
                reject(err);
            }

            if(!fileContentsOnly) {
                //renames files
                files.forEach((file) => {
                    const renamedFile = file.replace(new RegExp(searchString, 'g'), replaceString);
                    fs.renameSync(file, renamedFile);
                });
            }

            if(!filenamesOnly) {
                //replaces file contents
                replace({
                    regex: new RegExp(searchString, 'g'),
                    replacement: replaceString,
                    paths: [path],
                    recursive: true,
                    silent: true,
                    async: false
                });
            }

           resolve();
        }
    });
};

module.exports = regexReplace;