declare namespace Connex.Thor {
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

    namespace Block {
        interface Visitor {
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
    }
}
