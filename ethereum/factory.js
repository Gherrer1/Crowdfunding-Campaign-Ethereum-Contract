import web3 from './web3';
import CampaignFactory from './build/factory.json';

const instance = new web3.eth.Contract(
    JSON.parse(CampaignFactory.interface),
    '0xC39C8da9A295b79Aa77ef407d4fc8968786F62Cb',
);

export default instance;