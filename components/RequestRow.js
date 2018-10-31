import React from 'react';
import { Table, Button } from 'semantic-ui-react';
import web3 from '../ethereum/web3';
import { Router } from '../routes';
import Campaign from '../ethereum/campaign';

function getFriendlyErrMsg(devErrMsg) {
    if(/No "from" address specified/.test(devErrMsg)) {
        return 'Please install MetaMask and sign in.';
    }

    return devErrMsg;
}

class RequestRow extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            finalizeLoading: false,
        };

        this.handleApprove = this.handleApprove.bind(this);
        this.handleFinalize = this.handleFinalize.bind(this);
    }

    async handleFinalize() {
        this.setState({ finalizeLoading: true });
        const { index, address, request, balance, numApprovers } = this.props;
        try {
            const accounts = await web3.eth.getAccounts();
            const campaign = Campaign(address);

            const isManager = (await campaign.methods.manager().call()) === accounts[0];
            if(!isManager) {
                throw new Error('Only the manager of this campaign can finalize requests.');
            }
            const insuffientFunds = parseInt(balance) < parseInt(request.value);
            if(insuffientFunds) {
                throw new Error('Insufficient funds on this campaign to fulfill this request at this time.');
            }
            const enoughApproversApprove = parseInt(request.approvalCount) > (parseInt(numApprovers) / 2);
            if(!enoughApproversApprove) {
                throw new Error('More than 50% of contributors must approve this request first.');
            }

            await campaign.methods.finalizeRequest(index).send({
                from: accounts[0],
            });
            this.setState({ finalizeLoading: false });
            Router.replaceRoute(`/campaigns/${address}/requests`);
        } catch(e) {
            window.alert(getFriendlyErrMsg(e.message));
        }

        this.setState({ finalizeLoading: false });
    }

    async handleApprove() {
        this.setState({ loading: true });
        const { index, address } = this.props;
        try {
            const accounts = await web3.eth.getAccounts();
            const campaign = Campaign(address);
            const isApprover = await campaign.methods.approvers(accounts[0]).call();
            if(!isApprover) {
                throw new Error('You must be a contributor to approve of this request!');
            }
            const alreadyVotedYes = await campaign.methods.getUsersVoteForRequest(index, accounts[0]).call();
            if(alreadyVotedYes) {
                throw new Error('You have already voted for this request');
            }

            await campaign.methods.approveRequest(index).send({
                from: accounts[0]
            });
            this.setState({ loading: false });
            Router.replaceRoute(`/campaigns/${address}/requests`);
        } catch(e) {
            window.alert(getFriendlyErrMsg(e.message));
        }
        this.setState({ loading: false });
    }

    render() {
        const { description, value, recipient, approvalCount, complete } = this.props.request;
        const { numApprovers } = this.props;
        const { loading, finalizeLoading } = this.state;
        const enoughApproversApprove = parseInt(approvalCount) > (parseInt(numApprovers) / 2);

        return (
            <Table.Row disabled={complete} positive={enoughApproversApprove && !complete}>
                <Table.Cell>{this.props.index}</Table.Cell>
                <Table.Cell>{description}</Table.Cell>
                <Table.Cell>{web3.utils.fromWei(value, 'ether')} ETH</Table.Cell>
                <Table.Cell>{recipient}</Table.Cell>
                <Table.Cell>{approvalCount} / {numApprovers}</Table.Cell>
                <Table.Cell>
                    {complete ?
                        'Complete' :
                        <Button color="green" basic loading={loading} onClick={this.handleApprove}>Approve</Button>
                    }
                </Table.Cell>
                <Table.Cell>
                    {complete ?
                        'Complete' :
                        <Button color="teal" basic loading={finalizeLoading} onClick={this.handleFinalize}>Finalize</Button>
                    }
                </Table.Cell>
            </Table.Row>
        );
    }
}

export default RequestRow;