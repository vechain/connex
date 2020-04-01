
import { DriverNoVendor } from './driver-no-vendor'
import { Net, Wallet } from './interfaces'
import { Transaction } from 'thor-devkit/dist/transaction'
import { Certificate } from 'thor-devkit/dist/certificate'
import { blake2b256 } from 'thor-devkit/dist/cry/blake2b'
import { randomBytes } from 'crypto'
import { options } from './options'

/** class fully implements Connex.Driver */
export class Driver extends DriverNoVendor {
    /**
     * create driver instance
     * it will fetch config(genesis, head) via net as construction params
     * @param net
     * @param wallet
     */
    public static async connect(net: Net, wallet?: Wallet) {
        const genesis: Connex.Thor.Block = await net.http('GET', 'blocks/0')
        const best: Connex.Thor.Block = await net.http('GET', 'blocks/best', {
            validateResponseHeader: headers => {
                const xgid = headers['x-genesis-id']
                if (xgid && xgid !== genesis.id) {
                    throw new Error(`responded 'x-genesis-id' not matched`)
                }
            }
        })

        return new Driver(
            net,
            genesis, {
                id: best.id,
                number: best.number,
                timestamp: best.timestamp,
                parentID: best.parentID,
                txsFeatures: best.txsFeatures
            },
            wallet)
    }

    /** handler to receive txs committed */
    public onTxCommit?: (txObj: TxObject) => void

    /** params for tx construction */
    public txParams = {
        expiration: 18,
        gasPriceCoef: 0
    }

    constructor(
        net: Net,
        genesis: Connex.Thor.Block,
        initialHead?: Connex.Thor.Status['head'],
        private readonly wallet?: Wallet
    ) {
        super(net, genesis, initialHead)
    }

    public async signTx(
        msg: Connex.Driver.SignTxArg,
        option: Connex.Driver.SignTxOption,
    ): Promise<Connex.Driver.SignTxResult> {
        const key = this.findKey(option.signer)
        const clauses = msg.map(c => ({ to: c.to, value: c.value, data: c.data }))
        const gas = option.gas ||
            (await this.estimateGas(clauses, key.address))

        const txBody: Transaction.Body = {
            chainTag: Number.parseInt(this.genesis.id.slice(-2), 16),
            blockRef: this.head.id.slice(0, 18),
            expiration: this.txParams.expiration,
            clauses,
            gasPriceCoef: this.txParams.gasPriceCoef,
            gas,
            dependsOn: option.dependsOn || null,
            nonce: '0x' + randomBytes(8).toString('hex')
        }

        let tx: Transaction | undefined
        if (option.delegationHandler) {
            const delegatedTx = new Transaction({ ...txBody, reserved: { features: 1/* vip191 */ } })
            const originSig = await key.sign(delegatedTx.signingHash())
            try {
                const result = await option.delegationHandler({
                    raw: '0x' + delegatedTx.encode().toString('hex'),
                    origin: key.address
                })
                delegatedTx.signature = Buffer.concat([originSig, Buffer.from(result.signature.slice(2), 'hex')])
                tx = delegatedTx
            } catch (err) {
                if (!options.disableErrorLog) {
                    // tslint:disable-next-line: no-console
                    console.warn('tx delegation error: ', err)
                }
                // fallback to non-vip191 tx
            }
        }
        if (!tx) {
            tx = new Transaction(txBody)
            tx.signature = await key.sign(tx.signingHash())
        }

        const raw = '0x' + tx.encode().toString('hex')
        if (this.onTxCommit) {
            this.onTxCommit({
                id: tx.id!,
                raw,
                resend: async () => {
                    await this.sendTx(raw)
                }
            })
        }
        await this.sendTx(raw)
        return {
            txid: tx.id!,
            signer: key.address
        }

    }

    public async signCert(
        msg: Connex.Driver.SignCertArg,
        options: Connex.Driver.SignCertOption
    ): Promise<Connex.Driver.SignCertResult> {
        const key = this.findKey(options.signer)

        const annex = {
            domain: 'localhost',
            timestamp: this.head.timestamp,
            signer: key.address
        }
        const unsigned = Certificate.encode({
            ...msg,
            ...annex
        })
        const signature = await key.sign(blake2b256(unsigned))
        return {
            annex,
            signature: '0x' + signature.toString('hex')
        }
    }
    public isAddressOwned(addr: string) {
        return Promise.resolve(this.wallet ? this.wallet.list.findIndex(k => k.address === addr) >= 0 : false)
    }

    private findKey(addr?: string) {
        if (this.wallet) {
            const keys = this.wallet.list
            const key = addr ? keys.find(k => k.address === addr) : keys[0]
            if (key) {
                return key
            }
        }
        throw new Error('empty wallet')
    }

    private sendTx(raw: string) {
        return this.httpPost('transactions', { raw })
    }

    private async estimateGas(
        clauses: Array<{
            to: string | null
            value: string
            data: string
        }>,
        caller: string) {
        const outputs: Connex.Thor.VMOutput[] = await this.explain({
            clauses,
            caller,
        }, this.head.id)
        const execGas = outputs.reduce((sum, out) => sum + out.gasUsed, 0)
        const intrinsicGas = Transaction.intrinsicGas(clauses)

        return intrinsicGas + (execGas ? (execGas + 15000) : 0)
    }
}

export interface TxObject {
    id: string
    raw: string
    resend(): Promise<void>
}
