declare namespace Connex.Thor {
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
        interface Visitor {
            /**
                 * id of transaction to be visited
                 */
            readonly id: string

            /** 
             * allow the queried tx be in pending state.
             * note that a pending tx has null 'meta'.
             */
            allowPending(): this

            /**
             * query the transaction
             */
            get(): Promise<Transaction | null>

            /**
             * query the receipt
             */
            getReceipt(): Promise<Receipt | null>
        }

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
