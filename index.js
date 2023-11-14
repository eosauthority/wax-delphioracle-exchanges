const config = require('./config');
const { Api, JsonRpc } = require('eosjs');
const { TextDecoder, TextEncoder } = require('text-encoding');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const moment = require('moment');

//this is the order to fallback if ticker is not available 
const exchanges = ['kucoin', 'bitfinex', 'binance', 'huobi'];

const pairs = [
    { name: 'waxpbtc', precision: 8 },
    { name: 'waxpeth', precision: 8 },
    { name: 'waxpusd', precision: 4 },
    { name: 'usdcusd', precision: 4 },
    { name: 'usdtusd', precision: 4 },        
];

const send_quotes = async () => {
    console.log(`==============Start: ${moment().utc().format()}====================`);

    try {
        const quotes = [];
        for (const pair of pairs) {
            console.log(`Pair ${pair.name}`);

            let validQuoteFound = false; // Track if a valid quote is found for the pair

            for (const exchange of exchanges) {
                console.log(`Trying Exchange ${exchange}`);

                try {
                    const ticker = getTicker(pair.name, exchange);
                    if (!ticker) {
                        console.error(`Could not use exchange ${exchange} as ticker ${pair.name} was not available`);
                        continue; // Move on to the next exchange
                    }

                    const url = getExchangeUrl(exchange, ticker);
                    const res = await fetch(url, { timeout: 5 * 1000 });

                    if (!res.ok) {
                        console.error(`Failed Exchange ${exchange} and no data returned`);
                        continue; // Move on to the next exchange
                    }

                    const data = await res.json();

                    if (!isValidData(data, pair.name, ticker, exchange)) {
                        console.error(`Data from Exchange ${exchange} for ticker ${ticker} was not valid.`, JSON.stringify(data));
                        continue; // Move on to the next exchange
                    } else {
                        console.log(`Fetched data from Exchange ${exchange} for ticker ${ticker}.`, JSON.stringify(data));
                        validQuoteFound = true;
                    }

                    quotes.push({
                        pair: pair.name,
                        value: Math.round(parseFloat(getPrice(data, pair.name, exchange)) * Math.pow(10, pair.precision)),
                    });

                    // If a quote is found, break out of the loop for this pair
                    console.log(`Fetched Data from ${exchange} for ${ticker}`);
                    break;
                } catch (e) {
                    console.error(`Failed Exchange ${exchange} - ${e.message}`);
                }
            }

            if (!validQuoteFound) {
                console.log(`No valid quotes found for ${pair.name}`);
            }
        }

        if (!quotes.length) {
            console.log(`No quotes found for any pair`);
            return;
        }

        try {
            // const res = await transactRetry([...config.endpoints], quotes);
            // console.log(`Pushed transaction ${res.transaction_id}`);
            console.log([...config.endpoints], quotes);
        } catch (e) {
            console.error(`Failed to push quotes - ${e.message}`);
        }
    } catch (e) {
        console.error(`Failed - ${e.message}`);
    }
    console.log(`==============Stop: ${moment().utc().format()}====================`);
};


function getTicker(pairName, exchange) {
    switch (exchange) {
        case 'binance':
            return pairName === 'waxpbtc' ? 'WAXPBTC' : pairName === 'waxpusd' ? 'WAXPUSDT' : null;
        case 'huobi':
            return pairName === 'waxpusd' ? 'waxpusdt' : null;
        case 'bitfinex':
            return pairName === 'usdcusd' ? 'UDCUSD' : pairName === 'usdtusd' ? 'USTUSD' : null;
        case 'kucoin':
            return pairName === 'waxpbtc' ? 'WAX-BTC' : pairName === 'waxpeth' ? 'WAX-ETH' : pairName === 'waxpusd' ? 'WAX-USDT' : null;
        default:
            return null;
    }
}

function getExchangeUrl(exchange, ticker) {
    switch (exchange) {
        case 'binance':
            return `https://api.binance.com/api/v3/ticker/price?symbol=${ticker}`;
        case 'huobi':
            return `https://api.huobi.pro/market/trade?symbol=${ticker}`;
        case 'bitfinex':
            return `https://api.bitfinex.com/v1/pubticker/${ticker}`;
        case 'kucoin':
            return `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${ticker}`;
        default:
            return null;
    }
}

// Replace config.exchange with exchange in isValidData and getPrice functions

function isValidData(data, pairName, ticker, exchange) {
    switch (exchange) {
        case 'binance':
            return data && data.symbol === ticker && parseFloat(data.price) !== 0;
        case 'huobi':
            return data && data.tick && data.tick.data[0] && parseFloat(data.tick.data[0].price) !== 0;
        case 'bitfinex':
            return data && parseFloat(data.last_price) !== 0;
        case 'kucoin':
            return data && data.data && parseFloat(data.data.price) !== 0;
        default:
            return false;
    }
}

function getPrice(data, pairName, exchange) {
    switch (exchange) {
        case 'binance':
            return data.price;
        case 'huobi':
            return data.tick.data[0].price;
        case 'bitfinex':
            return data.last_price;
        case 'kucoin':
            return data.data.price;
        default:
            return null;
    }
}


function getNextFallback(currentFallback) {
    const fallbackExchanges = currentFallback.split(',');
    return fallbackExchanges.shift() || null;
}

// Rest of the code remains unchanged

const transactRetry = async (endpoints, quotes) => {
    let endpoint = endpoints.shift();
    console.log(`Endpoint: ${endpoint}`);

    try {
        rpc = new JsonRpc(endpoint, { fetch });
        signatureProvider = new JsSignatureProvider([config.private_key]);
        api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
    } catch (error) {}

    console.log(`Quotes`, quotes);

    const actions = [
        {
            account: 'delphioracle',
            name: 'write',
            authorization: [
                {
                    actor: config.account,
                    permission: config.permission,
                },
            ],
            data: {
                owner: config.account,
                quotes: quotes,
            },
        },
    ];

    return api
        .transact(
            {
                actions,
            },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            }
        )
        .then((res) => {
            return res;
        })
        .catch((error) => {
            console.error(`Failed - ${error.message}`);

            if (endpoints.length > 0) {
                return transactRetry(endpoints, quotes);
            } else {
                throw new Error('All endpoints failed');
            }
        });
};

const transact = async (quotes) => {
    console.log(`Quotes`, quotes);

    const actions = [
        {
            account: 'delphioracle',
            name: 'write',
            authorization: [
                {
                    actor: config.account,
                    permission: config.permission,
                },
            ],
            data: {
                owner: config.account,
                quotes: quotes,
            },
        },
    ];

    return api.transact(
        {
            actions,
        },
        {
            blocksBehind: 3,
            expireSeconds: 30,
        }
    );
};

const start = async () => {
    send_quotes();
    const interval = config.interval * 1000 || 60 * 2 * 1000;
    setInterval(send_quotes, interval);
};

start();
