import { Framework } from '@vechain/connex-framework'
import { genesisBlocks } from './config'
import { compat1 } from './compat'
import { create as createDriver } from './driver'

const SPA_WALLET_URL = 'https://qianbin.github.io/sync-spa/#/'

function extractGenesis(network: Options['network']): Connex.Thor.Block | undefined {
    network = network || 'main'
    if (typeof network === 'string') {
        return genesisBlocks[network]
    } else {
        return network
    }
}

function createConnex(nodeUrl: string, opts?: Options): Connex {
    opts = opts || {}
    const genesis = extractGenesis(opts.network)

    if (!genesis) {
        throw new Error('invalid network')
    }

    try {
        const injected = ((window || {}) as any).connex
        if (injected && injected.thor.genesis.id === genesis.id) {
            if (/^1\./.test(injected.version)) {
                return compat1(injected)
            }
            return injected
        }
    } catch { /**/ }

    const driver = createDriver(nodeUrl, genesis, SPA_WALLET_URL)
    return new Framework(driver)
}

export type Options = {
    network?: 'main' | 'test' | Connex.Thor.Block
}

class ConnexClass implements Connex {
    constructor(nodeUrl: string, opts?: Options) {
        const f = createConnex(nodeUrl, opts)
        return {
            get version() { return f.version },
            get thor() { return f.thor },
            get vendor() { return f.vendor }
        }
    }
    version!: string
    thor!: Connex.Thor
    vendor!: Connex.Vendor
}

export default ConnexClass
export { ConnexClass as Connex }
