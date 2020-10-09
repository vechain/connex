/// <reference path="thor.d.ts" />
/// <reference path="vendor.d.ts" />
/// <reference path="vm.d.ts" />
/// <reference path="account.d.ts" />
/// <reference path="block.d.ts" />
/// <reference path="tx.d.ts" />
/// <reference path="filter.d.ts" />

/**
 * The Connex interface.
 */
declare interface Connex {
    /** the version number */
    readonly version: string

    readonly thor: Connex.Thor
    readonly vendor: Connex.Vendor
}

declare namespace Connex {
    type ErrorType = 'BadParameter' | 'Rejected'
}
