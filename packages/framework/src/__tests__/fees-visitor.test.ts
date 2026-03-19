import { describe, it, expect, vi } from 'vitest'
import { newFeesHistoryVisitor } from '../fees-visitor'

const mockHistory: Connex.Thor.Fees.History = {
    oldestBlock: '0x' + '00'.repeat(32),
    baseFeePerGas: ['0x1'],
    gasUsedRatio: [0.5],
}

function makeDriver() {
    return {
        getFeesHistory: vi.fn(async () => mockHistory),
    } as unknown as Connex.Driver
}

describe('newFeesHistoryVisitor', () => {
    it('newestBlock getter returns the value passed at construction', () => {
        const driver = makeDriver()
        const v = newFeesHistoryVisitor(driver, 'best')
        expect(v.newestBlock).toBe('best')
    })

    it('get() calls driver.getFeesHistory with correct defaults', async () => {
        const driver = makeDriver()
        const v = newFeesHistoryVisitor(driver, 'best')
        await v.get()
        expect(driver.getFeesHistory).toHaveBeenCalledWith('best', 1, undefined)
    })

    it('count() overrides the blockCount', async () => {
        const driver = makeDriver()
        const v = newFeesHistoryVisitor(driver, 'best')
        v.count(10)
        await v.get()
        expect(driver.getFeesHistory).toHaveBeenCalledWith('best', 10, undefined)
    })

    it('count() with no argument keeps current value', async () => {
        const driver = makeDriver()
        const v = newFeesHistoryVisitor(driver, 100, 5)
        v.count()
        await v.get()
        expect(driver.getFeesHistory).toHaveBeenCalledWith(100, 5, undefined)
    })

    it('rewardPercentiles() sets percentiles', async () => {
        const driver = makeDriver()
        const v = newFeesHistoryVisitor(driver, 'best')
        v.rewardPercentiles([25, 50, 75])
        await v.get()
        expect(driver.getFeesHistory).toHaveBeenCalledWith('best', 1, [25, 50, 75])
    })

    it('accepts numeric newestBlock', async () => {
        const driver = makeDriver()
        const v = newFeesHistoryVisitor(driver, 12345)
        await v.get()
        expect(driver.getFeesHistory).toHaveBeenCalledWith(12345, 1, undefined)
    })

    it('returns the driver response', async () => {
        const driver = makeDriver()
        const v = newFeesHistoryVisitor(driver, 'best')
        const result = await v.get()
        expect(result).toEqual(mockHistory)
    })

    it('builder methods are chainable', () => {
        const driver = makeDriver()
        const v = newFeesHistoryVisitor(driver, 'best')
        expect(v.count(5)).toBe(v)
        expect(v.rewardPercentiles([50])).toBe(v)
    })
})
