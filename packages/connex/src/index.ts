import { Framework } from '@vechain/connex-framework'
import { SimpleNet } from '@vechain/connex-driver'
import { genesisBlocks } from './config'
import { Driver } from './driver'
import { compat1 } from './compat'

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

    const net = new SimpleNet(nodeUrl)
    const driver = new Driver(net, genesis)
    driver.spaWallet = opts.spaWallet
    return new Framework(driver)
}

export type Options = {
    network?: 'main' | 'test' | Connex.Thor.Block
    spaWallet?: string // will be removed later
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
