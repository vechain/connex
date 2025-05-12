declare namespace Connex.Thor {

    /** Transaction types */
    enum TransactionType {
        LEGACY = 0,
        DYNAMIC_FEE = 81
    }

    /** Base transaction model */
    type BaseTransaction = {
        id: string
        chainTag: number
        blockRef: string
        expiration: number
        clauses: Array<{
            to: string | null
            value: string
            data: string
        }>
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

    /** Legacy transaction model */
    type LegacyTransaction = BaseTransaction & {
        type: TransactionType.LEGACY
        gasPriceCoef: number
    }

    /** Dynamic fee transaction model */
    type DynamicFeeTransaction = BaseTransaction & {
        type: TransactionType.DYNAMIC_FEE
        maxPriorityFeePerGas: string
        maxFeePerGas: string
    }

    /** Union type for all transaction types */
    type Transaction = LegacyTransaction | DynamicFeeTransaction

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
            type?: number
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
