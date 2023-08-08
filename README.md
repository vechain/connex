# Connex

Connex is the mono-repo contains libraries to help build dApps for VeChain.

## Packages

| package | status | desc |
| - | - | - |
| [connex](packages/connex) | [![npm](https://badge.fury.io/js/%40vechain%2Fconnex.svg)](https://badge.fury.io/js/%40vechain%2Fconnex) | The out of the box Connex implementation for browser |
| [framework](packages/framework) | [![npm](https://badge.fury.io/js/%40vechain%2Fconnex-framework.svg)](https://badge.fury.io/js/%40vechain%2Fconnex-framework) | Implements Connex interface |
| [driver](packages/driver) | [![npm](https://badge.fury.io/js/%40vechain%2Fconnex-driver.svg)](https://badge.fury.io/js/%40vechain%2Fconnex-driver) | Implements Connex.Driver interface |
| [repl](packages/repl) | [![npm](https://badge.fury.io/js/%40vechain%2Fconnex-repl.svg)](https://badge.fury.io/js/%40vechain%2Fconnex-repl) | The REPL style command-line playground |
| [types](packages/types) | [![npm](https://badge.fury.io/js/%40vechain%2Fconnex-types.svg)](https://badge.fury.io/js/%40vechain%2Fconnex-types) | Connex interface declarations presented in Typescript |

## License

This package is licensed under the
[GNU Lesser General Public License v3.0](https://www.gnu.org/licenses/lgpl-3.0.html), also included
in *LICENSE* file in the repository.

# Run
This project uses Lerna to handle monorepo.

## Install
* `npx lerna bootstrap`

## Commands
* `npx lerna run {command}`

Available commands:
* build
* lint
