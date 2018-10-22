import React from 'react';
import CampaignFactory from '../ethereum/factory';
import { Card, Button } from 'semantic-ui-react';

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
            <div>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.3/semantic.min.css" />
                <h1>Open Campaigns</h1>
                {this.renderCardGroup()}
                <Button content="Create Campaign" icon="add circle" labelPosition="left" primary />
            </div>
        );
    }
}