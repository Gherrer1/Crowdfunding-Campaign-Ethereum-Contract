import React from 'react';
import { Card, Button } from 'semantic-ui-react';
import CampaignFactory from '../ethereum/factory';
import Layout from '../components/Layout';

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
            description: <a href="nba.com">Checkout this checkout</a>,
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
                    <Button content="Create Campaign" icon="add circle" labelPosition="left" primary floated="right" />
                    {this.renderCardGroup()}
                </div>
            </Layout>
        );
    }
}