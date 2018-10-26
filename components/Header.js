import React from 'react';
import { Menu } from 'semantic-ui-react';

export default () => (
    <Menu style={{ marginTop: '10px' }}>
        <Menu.Item name="logo">
            CrowdCoin
        </Menu.Item>

        <Menu.Menu position="right">
            <Menu.Item name="signup">
                Campaigns
            </Menu.Item>
            <Menu.Item name="help">
                +
            </Menu.Item>
        </Menu.Menu>
    </Menu>
);