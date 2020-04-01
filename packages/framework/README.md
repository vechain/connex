# Connex Framework

[![npm version](https://badge.fury.io/js/%40vechain%2Fconnex-framework.svg)](https://badge.fury.io/js/%40vechain%2Fconnex-framework)

Connex Framework is a library implements Connex interface. 
It helps various wallet instances offer consistent Connex interface to VeChain DApps.

## Installation

```sh
npm i @vechain/connex-framework
```

## Usage

To create framework instance, Connex.Driver needs to be implemented

```typescript
import { Framework } from '@vechain/connex-framework'
import '@vechain/connex.driver'

class MyDriver implements Connex.Driver {
    // implementations
}

const driver = new MyDriver()

// it's suggested in development mode, which is helpful to diagnose driver implementation.
// const framework = new Framework(Framework.guardDriver(driver))

const framework = new Framework(driver)

// here `framework` is the ready-to-use Connex instance object
```

## See also

### Driver implementations:

* NodeJS - [connex.driver-nodejs](https://github.com/vechain/connex.driver-nodejs)

### Connex playground

* [connex repl](https://github.com/vechain/connex-repl)
