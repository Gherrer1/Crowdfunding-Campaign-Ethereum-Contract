const ganache = require('ganache-cli');
const Web3 = require('web3');
const { expect } = require('chai');
const provider = ganache.provider();
const web3 = new Web3(provider);
const { interface, bytecode } = require('../compile');

describe('Campaign Contract', () => {
    let accounts;
    let contract;
    beforeEach(async () => {
        accounts = await web3.eth.getAccounts();
        contract = await new web3.eth.Contract(JSON.parse(interface))
            .deploy({ data: bytecode, arguments: [web3.utils.toWei('0.01', 'ether')] })
            .send({ from: accounts[0], gas: '1000000' });

        contract.setProvider(provider);
    });

    describe('initialize', () => {
        it('should deploy', () => {
            expect(contract.options.address).to.exist;
        });
        it('storage variable: manager = user who deployed contract', async () => {
            const manager = await contract.methods.manager().call();
            expect(manager).to.equal(accounts[0]);
        });
        it('storage variable: minimumContribution = uint value we set', async () => {
            // interesting: minContribution is a string not a number
            const minContribution = await contract.methods.minimumContribution().call();
            const expectedValue = web3.utils.toWei('0.01', 'ether');
            expect(minContribution).to.equal(expectedValue);
        });
        it('storage variable: approvers = array of addresses should be empty', async () => {
            const approvers = await contract.methods.getApprovers().call();
            expect(approvers).to.deep.equal([]);
        });
        it('storage variable: requests = array of Request struct should be empty', async () => {
            const requests = await contract.methods.getRequests().call();
            expect(requests).to.deep.equal([]);
        });
    });

    describe('contribute', () => {
        it.skip('should require that manager not be allowed to contribute');
        it('should increase balance of account by donation made', async () => {
            let balanceBefore = await web3.eth.getBalance(contract.options.address);
            await contract.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.0100001', 'ether') });
            let balanceAfter = await web3.eth.getBalance(contract.options.address);
            expect( parseInt(balanceAfter) - parseInt(balanceBefore) ).to.equal( parseInt(web3.utils.toWei('0.0100001', 'ether')) );
            
            // another donation just to be sure
            balanceBefore = balanceAfter;
            await contract.methods.contribute()
                .send({ from: accounts[2], value: web3.utils.toWei('0.0000050', 'ether') });
            balanceAfter = await web3.eth.getBalance(contract.options.address);
            expect( parseInt(balanceAfter) - parseInt(balanceBefore) ).to.equal( parseInt(web3.utils.toWei('0.0000050', 'ether')) );
        });
        it('should not add address to approvers array if donation < minimum contribution', async () => {
            await contract.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.009999', 'ether') });
            let approvers = await contract.methods.getApprovers().call();
            expect(approvers.length).to.equal(0);

            await contract.methods.contribute()
                .send({ from: accounts[1] });
            approvers = await contract.methods.getApprovers().call();
            expect(approvers.length).to.equal(0);
        });
        it('should add address to approvers if donation >= minimum contribution', async () => {
            await contract.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.010000001', 'ether') });
            let approvers = await contract.methods.getApprovers().call();
            expect(approvers.length).to.equal(1);

            await contract.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('1', 'ether') });
            approvers = await contract.methods.getApprovers().call();
            expect(approvers.length).to.equal(2);
        });
    });

    describe('createRequest', () => {
        it('should require that manager call it');
        it('should add Request struct to request storage array');
    });

    describe('approveRequest', () => {
        it('should require that only members of approvers storage array can call it');
        it('should add user address to Request struc\'s approvers field');
    });

    describe('finalizeRequest', () => {
        it('should require that manager call it');
        it('should require that enough approvers have voted yes');
        it('should send Request.value to vendor address');
    });
});