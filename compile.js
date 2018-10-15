const fs = require('fs');
const path = require('path');
const solc = require('solc');

const pathToSolFiles = path.resolve(__dirname, 'contracts', 'Campaign.sol');
try {
    const contents = fs.readFileSync(pathToSolFiles, 'utf8');
    const compiledSource = solc.compile(contents, 1);
    module.exports = compiledSource.contracts[':Campaign'];
} catch(e) {
    console.log(e.message);
}