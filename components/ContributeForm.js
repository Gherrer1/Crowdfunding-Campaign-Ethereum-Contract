import React from 'react';
import { Button, Form, Input } from 'semantic-ui-react';


export default class ContributeForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            contribution: '',
        };
    }

    render() {
        return (
            <div>
                <h3>Contribute!</h3>
                <Form onSubmit={e => e.preventDefault()}>
                    <Form.Field width={4}>
                        <Input
                            label="wei"
                            labelPosition="right"
                            onChange={e => this.setState({ contribution: e.target.value })}
                            value={this.state.contribution}
                        />
                    </Form.Field>
                    <Button type="submit" primary>Contribute!</Button>
                </Form>
            </div>
        );
    }
}
