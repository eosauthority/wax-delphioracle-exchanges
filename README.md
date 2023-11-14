# WAX Delphi Oracle Script with multiple exchange support

## Features
- Supports a variety of exchanges where WAX is listed
- Automatically switches to the next configured exchange in case of unavailability
- In case of API unavailability, it falls back to the next API endpoint to enhance the reliability of the oracle service

## Supported exchanges & pairs

- Binance: 

    [WAXP/BTC](https://api.binance.com/api/v3/ticker/price?symbol=WAXPBTC)
    [WAXP/USD](https://api.binance.com/api/v3/ticker/price?symbol=WAXPUSDT)  

- Bitfinex:

    [USDC/USD](https://api.bitfinex.com/v1/pubticker/UDCUSD)
    [USDT/USD](https://api.bitfinex.com/v1/pubticker/USTUSD)

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
