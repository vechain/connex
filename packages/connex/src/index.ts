import { Framework } from '@vechain/connex-framework'
import { SimpleNet } from '@vechain/connex-driver/dist/simple-net'
import { genesisBlocks } from './config'
import { Driver } from './driver'
import { compat1 } from './compat'

export import Thor = Connex.Thor
export import Vendor = Connex.Vendor
export import VM = Connex.VM
export import ErrorType = Connex.ErrorType

export type Options = {
    network?: 'main' | 'test' | Connex.Thor.Block
    spaWallet?: string // will be removed later
}

function extractGenesis(network: Options['network']): Thor.Block | undefined {
    network = network || 'main'
    if (typeof network === 'string') {
        return genesisBlocks[network]
    } else {
        return network
    }
}

export function create(nodeUrl: string, opts?: Options): Connex {
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
