# Connex

[![npm version](https://badge.fury.io/js/%40vechain%2Fconnex.svg)](https://badge.fury.io/js/%40vechain%2Fconnex)

The out of the box Connex implementation for **browser**.

## Installation

### Include in `<script>` tag

Just include the CDN link within a script tag. `Connex` will then be registered as a global variable.

```html
<!-- install the latest v2 -->
<script src="https://unpkg.com/@vechain/connex@2" />
```

### NPM

It's recommended for larger projects.

```sh
npm i @vechain/connex
```

```ts
import Connex from '@vechain/connex'
```

## Get Started

Connex was composed with two parts, `Connex.Thor` and `Connex.Vendor`, the former is the blockchain access layer, the latter is the vendor(signer) specific layer.

### Create Thor 

Connects to **mainnet**.

``` ts
const thor = new Connex.Thor({
    node: 'https://mainnet.veblocks.net/', // veblocks public node, use your own if needed
    network: 'main' // defaults to mainnet, so it can be omitted here
})
```

Connects to **testnet**.

``` ts
const thor = new Connex.Thor({
    node: 'https://testnet.veblocks.net/',
    network: 'test'
})
```

Or connect to a *private network*

```ts
const thor = new Connex.Thor({
    node: '<the API url of your node>',
    // the genesis block of your private network
    network: {
        id: '0x...',
        ...
    }
})
```

### Create Vendor

Vendor module handles user's signing requests. It's designed to be pluggable, so you can use your own vendor module, or use the built-in vendor module. For example, ['Buy me a coffee'](https://codepen.io/qianbin/pen/YzGBeOB) is a classic demo for a vendor only app.

```ts
/**
 * @param network 'main' or 'test' or genesis ID if it's private network
 * @param signer 'sync2' or 'sync'(sync and vechainthor mobile wallet), 'sync2' will be used if omitted
 */

// will throw error if signer is not supported.
const vendor = new Connex.Vendor('main'， 'sync2') // create a sync2 vendor for mainnet
const vendor = new Connex.Vendor('test'， 'sync')  // sync or vechainthor mobile wallet
```

**Wallets:**

- [Sync2](https://sync.vecha.in/) - Option `sync2`
- [Sync](https://env.vechain.org/#sync) - Option `sync`
- [VeChainThor Wallet](https://env.vechain.org/#thor-wallet) - Option `sync`
- [VeWorld Extension](https://www.veworld.com/) - See [below](#creating-a-veworld-extension-vendor)

### Create Full Connex

```ts
const connex = new Connex({
    node: 'https://mainnet.veblocks.net/',
    network: 'main',
    signer: 'sync2'
})

// read best block
const best = await connex.thor.block().get()
// sign a transaction
const res = await connex.vendor.sign('tx', [{
    to: '0x...',
    value: 0x0,
    data: '0x...'
}]).request()
// composed by thor and vendor
const {thor, vendor} = connex
```

## Note for Node.js

This package, **@vechain/connex** is designed only work in the browser, if you are interested in running it in Node.js, try [@vechain/connex-framework](https://github.com/vechain/connex/tree/master/packages/framework).

## Creating a custom Connex Vendor

```typescript
/// <reference types="@vechain/connex-types" />
import { newVendor } from "@vechain/connex-framework"
import { LazyDriver } from "@vechain/connex/esm/driver"

const myCustomSigner: Connex.Signer = {
  signCert: async (
    cert: Connex.Vendor.CertMessage,
    options: Connex.Signer.CertOptions
  ) => {
    // TODO: Implement
  },
  signTx: async (
    tx: Connex.Vendor.TxMessage,
    options: Connex.Signer.TxOptions
  ) => {
    // TODO: Implement
  },
}

// Convert a Connex.Signer -> Connex.Vendor
const createVendorFromSigner = (signer: Connex.Signer): Connex.Vendor =>
    newVendor(new LazyDriver(Promise.resolve(signer)))


const myCustomVendor: Connex.Vendor = createVendorFromSigner(myCustomSigner)
```

## Creating a VeWorld Extension Vendor

```typescript
/// <reference types="@vechain/connex-types" />
import { newVendor } from "@vechain/connex-framework"
import { LazyDriver } from "@vechain/connex/esm/driver"

declare global {
  interface Window {
    vechain: {
      newConnexSigner: (genesisId: string) => Connex.Signer
    }
  }
}

// Convert a Connex.Signer -> Connex.Vendor
const createVendorFromSigner = (signer: Connex.Signer): Connex.Vendor =>
    newVendor(new LazyDriver(Promise.resolve(signer)))

/**
 * Get the extension's vendor
 * @param genesisId - The genesis ID of the network
 * @returns Connex.Vendor
 * @throws Error if the extension is not installed
 */
const getExtensionVendor = (genesisId: string): Connex.Vendor => {
  if (!window.vechain) throw new Error("VeWorld is not installed")

  const extensionSigner = window.vechain.newConnexSigner(genesisId)

  return createVendorFromSigner(extensionSigner)
}
```


## License

This package is licensed under the
[GNU Lesser General Public License v3.0](https://www.gnu.org/licenses/lgpl-3.0.html), also included in *LICENSE* file in the repository.
