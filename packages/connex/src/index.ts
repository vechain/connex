import { Framework } from '@vechain/connex-framework'
import { SimpleNet } from '@vechain/connex-driver/dist/simple-net'
import { genesisBlocks } from './config'
import { Driver } from './driver'

export import Thor = Connex.Thor
export import Vendor = Connex.Vendor
export import VM = Connex.VM
export import ErrorType = Connex.ErrorType

export type Options = {
    network?: 'main' | 'test' | Connex.Thor.Block
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
        const injected = ((window || {}) as any).connex as Connex
        if (injected && injected.thor.genesis.id === genesis.id) {
            return injected
        }
    } catch { /**/ }

    const net = new SimpleNet(nodeUrl)
    const driver = new Driver(net, genesis)
    return new Framework(driver)
}
