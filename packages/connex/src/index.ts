import { Framework } from '@vechain/connex-framework'
import { SimpleNet } from '@vechain/connex-driver/dist/simple-net'
import { genesisBlocks } from './config'
import { Driver } from './driver'

export type Options = {
    node: string
}

export function create(network: 'main' | 'test' | Connex.Thor.Block, opts: Options): Connex {
    let genesis: Connex.Thor.Block
    if (typeof network === 'string') {
        genesis = genesisBlocks[network]
    } else {
        genesis = network
    }

    const net = new SimpleNet(opts.node)
    const driver = new Driver(net, genesis)
    return new Framework(driver)
}

declare global {    
    namespace Connex {        
        function create(network: 'main' | 'test' | Connex.Thor.Block, opts: Options): Connex
    }
}
