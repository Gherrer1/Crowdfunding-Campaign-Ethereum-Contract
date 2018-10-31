import React from 'react';
import { Button } from 'semantic-ui-react';
import { Link } from '../../../routes';
import Layout from '../../../components/Layout';

class RequestIndex extends React.Component {
    render() {
        const { address } = this.props.url.query;
        return (
            <Layout>
                <h3>Request List</h3>
                <Link route={`/campaigns/${address}/requests/new`}>
                    <a>
                        <Button>New Request</Button>
                    </a>
                </Link>
            </Layout>
        );
    }
}

export default RequestIndex;