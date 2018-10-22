import web3 from './web3';
import CampaignFactory from './build/factory.json';

const instance = new web3.eth.Contract(
    JSON.parse(CampaignFactory.interface),
    '0xc1d812676dc6Ca789898Cb226C6E0eE9B6179FB7',
);

export default instance;