const ganache = require('ganache-cli');
const Web3 = require('web3');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const { expect } = chai;

const provider = ganache.provider();
const web3 = new Web3(provider);
const compiledCampaign = require('../build/campaign.json');
const compiledFactory = require('../build/factory.json');

describe('Campaign Contract', () => {
    let factory;
    let campaignAddress;
    let campaign;
    let accounts;
    beforeEach(async () => {
        accounts = await web3.eth.getAccounts();
        factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
            .deploy({ data: compiledFactory.bytecode })
            .send({ from: accounts[0], gas: '2000000' });
        await factory.methods.createCampaign( web3.utils.toWei('0.01', 'ether') )
            .send({ from: accounts[0], gas: '1000000' });

        factory.setProvider(provider);

        [campaignAddress] = await factory.methods.getDeployedContracts().call();
        campaign = await new web3.eth.Contract(JSON.parse(compiledCampaign.interface), campaignAddress);
        campaign.setProvider(provider);
    });

    describe('initialize', () => {
        it('deploys factory and campaign', () => {
            expect(factory.options.address).to.exist;
            expect(campaign.options.address).to.exist;
        });
        it('storage variable: manager = user who deployed contract', async () => {
            const manager = await campaign.methods.manager().call();
            expect(manager).to.equal(accounts[0]);
        });
        it('storage variable: minimumContribution = uint value we set', async () => {
            // interesting: minContribution is a string not a number
            const minContribution = await campaign.methods.minimumContribution().call();
            const expectedValue = web3.utils.toWei('0.01', 'ether');
            expect(minContribution).to.equal(expectedValue);
        });
        it('storage variable: requests = array of Request struct should be empty', async () => {
            const numRequests = await campaign.methods.getNumRequests().call();
            expect(numRequests).to.equal('0');
        });
    });

    describe('contribute', () => {
        it.skip('should require that manager not be allowed to contribute');
        it('should throw error if contribution is less than minimum', () => {
            let promise = campaign.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.009999', 'ether') });

            let secondPromise = campaign.methods.contribute()
                .send({ from: accounts[1] });

            return Promise.all([
                expect(promise).to.be.rejectedWith(/revert/),
                expect(secondPromise).to.be.rejectedWith(/revert/),
            ]);
        });
        it('should return contribution to user if contribution less than minimum', async () => {
            const balanceBefore = await web3.eth.getBalance(accounts[1]);
            try {
                await campaign.methods.contribute()
                    .send({ from: accounts[1], value: web3.utils.toWei('0.009999', 'ether') });
            } catch(e) {
                expect(e.message).to.match(/revert/);
            }
            const balanceAfter = await web3.eth.getBalance(accounts[1]);
            const differenceCeiling = parseInt( web3.utils.toWei('0.009999', 'ether') );
            expect(balanceAfter - balanceBefore).to.be.lessThan(differenceCeiling);
        });
        it('should not add address to approvers mapping if donation < minimum contribution', async () => {
            try {
                await campaign.methods.contribute().send({
                    from: accounts[1], value: web3.utils.toWei('0.009999', 'ether')
                });
            } catch(e) {
                const isApprover = await campaign.methods.isApprover(accounts[1]).call();
                expect(isApprover).to.be.false;
            }

            try {
                await campaign.methods.contribute().send({
                    from: accounts[1],
                });
            } catch(e) {
                const isApprover = await campaign.methods.isApprover(accounts[1]).call();
                expect(isApprover).to.be.false;
            }
        });
        it('should add address to approvers if donation >= minimum contribution', async () => {
            await campaign.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.010000001', 'ether') });
            let isApprover = await campaign.methods.isApprover(accounts[1]).call();
            expect(isApprover).to.true;

            await campaign.methods.contribute()
                .send({ from: accounts[2], value: web3.utils.toWei('1', 'ether') });
            isApprover = await campaign.methods.isApprover(accounts[2]).call();
            expect(isApprover).to.true;
        });
        it('should increment approversCount if contributer was not previously an approver', async () => {
            let approversCount = await campaign.methods.approversCount().call();
            expect(approversCount).to.equal('0');

            await campaign.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.01000001', 'ether') });

            approversCount = await campaign.methods.approversCount().call();
            expect(approversCount).to.equal('1');
        });
        it('should not increment approversCount if contributer was previously an approver', async () => {
            await campaign.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.01000001', 'ether') });

            approversCount = await campaign.methods.approversCount().call();
            expect(approversCount).to.equal('1');

            await campaign.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.01000001', 'ether') });

            approversCount = await campaign.methods.approversCount().call();
            expect(approversCount).to.equal('1');
        });
        it('should increase balance of account by donation made', async () => {
            let balanceBefore = await web3.eth.getBalance(campaign.options.address);
            await campaign.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.0100001', 'ether') });
            let balanceAfter = await web3.eth.getBalance(campaign.options.address);
            expect( parseInt(balanceAfter) - parseInt(balanceBefore) ).to.equal( parseInt(web3.utils.toWei('0.0100001', 'ether')) );
        });
    });

    describe('createRequest', () => {
        it('should require that manager call it', () => {
            let resolvePromise = campaign.methods.createRequest(
                'To pay alibaba',
                web3.utils.toWei('0.01', 'ether'),
                accounts[4],
            ).send({ from: accounts[0], gas: '1000000' });

            let rejectPromise = campaign.methods.createRequest(
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
            let numRequestsBefore = await campaign.methods.getNumRequests().call();
            expect(numRequestsBefore).to.equal('0');
            await campaign.methods.createRequest('To pay alibaba', web3.utils.toWei('0.01', 'ether'), accounts[4])
                .send({ from: accounts[0], gas: '1000000' });
            let numRequestsAfter = await campaign.methods.getNumRequests().call();
            expect(numRequestsAfter).to.equal('1');

            numRequestsBefore = numRequestsAfter;
            await campaign.methods.createRequest('To pay aliexpress', web3.utils.toWei('0.01', 'ether'), accounts[4])
                .send({ from: accounts[0], gas: '1000000' });
            numRequestsAfter = await campaign.methods.getNumRequests().call();
            expect(numRequestsAfter).to.equal('2');
        });
    });

    describe('approveRequest', () => {
        beforeEach(async () => {
            // create requests with vendors: 4, 5, 6
            await campaign.methods.createRequest('To pay alibaba', web3.utils.toWei('0.01', 'ether'), accounts[4])
                .send({ from: accounts[0], gas: '1000000' });
            await campaign.methods.createRequest('To pay shopify', web3.utils.toWei('0.01', 'ether'), accounts[5])
                .send({ from: accounts[0], gas: '1000000' });
            await campaign.methods.createRequest('To pay developers', web3.utils.toWei('0.01', 'ether'), accounts[6])
                .send({ from: accounts[0], gas: '1000000' });

            // get some approvers in there: 1, 2, 3
            await campaign.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.0101', 'ether'), gas: '1000000' });
            await campaign.methods.contribute()
                .send({ from: accounts[2], value: web3.utils.toWei('0.0101', 'ether'), gas: '1000000' });
            await campaign.methods.contribute()
                .send({ from: accounts[3], value: web3.utils.toWei('0.0101', 'ether'), gas: '1000000' });

            // approver 2 has already approved request 2
            await campaign.methods.approveRequest(2)
                .send({ from: accounts[2], gas: '1000000' });
        });
        it('should throw error if invalid index is passed in', () => {
            let promise = campaign.methods.approveRequest(3)
                .send({ from: accounts[1], gas: '1000000' });
            expect(promise).to.be.rejectedWith(/invalid opcode/);
        });
        it('should require that only members of approvers storage mapping can call it', () => {
            let promise = campaign.methods.approveRequest(2)
                .send({ from: accounts[4], gas: '1000000' });
            expect(promise).to.be.rejectedWith(/revert/);
        });
        it('should require that user hasnt voted on that request yet', () => {
            let promise = campaign.methods.approveRequest(2)
                .send({ from: accounts[2], gas: '1000000' });
            expect(promise).to.be.rejectedWith(/revert/);
        });
        it('should add user address to Request struc\'s approvers field', async () => {
            let didUserVoteOnRequest = await campaign.methods.getUsersVoteForRequest(2, accounts[3]).call();
            expect(didUserVoteOnRequest).to.be.false;

            await campaign.methods.approveRequest(2)
                .send({ from: accounts[3], gas: '1000000' });
            
            didUserVoteOnRequest = await campaign.methods.getUsersVoteForRequest(2, accounts[3]).call();
            expect(didUserVoteOnRequest).to.be.true;
        });
        it('should increment an approvalCount field', async () => {
            let approvalCount = (await campaign.methods.requests(2).call())['4'];
            expect(approvalCount).to.equal('1');

            await campaign.methods.approveRequest(2)
                .send({ from: accounts[3], gas: '1000000' });
            
            approvalCount = (await campaign.methods.requests(2).call())['4'];
            expect(approvalCount).to.equal('2');
        });
    });

    describe('finalizeRequest', () => {
        beforeEach(async () => {
            // create requests with vendors: 4, 5, 6
            await campaign.methods.createRequest('To pay alibaba', web3.utils.toWei('0.01', 'ether'), accounts[4])
                .send({ from: accounts[0], gas: '1000000' });
            await campaign.methods.createRequest('To pay shopify', web3.utils.toWei('0.01', 'ether'), accounts[5])
                .send({ from: accounts[0], gas: '1000000' });
            await campaign.methods.createRequest('To pay developers', web3.utils.toWei('0.03', 'ether'), accounts[6])
                .send({ from: accounts[0], gas: '1000000' });

            // get some approvers in there: 1, 2, 3
            await campaign.methods.contribute()
                .send({ from: accounts[1], value: web3.utils.toWei('0.0101', 'ether'), gas: '1000000' });
            await campaign.methods.contribute()
                .send({ from: accounts[2], value: web3.utils.toWei('0.0101', 'ether'), gas: '1000000' });
            await campaign.methods.contribute()
                .send({ from: accounts[3], value: web3.utils.toWei('0.0101', 'ether'), gas: '1000000' });

            // approver 2 has already approved request 2
            await campaign.methods.approveRequest(2)
                .send({ from: accounts[2], gas: '1000000' });
        });
        it('must be called with valid request index', () => {
            let promise = campaign.methods.finalizeRequest(5)
                .send({ from: accounts[0], gas: '1000000' });
            return expect(promise).to.be.rejectedWith(/invalid opcode/);
        });
        it('should require that manager call it', () => {
            let promise = campaign.methods.finalizeRequest(2)
                .send({ from: accounts[1], gas: '1000000' });
            return expect(promise).to.be.rejectedWith(/revert/);
        });
        it('should require that campaign balance > request value', async () => {
            // create request with absurd value
            await campaign.methods.createRequest('Really expensive', web3.utils.toWei('0.04', 'ether'), accounts[7])
                .send({ from: accounts[0], gas: '1000000' });
            const campaignBalance = await web3.eth.getBalance(campaign.options.address);
            const requestValue = (await campaign.methods.requests(3).call())['1'];
            expect(parseInt(requestValue)).to.be.greaterThan(parseInt(campaignBalance));

            try {
                await campaign.methods.finalizeRequest(3)
                    .send({ from: accounts[0], gas: '1000000' });
            } catch(e) {
                return expect(e.message).to.match(/revert/);
            }

            throw new Error('finalizeRequest() should have thrown');
        });
        it('should require that greater than 50% approvers have voted yes', async () => {
            let approversForRequest = (await campaign.methods.requests(2).call())['4'];
            let approversCount = await campaign.methods.approversCount().call();
            expect(approversForRequest).to.equal('1');
            expect(approversCount).to.equal('3');
            expect( parseInt(approversForRequest) ).to.be.lte( parseInt(approversCount) / 2);

            try {
                await campaign.methods.finalizeRequest(2)
                    .send({ from: accounts[0], gas: '1000000' });
            } catch(e) {
                expect(e.message).to.match(/revert/);

                await campaign.methods.approveRequest(2).send({ from: accounts[3], gas: '1000000' });
                await campaign.methods.finalizeRequest(2)
                    .send({ from: accounts[0], gas: '1000000' });
                return;
            }

            throw new Error('finalizeRequest() should have thrown because not enough approvals');
        });
        it('should send Request.value to vendor address and should mark Request.complete as true', async () => {
            let campaignBalance = await web3.eth.getBalance(campaign.options.address);
            expect(campaignBalance).to.equal( web3.utils.toWei('0.0303', 'ether') );
            let requestData = await campaign.methods.requests(2).call();
            let completeStatus = requestData['3'];
            expect(completeStatus).to.be.false;
            let requestValue = requestData['2'];
            let vendor = requestData['1'];
            let vendorBalanceBefore = await web3.eth.getBalance(vendor);

            // get one more approval bc of 50%+ requirement
            await campaign.methods.approveRequest(2)
                .send({ from: accounts[3], gas: '1000000' });
            await campaign.methods.finalizeRequest(2)
                .send({ from: accounts[0], gas: '1000000' });

            campaignBalance = await web3.eth.getBalance(campaign.options.address);
            expect(campaignBalance).to.equal( web3.utils.toWei('0.0003', 'ether') );

            completeStatus = (await campaign.methods.requests(2).call())['3'];
            expect(completeStatus).to.be.true;

            const vendorBalanceAfter = await web3.eth.getBalance(vendor);
            expect( parseInt(vendorBalanceAfter) ).to.equal( parseInt(vendorBalanceBefore) + parseInt(requestValue) );
        });
        it('should require that request is not already complete', async () => {
            // contribute alot so campaign has more than enough value to send
            await campaign.methods.contribute().send({ from: accounts[4], value: web3.utils.toWei('1', 'ether'), gas: '1000000' });
            // get two more approval bc 50% requirement (3 approvals out of 4 approvers)
            await campaign.methods.approveRequest(2).send({ from: accounts[3], gas: '1000000' });
            await campaign.methods.approveRequest(2).send({ from: accounts[4], gas: '1000000' });
            // finalize request 2
            await campaign.methods.finalizeRequest(2).send({ from: accounts[0], gas: '1000000' });
            // try finalizing it again but should get error
            try {
                await campaign.methods.finalizeRequest(2).send({ from: accounts[0], gas: '1000000' });
            } catch(e) {
                return expect(e.message).to.match(/revert/);
            }

            throw new Error('finalizeRequest() should have thrown because it should be complete');
        });
    });
});