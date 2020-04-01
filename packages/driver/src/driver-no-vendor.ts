import { Net } from './interfaces'
import { PromInt, InterruptedError } from './promint'
import { Cache } from './cache'
import { blake2b256 } from 'thor-devkit/dist/cry/blake2b'
import { sleep } from './common'
import { options } from './options'

/** class implements Connex.Driver leaves out Vendor related methods */
export class DriverNoVendor implements Connex.Driver {
    public head: Connex.Thor.Status['head']

    private headResolvers = [] as Array<() => void>
    private readonly int = new PromInt()
    private readonly cache = new Cache()

    constructor(
        private readonly net: Net,
        readonly genesis: Connex.Thor.Block,
        initialHead?: Connex.Thor.Status['head']
    ) {
        if (initialHead) {
            this.head = initialHead
        } else {
            this.head = {
                id: genesis.id,
                number: genesis.number,
                timestamp: genesis.timestamp,
                parentID: genesis.parentID,
                txsFeatures: genesis.txsFeatures
            }
        }
        this.headTrackerLoop()
    }

    // close the driver to prevent mem leak
    public close() {
        this.int.interrupt()
    }

    // implementations
    public pollHead() {
        return this.int.wrap(
            new Promise<Connex.Thor.Status['head']>(resolve => {
                this.headResolvers.push(() => resolve(this.head))
            }))
    }

    public getBlock(revision: string | number) {
        return this.cache.getBlock(revision, () =>
            this.httpGet(`blocks/${revision}`))
    }
    public getTransaction(id: string) {
        return this.cache.getTx(id, () =>
            this.httpGet(`transactions/${id}`, { head: this.head.id }))
    }
    public getReceipt(id: string) {
        return this.cache.getReceipt(id, () =>
            this.httpGet(`transactions/${id}/receipt`, { head: this.head.id }))
    }
    public getAccount(addr: string, revision: string) {
        return this.cache.getAccount(addr, revision, () =>
            this.httpGet(`accounts/${addr}`, { revision }))
    }
    public getCode(addr: string, revision: string) {
        return this.cache.getTied(`code-${addr}`, revision, () =>
            this.httpGet(`accounts/${addr}/code`, { revision }))
    }
    public getStorage(addr: string, key: string, revision: string) {
        return this.cache.getTied(`storage-${addr}-${key}`, revision, () =>
            this.httpGet(`accounts/${addr}/storage/${key}`, { revision }))
    }
    public explain(arg: Connex.Driver.ExplainArg, revision: string, cacheTies?: string[]) {
        const cacheKey = `explain-${blake2b256(JSON.stringify(arg)).toString('hex')}`
        return this.cache.getTied(cacheKey, revision, () =>
            this.httpPost('accounts/*', arg, { revision }), cacheTies)
    }
    public filterEventLogs(arg: Connex.Driver.FilterEventLogsArg) {
        const cacheKey = `event-${blake2b256(JSON.stringify(arg)).toString('hex')}`
        return this.cache.getTied(cacheKey, this.head.id, () =>
            this.httpPost('logs/event', arg))
    }
    public filterTransferLogs(arg: Connex.Driver.FilterTransferLogsArg) {
        const cacheKey = `transfer-${blake2b256(JSON.stringify(arg)).toString('hex')}`
        return this.cache.getTied(cacheKey, this.head.id, () =>
            this.httpPost('logs/transfer', arg))
    }
    public signTx(
        msg: Connex.Driver.SignTxArg,
        option: Connex.Driver.SignTxOption
    ): Promise<Connex.Driver.SignTxResult> {
        throw new Error('not implemented')
    }
    public signCert(
        msg: Connex.Driver.SignCertArg,
        options: Connex.Driver.SignCertOption
    ): Promise<Connex.Driver.SignCertResult> {
        throw new Error(' not implemented')
    }
    public isAddressOwned(addr: string): Promise<boolean> {
        return Promise.resolve(false)
    }
    //////
    protected httpGet(path: string, query?: Record<string, string>) {
        return this.net.http('GET', path, {
            query,
            validateResponseHeader: this.headerValidator
        })
    }

    protected httpPost(path: string, body: any, query?: Record<string, string>) {
        return this.net.http('POST', path, {
            query,
            body,
            validateResponseHeader: this.headerValidator
        })
    }

    private get headerValidator() {
        return (headers: Record<string, string>) => {
            const xgid = headers['x-genesis-id']
            if (xgid && xgid !== this.genesis.id) {
                throw new Error(`responded 'x-genesis-id' not matched`)
            }
        }
    }

    private emitNewHead() {
        const resolvers = this.headResolvers
        this.headResolvers = []
        resolvers.forEach(r => r())
    }

    private async headTrackerLoop() {
        let triggerWs = 0
        for (; ;) {
            try {
                const best = await this.int.wrap<Connex.Thor.Block>(this.httpGet('blocks/best'))
                if (best.id !== this.head.id && best.number >= this.head.number) {
                    this.head = {
                        id: best.id,
                        number: best.number,
                        timestamp: best.timestamp,
                        parentID: best.parentID,
                        txsFeatures: best.txsFeatures
                    }
                    this.cache.handleNewBlock(this.head, undefined, best)
                    this.emitNewHead()

                    if (Date.now() - this.head.timestamp * 1000 < 60 * 1000) {
                        // nearly synced
                        triggerWs++
                    }
                }
            } catch (err) {
                triggerWs = 0
                if (!options.disableErrorLog) {
                    // tslint:disable-next-line: no-console
                    console.warn('headTracker(http):', err)
                }
                if (err instanceof InterruptedError) {
                    break
                }
            }

            if (triggerWs > 2) {
                triggerWs = 0
                try {
                    await this.trackWs()
                } catch (err) {
                    if (!options.disableErrorLog) {
                        // tslint:disable-next-line: no-console
                        console.warn('headTracker(ws):', err)
                    }
                    if (err instanceof InterruptedError) {
                        break
                    }
                }
            }
            try {
                await this.int.wrap(sleep(8 * 1000))
            } catch {
                break
            }
        }
    }

    private async trackWs() {
        const wsPath =
            `subscriptions/beat?pos=${this.head.parentID}`

        const wsr = this.net.openWebSocketReader(wsPath)

        try {
            for (; ;) {
                const data = await this.int.wrap(wsr.read())
                const beat: Beat = JSON.parse(data)
                if (!beat.obsolete && beat.id !== this.head.id && beat.number >= this.head.number) {
                    this.head = {
                        id: beat.id,
                        number: beat.number,
                        timestamp: beat.timestamp,
                        parentID: beat.parentID,
                        txsFeatures: beat.txsFeatures
                    }
                    this.cache.handleNewBlock(this.head, { k: beat.k, bits: beat.bloom })
                    this.emitNewHead()
                }
            }
        } finally {
            wsr.close()
        }
    }
}

interface Beat {
    number: number
    id: string
    parentID: string
    timestamp: number
    bloom: string
    k: number
    txsFeatures?: number
    obsolete: boolean
}
