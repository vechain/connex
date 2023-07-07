import { DriverNoVendor, SimpleNet } from '@vechain/connex-driver'
import { blake2b256 } from 'thor-devkit'

/** the LazyDriver implements vendor methods at construction but allows attaching NoVendorDriver later to be a full one*/
export class LazyDriver implements Connex.Driver {
    private noVendor: DriverNoVendor|null = null
    constructor(private readonly signer:Promise<Connex.Signer> ) {}
    get genesis(): Connex.Thor.Block {
        if (this.noVendor) {
            return this.noVendor.genesis
        }
        throw new Error('driver no vendor is not ready')
    }
    get head(): Connex.Thor.Status['head'] {
        if (this.noVendor) {
            return this.noVendor.head
        }
        throw new Error('driver no vendor is not ready')
    }
    pollHead(): Promise<Connex.Thor.Status['head']> { 
        if (this.noVendor) {
            return this.noVendor.pollHead()
        }
        throw new Error('driver no vendor is not ready')
     }
    getBlock(revision: string | number): Promise<Connex.Thor.Block | null> {
        if (this.noVendor) {
            return this.noVendor.getBlock(revision)
        }
        throw new Error('driver no vendor is not ready')
    }
    getTransaction(id: string, allowPending: boolean): Promise<Connex.Thor.Transaction | null> { 
        if (this.noVendor) {
            return this.noVendor.getTransaction(id, allowPending)
        }
        throw new Error('driver no vendor is not ready')
     }
    getReceipt(id: string): Promise<Connex.Thor.Transaction.Receipt | null> { 
        if (this.noVendor) {
            return this.noVendor.getReceipt(id)
        }
        throw new Error('driver no vendor is not ready')
     }
    getAccount(addr: string, revision: string): Promise<Connex.Thor.Account> { 
        if (this.noVendor) {
            return this.noVendor.getAccount(addr, revision)
        }
        throw new Error('driver no vendor is not ready')
     }
    getCode(addr: string, revision: string): Promise<Connex.Thor.Account.Code> { if (this.noVendor) {
        return this.noVendor.getCode(addr, revision)
    }
        throw new Error('driver no vendor is not ready')
    }
    getStorage(addr: string, key: string, revision: string): Promise<Connex.Thor.Account.Storage> { 
        if (this.noVendor) {
            return this.noVendor.getStorage(addr, key, revision)
        }
        throw new Error('driver no vendor is not ready')
     }
    explain(arg: Connex.Driver.ExplainArg, revision: string, cacheHints?: string[]): Promise<Connex.VM.Output[]> { 
        if (this.noVendor) {
            return this.noVendor.explain(arg, revision, cacheHints)
        }
        throw new Error('driver no vendor is not ready')
     }
    filterEventLogs(arg: Connex.Driver.FilterEventLogsArg): Promise<Connex.Thor.Filter.Row<'event'>[]> { 
        if (this.noVendor) {
            return this.noVendor.filterEventLogs(arg)
        }
        throw new Error('driver no vendor is not ready')
     }
    filterTransferLogs(arg: Connex.Driver.FilterTransferLogsArg): Promise<Connex.Thor.Filter.Row<'transfer'>[]> { 
        if (this.noVendor) {
            return this.noVendor.filterTransferLogs(arg)
        }
        throw new Error('driver no vendor is not ready')
     }

    signTx(msg: Connex.Vendor.TxMessage, options: Connex.Signer.TxOptions): Promise<Connex.Vendor.TxResponse> {
        return this.signer.then(b => b.signTx(msg, options))
    }
    signCert(msg: Connex.Vendor.CertMessage, options: Connex.Signer.CertOptions): Promise<Connex.Vendor.CertResponse> {
        return this.signer.then(b => b.signCert(msg, options))
    }

    attachNoVendor(driver: DriverNoVendor): Connex.Driver {
        this.noVendor = driver
        return this
    }
}

const cache: Record<string, DriverNoVendor> = {}

/**
 * create a no vendor driver
 * @param node the url of thor node
 * @param genesis the enforced genesis block
 */
export function createNoVendor(node: string, genesis: Connex.Thor.Block): DriverNoVendor {
    const key = blake2b256(JSON.stringify({
        node,
        genesis
    })).toString('hex')

    let driver = cache[key]
    if (!driver) {
        cache[key] = driver = new DriverNoVendor(new SimpleNet(node), genesis)
    }
    return driver
}

/**
 * create a full driver
 * @param node the url of thor node
 * @param genesis the enforced genesis block
 * @param newSigner a function to create signer
 */
export function createFull(node: string, genesis: Connex.Thor.Block, newSigner: Connex.NewSigner): Connex.Driver {
    const noVendor = createNoVendor(node, genesis)
        
    return  new LazyDriver(newSigner(genesis.id)).attachNoVendor(noVendor)
}
