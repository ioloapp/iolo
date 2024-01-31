const fs = require('fs');
const path = require('path');

const fileDirectory = '../../tests/iolo-tests-js'; // Change to your directory path
const methodDefinitionFile = '../../src/declarations/iolo_backend/iolo_backend.did.d.ts'; // Change to your definitions file path
const knownFilenames = ['user.test.ts', 'secret.test.ts', 'crypto.test.ts', 'policy.test.ts']; // Add your file names here

// Helper function to recursively find files
function findFiles(dir, filenames) {
    let results = [];
    fs.readdirSync(dir).forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(findFiles(file, filenames));
        } else if (filenames.includes(path.basename(file))) {
            results.push(file);
        }
    });
    return results;
}

// Helper function to find specific actor method call pattern
function findActorMethodCalls(content) {
    const actorMethodCallRegex = /const\s+(result\w+)\s*:\s*(Result_\d+)\s*=\s*await\s+(actor\w+)\.(\w+)\(/g;
    let match;
    let calls = [];

    while (match = actorMethodCallRegex.exec(content)) {
        calls.push({
            resultVar: match[1],
            resultType: match[2],
            actorVar: match[3],
            methodName: match[4]
        });
    }

    return calls;
}

// Helper function to find method signature in another file
function findMethodSignature(method, content) {
    const methodSignatureRegex = new RegExp(`'${method}'\\s*:\\s*ActorMethod<.*?,\\s*(.*?)\\>`, 's');
    const match = methodSignatureRegex.exec(content);
    return match ? match[1] : null;
}

// Main function to process files
async function processFiles() {
    const files = findFiles(fileDirectory, knownFilenames);
    const methodDefinitions = fs.readFileSync(methodDefinitionFile, 'utf-8');

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const calls = findActorMethodCalls(content);

        for (const { resultVar, resultType, actorVar, methodName } of calls) {
            const methodResultType = findMethodSignature(methodName, methodDefinitions);
            if (methodResultType && methodResultType === resultType) {
                const resultPattern = new RegExp(`const\\s+${resultVar}\\s*:\\s*${resultType}\\s*=\\s*await\\s+${actorVar}\\.${methodName}\\(`);
                if (!resultPattern.test(content)) {
                    console.log(`Mismatch in result type for method ${methodName} in file ${file}`);
                }
            } else {
                console.log(`No matching method signature for ${methodName} or result type mismatch in file ${file}`);
            }
        }
    }
}

processFiles().then(() => console.log('Processing complete. See results above, all good if there are no log statements :)'));