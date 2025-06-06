# Connex Driver

[![npm version](https://badge.fury.io/js/%40vechain%2Fconnex-driver.svg)](https://badge.fury.io/js/%40vechain%2Fconnex-driver)

This library implement Connex.Driver, which drives Connex Framework.

## ⚠️ Repository Notice: End-of-Life (EOL)

**This repository now has reached its end-of-life (EOL).** We have transitioned to brand new and comprehensive [VeChain SDK](https://github.com/vechain/vechain-sdk-js) that will continue to receive updates, support, and new features.

For any further questions or migration guidance, please reach out using our [support portal](https://support.vechain.org/support/home).

## Installation

```bash
# install driver along with framework
npm i @vechain/connex-framework @vechain/connex-driver
```

## Usage

The [REPL playground](https://github.com/vechain/connex/tree/master/packages/repl) is a good start.


```typescript
import { Framework } from '@vechain/connex-framework'
import { Driver, SimpleNet, SimpleWallet } from '@vechain/connex-driver'

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
driver.txParams.maxPriorityFeePerGas = 100 // 100 Wei for tipping the miner
driver.txParams.txType = Transaction.Type.DynamicFee // txType to use

// watch committed tx
driver.onTxCommit = txObj => {
    // 
}
```

## License

This package is licensed under the
[GNU Lesser General Public License v3.0](https://www.gnu.org/licenses/lgpl-3.0.html), also included
in *LICENSE* file in the repository.
