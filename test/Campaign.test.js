const ganache = require('ganache-cli');
const Web3 = require('web3');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const { expect } = chai;

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
        it('storage variable: requests = array of Request struct should be empty', async () => {
            const numRequests = await contract.methods.getNumRequests().call();
            expect(numRequests).to.equal('0');
        });
    });

    describe('contribute', () => {
        it.skip('should require that manager not be allowed to contribute');
        it('should throw error if contribution is less than minimum', () => {
            let promise = contract.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.009999', 'ether') });

            let secondPromise = contract.methods.contribute()
                .send({ from: accounts[1] });

            return Promise.all([
                expect(promise).to.be.rejectedWith(/revert/),
                expect(secondPromise).to.be.rejectedWith(/revert/),
            ]);
        });
        it('should return contribution to user if contribution less than minimum', async () => {
            const balanceBefore = await web3.eth.getBalance(accounts[1]);
            try {
                await contract.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.009999', 'ether') });
            } catch(e) {}
            const balanceAfter = await web3.eth.getBalance(accounts[1]);
            const differenceCeiling = parseInt( web3.utils.toWei('0.009999', 'ether') );
            expect(balanceAfter - balanceBefore).to.be.lessThan(differenceCeiling);
        });
        it('should not add address to approvers mapping if donation < minimum contribution', async () => {
            try {
                await contract.methods.contribute().send({
                    from: accounts[1], value: web3.utils.toWei('0.009999', 'ether')
                });
            } catch(e) {
                const isApprover = await contract.methods.isApprover(accounts[1]).call();
                expect(isApprover).to.be.false;
            }

            try {
                await contract.methods.contribute().send({
                    from: accounts[1],
                });
            } catch(e) {
                const isApprover = await contract.methods.isApprover(accounts[1]).call();
                expect(isApprover).to.be.false;
            }
        });
        it('should add address to approvers if donation >= minimum contribution', async () => {
            await contract.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.010000001', 'ether') });
            let isApprover = await contract.methods.isApprover(accounts[1]).call();
            expect(isApprover).to.true;

            await contract.methods.contribute()
                .send({ from: accounts[2], value: web3.utils.toWei('1', 'ether') });
            isApprover = await contract.methods.isApprover(accounts[2]).call();
            expect(isApprover).to.true;
        });
        it('should increment approversCount if contributer was not previously an approver', async () => {
            let approversCount = await contract.methods.approversCount().call();
            expect(approversCount).to.equal('0');

            await contract.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.01000001', 'ether') });

            approversCount = await contract.methods.approversCount().call();
            expect(approversCount).to.equal('1');
        });
        it('should not increment approversCount if contributer was previously an approver', async () => {
            await contract.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.01000001', 'ether') });

            approversCount = await contract.methods.approversCount().call();
            expect(approversCount).to.equal('1');

            await contract.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.01000001', 'ether') });

            approversCount = await contract.methods.approversCount().call();
            expect(approversCount).to.equal('1');
        });
        it('should increase balance of account by donation made', async () => {
            let balanceBefore = await web3.eth.getBalance(contract.options.address);
            await contract.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.0100001', 'ether') });
            let balanceAfter = await web3.eth.getBalance(contract.options.address);
            expect( parseInt(balanceAfter) - parseInt(balanceBefore) ).to.equal( parseInt(web3.utils.toWei('0.0100001', 'ether')) );
        });
    });

    describe('createRequest', () => {
        it('should require that manager call it', () => {
            let resolvePromise = contract.methods.createRequest(
                'To pay alibaba',
                web3.utils.toWei('0.01', 'ether'),
                accounts[4],
            ).send({ from: accounts[0], gas: '1000000' });

            let rejectPromise = contract.methods.createRequest(
                'To pay alibaba',
                web3.utils.toWei('0.01', 'ether'),
                accounts[4]
            ).send({ from: accounts[1], gas: '1000000' });

            return Promise.all([
                expect(resolvePromise).to.be.fulfilled,
                expect(rejectPromise).to.be.rejectedWith(/revert/),
            ]);
        });
        it('should add Request struct to request storage array', async () => {
            let numRequestsBefore = await contract.methods.getNumRequests().call();
            expect(numRequestsBefore).to.equal('0');
            await contract.methods.createRequest('To pay alibaba', web3.utils.toWei('0.01', 'ether'), accounts[4])
                .send({ from: accounts[0], gas: '1000000' });
            let numRequestsAfter = await contract.methods.getNumRequests().call();
            expect(numRequestsAfter).to.equal('1');

            numRequestsBefore = numRequestsAfter;
            await contract.methods.createRequest('To pay aliexpress', web3.utils.toWei('0.01', 'ether'), accounts[4])
                .send({ from: accounts[0], gas: '1000000' });
            numRequestsAfter = await contract.methods.getNumRequests().call();
            expect(numRequestsAfter).to.equal('2');
        });
    });

    describe('approveRequest', () => {
        beforeEach(async () => {
            // create requests with vendors: 4, 5, 6
            await contract.methods.createRequest('To pay alibaba', web3.utils.toWei('0.01', 'ether'), accounts[4])
                .send({ from: accounts[0], gas: '1000000' });
            await contract.methods.createRequest('To pay shopify', web3.utils.toWei('0.01', 'ether'), accounts[5])
                .send({ from: accounts[0], gas: '1000000' });
            await contract.methods.createRequest('To pay developers', web3.utils.toWei('0.01', 'ether'), accounts[6])
                .send({ from: accounts[0], gas: '1000000' });

            // get some approvers in there: 1, 2, 3
            await contract.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.0101', 'ether'), gas: '1000000' });
            await contract.methods.contribute()
                .send({ from: accounts[2], value: web3.utils.toWei('0.0101', 'ether'), gas: '1000000' });
            await contract.methods.contribute()
                .send({ from: accounts[3], value: web3.utils.toWei('0.0101', 'ether'), gas: '1000000' });

            // approver 2 has already approved request 2
            await contract.methods.approveRequest(2)
                .send({ from: accounts[2], gas: '1000000' });
        });
        it('should throw error if invalid index is passed in', () => {
            let promise = contract.methods.approveRequest(3)
                .send({ from: accounts[1], gas: '1000000' });
            expect(promise).to.be.rejectedWith(/invalid opcode/);
        });
        it('should require that only members of approvers storage mapping can call it', () => {
            let promise = contract.methods.approveRequest(2)
                .send({ from: accounts[4], gas: '1000000' });
            expect(promise).to.be.rejectedWith(/revert/);
        });
        it('should require that user hasnt voted on that request yet', () => {
            let promise = contract.methods.approveRequest(2)
                .send({ from: accounts[2], gas: '1000000' });
            expect(promise).to.be.rejectedWith(/revert/);
        });
        it('should add user address to Request struc\'s approvers field', async () => {
            let didUserVoteOnRequest = await contract.methods.getUsersVoteForRequest(2, accounts[3]).call();
            expect(didUserVoteOnRequest).to.be.false;

            await contract.methods.approveRequest(2)
                .send({ from: accounts[3], gas: '1000000' });
            
            didUserVoteOnRequest = await contract.methods.getUsersVoteForRequest(2, accounts[3]).call();
            expect(didUserVoteOnRequest).to.be.true;
        });
        it('should increment an approvalCount field', async () => {
            let approvalCount = await contract.methods.getApprovalCountForRequest(2).call();
            expect(approvalCount).to.equal('1');

            await contract.methods.approveRequest(2)
                .send({ from: accounts[3], gas: '1000000' });
            
            approvalCount = await contract.methods.getApprovalCountForRequest(2).call();
            expect(approvalCount).to.equal('2');
        });
    });

    describe('finalizeRequest', () => {
        beforeEach(async () => {
            // create requests with vendors: 4, 5, 6
            await contract.methods.createRequest('To pay alibaba', web3.utils.toWei('0.01', 'ether'), accounts[4])
                .send({ from: accounts[0], gas: '1000000' });
            await contract.methods.createRequest('To pay shopify', web3.utils.toWei('0.01', 'ether'), accounts[5])
                .send({ from: accounts[0], gas: '1000000' });
            await contract.methods.createRequest('To pay developers', web3.utils.toWei('0.03', 'ether'), accounts[6])
                .send({ from: accounts[0], gas: '1000000' });

            // get some approvers in there: 1, 2, 3
            await contract.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.0101', 'ether'), gas: '1000000' });
            await contract.methods.contribute()
                .send({ from: accounts[2], value: web3.utils.toWei('0.0101', 'ether'), gas: '1000000' });
            await contract.methods.contribute()
                .send({ from: accounts[3], value: web3.utils.toWei('0.0101', 'ether'), gas: '1000000' });

            // approver 2 has already approved request 2
            await contract.methods.approveRequest(2)
                .send({ from: accounts[2], gas: '1000000' });
        });
        it('must be called with valid request index', () => {
            let promise = contract.methods.finalizeRequest(5)
                .send({ from: accounts[0], gas: '1000000' });
            return expect(promise).to.be.rejectedWith(/invalid opcode/);
        });
        it('should require that manager call it', () => {
            let promise = contract.methods.finalizeRequest(2)
                .send({ from: accounts[1], gas: '1000000' });
            return expect(promise).to.be.rejectedWith(/revert/);
        });
        it('should require that contract balance > request value', async () => {
            // create contract with absurd value
            await contract.methods.createRequest('Really expensive', web3.utils.toWei('0.04', 'ether'), accounts[7])
                .send({ from: accounts[0], gas: '1000000' });
            const contractBalance = await web3.eth.getBalance(contract.options.address);
            const requestValue = await contract.methods.getRequestValue(3).call();
            expect(parseInt(requestValue)).to.be.greaterThan(parseInt(contractBalance));

            try {
                await contract.methods.finalizeRequest(3)
                    .send({ from: accounts[0], gas: '1000000' });
            } catch(e) {
                return expect(e.message).to.match(/revert/);
            }

            throw new Error('finalizeRequest() should have thrown');
        });
        it('should require that 51%+ approvers have voted yes', async () => {
            // this one I'm not too sure about.
            // sanity checks
            let numApprovalsForRequest = await contract.methods.getApprovalCountForRequest(2).call();
            expect(numApprovalsForRequest).to.equal('1');
            let numApprovers = await contract.methods.getNumApprovers().call();
            expect(numApprovers).to.equal('3');
            try {
                await contract.methods.finalizeRequest(2)
                    .send({ from: accounts[0], gas: '1000000' });
            } catch(e) {
                expect(e).to.match(/blahhhh/);

                // now make sure it works when you add one more approver
                // note: might have to contribute more to the contract first
                await contract.methods.approveRequest(2)
                    .send({ from: accounts[3], gas: '1000000' });
                
                await contract.methods.finalizeRequest(2)
                    .send({ from: accounts[0], gas: '1000000' });
            }
        });
        it('should send Request.value to vendor address and should mark Request.complete as true', async () => {
            let contractBalance = await web3.eth.getBalance(contract.options.address);
            expect(contractBalance).to.equal( web3.utils.toWei('0.0303', 'ether') );
            let contractData = await contract.methods.getRequest(2).call();
            let completeStatus = contractData['2'];
            expect(completeStatus).to.be.false;

            // get one more approval bc of 51%+ requirement
            await contract.methods.approveRequest(2)
                .send({ from: accounts[3], gas: '1000000' });
            await contract.methods.finalizeRequest(2)
                .send({ from: accounts[0], gas: '1000000' });

            contractBalance = await web3.eth.getBalance(contract.options.address);
            expect(contractBalance).to.equal( web3.utils.toWei('0.0003', 'ether') );

            contractData = await contract.methods.getRequest(2).call();
            completeStatus = contractData['2'];
            expect(completeStatus).to.be.true;
        });
        it('should require that contract is not already complete', async () => {
            // contribute alot so contract has more than enough value to send
            await contract.methods.contribute().send({ from: accounts[4], value: web3.utils.toWei('1', 'ether'), gas: '1000000' });
            // get one more approval bc 51% requirement
            await contract.methods.approveRequest(2).send({ from: accounts[3], gas: '1000000' });
            // finalize request 2
            await contract.methods.finalizeRequest(2).send({ from: accounts[0], gas: '1000000' });
            // try finalizing it again but should get error
            try {
                await contract.methods.finalizeRequest(2).send({ from: accounts[0], gas: '1000000' });
            } catch(e) {
                return expect(e.message).to.match(/revert/);
            }

            throw new Error('finalizeRequest() should have thrown because it should be complete');
        });
    });
});