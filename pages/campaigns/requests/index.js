import React from 'react';
import { Button, Table } from 'semantic-ui-react';
import { Link } from '../../../routes';
import Layout from '../../../components/Layout';
import RequestRow from '../../../components/RequestRow';
import Campaign from '../../../ethereum/campaign';
import web3 from '../../../ethereum/web3';

class RequestIndex extends React.Component {
    static async getInitialProps(props) {
        const campaign = Campaign(props.query.address);
        const summary = await campaign.methods.getSummary().call();
        const balance = summary[0];
        const numRequests = summary[2];
        const numApprovers = summary[3];

        const requests = await Promise.all(
            Array(parseInt(numRequests)).fill().map((_, index) => { return campaign.methods.requests(index).call()}),
        );

        return { requests, numRequests, numApprovers, balance };
    }

    render() {
        const { address } = this.props.url.query;
        const { numApprovers, balance, numRequests } = this.props;
        return (
            <Layout>
                <h3>Request List</h3>

                <Table celled>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>ID</Table.HeaderCell>
                            <Table.HeaderCell>Description</Table.HeaderCell>
                            <Table.HeaderCell>Amount</Table.HeaderCell>
                            <Table.HeaderCell>Recipient</Table.HeaderCell>
                            <Table.HeaderCell>Approval Count</Table.HeaderCell>
                            <Table.HeaderCell>Approve</Table.HeaderCell>
                            <Table.HeaderCell>Finalize</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {this.props.requests.map((request, index) => (
                            <RequestRow
                                key={index}
                                request={request}
                                index={index}
                                address={address}
                                numApprovers={numApprovers}
                                balance={balance}
                            />   
                        ))}
                    </Table.Body>
                </Table>

                <p>Found {numRequests} Request{numRequests > 1 ? 's' : ''}</p>

                <Link route={`/campaigns/${address}/requests/new`}>
                    <a>
                        <Button positive>New Request</Button>
                    </a>
                </Link>
            </Layout>
        );
    }
}

export default RequestIndex;