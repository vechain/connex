/// <reference path="thor.d.ts" />
/// <reference path="vendor.d.ts" />
/// <reference path="vm.d.ts" />
/// <reference path="account.d.ts" />
/// <reference path="block.d.ts" />
/// <reference path="fees.d.ts" />
/// <reference path="tx.d.ts" />
/// <reference path="filter.d.ts" />
/// <reference path="signer.d.ts" />

/** The VeChain Connex interface */
declare interface Connex {
    /** the module for accessing VeChain accounts/blocks/txs/logs etc. */
    readonly thor: Connex.Thor
    /** the module for interacting with wallets */
    readonly vendor: Connex.Vendor
}

declare namespace Connex {
    /** major error types */
    type ErrorType = 'BadParameter' | 'Rejected'
}
