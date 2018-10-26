import React from 'react';
import { Form, Button, Input, Message } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import web3 from '../../ethereum/web3';
import CampaignFactory from '../../ethereum/factory';
import { Router } from '../../routes';

const NO_ACCOUNT_FOUND = 'No meta mask account detected';
const YOU_CANCELLED = 'You rejected the transaction.';
const INVALID_VALUE = 'Invalid Value';

// TODO: add Eth to Wei converter

export default class CampaignNew extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            minimumContribution: '',
            message: null,
            loading: false,
        };

        this.handleCreateSubmit = this.handleCreateSubmit.bind(this);
    }

    async handleCreateSubmit(e) {
        const stringIsInteger = (str) => /^\d+$/.test(str);
        e.preventDefault();

        if(!stringIsInteger(this.state.minimumContribution)) {
            return this.setState({
                message: INVALID_VALUE,
            });
        }

        const accounts = await web3.eth.getAccounts();
        if(accounts.length === 0) {
            return this.setState({
                message: NO_ACCOUNT_FOUND,
            });
        }
        try {
            this.setState({
                message: null,
                loading: true,
            })
            await CampaignFactory.methods
                .createCampaign(this.state.minimumContribution)
                .send({ from: accounts[0] });
            Router.pushRoute('/');
        } catch(e) {
            return this.setState({
                message: /denied transaction/.test(e.message) ?
                    YOU_CANCELLED :
                    e.message,
                loading: false,
            });
        }
    }

    renderMessageBanner() {
        const getBanner = (errorType, helpMessage) => () => (
            <Message negative>
                <Message.Header>{errorType}</Message.Header>
                <p>{helpMessage}</p>
            </Message>
        );

        if(!this.state.message) {
            return null;
        }

        const errorHelpMessageMap = {
            [NO_ACCOUNT_FOUND]: 'Install MetaMask and sign in to create a campaign.',
            [INVALID_VALUE]: 'Please enter a value in wei - this will be the minimum contribution.',
            [YOU_CANCELLED]: 'Campaign not created.',
        };

        return getBanner(this.state.message, errorHelpMessageMap[this.state.message]);
    }

    render() {
        const { minimumContribution, loading } = this.state;
        let MessageBanner = this.renderMessageBanner();

        return (
            <Layout>
                {MessageBanner && <MessageBanner />}
                <h3>Create a Campaign</h3>
                <Form onSubmit={this.handleCreateSubmit}>
                    <Form.Field width={4}>
                        <label>Minimum Contribution (wei)</label>
                        <Input
                            label="wei"
                            labelPosition="right"
                            onChange={e => this.setState({ minimumContribution: e.target.value })}
                            value={minimumContribution}
                        />
                    </Form.Field>
                    <Button type="submit" primary loading={loading}>Create</Button>
                </Form>
            </Layout>
        )
    } 
}