import { abi } from 'thor-devkit'
import * as R from '@vechain/connex-framework/dist/rules'

/** ports connex v1 to connex v2 */
export function compat1(connex1: Connex1): Connex {
    const t1 = connex1.thor
    const v1 = connex1.vendor
    return {
        get thor(): Connex.Thor {
            const t2: Connex.Thor = {
                get genesis() { return t1.genesis },
                get status() {
                    const s = t1.status
                    return {
                        ...s,
                        head: {
                            ...s.head,
                            gasLimit: 20000000
                        },
                        finalized: '0000000000000000000000000000000000000000000000000000000000000000'
                    }
                },
                ticker: () => {
                    const t = t1.ticker()
                    return {
                        next: () => t.next().then(h => ({ ...h, gasLimit: 20000000 }))
                    }
                },
                account: addr => {
                    const a1 = t1.account(addr)
                    return {
                        get address() { return a1.address },
                        get: () => a1.get(),
                        getCode: () => a1.getCode(),
                        getStorage: key => a1.getStorage(key),
                        method: jsonABI => newMethod(a1, jsonABI, this),
                        event: jsonABI => newEvent(a1, jsonABI, this)
                    }
                },
                block: rev => t1.block(rev),
                transaction: id => t1.transaction(id),
                filter: (kind: any, criteria: any): Connex.Thor.Filter<'event' | 'transfer'> => {
                    const f1 = t1.filter(kind)
                    f1.criteria(criteria)
                    return {
                        range(r) { f1.range(r); return this },
                        order(o) { f1.order(o); return this },
                        cache() { console.warn('filter :cache is not supported in compat mode'); return this },
                        apply(offset, limit): Promise<any> {
                            return f1.apply(offset, limit)
                        }
                    }
                },
                explain: (clauses): Connex.VM.Explainer => {
                    const e1 = t1.explain()
                    return {
                        caller(addr) { e1.caller(addr); return this },
                        gas(gas) { e1.gas(gas); return this },
                        gasPrice(gp) { e1.gasPrice(gp); return this },
                        gasPayer(addr) { console.warn("gasPayer is not supported in compat mode"); return this },
                        cache() { console.warn('explainer :cache is not supported in compat mode'); return this },
                        execute: () => e1.execute(clauses)
                    }
                }
            }
            return t2
        },
        get vendor(): Connex.Vendor {
            return {
                sign: (kind: 'tx' | 'cert', msg: any): any => {
                    let onAccepted: () => void
                    if (kind === 'tx') {
                        const s1 = v1.sign(kind)
                        const s2: Connex.Vendor.TxSigningService = {
                            signer(addr) { s1.signer(addr); return this },
                            gas(gas) { s1.gas(gas); return this },
                            dependsOn(txid) { s1.dependsOn(txid); return this },
                            link(url) { s1.link(url); return this },
                            comment(text) { s1.comment(text); return this },
                            delegate(url) {
                                R.ensure(typeof url === 'string', `arg0: expected url string`)
                                s1.delegate(async (unsignedTx) => {
                                    const res = await fetch(url, {
                                        method: 'POST',
                                        body: JSON.stringify(unsignedTx),
                                        headers: {
                                            "Content-Type": 'application/json'
                                        }
                                    })

                                    return res.json()
                                })
                                return this
                            },
                            accepted(cb) { onAccepted = cb; return this },
                            request: () => {
                                onAccepted && onAccepted()
                                return s1.request(msg)
                            }
                        }
                        return s2
                    } else {
                        const s1 = v1.sign(kind)
                        const s2: Connex.Vendor.CertSigningService = {
                            signer(addr) { s1.signer(addr); return this },
                            link(url) { s1.link(url); return this },
                            accepted(cb) {
                                onAccepted = cb
                                return this
                            },
                            request: () => {
                                onAccepted && onAccepted()
                                return s1.request(msg)
                            }
                        }
                        return s2
                    }
                }
            }
        }
    }
}

export declare interface Connex1 {
    readonly version: string
    readonly thor: Connex1.Thor
    readonly vendor: Connex1.Vendor
}

export declare namespace Connex1 {
    interface Thor {
        readonly genesis: Thor.Block
        readonly status: Thor.Status
        ticker(): Thor.Ticker
        account(addr: string): Thor.AccountVisitor
        block(revision?: string | number): Thor.BlockVisitor
        transaction(id: string): Thor.TransactionVisitor
        filter<T extends 'event' | 'transfer'>(kind: T): Thor.Filter<T>
        explain(): Thor.Explainer
    }

    namespace Thor {
        interface Ticker {
            next(): Promise<Status['head']>
        }

        interface AccountVisitor {
            readonly address: string
            get(): Promise<Account>
            getCode(): Promise<Code>
            getStorage(key: string): Promise<Storage>
            method(abi: object): Method
            event(abi: object): EventVisitor
        }

        interface Method {
            value(val: string | number): this
            caller(addr: string): this
            gas(gas: number): this
            gasPrice(gp: string | number): this
            cache(ties: string[]): this
            asClause(...args: any[]): Clause
            call(...args: any[]): Promise<VMOutput>
        }

        interface EventVisitor {
            asCriteria(indexed: object): Event.Criteria
            filter(indexedSet: object[]): Filter<'event'>
        }

        interface BlockVisitor {
            readonly revision: string | number
            get(): Promise<Block | null>
        }

        interface TransactionVisitor {
            readonly id: string
            allowPending(): this
            get(): Promise<Transaction | null>
            getReceipt(): Promise<Receipt | null>
        }

        interface Filter<T extends 'event' | 'transfer'> {
            criteria(set: Filter.Criteria<T>[]): this
            range(range: Filter.Range): this
            order(order: 'asc' | 'desc'): this
            apply(offset: number, limit: number): Promise<Thor.Filter.Result<T>>
        }

        interface Explainer {
            caller(addr: string): this
            gas(gas: number): this
            gasPrice(gp: string | number): this
            execute(clauses: Clause[]): Promise<VMOutput[]>
        }

        type Status = {
            progress: number
            head: {
                id: string
                number: number
                timestamp: number
                parentID: string
                txsFeatures?: number
            }
        }

        type Account = {
            balance: string
            energy: string
            hasCode: boolean
        }

        type Storage = {
            value: string
        }
        type Code = {
            code: string
        }

        type Block = {
            id: string
            number: number
            size: number
            parentID: string
            timestamp: number
            gasLimit: number
            beneficiary: string
            gasUsed: number
            totalScore: number
            txsRoot: string
            txsFeatures?: number
            stateRoot: string
            receiptsRoot: string
            signer: string
            transactions: string[]
            com?: boolean
            isFinalized?: boolean
            isTrunk: boolean
        }

        type Clause = {
            to: string | null
            value: string | number
            data?: string
        }

        namespace Transaction {
            type Meta = {
                blockID: string
                blockNumber: number
                blockTimestamp: number
            }
        }

        type Transaction = {
            id: string
            chainTag: number
            blockRef: string
            expiration: number
            clauses: Array<{
                to: string | null
                value: string
                data: string
            }>
            gasPriceCoef: number
            gas: number
            origin: string
            delegator?: string | null
            nonce: string
            dependsOn: string | null
            size: number
            meta: Transaction.Meta
        }

        type Receipt = {
            gasUsed: number
            gasPayer: string
            paid: string
            reward: string
            reverted: boolean
            outputs: {
                contractAddress: string | null
                events: Event[]
                transfers: Transfer[]
            }[]
            meta: Receipt.Meta
        }

        namespace Receipt {
            type Meta = Transaction.Meta & {
                txID: string
                txOrigin: string
            }
        }

        type Event = {
            address: string
            topics: string[]
            data: string
            meta?: LogMeta
            decoded?: Decoded
        }

        namespace Event {
            type Criteria = {
                address?: string
                topic0?: string
                topic1?: string
                topic2?: string
                topic3?: string
                topic4?: string
            }
        }

        type Transfer = {
            sender: string
            recipient: string
            amount: string
            meta?: LogMeta
        }

        namespace Transfer {
            type Criteria = {
                txOrigin?: string
                sender?: string
                recipient?: string
            }
        }

        type LogMeta = Receipt.Meta & {
            clauseIndex: number
        }

        namespace Filter {
            type Criteria<T extends 'event' | 'transfer'> =
                T extends 'event' ? Event.Criteria :
                T extends 'transfer' ? Transfer.Criteria : never

            type Range = {
                unit: 'block' | 'time'
                from: number
                to: number
            }
            type Result<T extends 'event' | 'transfer'> = Array<
                T extends 'event' ? Event :
                T extends 'transfer' ? Transfer : never>
        }

        type VMOutput = {
            data: string
            vmError: string
            gasUsed: number
            reverted: boolean
            events: Event[]
            transfers: Transfer[]
            decoded?: Decoded & { revertReason?: string }
        }

        type Decoded = { [name: string]: any } & { [index: number]: any }
    }

    interface Vendor {
        sign<T extends 'tx' | 'cert'>(kind: T): Vendor.SigningService<T>
        owned(addr: string): Promise<boolean>
    }

    namespace Vendor {
        interface TxSigningService {
            signer(addr: string): this
            gas(gas: number): this
            dependsOn(txid: string): this
            link(url: string): this
            comment(text: string): this
            delegate(handler: DelegationHandler): this
            request(msg: TxMessage): Promise<TxResponse>
        }

        interface CertSigningService {
            signer(addr: string): this
            link(url: string): this
            request(msg: CertMessage): Promise<CertResponse>
        }

        type SigningService<T extends 'tx' | 'cert'> =
            T extends 'tx' ? TxSigningService :
            T extends 'cert' ? CertSigningService : never

        type TxMessage = Array<Thor.Clause & {
            comment?: string
            abi?: object
        }>

        type CertMessage = {
            purpose: 'identification' | 'agreement'
            payload: {
                type: 'text'
                content: string
            }
        }

        type TxResponse = {
            txid: string
            signer: string
        }

        type CertResponse = {
            annex: {
                domain: string
                timestamp: number
                signer: string
            }
            signature: string
        }
        type DelegationHandler = (unsignedTx: { raw: string, origin: string }) => Promise<{ signature: string }>
    }
    type ErrorType = 'BadParameter' | 'Rejected'
}

const newMethod = (acc: Connex1.Thor.AccountVisitor, jsonABI: object, connex: Connex): Connex.Thor.Account.Method => {
    const coder = new abi.Function(JSON.parse(JSON.stringify(jsonABI)))

    let value: string | number = 0
    const opts: {
        caller?: string
        gas?: number
        gasPrice?: string | number
    } = {}

    return {
        value(val) {
            value = R.test(val, R.bigInt, 'arg0')
            return this
        },
        caller(addr) {
            opts.caller = R.test(addr, R.address, 'arg0').toLowerCase()
            return this
        },
        gas(gas) {
            opts.gas = R.test(gas, R.uint64, 'arg0')
            return this
        },
        gasPrice(gp) {
            opts.gasPrice = R.test(gp, R.bigInt, 'arg0').toString().toLowerCase()
            return this
        },
        gasPayer(addr) { console.warn("gasPayer is not supported in compat mode"); return this },
        cache(hints) { console.warn("account.method :cache is not supported in compat mode"); return this },
        asClause: (...args) => {
            const inputsLen = (coder.definition.inputs || []).length
            R.ensure(inputsLen === args.length, `args count expected ${inputsLen}`)
            try {
                const data = coder.encode(...args)
                return {
                    to: acc.address,
                    value: value.toString().toLowerCase(),
                    data
                }
            } catch (err) {
                throw new R.BadParameter(`args can not be encoded (${err.message})`)
            }
        },
        call(...args) {
            const clause = this.asClause(...args)
            const explainer = connex.thor.explain([clause])

            if (opts.caller) explainer.caller(opts.caller)
            if (opts.gas) explainer.gas(opts.gas)
            if (opts.gasPrice) explainer.gasPrice(opts.gasPrice)

            return explainer.execute().then(outputs => {
                const out: Connex.VM.Output & Connex.Thor.Account.WithDecoded = { ...outputs[0], decoded: {} }

                if (!out.reverted && out.data !== '0x') {
                    out.decoded = coder.decode(out.data)
                }

                return out
            })
        },
        transact(...args) {
            const clause = this.asClause(...args)
            return connex.vendor.sign('tx', [clause])
        }
    }
}

const newEvent = (acc: Connex1.Thor.AccountVisitor, jsonABI: object, connex: Connex): Connex.Thor.Account.Event => {
    const coder = new abi.Event(JSON.parse(JSON.stringify(jsonABI)))
    const encode = (indexed: object) => {
        const topics = coder.encode(indexed)
        return {
            address: acc.address,
            topic0: topics[0] || undefined,
            topic1: topics[1] || undefined,
            topic2: topics[2] || undefined,
            topic3: topics[3] || undefined,
            topic4: topics[4] || undefined
        }
    }

    return {
        asCriteria: indexed => {
            try {
                return encode(indexed)
            } catch (err) {
                throw new R.BadParameter(`arg0: can not be encoded (${err.message})`)
            }
        },
        filter(indexed) {
            R.test(indexed, [{}], 'arg0')

            if (indexed.length === 0) {
                indexed = [{}]
            }

            const criteriaSet = indexed.map((o, i) => {
                try {
                    return encode(o)
                } catch (err) {
                    throw new R.BadParameter(`arg0.#${i}: can not be encoded (${err.message})`)
                }
            })
            const filter = connex.thor.filter('event', criteriaSet)
            return {
                range(r) { filter.range(r); return this },
                order(o) { filter.order(o); return this },
                cache() { console.warn('account.event :cache is not supported in compat mode'); return this },
                apply(offset, limit) {
                    return filter.apply(offset, limit).then(events => events.map(e => {
                        const event:Connex.Thor.Filter.Row<'event'> & Connex.Thor.Account.WithDecoded = {...e, decoded: {}}
                        event.decoded = coder.decode(event.data, event.topics)
                        return event
                    }))
                }
            }
        }
    }
}
