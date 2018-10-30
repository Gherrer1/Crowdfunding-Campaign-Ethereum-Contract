import React from 'react';
import { Card, Button } from 'semantic-ui-react';
import CampaignFactory from '../ethereum/factory';
import Layout from '../components/Layout';
import { Link, Router } from '../routes';

export default class Root extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            campaigns: [],
        };
    }

    static async getInitialProps() {
        const campaigns = await CampaignFactory.methods.getDeployedContracts().call();
        return { campaigns };
    }

    renderCardGroup() {
        const { campaigns } = this.props;
        const campaignObjects = campaigns.map(address => ({
            header: address,
            description: (
                <Link route={`/campaigns/${address}`}>
                    <a>Checkout this campaign</a>
                </Link>
            ),
            fluid: true,
        }));
        return (
            <Card.Group items={campaignObjects} />
        )      
    }

    render() {
        return (
            <Layout>
                <div>
                    <h1>Open Campaigns</h1>
                    <Link route="/campaigns/new">
                        <a>
                            <Button
                                content="Create Campaign"
                                icon="add circle"
                                labelPosition="left"
                                primary
                                floated="right"
                            />
                        </a>
                    </Link>
                    {this.renderCardGroup()}
                </div>
            </Layout>
        );
    }
}