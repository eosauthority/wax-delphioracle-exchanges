// index.js
const config = require('./config');
const { Api, JsonRpc } = require('eosjs');
const { TextDecoder, TextEncoder } = require('text-encoding');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const moment = require('moment');

// Order to fallback if ticker is not available
const exchanges = ['kucoin', 'bitfinex', 'binance', 'huobi'];

// Pairs to publish
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
      let validQuoteFound = false;

      // 1) try direct market
      for (const exchange of exchanges) {
        console.log(`Trying Exchange ${exchange}`);
        try {
          const ticker = getTicker(pair.name, exchange);
          if (!ticker) continue;

          const url = getExchangeUrl(exchange, ticker);
          const res = await fetch(url, { timeout: 5000 });
          if (!res.ok) continue;
          const data = await res.json();
          if (!isValidData(data, pair.name, ticker, exchange)) continue;

          const rawPrice = parseFloat(getPrice(data, pair.name, exchange));
          quotes.push({
            pair: pair.name,
            value: Math.round(rawPrice * Math.pow(10, pair.precision)),
          });
          validQuoteFound = true;
          console.log(`Fetched data from ${exchange} for ${ticker}`);
          break;

        } catch (e) {
          console.error(`Failed Exchange ${exchange} - ${e.message}`);
        }
      }

      // 2) if waxpeth failed, compute via waxpusd ÷ ethusd
      if (!validQuoteFound && pair.name === 'waxpeth') {
        console.log('🛠️  Fallback: computing WAXP/ETH as WAXP/USD ÷ ETH/USD');
        // a) get or fetch WAXP/USD
        const waxpUsdQuote = quotes.find(q => q.pair === 'waxpusd');
        let waxpUsdPrice = waxpUsdQuote
          ? waxpUsdQuote.value / Math.pow(10, 4)
          : await fetchPrice('waxpusd');

        // b) fetch ETH/USD
        const ethUsdPrice = await fetchPrice('ethusd');

        // c) compute and push
        const waxpEth = waxpUsdPrice / ethUsdPrice;
        quotes.push({
          pair: 'waxpeth',
          value: Math.round(waxpEth * Math.pow(10, 8)),
        });
        validQuoteFound = true;
      }

      if (!validQuoteFound) {
        console.log(`No valid quotes found for ${pair.name}`);
      }
    }

    if (!quotes.length) {
      console.log(`No quotes found for any pair`);
      return;
    }

    // Push to chain
    try {
      const res = await transactRetry([...config.endpoints], quotes);
      console.log(`Pushed transaction ${res.transaction_id}`);
    } catch (e) {
      console.error(`Failed to push quotes - ${e.message}`);
    }

  } catch (e) {
    console.error(`Failed - ${e.message}`);
  }
  console.log(`==============Stop: ${moment().utc().format()}====================`);
};

// Helper to fetch any pair by trying each exchange
async function fetchPrice(pairName) {
  for (const exchange of exchanges) {
    const ticker = getTicker(pairName, exchange);
    if (!ticker) continue;
    const url = getExchangeUrl(exchange, ticker);

    try {
      const res = await fetch(url, { timeout: 5000 });
      if (!res.ok) continue;
      const data = await res.json();
      if (!isValidData(data, pairName, ticker, exchange)) continue;
      return parseFloat(getPrice(data, pairName, exchange));
    } catch (e) {
      console.error(`fetchPrice ${exchange}/${ticker} failed:`, e.message);
    }
  }
  throw new Error(`All exchanges failed for ${pairName}`);
}

function getTicker(pairName, exchange) {
  switch (exchange) {
    case 'binance':
      if (pairName === 'waxpbtc') return 'WAXPBTC';
      if (pairName === 'waxpusd') return 'WAXPUSDT';
      if (pairName === 'ethusd')  return 'ETHUSDT';
      return null;
    case 'huobi':
      if (pairName === 'waxpusd') return 'waxpusdt';
      if (pairName === 'ethusd')  return 'ethusdt';
      return null;
    case 'bitfinex':
      if (pairName === 'usdcusd') return 'UDCUSD';
      if (pairName === 'usdtusd') return 'USTUSD';
      if (pairName === 'ethusd')  return 'ETHUSD';
      return null;
    case 'kucoin':
      if (pairName === 'waxpbtc') return 'WAX-BTC';
      if (pairName === 'waxpusd') return 'WAX-USDT';
      if (pairName === 'ethusd')  return 'ETH-USDT';
      return null;
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

function isValidData(data, pairName, ticker, exchange) {
  switch (exchange) {
    case 'binance':
      return data.symbol === ticker && parseFloat(data.price) !== 0;
    case 'huobi':
      return data.tick && data.tick.data[0] && parseFloat(data.tick.data[0].price) !== 0;
    case 'bitfinex':
      return parseFloat(data.last_price) !== 0;
    case 'kucoin':
      return data.data && parseFloat(data.data.price) !== 0;
    default:
      return false;
  }
}

function getPrice(data, pairName, exchange) {
  switch (exchange) {
    case 'binance':   return data.price;
    case 'huobi':     return data.tick.data[0].price;
    case 'bitfinex':  return data.last_price;
    case 'kucoin':    return data.data.price;
    default:          return null;
  }
}

const transactRetry = async (endpoints, quotes) => {
  const endpoint = endpoints.shift();
  console.log(`Endpoint: ${endpoint}`);
  const rpc = new JsonRpc(endpoint, { fetch });
  const signatureProvider = new JsSignatureProvider([config.private_key]);
  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  const actions = [{
    account: 'delphioracle',
    name: 'write',
    authorization: [{ actor: config.account, permission: config.permission }],
    data: { owner: config.account, quotes },
  }];

  return api.transact({ actions }, { blocksBehind: 3, expireSeconds: 30 })
    .catch(err => {
      console.error(`Failed - ${err.message}`);
      if (endpoints.length) return transactRetry(endpoints, quotes);
      throw new Error('All endpoints failed');
    });
};

const start = async () => {
  await send_quotes();
  const interval = (config.interval || 60) * 1000;
  setInterval(send_quotes, interval);
};

start();
