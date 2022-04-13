const config = require('./config');
const {Api, JsonRpc, Serialize} = require('eosjs');
const {TextDecoder, TextEncoder} = require('text-encoding');
const {JsSignatureProvider} = require('eosjs/dist/eosjs-jssig');
const fetch = require("node-fetch");
const moment = require('moment');

var rpc, signatureProvider, api;
try {
    rpc = new JsonRpc(config.endpoint, {fetch});
    signatureProvider = new JsSignatureProvider([config.private_key]);
    api = new Api({rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder()});
} catch (err) {
    console.log(`Api provider initialize error:`, err)
    process.exit();
}

const exchanges = ['binance', 'huobi', 'bitfinex', 'bittrex'];

const pairs = [
    {name: 'waxpbtc', precision: 8},
    {name: 'waxpeth', precision: 8},
    {name: 'waxpusd', precision: 4}
];

const send_quotes = async () => {
    console.log(`==============Start: ${moment().utc().format()}====================`)
    console.log(`Exchange ${config.exchange}`)
    if (!exchanges.includes(config.exchange)) {
        console.log(`Exchange ${config.exchange} not in list`)
        process.exit()
    }

    try {
        const quotes = [];
        switch (config.exchange) {
            case 'binance':
                for (const pair of pairs) {
                    var ticker;
                    switch (pair.name) {
                        case 'waxpbtc':
                            ticker = 'WAXPBTC';
                            break;
                        case 'waxpusd':
                            ticker = 'WAXPUSDT';
                            break;
                        default :
                            ticker = null;
                            break;
                    }
                    if (!ticker)
                        continue;

                    var url = `https://api.binance.com/api/v3/ticker/price?symbol=${ticker}`;
                    const res = await fetch(url);
                    const data = await res.json();

                    if (!data || data.symbol != ticker || parseFloat(data.price) == 0)
                        continue;

                    quotes.push({pair: pair.name, value: Math.round(parseFloat(data.price) * Math.pow(10, pair.precision))});
                }
                break;
            case 'huobi':
                for (const pair of pairs) {
                    var ticker;
                    switch (pair.name) {
                        case 'waxpbtc':
                            ticker = 'waxpbtc';
                            break;
                        case 'waxpeth':
                            ticker = 'waxpeth';
                            break;
                        case 'waxpusd':
                            ticker = 'waxpusdt';
                            break;
                        default :
                            ticker = null;
                            break;
                    }
                    if (!ticker)
                        continue;

                    var url = `https://api.huobi.pro/market/trade?symbol=${ticker}`;
                    const res = await fetch(url);
                    const data = await res.json();

                    if (!data || !data.tick || !data.tick.data[0] || parseFloat(data.tick.data[0].price) == 0)
                        continue;

                    quotes.push({pair: pair.name, value: Math.round(parseFloat(data.tick.data[0].price) * Math.pow(10, pair.precision))});
                }
                break;
            case 'bitfinex':
                for (const pair of pairs) {
                    var ticker;
                    switch (pair.name) {
                        case 'waxpusd':
                            ticker = 'WAXUSD';
                            break;
                        default :
                            ticker = null;
                            break;
                    }

                    if (!ticker)
                        continue;

                    var url = `https://api.bitfinex.com/v1/pubticker/${ticker}`;
                    const res = await fetch(url);
                    const data = await res.json();

                    if (!data || parseFloat(data.last_price) == 0)
                        continue;

                    quotes.push({pair: pair.name, value: Math.round(parseFloat(data.last_price) * Math.pow(10, pair.precision))});

                }
                break;
            case 'bittrex':
                for (const pair of pairs) {
                    var ticker;
                    switch (pair.name) {
                        case 'waxpbtc':
                            ticker = 'WAXP-BTC';
                            break;
                        case 'waxpeth':
                            ticker = 'WAXP-ETH';
                            break;
                        case 'waxpusd':
                            ticker = 'WAXP-USD';
                            break;
                        default :
                            ticker = null;
                            break;
                    }

                    if (!ticker)
                        continue;

                    var url = `https://api.bittrex.com/v3/markets/${ticker}/ticker`;
                    const res = await fetch(url);
                    const data = await res.json();

                    if (!data || data.symbol != ticker)
                        continue;

                    quotes.push({pair: pair.name, value: Math.round(parseFloat(data.lastTradeRate) * Math.pow(10, pair.precision))});

                }
                break;
        }

        if (quotes.length === 0) {
            throw new Error(`Quotes empty`);
        }

        try {
            const res = await transact(quotes);

            console.log(`Pushed transaction ${res.transaction_id}`);
        } catch (e) {
            console.error(`Failed to push quotes - ${e.message}`);
        }

    } catch (e) {
        console.error(`Failed - ${e.message}`);
    }
    console.log(`==============Stop: ${moment().utc().format()}====================`)
};

const transact = async (quotes) => {

    console.log(`Quotes`, quotes);

    const actions = [{
            account: 'delphioracle',
            name: 'write',
            authorization: [{
                    actor: config.account,
                    permission: config.permission
                }],
            data: {
                owner: config.account,
                quotes: quotes
            }
        }];

    // console.log(actions);

    return api.transact({
        actions
    }, {
        blocksBehind: 3,
        expireSeconds: 30,
    });
};

const start = async () => {
    send_quotes();
    const interval = config.interval * 1000 || 60 * 2 * 1000;
    setInterval(send_quotes, interval);
};

start();


