import { DriverNoVendor, SimpleNet } from '@vechain/connex-driver'
import { loadLibrary } from './script-loader'
import type * as ConnexWalletBuddy from '@vechain/connex-wallet-buddy'

const BUDDY_SRC = 'https://unpkg.com/@vechain/connex-wallet-buddy@0.0'
const BUDDY_LIB_NAME = 'ConnexWalletBuddy'

const SPA_WALLET_URL = 'https://qianbin.github.io/sync-spa/#/'

export class DriverVendorOnly implements Connex.Driver {
    private readonly buddy: Promise<ReturnType<typeof ConnexWalletBuddy.create>>
    constructor(genesisId: string) {
        this.buddy = loadLibrary<typeof ConnexWalletBuddy>(
            BUDDY_SRC,
            BUDDY_LIB_NAME
        ).then(lib => lib.create(genesisId, SPA_WALLET_URL))
    }
    get genesis(): Connex.Thor.Block { throw new Error('not implemented') }
    get head(): Connex.Thor.Status['head'] { throw new Error('not implemented') }
    pollHead(): Promise<Connex.Thor.Status['head']> { throw new Error('not implemented') }
    getBlock(revision: string | number): Promise<Connex.Thor.Block | null> { throw new Error('not implemented') }
    getTransaction(id: string, allowPending: boolean): Promise<Connex.Thor.Transaction | null> { throw new Error('not implemented') }
    getReceipt(id: string): Promise<Connex.Thor.Transaction.Receipt | null> { throw new Error('not implemented') }
    getAccount(addr: string, revision: string): Promise<Connex.Thor.Account> { throw new Error('not implemented') }
    getCode(addr: string, revision: string): Promise<Connex.Thor.Account.Code> { throw new Error('not implemented') }
    getStorage(addr: string, key: string, revision: string): Promise<Connex.Thor.Account.Storage> { throw new Error('not implemented') }
    explain(arg: Connex.Driver.ExplainArg, revision: string, cacheHints?: string[]): Promise<Connex.VM.Output[]> { throw new Error('not implemented') }
    filterEventLogs(arg: Connex.Driver.FilterEventLogsArg): Promise<Connex.Thor.Filter.Row<'event'>[]> { throw new Error('not implemented') }
    filterTransferLogs(arg: Connex.Driver.FilterTransferLogsArg): Promise<Connex.Thor.Filter.Row<'transfer'>[]> { throw new Error('not implemented') }

    signTx(msg: Connex.Vendor.TxMessage, options: Connex.Driver.TxOptions): Promise<Connex.Vendor.TxResponse> {
        return this.buddy.then(b => b.signTx(msg, options))
    }
    signCert(msg: Connex.Vendor.CertMessage, options: Connex.Driver.CertOptions): Promise<Connex.Vendor.CertResponse> {
        return this.buddy.then(b => b.signCert(msg, options))
    }
}


class FullDriver extends DriverNoVendor {
    private readonly vd: DriverVendorOnly
    constructor(nodeUrl: string, genesis: Connex.Thor.Block) {
        super(new SimpleNet(nodeUrl), genesis)
        this.vd = new DriverVendorOnly(genesis.id)
    }
    signTx(msg: Connex.Vendor.TxMessage, options: Connex.Driver.TxOptions): Promise<Connex.Vendor.TxResponse> {
        return this.vd.signTx(msg, options)
    }
    signCert(msg: Connex.Vendor.CertMessage, options: Connex.Driver.CertOptions): Promise<Connex.Vendor.CertResponse> {
        return this.vd.signCert(msg, options)
    }
}

const cache: Record<string, FullDriver> = {}

export function create(nodeUrl: string, genesis: Connex.Thor.Block): Connex.Driver {
    const key = JSON.stringify({
        nodeUrl,
        genesis
    })
    let driver = cache[key]
    if (!driver) {
        cache[key] = driver = new FullDriver(nodeUrl, genesis)
    }
    return driver
}

