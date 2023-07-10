import { Framework } from '@vechain/connex-framework'
import { genesisBlocks } from './config'
import { createFull, createNoVendor, LazyDriver } from './driver'
import { createSync, createSync2, createVeworldExtension, Connex1 } from './signer'

declare global {
    interface Window {
        /* connex@1.x, injected by Sync@1, VeChainThor mobile wallet*/
        connex?: Connex1;
        /* injected by veworld extension wallet */
        vechain?: {
            newConnexSigner: Connex.NewSigner
        };
    }
}

export enum BuiltinSigner {
    Sync = 'Sync',
    Sync2 = 'Sync2',
    VeworldExtension = 'VeworldExtension'
}

/** options for creating Connex object */
export type Options = {
    /** the base url of the thor node's thorREST API */
    node: string
    /**
     * the expected network of the node url. defaults to 'main' if omitted.
     * if it does not match with the actual network of the node url points to,
     * all subsequent request will fail.
     */
    network?: 'main' | 'test' | Connex.Thor.Block

    /** 
     * designated signer, either builtin signer or a new signer function
     * defaults to sync2 if omitted
     */
    signer?: BuiltinSigner | Connex.NewSigner
}

/** convert options.network to Connex.Thor.Block */
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

/** convert network name to genesis id */
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

/** convert options.signer to a signer creation function */
function normalizeNewSigner(signer: Options['signer'], genesisId: string) {
    if (typeof signer === 'function') {
        return signer
    }

    if (signer === BuiltinSigner.Sync) {
        if (!window.connex) {
            throw new Error('Sync not found')
        }

        if (window.connex.thor.genesis.id !== genesisId) {
            throw new Error('Network mismatch')
        }
    }

    if (signer === BuiltinSigner.VeworldExtension && (!window.vechain || !window.vechain.newConnexSigner)) {
        throw new Error('VeworldExtension not found')
    }

    switch (signer) {
        case BuiltinSigner.Sync:
            return createSync
        case BuiltinSigner.VeworldExtension:
            return createVeworldExtension
        default:
            return createSync2
    }
}

/** Vendor class which can work standalone to provide signing-services only */
class VendorClass implements Connex.Vendor {
    sign !: Connex.Vendor['sign']
    constructor(genesisId?: 'main' | 'test' | string, opts?: Pick<Options, 'signer'>) {
        genesisId = normalizeGenesisId(genesisId)
        const newSigner = normalizeNewSigner(opts?.signer, genesisId)

        const driver = new LazyDriver(newSigner(genesisId))
        const framework = new Framework(driver)
        return {
            get sign() {
                return framework.vendor.sign.bind(framework.vendor)
            }
        }
    }
}

/** Thor class which can work stand alone to provide reading-services only */
class ThorClass implements Connex.Thor{
    genesis !: Connex.Thor['genesis']
    status !: Connex.Thor['status']
    ticker !: Connex.Thor['ticker']
    account !: Connex.Thor['account']
    block !: Connex.Thor['block']
    transaction !: Connex.Thor['transaction']
    filter !: Connex.Thor['filter']
    explain !: Connex.Thor['explain']

    constructor(opts: Omit<Options, 'signer'>) {
        const genesis = normalizeNetwork(opts.network)
        
        const driver = createNoVendor(opts.node, genesis)
        const framework = new Framework(driver)

        return {
            get genesis() { return framework.thor.genesis },
            get status() { return framework.thor.status },
            get ticker() { return framework.thor.ticker.bind(framework.thor) },
            get account() { return framework.thor.account.bind(framework.thor) },
            get block() { return framework.thor.block.bind(framework.thor) },
            get transaction() { return framework.thor.transaction.bind(framework.thor) },
            get filter() { return framework.thor.filter.bind(framework.thor) },
            get explain() { return framework.thor.explain.bind(framework.thor) }
        }
    }
}

/** Connex class */
class ConnexClass implements Connex {
    static readonly Thor = ThorClass
    static readonly Vendor = VendorClass
    static readonly BuiltinSigner = BuiltinSigner

    thor!: Connex.Thor
    vendor!: Connex.Vendor

    constructor(opts: Options) {
        const genesis = normalizeNetwork(opts.network)
        const newSigner = normalizeNewSigner(opts.signer, genesis.id)

        const driver = createFull(opts.node, genesis, newSigner)
        const framework = new Framework(driver)
        return {
            get thor() { return framework.thor },
            get vendor() { return framework.vendor }
        }
    }
}

export default ConnexClass
export { ConnexClass as Connex }
