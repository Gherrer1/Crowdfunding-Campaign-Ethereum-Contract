import React from 'react';
import { Form, Input, Button, Message } from 'semantic-ui-react';
import Layout from '../../../components/Layout';
import { Router, Link } from '../../../routes';
import Campaign from '../../../ethereum/campaign';
import web3 from '../../../ethereum/web3';

class NewRequest extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            description: '',
            requestValue: '',
            recipient: '',
            loading: false,
            message: null,
        };

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    getFriendlyErrorMessage(devErrorMessage) {
        if(/invalid number value/.test(devErrorMessage)) {
            return 'Please enter a valid number for the Request value in Ether.';
        }
        if(/invalid address \(arg="vendorAddress"/.test(devErrorMessage)) {
            return 'Please enter a valid address for the recipient.';
            // return 'No account found. Please install MetaMask and sign in.';
        }

        return devErrorMessage;
    }

    async handleSubmit(event) {
        event.preventDefault();

        this.setState({
            loading: true,
            message: null,
        });
        const campaign = Campaign(this.props.url.query.address);
        try {
            const accounts = await web3.eth.getAccounts();
            const manager = await campaign.methods.manager().call();
            if(accounts[0] !== manager) {
                throw new Error('Only the manager of this campaign can create a request.');
            }
            const { description, requestValue, recipient } = this.state;
            const requestValueInWei = web3.utils.toWei(requestValue, 'ether');
            await campaign.methods.createRequest(description, requestValueInWei, recipient)
                .send({ from: accounts[0] })
            Router.pushRoute(`/campaigns/${this.props.url.query.address}/requests`);
        } catch(e) {
            this.setState({
                loading: false,
                message: e.message,
            });
        }
    }

    render() {
        const { loading } = this.state;
        const { description, requestValue, recipient } = this.state;
        return (
            <Layout>
                <Link route={`/campaigns/${this.props.url.query.address}/requests`}>
                    <a>Back</a>
                </Link>
                <h3>Create a Request</h3>
                <Form onSubmit={this.handleSubmit}>
                    <Form.Field width={6}>
                        <label>Description</label>
                        <Input
                            onChange={e => this.setState({ description: e.target.value })}
                            value={description}
                        />
                    </Form.Field>
                    <Form.Field width={6}>
                        <label>Amount in Ether</label>
                        <Input
                            onChange={e => this.setState({ requestValue: e.target.value })}
                            value={requestValue}
                        />
                    </Form.Field>
                    <Form.Field width={6}>
                        <label>Recipient</label>
                        <Input
                            onChange={e => this.setState({ recipient: e.target.value })}
                            value={recipient}
                        />
                    </Form.Field>
                    <Button
                        type="submit"
                        primary
                        loading={loading}
                        disabled={loading || description === '' || requestValue === '' || recipient === ''}
                    >
                        Create Request
                    </Button>
                    {this.state.message &&
                        <Message negative>
                            <Message.Header>Error</Message.Header>
                            <p>{this.getFriendlyErrorMessage(this.state.message)}</p>
                        </Message>
                    }
                </Form>
            </Layout>
        )
    }
}

export default NewRequest;