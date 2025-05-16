declare namespace Connex.Thor {
    /** the fees model */
    type Fees = {
        oldestBlock: string
        baseFeePerGas: string[]
        gasUsedRatio: number[]
        reward?: string[][]
    }

    type PriorityFeeSuggestion = {
        maxPriorityFeePerGas: string
    }

    namespace Fees {
        /** the fees visitor interface */
        interface Visitor {
            /** newest block of the fees to be visited */
            readonly newestBlock: string | number

            /** number of blocks to query */
            readonly blockCount: number

            /** array of reward percentiles to query */
            readonly rewardPercentiles?: number[]

            /** query the fees */
            get(): Promise<Fees>
        }
    }
}
