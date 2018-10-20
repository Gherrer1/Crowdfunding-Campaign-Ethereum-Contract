import React from 'react';
import Web3 from 'web3';
import { contractInterface, contractAddress } from '../instance.info';

export default class Root extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            campaigns: [],
            errorMessage: null,
        };

        this.fetchCampaigns = this.fetchCampaigns.bind(this);
    }

    async componentDidMount() {
        if (!window.web3) {
            return this.setState({
                errorMessage: 'You dont have meta mask installed!',
            });
        }

        this.web3 = new Web3(window.web3.currentProvider);
        this.CampaignFactory = await new this.web3.eth.Contract(JSON.parse(contractInterface), contractAddress);

        // listener for user login or account switch
        this.web3.currentProvider.publicConfigStore.on('update', newData => this.fetchCampaigns(newData.selectedAddress));
 
        let accounts = await this.web3.eth.getAccounts();
        if (accounts.length > 0) {
            this.fetchCampaigns(accounts[0]);
        }
    }

    async fetchCampaigns(account) {
        if (!account || account === '') {
            return this.setState({
                errorMessage: 'No MetaMask account found. You might not be logged in',
                campaigns: [],
            });
        }

        if (this.state.campaigns.length === 0) {
            const campaigns = await this.CampaignFactory.methods.getDeployedContracts().call();
            this.setState({
                campaigns,
                errorMessage: null,
            });
        }
    }

    render() {
        if (this.state.errorMessage) {
            return <h1>{this.state.errorMessage}</h1> 
        }

        return (
            <div>
                <h1>Open Campaigns</h1>
                {this.state.campaigns.map(address => (
                    <div key={address}>{address}</div>
                ))}
            </div>
        )
    }
}