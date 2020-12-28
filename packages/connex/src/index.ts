import { Framework } from '@vechain/connex-framework'
import { genesisBlocks } from './config'
import { compat1 } from './compat'
import { create as createDriver, DriverVendorOnly } from './driver'
import { newVendor } from '@vechain/connex-framework'

function normalizeNetwork(n: Options['network']) {
    n = n || 'main'
    if (typeof n === 'string') {
        const gb = genesisBlocks[n]
        if (!gb) {
            throw new Error('invalid network')
        }
        return gb
    } else {
        return n
    }
}

function normalizeGenesisId(id?: 'main' | 'test' | string) {
    id = id || 'main'
    if (/^0x[0-9a-f]{64}$/.test(id)) {
        return id
    }
    const gb = genesisBlocks[id as 'main' | 'test']
    if (gb) {
        return gb.id
    }
    throw new Error('invalid genesis id')
}

class VendorClass implements Connex.Vendor {
    sign !: Connex.Vendor['sign']
    constructor(genesisId?: 'main' | 'test' | string) {
        genesisId = normalizeGenesisId(genesisId)
        try {
            const injected = ((window || {}) as any).connex
            if (injected && injected.thor.genesis.id === genesisId) {
                if (/^1\./.test(injected.version)) {
                    return compat1(injected).vendor
                }
                return injected.vendor
            }
        } catch { /**/ }
        const driver = new DriverVendorOnly(genesisId)
        const vendor = newVendor(driver)
        return {
            get sign() {
                // eslint-disable-next-line @typescript-eslint/unbound-method
                return vendor.sign
            }
        }
    }
}

export type Options = {
    nodeUrl: string
    network?: 'main' | 'test' | Connex.Thor.Block
}

class ConnexClass implements Connex {
    static readonly Vendor = VendorClass

    thor!: Connex.Thor
    vendor!: Connex.Vendor

    constructor(opts: Options) {
        const genesis = normalizeNetwork(opts.network)
        try {
            const injected = ((window || {}) as any).connex
            if (injected && injected.thor.genesis.id === genesis.id) {
                if (/^1\./.test(injected.version)) {
                    return compat1(injected)
                }
                return injected
            }
        } catch { /**/ }

        const driver = createDriver(opts.nodeUrl, genesis)
        const framework = new Framework(driver)
        return {
            get thor() { return framework.thor },
            get vendor() { return framework.vendor }
        }
    }
}

export default ConnexClass
export { ConnexClass as Connex }
