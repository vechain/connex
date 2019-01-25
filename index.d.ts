/**
 * The Connex interface.
 */
declare interface Connex {
    /**
     * the version number
     */
    readonly version: string

    /**
     *  the {@link Thor} instance 
     */
    readonly thor: Connex.Thor

    /**
     * the {@link Vendor} instance
     */
    readonly vendor: Connex.Vendor
}

declare namespace Connex {
    /**
     * The main interface to access VeChain.
     */
    interface Thor {
        /**
         * The genesis block of connected network. It's consistent in Connex' life-cycle. 
         */
        readonly genesis: Thor.Block

        /**
         * Returns current block-chain status. 
         */
        readonly status: Thor.Status

        /**
         * Create a ticker to track head block changes.
         * 
         * @returns ticker object
         */
        ticker(): Thor.Ticker

        /**
         * Create an account visitor.
         * 
         * @param addr account address
         */
        account(addr: string): Thor.AccountVisitor

        /**
         * Create a block visitor.
         * 
         * @param revision block id or number, 
         * assumed to current value of status.head.id if omitted
         */
        block(revision?: string | number): Thor.BlockVisitor

        /**
         * Create a transaction visitor.
         * 
         * @param id tx id
         */
        transaction(id: string): Thor.TransactionVisitor

        /**
         * Create a filter to filter logs (event | transfer).
         * 
         * @type T
         * @param kind 
         */
        filter<T extends 'event' | 'transfer'>(kind: T): Thor.Filter<T>

        /**
         * Create an explainer to obtain how blockchain would execute a tx.
         */
        explain(): Thor.Explainer
    }

    namespace Thor {
        interface Ticker {
            /**
             * @returns a promise resolves right after head block changed
             * @remarks The returned promise never rejects.
             */
            next(): Promise<void>
        }

        interface AccountVisitor {
            /**
             * the address of account to be visited
             */
            readonly address: string

            /**
             * query the account
             * 
             * @returns promise of account
             */
            get(): Promise<Account>

            /**
             * query account code
             * 
             * @returns promise of account code
             */
            getCode(): Promise<Code>

            /**
             * query account storage
             * 
             * @param key storage key
             * @returns promise of account storage
             */
            getStorage(key: string): Promise<Storage>

            /**
             * Create a method object, to perform contract call, or build transaction clause.
             * 
             * @param abi method's JSON ABI object
             * @returns method object
             */
            method(abi: object): Method

            /**
             * Create an event visitor
             * @param abi event's JSON ABI object
             * @returns event visitor
             */
            event(abi: object): EventVisitor
        }

        interface Method {
            /**
             * set value
             * @param val amount of VET to transfer
             */
            value(val: string | number): this

            /**
             * set caller(msg.sender) 
             * @param addr caller address
             */
            caller(addr: string): this

            /**
             * set max allowed gas
             * @param gas 
             */
            gas(gas: number): this

            /**
             * set gas price
             * @param gp gas price in hex string
             */
            gasPrice(gp: string): this

            /**
             * Pack arguments into {@link Clause}.
             * @param args method arguments
             */
            asClause(...args: any[]): Clause

            /**
             * Call the method to obtain output without altering contract state.
             * @param args method arguments
             */
            call(...args: any[]): Promise<VMOutput>
        }

        interface EventVisitor {
            /**
             * Pack indexed arguments into {@link Event.Criteria}.
             * @param indexed object contains indexed arguments
             */
            asCriteria(indexed: object): Event.Criteria

            /**
             * Create an event filter
             * @param indexedSet a set of objects contain indexed arguments
             */
            filter(indexedSet: object[]): Filter<'event'>
        }

        interface BlockVisitor {
            /**
             * id or number of the block to be visited
             */
            readonly revision: string | number

            /**
             * query the block
             * @returns a promise of block.
             */
            get(): Promise<Block | null>
        }

        interface TransactionVisitor {
            /**
             * id of transaction to be visited
             */
            readonly id: string

            /**
             * query the transaction
             */
            get(): Promise<Transaction | null>

            /**
             * query the receipt
             */
            getReceipt(): Promise<Receipt | null>
        }

        interface Filter<T extends 'event' | 'transfer'> {
            /**
             * set criteria
             * @param set 
             */
            criteria(set: Filter.Criteria<T>[]): this

            /**
             * Set the range to filter in
             * @param range 
             */
            range(range: Filter.Range): this

            /**
             * Set sort order
             * @param order
             */
            order(order: 'asc' | 'desc'): this

            /**
             * Apply the filter
             * @param offset 
             * @param limit 
             * @returns filtered records
             */
            apply(offset: number, limit: number): Promise<Thor.Filter.Result<T>>
        }

        interface Explainer {
            /**
             * set caller
             * @param addr caller address 
             */
            caller(addr: string): this

            /**
             * set max allowed gas
             * @param gas 
             */
            gas(gas: number): this

            /**
             * set gas price
             * @param gp gas price in hex string
             */
            gasPrice(gp: string): this

            /**
             * execute clauses
             * @param clauses 
             */
            execute(clauses: Clause[]): Promise<VMOutput[]>
        }

        /**
         * block chain status
         */
        type Status = {
            /** 
             * progress of synchronization. 
             * From 0 to 1, 1 means fully synchronized. 
             */
            progress: number

            /**
             * summary of head block
             */
            head: {
                /**
                 * block id
                 */
                id: string

                /**
                 * block number
                 */
                number: number

                /** 
                 * block timestamp 
                 */
                timestamp: number

                /**
                 * parent block id
                 */
                parentID: string
            }
        }

        type Account = {
            /**
             * account balance in hex string
             */
            balance: string
            /**
             * account energy in hex string
             */
            energy: string
            /**
             * true indicates contract account
             */
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
            stateRoot: string
            receiptsRoot: string
            signer: string
            transactions: string[]
            isTrunk: boolean
        }

        type Clause = {
            to: string | null
            value: string | number
            data: string
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
            clauses: Clause[]
            gasPriceCoef: number
            gas: number
            origin: string
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
            meta: LogMeta
        }

        type Event = {
            address: string
            topics: string[]
            data: string
            meta?: LogMeta
            decoded?: object
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

        type LogMeta = {
            blockID: string
            blockNumber: number
            blockTimestamp: number
            txID: string
            txOrigin: string
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
            decoded?: object
        }
    }

    interface Vendor {
        /**
         *  Acquire the signing service
         * @param kind kind of target to be signed
         */
        sign<T extends 'tx' | 'cert'>(kind: T): Vendor.SigningService<T>
    }

    namespace Vendor {
        interface TxSigningService {
            /**
             * enforce the signer
             * @param addr signer address
             */
            signer(addr: string): this

            /**
             * enforce max allowed gas
             * @param gas 
             */
            gas(gas: number): this

            /**
             * set the link to reveal tx related information
             * @param url link url
             */
            link(url: string): this

            /**
             * set comment for the message
             * @param text 
             */
            comment(text: string): this

            /**
             * send request
             * @param msg clauses with comments
             */
            request(msg: SigningService.TxMessage): Promise<SigningService.TxResponse>
        }

        interface CertSigningService {
            /**
             * enforce the signer
             * @param addr signer address
             */
            signer(addr: string): this

            /**
             * send request
             * @param msg 
             */
            request(msg: SigningService.CertMessage): Promise<SigningService.CertResponse>
        }

        type SigningService<T extends 'tx' | 'cert'> =
            T extends 'tx' ? TxSigningService :
            T extends 'cert' ? CertSigningService : never

        namespace SigningService {
            type TxMessage = Array<{
                to: string | null
                value: string | number
                data: string
                /**
                 * comment to the clause
                 */
                comment?: string
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
        }
    }
    type ErrorType = 'BadParameter' | 'Rejected'
}


declare interface Window {
    readonly connex: Connex
}

declare const connex: Connex
