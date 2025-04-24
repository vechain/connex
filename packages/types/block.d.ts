declare namespace Connex.Thor {
    /** the block model */
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
        baseFeePerGas?: string
        isTrunk: boolean
    }

    namespace Block {
        /** the block visitor interface */
        interface Visitor {
            /** id or number of the block to be visited */
            readonly revision: string | number

            /** query the block */
            get(): Promise<Block | null>
        }
    }
}
