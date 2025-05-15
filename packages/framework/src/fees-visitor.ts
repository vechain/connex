export function newFeesVisitor(
    driver: Connex.Driver,
    newestBlock: string | number,
    blockCount: number
): Connex.Thor.Fees.Visitor {

    return {
        get newestBlock() { return newestBlock },
        get blockCount() { return blockCount },
        get: () => driver.getFees(newestBlock, blockCount)
    }
}
