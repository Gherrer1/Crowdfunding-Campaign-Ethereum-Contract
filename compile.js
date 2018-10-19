const fs = require('fs-extra');
const path = require('path');
const solc = require('solc');

fs.removeSync(path.resolve(__dirname, 'build'));

const contents = fs.readFileSync(path.resolve(__dirname, 'contracts', 'Campaign.sol'), 'utf8');
const compiledSource = solc.compile(contents, 1);
const campaignSource = compiledSource.contracts[':Campaign'];
const factorySource = compiledSource.contracts[':CampaignFactory'];

function saveContract(filename, compiledContract) {
    fs.writeJsonSync(path.resolve(__dirname, 'build', filename), {
        bytecode: compiledContract.bytecode,
        interface: compiledContract.interface,
    });
}

fs.mkdirSync(path.resolve(__dirname, 'build'));
saveContract('campaign.json', campaignSource);
saveContract('factory.json', factorySource);
