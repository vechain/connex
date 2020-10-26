import { VERSION } from '@vechain/connex-framework'

/** ports connex v1 to connex v2 */
export function compat1(connex1: Connex1): Connex {
    const t1 = connex1.thor
    const v1 = connex1.vendor
    return {
        version: `${VERSION}#${connex1.version}`,
        get thor(): Connex.Thor {
            const t2: Connex.Thor = {
                get genesis() { return t1.genesis },
                get status() { return t1.status },
                ticker: () => t1.ticker(),
                account: addr => {
                    const a1 = t1.account(addr)
                    return {
                        get address() { return a1.address },
                        get: () => a1.get(),
                        getCode: () => a1.getCode(),
                        getStorage: key => a1.getStorage(key),
                        method: abi => {
                            const m1 = a1.method(abi)
                            return {
                                value(val) { m1.value(val); return this },
                                caller(addr) { m1.caller(addr); return this },
                                gas(gas) { m1.gas(gas); return this },
                                gasPrice(gp) { m1.gasPrice(gp); return this },
                                cache(hints) { m1.cache(hints); return this },
                                asClause: (...args) => m1.asClause(...args) as Connex.Thor.Transaction['clauses'][0],
                                call: (...args) => {
                                    return m1.call(...args).
                                        then(r => {
                                            return {
                                                ...r,
                                                decoded: r.decoded!,
                                                revertReason: r.decoded!.revertReason
                                            }
                                        })
                                },
                                transact: (...args) => {
                                    const clause = m1.asClause(...args)
                                    return this.vendor.sign('tx', [clause])
                                }
                            }
                        },
                        event: abi => {
                            const e1 = a1.event(abi)
                            return {
                                asCriteria: indexed => e1.asCriteria(indexed),
                                filter: (indexed) => {
                                    const f1 = e1.filter(indexed)
                                    return {
                                        range(r) { f1.range(r); return this },
                                        order(o) { f1.order(o); return this },
                                        apply(offset, limit) {
                                            return f1.apply(offset, limit) as any
                                        }
                                    }
                                }
                            }
                        }
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
                        cache() { console.warn('cache is not supported in compat mode'); return this },
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
                            delegate(/*url*/) {
                                console.warn('delegate is not supported in compat mode')
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

declare interface Connex1 {
    readonly version: string
    readonly thor: Connex1.Thor
    readonly vendor: Connex1.Vendor
}

declare namespace Connex1 {
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

