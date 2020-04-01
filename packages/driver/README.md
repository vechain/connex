# Connex Driver for NodeJS

[![npm version](https://badge.fury.io/js/%40vechain%2Fconnex.driver-nodejs.svg)](https://badge.fury.io/js/%40vechain%2Fconnex.driver-nodejs)

It drives Connex Framework to work in NodeJS environment. Now you can use Connex in NodeJS backend project.

## Installation

```bash
# install driver along with framework
npm i @vechain/connex-framework @vechain/connex.driver-nodejs
```

## Usage

The [REPL playground](https://github.com/vechain/connex-repl) is a good start.


```typescript
import { Framework } from '@vechain/connex-framework'
import { Driver, SimpleNet, SimpleWallet, options } from '@vechain/connex.driver-nodejs'

const wallet = new SimpleWallet()
// add account by importing private key
wallet.import('<private key>')

const driver = await Driver.connect(new SimpleNet('http://localhost:8669/'), wallet)
const connex = new Framework(driver)
// here get connex object ready to use
...

// config tx parameters, e.g. expiration, gasPriceCoef
driver.txParams.expiration = 18
driver.txParams.gasPriceCoef = 128

// watch committed tx
driver.onTxCommit = txObj => {
    // 
}

// if feel error logs annoying, you can disable it by
options.disableErrorLog = true
```