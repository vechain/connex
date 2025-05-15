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
        /** the block visitor interface */
        interface Visitor {
            /** id or number of the fees to be visited */
            readonly newestBlock: string | number

            readonly blockCount: number

            /** array of reward percentiles to query */
            readonly rewardPercentiles?: number[]

            /** query the fees */
            get(): Promise<Fees | null>
        }
    }
}
