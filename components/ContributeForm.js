import React from 'react';
import { Button, Form, Input, Message } from 'semantic-ui-react';
import { Router } from '../routes';
import Campaign from '../ethereum/campaign';
import web3 from '../ethereum/web3';


export default class ContributeForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            contribution: '',
            loading: false,
            message: null,
            success: false,
        };

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async handleSubmit(event) {
        event.preventDefault();

        this.setState({
            loading: true,
            message: null,
        });
        const campaign = Campaign(this.props.address);
        try {
            const accounts = await web3.eth.getAccounts();
            const contributionInWei = web3.utils.toWei(this.state.contribution);
            await campaign.methods.contribute()
                .send({ from: accounts[0], value: contributionInWei });
            this.setState({
                loading: false,
                success: true,
                contribution: '',
            });
            Router.replaceRoute(`/campaigns/${this.props.address}`);
        } catch(e) {
            this.setState({
                loading: false,
                message: e.message,
                success: false,
            });
        }
    }

    getFriendlyErrorMessage(devErrorMessage) {
        if(/No "from" address specified/.test(devErrorMessage)) {
            return 'No account found. Please install MetaMask and sign in';
        }

        if(/User denied transaction/.test(devErrorMessage)) {
            return 'You cancelled the transaction.';
        }

        if(/while converting number to string/.test(devErrorMessage)) {
            return 'Please enter a valid number';
        }

        return `Something went wrong: ${devErrorMessage}`;
    }

    render() {
        return (
            <div>
                <h3>Contribute!</h3>
                <Form onSubmit={e => this.handleSubmit(e)}>
                    <Form.Field>
                        <label>Amount to contribute</label>
                        <Input
                            label="ether"
                            labelPosition="right"
                            onChange={e => this.setState({ contribution: e.target.value })}
                            value={this.state.contribution}
                        />
                    </Form.Field>
                    <Button type="submit" primary loading={this.state.loading} positive={this.state.success} disabled={!this.state.success && this.state.contribution === ''}>
                        {this.state.success ? 'Success!' : 'Contribute!'}
                    </Button>
                    {this.state.message &&
                        <Message negative>
                            <Message.Header>Error</Message.Header>
                            <p>{this.getFriendlyErrorMessage(this.state.message)}</p>
                        </Message>
                    }
                    {this.state.loading &&
                        <Message>
                            <Message.Header>Please be patient</Message.Header>
                            <p>Transaction may take up to 60 seconds for miners to process your transaction.</p>
                        </Message>
                    }
                </Form>
            </div>
        );
    }
}
