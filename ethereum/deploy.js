const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const { interface, bytecode } = require('./build/factory.json');

const provider = new HDWalletProvider(
    require('./mnemonic'),
    'https://rinkeby.infura.io/v3/c335065904644478934597d20e2fb60a',
);
const web3 = new Web3(provider);

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();
    console.log(`Attempted to deploy from ${accounts[0]}...`);
    const factoryContract = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: '0x' + bytecode })
        .send({ from: accounts[0], gas: '3000000' });
    console.log(`Contract interface: ${interface}`);
    console.log(`Contract deployed to ${factoryContract.options.address}`);
};

deploy();