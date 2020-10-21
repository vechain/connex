declare namespace Connex.Thor {
    /** the transaction model */
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
        meta: {
            blockID: string
            blockNumber: number
            blockTimestamp: number
        }
    }

    namespace Transaction {
        /** the transaction visitor interface */
        interface Visitor {
            /** the transaction id to be visited */
            readonly id: string

            /** allow the queried tx be in pending state. a pending tx has null 'meta'. */
            allowPending(): this

            /** query the transaction */
            get(): Promise<Transaction | null>

            /** query the receipt */
            getReceipt(): Promise<Receipt | null>
        }

        /** the transaction receipt model */
        type Receipt = {
            gasUsed: number
            gasPayer: string
            paid: string
            reward: string
            reverted: boolean
            outputs: {
                contractAddress: string | null
                events: VM.Event[]
                transfers: VM.Transfer[]
            }[]
            meta: {
                blockID: string
                blockNumber: number
                blockTimestamp: number
                txID: string
                txOrigin: string
            }
        }
    }
}
