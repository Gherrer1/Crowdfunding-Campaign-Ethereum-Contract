import React from 'react';
import { Card, Grid } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import ContributeForm from '../../components/ContributeForm';
import Campaign from '../../ethereum/campaign';
import web3 from '../../ethereum/web3';

class CampaignShow extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            contribution: '',
        };
    }

    static async getInitialProps(props) {
        const { address } = props.query;
        return await CampaignShow.getSummary(address);
    }

    static async getSummary(address) {
        const campaign = Campaign(address);
        const campaignSummary = await campaign.methods.getSummary().call();

        return {
            balance: campaignSummary[0],
            minContribution: campaignSummary[1],
            requests: campaignSummary[2],
            contributorsCount: campaignSummary[3],
            manager: campaignSummary[4],
        };
    }

    renderCardGroup() {
        const { balance, minContribution, requests, contributorsCount, manager } = this.props;
        const items = [
            {
                header: web3.utils.fromWei(balance),
                meta: 'Address of Manager',
                description: 'The manager created this campaign and can create requests and withdraw money',
                style: {
                    overflowWrap: 'break-word',
                },
            },
            {
                header: minContribution,
                meta: 'Minimum Contribution (wei)',
                description: 'You must contribute at least this much wei to become an approver',
            },
            {
                header: requests,
                meta: 'Number of Requests',
                description: 'A request tries to withdraw money from the contract. Requests must be approved by approvers (contributers)'
            },
            {
                header: contributorsCount,
                meta: 'Number of approvers',
                description: 'Number of people who have already donated to this campaign',
            },
            {
                header: balance,
                meta: 'Balance (in Ether)',
                description: 'How much money remains in the contract.'
            }
        ];
        
        return <Card.Group items={items} />
    }

    render() {
        const { balance, minContribution, requests, contributorsCount } = this.props;
        return (
            <Layout>
                <Grid>
                    <Grid.Column width={10}>
                        {this.renderCardGroup()}
                    </Grid.Column>
                    <Grid.Column width={6}>
                        <ContributeForm address={this.props.url.query.address} />
                    </Grid.Column>
                </Grid>
            </Layout>
        );
    }
}

export default CampaignShow;