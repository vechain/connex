import { DriverNoVendor, SimpleNet } from '@vechain/connex-driver'
import { loadLibrary } from './script-loader'
import type * as ConnexWalletBuddy from '@vechain/connex-wallet-buddy'

const BUDDY_SRC = 'https://unpkg.com/@vechain/connex-wallet-buddy@0.0'
const BUDDY_LIB_NAME = 'ConnexWalletBuddy'

class Driver extends DriverNoVendor {
    private readonly buddy: Promise<ReturnType<typeof ConnexWalletBuddy.create>>
    constructor(nodeUrl: string, genesis: Connex.Thor.Block, readonly spaWalletUrl: string) {
        super(new SimpleNet(nodeUrl), genesis)
        this.buddy = loadLibrary<typeof ConnexWalletBuddy>(
            BUDDY_SRC,
            BUDDY_LIB_NAME
        ).then(lib => lib.create(genesis.id, spaWalletUrl))
    }
    signTx(msg: Connex.Vendor.TxMessage, options: Connex.Driver.TxOptions): Promise<Connex.Vendor.TxResponse> {
        return this.buddy.then(b => b.signTx(msg, options))
    }
    signCert(msg: Connex.Vendor.CertMessage, options: Connex.Driver.CertOptions): Promise<Connex.Vendor.CertResponse> {
        return this.buddy.then(b => b.signCert(msg, options))
    }
}

const cache: Record<string, Driver> = {}

export function create(nodeUrl: string, genesis: Connex.Thor.Block, spaWalletUrl: string): Connex.Driver {
    const key = JSON.stringify({
        nodeUrl,
        genesis,
        spaWalletUrl
    })
    let driver = cache[key]
    if (!driver) {
        cache[key] = driver = new Driver(nodeUrl, genesis, spaWalletUrl)
    }
    return driver
}

