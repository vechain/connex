export function newFeesHistoryVisitor(
    driver: Connex.Driver,
    newestBlock: string | number,
    blockCount = 1,
    rewardPercentiles?: number[]
): Connex.Thor.Fees.HistoryVisitor {
    let currentBlockCount = blockCount;
    let currentRewardPercentiles = rewardPercentiles;

    return {
        get newestBlock() { return newestBlock },
        count(blockCount?: number): Connex.Thor.Fees.HistoryVisitor {
            if (blockCount !== undefined) {
                currentBlockCount = blockCount;
            }
            return this;
        },
        rewardPercentiles(percentiles: Array<number>): Connex.Thor.Fees.HistoryVisitor {
            currentRewardPercentiles = percentiles;
            return this;
        },
        get: () => driver.getFeesHistory(newestBlock, currentBlockCount, currentRewardPercentiles)
    }
}
