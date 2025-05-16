export function newFeesVisitor(
    driver: Connex.Driver,
    newestBlock: string | number,
    blockCount: number,
    rewardPercentiles?: number[]
): Connex.Thor.Fees.Visitor {

    return {
        get newestBlock() { return newestBlock },
        get blockCount() { return blockCount },
        get rewardPercentiles() { return rewardPercentiles },
        get: () => driver.getFees(newestBlock, blockCount, rewardPercentiles)
    }
}
