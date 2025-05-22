declare namespace Connex.Thor {
    interface Fees {
        //create a visitor for historical fee data
        history(newestBlock?: string): Fees.HistoryVisitor
        // suggest a priority fee
        priorityFee(): Promise<string>
    }

    namespace Fees {
        interface History {
            // oldest block id in the returned data
            oldestBlock: string
            // base fee per gas for each block
            baseFeePerGas: Array<string>
            // gas used ratio for each block as float numbers.
            gasUsedRatio: Array<number>
            // an array of arrays of rewards by the percentiles set in the request via rewardPercentiles().
            reward?: Array<Array<string>>
        }
        interface HistoryVisitor {
            /** newest block of the fees to be visited */
            readonly newestBlock: string | number

            // set the number of blocks to be returned
            count(blockCount?: number): this
            // enable percentiles calculation and set the percentiles to be returned, eg [10, 50, 90]
            rewardPercentiles(percentiles: Array<number>): this
            // do query
            get(): Promise<Fees.History>
        }
    }
}
