declare namespace Connex {
    /** the interface of Thor module, for accessing VeChain accounts/blocks/txs/logs etc. */
    export interface Thor {
        /** the genesis block */
        readonly genesis: Thor.Block
        /** current status of VeChain */
        readonly status: Thor.Status

        /** create a ticker to watch new blocks */
        ticker(): Thor.Ticker

        /**
         * create a visitor to the account specified by the given address
         * @param addr account address
         */
        account(addr: string): Thor.Account.Visitor

        /**
         * create a visitor to the block specified by the given revision
         * @param revision block id or number, defaults to current value of status.head.id
         */
        block(revision?: string | number): Thor.Block.Visitor

        /**
         * create a visitor to the transaction specified by the given id
         * @param id tx id
         */
        transaction(id: string): Thor.Transaction.Visitor

        /** create an event logs filter */
        filter(kind: 'event', criteria: Thor.Filter.Criteria<'event'>[]): Thor.Filter<'event'>

        /** create an transfer logs filter */
        filter(kind: 'transfer', criteria: Thor.Filter.Criteria<'transfer'>[]): Thor.Filter<'transfer'>

        /** create an explainer to simulate tx execution */
        explain(clauses: VM.Clause[]): VM.Explainer

        /** fees related operations */
        fees: Thor.Fees
    }

    namespace Thor {
        /** describes the status of VeChain */
        type Status = {
            /** progress of synchronization. From 0 to 1, 1 means fully synchronized. */
            progress: number
            /** summary of head block */
            head: {
                /** block id */
                id: string
                /** block number */
                number: number
                /** block timestamp */
                timestamp: number
                /** parent block id */
                parentID: string
                /** bits of supported txs features */
                txsFeatures?: number
                /** block gas limit */
                gasLimit: number
                /** block base fee per gas */
                baseFeePerGas?: string
            }
            /** id of finalized block */
            finalized: string
        }

        /** the ticker interface, to watch new blocks */
        interface Ticker {
            /** returns a Promise of new head block summary, which is resolved once a new block produced */
            next(): Promise<Status['head']>
        }
    }
}
