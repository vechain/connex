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

It's recommended when your project is a bit large.

```sh
npm i @vechain/connex
```

```ts
import Connex from '@vechain/connex'
```

## Startup

### Create a Connex object connects to VeChain **mainnet**

```ts
const connex = new Connex({
    node: 'https://mainnet.veblocks.net/', // veblocks public node, use your own if needed
    network: 'main' // defaults to mainnet, so it can be omitted here
})
```

### Connect to **testnet**

```ts
const connex = new Connex({
    node: 'https://testnet.veblocks.net/',
    network: 'test'
})
```

### Or connect to private network

```ts
const connex = new Connex({
    node: '<the API url of your node>',
    // the genesis block of your private network
    network: {
        id: '0x...',
        ...
    }
})
```

### Create `Vendor` module only

In some cases, e.g. the classic ['Buy me a coffee'](https://codepen.io/qianbin/pen/YzGBeOB) demo, you don't need the ability to access the blockchain. You can opt-out `Connex.Thor` module, and just create `Connex.Vendor` module.

```ts
const vendor = new Connex.Vendor('main') //'main','test' or genesis ID if it's private network
```

## Using in Node.js environment

This package, **@vechain/connex** is designed only work in the browser, if you are interested in running it in Node.js, try [@vechain/connex-framework](https://github.com/vechain/connex/tree/master/packages/framework).

## License

This package is licensed under the
[GNU Lesser General Public License v3.0](https://www.gnu.org/licenses/lgpl-3.0.html), also included
in *LICENSE* file in the repository.
