import React from 'react';
import { Divider, Container } from 'semantic-ui-react';

export default function Footer() {
    return (
        <div>
            <Divider />
            <Container>
                <p>
                    * Disclaimer: This is just a hobby project that interacts with a Smart Contract that I wrote and deployed onto the Rinkeby Ethereum test network.
                    No Ether exchanged on this site has any real world value - it is purely for the demonstration of skills and experience
                    using Solidity, Web3, and general Smart Contract programming for blockchain.
                </p>
            </Container>
        </div>
    );
}