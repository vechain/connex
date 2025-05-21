declare namespace Connex.Thor {
    interface Fees {
        history(newestBlock?: string): Fees.HistoryVisitor
        priorityFee(): Promise<string>
    }

    namespace Fees {
        interface History {
            oldestBlock: string
            baseFeePerGas: Array<string>
            gasUsedRatio: Array<number>
            reward?: Array<Array<string>>
        }
        interface HistoryVisitor {
            /** newest block of the fees to be visited */
            readonly newestBlock: string | number

            get(): Promise<Fees.History>
            count(blockCount?: number): this
            rewardPercentiles(percentile: Array<number>): this
        }
    }
}
