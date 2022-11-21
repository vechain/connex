/* eslint-disable @typescript-eslint/no-unused-vars */
import { DriverNoVendor, SimpleNet } from '@vechain/connex-driver'
import { loadLibrary } from './script-loader'
import type * as ConnexWalletBuddy from '@vechain/connex-wallet-buddy'
import randomBytes from 'randombytes'
import { blake2b256 } from 'thor-devkit'
import { Options } from '.'

const BUDDY_SRC = 'https://unpkg.com/@vechain/connex-wallet-buddy@0.1'
const BUDDY_LIB_NAME = 'ConnexWalletBuddy'

type ConnexSigner = ReturnType<typeof ConnexWalletBuddy.create>

declare global {
    interface Window {
      vechain?: {
        isVeWorld?: boolean
        getSigner: (genesisId: string) => ConnexSigner
      }
    }
  }


/** the driver implements vendor methods only */
export class DriverVendorOnly implements Connex.Driver {
    private extensionSigner: ConnexSigner | undefined
    private readonly defaultSigner: Promise<ConnexSigner>
    private readonly noExtension: boolean
    private readonly genesisId: string
    constructor(genesisId: string, noExtension?: boolean) {
        this.genesisId = genesisId
        this.defaultSigner = loadLibrary<typeof ConnexWalletBuddy>(
            BUDDY_SRC,
            BUDDY_LIB_NAME
        ).then(lib => lib.create(
            genesisId,
            () => randomBytes(16).toString('hex'),
            val => blake2b256(val).toString('hex')
        ))
        this.noExtension = !!noExtension
    }
    get genesis(): Connex.Thor.Block { throw new Error('not implemented') }
    get head(): Connex.Thor.Status['head'] { throw new Error('not implemented') }
    pollHead(): Promise<Connex.Thor.Status['head']> { throw new Error('not implemented') }
    getBlock(revision: string | number): Promise<Connex.Thor.Block | null> { throw new Error('not implemented') }
    getTransaction(id: string, allowPending: boolean): Promise<Connex.Thor.Transaction | null> { throw new Error('not implemented') }
    getReceipt(id: string): Promise<Connex.Thor.Transaction.Receipt | null> { throw new Error('not implemented') }
    getAccount(addr: string, revision: string): Promise<Connex.Thor.Account> { throw new Error('not implemented') }
    getCode(addr: string, revision: string): Promise<Connex.Thor.Account.Code> { throw new Error('not implemented') }
    getStorage(addr: string, key: string, revision: string): Promise<Connex.Thor.Account.Storage> { throw new Error('not implemented') }
    explain(arg: Connex.Driver.ExplainArg, revision: string, cacheHints?: string[]): Promise<Connex.VM.Output[]> { throw new Error('not implemented') }
    filterEventLogs(arg: Connex.Driver.FilterEventLogsArg): Promise<Connex.Thor.Filter.Row<'event'>[]> { throw new Error('not implemented') }
    filterTransferLogs(arg: Connex.Driver.FilterTransferLogsArg): Promise<Connex.Thor.Filter.Row<'transfer'>[]> { throw new Error('not implemented') }

    signTx(msg: Connex.Vendor.TxMessage, options: Connex.Driver.TxOptions): Promise<Connex.Vendor.TxResponse> {
        return this.getSigner().then(s => s.signTx(msg, options))
    }
    signCert(msg: Connex.Vendor.CertMessage, options: Connex.Driver.CertOptions): Promise<Connex.Vendor.CertResponse> {
        return this.getSigner().then(s => s.signCert(msg, options))
    }

    getSigner(): Promise<ConnexSigner> {
        if (!this.noExtension && window.vechain?.isVeWorld) {
            if (!this.extensionSigner){
                //Initiate the signer on the first call
                this.extensionSigner = window.vechain.getSigner(this.genesisId)
            }
            return Promise.resolve(this.extensionSigner as ConnexSigner)
        }

        return this.defaultSigner
    }
}

/** fully implemented Connex.Driver */
class FullDriver extends DriverNoVendor {
    private readonly vd: DriverVendorOnly
    constructor(opts: Options, genesis: Connex.Thor.Block) {
        super(new SimpleNet(opts.node), genesis)
        this.vd = new DriverVendorOnly(genesis.id, opts.noExtension)
    }
    signTx(msg: Connex.Vendor.TxMessage, options: Connex.Driver.TxOptions): Promise<Connex.Vendor.TxResponse> {
        return this.vd.signTx(msg, options)
    }
    signCert(msg: Connex.Vendor.CertMessage, options: Connex.Driver.CertOptions): Promise<Connex.Vendor.CertResponse> {
        return this.vd.signCert(msg, options)
    }
}

const cache: Record<string, FullDriver> = {}

/**
 * create full driver
 * @param opts the connection {@link Options}
 * @param genesis the enforced genesis block
 */
export function createFull(opts: Options, genesis: Connex.Thor.Block): Connex.Driver {
    const key = blake2b256(JSON.stringify({
        node: opts.node,
        genesis
    })).toString('hex')

    let driver = cache[key]
    if (!driver) {
        cache[key] = driver = new FullDriver(opts, genesis)
    }
    return driver
}

