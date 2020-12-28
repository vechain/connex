import { Framework } from '@vechain/connex-framework'
import { genesisBlocks } from './config'
import { compat1 } from './compat'
import { create as createDriver } from './driver'


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

export type Options = {
    nodeUrl: string
    network?: 'main' | 'test' | Connex.Thor.Block
}

class ConnexClass implements Connex {
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
