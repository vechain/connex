import { Framework } from '@vechain/connex-framework'
import { genesisBlocks } from './config'
import { compat1 } from './compat'
import type * as ConnexDriver from './driver-bundle'

const loadDriverCreator = (() => {
    let instance = null as Promise<typeof ConnexDriver> | null
    return () => {
        if (!instance) {
            const iframe = document.createElement('iframe')
            iframe.style.display = 'none'
            document.body.appendChild(iframe)
            if (iframe.contentWindow) {
                const doc = iframe.contentWindow.document
                const script = doc.createElement('script')
                instance = new Promise(resolve => {
                    script.onload = () => resolve((iframe.contentWindow as any).ConnexDriver)
                })
                script.src = 'https://unpkg.com/@vechain/connex@beta/dist/driver-bundle.min.js'
                doc.body.appendChild(script)
            } else {
                throw new Error('contentWindow unavailable')
            }
        }
        return instance
    }
})()

function createDriver(nodeUrl: string, genesis: Connex.Thor.Block, spaWalletUrl: string): Connex.Driver {
    const drv = loadDriverCreator()
        .then(c => c.create(nodeUrl, genesis, spaWalletUrl))

    let curHead: Connex.Thor.Status['head'] = {
        id: genesis.id,
        number: genesis.number,
        parentID: genesis.parentID,
        timestamp: genesis.timestamp,
        txsFeatures: genesis.txsFeatures
    }
    void drv.then(d => { curHead = d.head })
    return {
        get genesis() { return genesis },
        get head() { return curHead },
        pollHead: async () => {
            for (; ;) {
                try {
                    const newHead = await (await drv).pollHead()
                    curHead = newHead
                    return newHead
                } catch {
                    await new Promise(resolve => setTimeout(resolve, 5000))
                }
            }
        },
        getBlock: rev => drv.then(d => d.getBlock(rev)),
        getTransaction: (id, allowPending) => drv.then(d => d.getTransaction(id, allowPending)),
        getReceipt: id => drv.then(d => d.getReceipt(id)),
        getAccount: (addr, revision) => drv.then(d => d.getAccount(addr, revision)),
        getCode: (addr, revision) => drv.then(d => d.getCode(addr, revision)),
        getStorage: (addr, key, revision) => drv.then(d => d.getStorage(addr, key, revision)),
        explain: (arg, revision, cacheHints) => drv.then(d => d.explain(arg, revision, cacheHints)),
        filterEventLogs: arg => drv.then(d => d.filterEventLogs(arg)),
        filterTransferLogs: arg => drv.then(d => d.filterTransferLogs(arg)),
        signTx: (msg, options) => drv.then(d => d.signTx(msg, options)),
        signCert: (msg, options) => drv.then(d => d.signCert(msg, options))
    }
}


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


    const driver = createDriver(nodeUrl, genesis, opts.spaWallet || 'https://qianbin.github.io/sync-spa/#/')
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
