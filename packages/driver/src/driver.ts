
import { DriverNoVendor } from './driver-no-vendor'
import { Net, Wallet } from './interfaces'
import { Transaction, Certificate, blake2b256 } from 'thor-devkit'
import { randomBytes } from 'crypto'
import BigNumber from 'bignumber.js'

/** class fully implements DriverInterface */
export class Driver extends DriverNoVendor {
    /**
     * create driver instance
     * it will fetch config(genesis, head) via net as construction params
     * @param net
     * @param wallet
     */
    public static async connect(net: Net, wallet?: Wallet): Promise<Driver> {
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
            genesis,
            {
                id: best.id,
                number: best.number,
                timestamp: best.timestamp,
                parentID: best.parentID,
                txsFeatures: best.txsFeatures,
                gasLimit: best.gasLimit
            },
            wallet)
    }

    /** handler to receive txs committed */
    public onTxCommit?: (txObj: TxObject) => void

    /** params for tx construction */
    public txParams = {
        expiration: 18,
        gasPriceCoef: 0,
        maxPriorityFeePerGas: 0 as string|number,
        txType: Transaction.Type.Legacy
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
        msg: Connex.Vendor.TxMessage,
        options: Connex.Signer.TxOptions,
    ): Promise<Connex.Vendor.TxResponse> {
        options.onAccepted && options.onAccepted()

        const key = this.findKey(options.signer)
        const clauses = msg.map(c => ({
            to: c.to ? c.to.toLowerCase() : null,
            value: c.value.toString().toLowerCase(),
            data: (c.data || '0x').toLowerCase(),
        }))
        const gas = options.gas || (await this.estimateGas(clauses, key.address))

        // Base transaction body
        const baseTxBody = {
            chainTag: Number.parseInt(this.genesis.id.slice(-2), 16),
            blockRef: this.head.id.slice(0, 18),
            expiration: this.txParams.expiration,
            clauses,
            gas,
            dependsOn: options.dependsOn || null,
            nonce: '0x' + randomBytes(8).toString('hex')
        }

        // Determine transaction type and create appropriate body
        let txType = this.txParams.txType
        if (txType === Transaction.Type.DynamicFee && !this.head.baseFeePerGas) {
            // If baseFeePerGas is not available, means dynamic fee is not enabled
            // in the current block, fallback to legacy transaction
           txType = Transaction.Type.Legacy
        }
        let txBody: Transaction.LegacyBody | Transaction.DynamicFeeBody
        if (txType === Transaction.Type.DynamicFee) {
            // Dynamic fee transaction
            txBody = {
                ...baseTxBody,
                type: Transaction.Type.DynamicFee,
                maxPriorityFeePerGas: this.txParams.maxPriorityFeePerGas.toString(),
                maxFeePerGas: new BigNumber(this.txParams.maxPriorityFeePerGas).plus(this.head.baseFeePerGas!).toString(),
            } as Transaction.DynamicFeeBody
        } else {
            // Legacy transaction
            txBody = {
                ...baseTxBody,
                type: Transaction.Type.Legacy,
                gasPriceCoef: this.txParams.gasPriceCoef
            } as Transaction.LegacyBody
        }

        let tx: Transaction<Transaction.LegacyBody | Transaction.DynamicFeeBody>|undefined
        if (options.delegator) {
            const delegatedTx = new Transaction({ ...txBody, reserved: { features: 1/* vip191 */ } })
            const originSig = await key.sign(delegatedTx.signingHash())
            const unsigned = {
                raw: '0x' + delegatedTx.encode().toString('hex'),
                origin: key.address
            }
            try {
                const result = await this.net.http('POST', options.delegator.url, { body: unsigned }) as {signature: string}                    
                delegatedTx.signature = Buffer.concat([originSig, Buffer.from(result.signature.slice(2), 'hex')])
                tx = delegatedTx
            } catch (err) {
                // tslint:disable-next-line: no-console
                console.warn('tx delegation error: ', err)
                // fallback to non-vip191 tx
            }
        }
        
        if (!tx) {
            tx = new Transaction(txBody)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            tx.signature = await key.sign(tx.signingHash())
        }

         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const raw = `0x${tx.encode().toString('hex')}`
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
        msg: Connex.Vendor.CertMessage,
        options: Connex.Signer.CertOptions
    ): Promise<Connex.Vendor.CertResponse> {
        options.onAccepted && options.onAccepted()

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
        const outputs: Connex.VM.Output[] = await this.explain({
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
