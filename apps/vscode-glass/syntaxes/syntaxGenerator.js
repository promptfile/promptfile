"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var currentJson = fs.readFileSync('./syntaxes/glass.tmLanguage.json', 'utf8');
var languages = [
    {
        name: 'Typescript',
        scopeName: 'glass-ts',
        source: 'source.js',
    },
    {
        name: 'Python',
        scopeName: 'glass-py',
        source: 'source.python',
    },
];
// Create the "generated" directory if it doesn't exist
if (!fs.existsSync('./syntaxes/generated')) {
    fs.mkdirSync('./syntaxes/generated', { recursive: true });
}
// loop over all languages
for (var _i = 0, languages_1 = languages; _i < languages_1.length; _i++) {
    var language = languages_1[_i];
    console.log('writing ' + language.scopeName);
    var result = currentJson.replace(/SOURCE_LANGUAGE/g, language.source).replace(/SCOPE_NAME/g, language.scopeName);
    // Define the path for the output file
    var outputPath = path.join('syntaxes', 'generated', "".concat(language.scopeName, ".tmLanguage.json"));
    // Write the resulting text to the output file
    fs.writeFileSync(outputPath, result);
}
console.log('done');
