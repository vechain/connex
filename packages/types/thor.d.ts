declare namespace Connex {
    export interface Thor {
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
        account(addr: string): Thor.Account.Visitor

        /**
         * Create a block visitor.
         * 
         * @param revision block id or number, 
         * assumed to current value of status.head.id if omitted
         */
        block(revision?: string | number): Thor.Block.Visitor

        /**
         * Create a transaction visitor.
         * 
         * @param id tx id
         */
        transaction(id: string): Thor.Transaction.Visitor

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
        explain(): VM.Explainer
    }

    namespace Thor {

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

                /**
                 * supported txs features
                 */
                txsFeatures?: number
            }
        }

        interface Ticker {
            /**
             * @returns a promise resolves to summary of head block right after head block changed
             * @remarks The returned promise never rejects.
             */
            next(): Promise<Status['head']>
        }
    }
}
