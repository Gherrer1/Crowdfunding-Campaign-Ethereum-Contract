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
        };

        this.handleApprove = this.handleApprove.bind(this);
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
        const { description, value, recipient, approvalCount } = this.props.request;
        const { numApprovers } = this.props;
        const { loading } = this.state;

        return (
            <Table.Row>
                <Table.Cell>{this.props.index}</Table.Cell>
                <Table.Cell>{description}</Table.Cell>
                <Table.Cell>{web3.utils.fromWei(value, 'ether')} ETH</Table.Cell>
                <Table.Cell>{recipient}</Table.Cell>
                <Table.Cell>{approvalCount} / {numApprovers}</Table.Cell>
                <Table.Cell>
                    <Button color="green" basic loading={loading} onClick={this.handleApprove}>Approve</Button>
                </Table.Cell>
                <Table.Cell>
                    <Button color="teal" basic>Finalize</Button>
                </Table.Cell>
            </Table.Row>
        );
    }
}

export default RequestRow;