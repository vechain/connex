# Connex [![Gitter](https://badges.gitter.im/vechain/thor.svg)](https://gitter.im/vechain/thor?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

[![npm version](https://badge.fury.io/js/%40vechain%2Fconnex.svg)](https://badge.fury.io/js/%40vechain%2Fconnex)

## Introduction

Connex is the standard interface to connect VeChain apps with VeChain blockchain and user. `Connex` is a set of well-designed APIs for developers, with injected `Connex Object` in web applications they can easily build decentralized applications.

## Get Started 

[Sync](https://github.com/vechain/thor-sync.electron/releases) or other compatible clients will expose `connex` API by an injected object on `Window Object`.

### VeChain App Bootstrapping

VeChain apps are usually web apps. On app load, you always need to detect Connex component. If Connex is not available, you may instruct people to setup Connex environment.

To simplify these steps, simply perform redirection:

```javascript
if(!window.connex) {
    location.href = 'https://env.vechain.org/r/#' + encodeURIComponent(location.href)
}
```

Additionally, network can be specified:

```javascript
if(!window.connex) {
    // the app prefers running on test net
    location.href = 'https://env.vechain.org/r/#/test/' + encodeURIComponent(location.href)
}
```

### Install

#### TypeScript(Recommended)

``` bash
npm install @vechain/connex --save-dev
```

Add `@vechain/connex` to `compilerOptions.types`  in `tsconfig.json` then you are good to go!

#### Vanilla JS

No need to set up, just code in your favourite way.

### Usage

``` javascript
const el = document.createElement('h1')

const status = connex.thor.status
el.innerText = 'You are \'connexed\' to vechain, the status is ' + (status.progress === 1 ? 'synced': 'syncing')

document.querySelector('body').append(el)
```

## Developers

+ [API Reference](https://connex.vecha.in) for VeChain app developers

## Resource

+ [Connex Implementation Test](https://connex-impl-test.vecha.in)

## Architecture explained

![Connex Architecture](./docs/architecture.png)

## Compatible clients

+ [VeChain Sync](https://github.com/vechain/thor-sync.electron)

## License

Connex is licensed under the
[GNU Lesser General Public License v3.0](https://www.gnu.org/licenses/lgpl-3.0.html), also included
in *LICENSE* file in the repository.
