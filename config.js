require("dotenv").config();

module.exports = {
    interval: process.env.INTERVAL_SECONDS || 120, // interval in seconds
    //endpoint: process.env.ENDPOINT || 'https://wax-test.eosdac.io',
    endpoints: process.env.ENDPOINT.split(',') || ['https://wax-test.eosdac.io'],
    account: process.env.ACCOUNT || '[your bp account name]',
    permission: process.env.PERMISSION || '[permission used to push quotes]',
    private_key: process.env.PRIVATE_KEY || '[private key that satisfies that permission]',
    exchange: process.env.EXCHANGE || '[exchange]',
};