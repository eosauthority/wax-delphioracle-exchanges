# WAX Delphi Oracle Script with multiple exchange support

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

    [WAXP/BTC](https://api.huobi.pro/market/trade?symbol=waxpbtc)
    [WAXP/ETH](https://api.huobi.pro/market/trade?symbol=waxpeth)
    [WAXP/USD](https://api.huobi.pro/market/trade?symbol=waxpusdt)

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
