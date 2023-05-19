# WAX Delphi Oracle Script with multiple exchange support

## Features
- Suppots multiple exchanges that have WAX listing
- Fallback to next exchange configured (if unavailable)
- Fallback to next API endpoint if API is unavailable (increases reliability of the oracle service) 

## Supported exchanges & pairs

- Binance: 

    [WAXP/BTC](https://api.binance.com/api/v3/ticker/price?symbol=WAXPBTC)
    [WAXP/USD](https://api.binance.com/api/v3/ticker/price?symbol=WAXPUSDT)  

- Bitfinex:

    [WAX/USD](https://api.bitfinex.com/v1/pubticker/WAXUSD)

- Bittrex:

    [WAXP/BTC](https://api.bittrex.com/v3/markets/WAXP-BTC/ticker)
    [WAXP/ETH](https://api.bittrex.com/v3/markets/WAXP-ETH/ticker)
    [WAXP/USD](https://api.bittrex.com/v3/markets/WAXP-USD/ticker)

- Huobi:

    [WAXP/USD](https://api.huobi.pro/market/trade?symbol=waxpusdt)

- Kucoin:

    [WAXP/BTC](https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=WAX-BTC)
    [WAXP/ETH](https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=WAX-ETH)
    [WAXP/USD](https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=WAX-USDT)

## Configure

Copy .env.example to .env and edit to your needs.

```
INTERVAL_SECONDS="<INTERVAL_SECONDS>"
ENDPOINT="<ENDPOINT>"
ACCOUNT="<ACCOUNT>"
PRIVATE_KEY="<PRIVATE KEY>"
PERMISSION="<PERMISSION>"
EXCHANGE="<EXCHANGE>"
```

## Install

```
$ pm2 install
$ npm install
```

## Run
```
$ npm start
```
Can be run standalone or with pm2.
