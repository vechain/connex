# Connex

[![npm version](https://badge.fury.io/js/%40vechain%2Fconnex.svg)](https://badge.fury.io/js/%40vechain%2Fconnex)
&nbsp;&nbsp; [![TG](https://img.shields.io/badge/chat-on%20telegram-blue)](https://t.me/VeChainDevCommunity)

[Connex Powered VeChain Wallets](https://env.vechain.org/)

[API Reference](https://docs.vechain.org/connex/)

## Introduction

Connex is the standard interface to connect VeChain apps with VeChain blockchain and users. Aiming to help developers building decentralized applications.
[Sync](https://env.vechain.org/#sync) or other connex compatible [clients](https://env.vechain.org/) will expose `connex` API by an injected object on [`Window Object`](https://developer.mozilla.org/en-US/docs/Glossary/Global_object).
<p align="center">
<img src="./docs/connex.jpg" alt="Connex Overview">
</p>

## How To

As `Connex` is already attached to the `Window Object`, just use it in your favourite way. Below is a sample of getting network status,

``` javascript
const el = document.createElement('h1')

const status = connex.thor.status
el.innerText = 'You are \'connexed\' to vechain, the status is ' + (status.progress === 1 ? 'synced': 'syncing')

document.querySelector('body').append(el)
```

### TypeScript(Recommended)

This project is the type definition of `Connex` API which can be used to in typescript projects. Install by the following command:

``` bash
npm install @vechain/connex --save-dev
```

Place following line in any .ts file of your project
```typescript
import '@vechain/connex'
```
or

add `@vechain/connex` to `compilerOptions.types`  in `tsconfig.json` then you are good to go!

### Bootstrap Your APP

VeChain apps are usually web apps. On app load, you always need to detect `Connex` component in the environment. If `Connex` is not available, you may instruct users to setup `Connex` environment.

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

## Resources

+ [Connex Framework](https://github.com/vechain/connex-framework)
+ [Connex Driver](https://github.com/vechain/connex-driver)
+ [Connex REPL](https://github.com/vechain/connex-repl)

<details><summary>Implementation Architecture(SYNC)</summary>
<p align="center">

<img src="./docs/architecture.png" alt="Connex Architecture" width=400/>

</p>
</details>

## License

Connex is licensed under the
[GNU Lesser General Public License v3.0](https://www.gnu.org/licenses/lgpl-3.0.html), also included
in *LICENSE* file in the repository.
