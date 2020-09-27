import { Framework } from '@vechain/connex-framework'
import { SimpleNet } from '@vechain/connex-driver/dist/simple-net'
import { genesisBlocks } from './config'
import { Driver } from './driver'

declare global {
    namespace Connex {
        interface Creator {
            create(opts: Creator.Options): Connex
        }
        namespace Creator {
            type Options = {
                node: string
            }
        }

        function network(which: 'main' | 'test' | Thor.Block): Creator
    }
}

if (!globalThis.Connex) {
    Object.defineProperty(globalThis, 'Connex', {
        value: {},
        writable: false
    })
}

Object.defineProperty(globalThis.Connex, 'network', {
    get(): typeof Connex.network {
        return which => {
            let genesis: Connex.Thor.Block
            if (typeof which === 'string') {
                genesis = genesisBlocks[which]
            } else {
                genesis = which
            }
            return {
                create: opts => {
                    const net = new SimpleNet(opts.node)
                    const driver = new Driver(net, genesis)
                    return new Framework(driver)
                }
            }
        }
    }
})

export default globalThis.Connex
