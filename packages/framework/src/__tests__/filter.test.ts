import { describe, it, expect, vi } from 'vitest'
import { newFilter } from '../filter'
import { BadParameter } from '../rules'

function makeDriver() {
    const driver = {
        filterEventLogs: vi.fn(async () => []),
        filterTransferLogs: vi.fn(async () => []),
    }
    return driver as unknown as Connex.Driver
}

describe('newFilter - event', () => {
    it('uses defaults: block range [0, 2^32-1], offset=0, limit=10, order=asc', async () => {
        const driver = makeDriver()
        const f = newFilter(Promise.resolve(driver), 'event', [])
        await f.apply(0, 10)
        expect(driver.filterEventLogs).toHaveBeenCalledWith(
            expect.objectContaining({
                range: { unit: 'block', from: 0, to: 2 ** 32 - 1 },
                options: { offset: 0, limit: 10 },
                order: 'asc',
            }),
            undefined
        )
    })

    it('range() sets block range', async () => {
        const driver = makeDriver()
        const f = newFilter(Promise.resolve(driver), 'event', [])
        f.range({ unit: 'block', from: 100, to: 200 })
        await f.apply(0, 10)
        expect(driver.filterEventLogs).toHaveBeenCalledWith(
            expect.objectContaining({ range: { unit: 'block', from: 100, to: 200 } }),
            undefined
        )
    })

    it('range() sets time range', async () => {
        const driver = makeDriver()
        const f = newFilter(Promise.resolve(driver), 'event', [])
        f.range({ unit: 'time', from: 1000, to: 2000 })
        await f.apply(0, 10)
        expect(driver.filterEventLogs).toHaveBeenCalledWith(
            expect.objectContaining({ range: { unit: 'time', from: 1000, to: 2000 } }),
            undefined
        )
    })

    it('range() throws BadParameter when from > to', () => {
        const driver = makeDriver()
        const f = newFilter(Promise.resolve(driver), 'event', [])
        expect(() => f.range({ unit: 'block', from: 200, to: 100 })).toThrow(BadParameter)
    })

    it('range() throws BadParameter for invalid unit', () => {
        const driver = makeDriver()
        const f = newFilter(Promise.resolve(driver), 'event', [])
        expect(() => f.range({ unit: 'invalid' as any, from: 0, to: 10 })).toThrow(BadParameter)
    })

    it('order() sets asc', async () => {
        const driver = makeDriver()
        const f = newFilter(Promise.resolve(driver), 'event', [])
        f.order('asc')
        await f.apply(0, 10)
        expect(driver.filterEventLogs).toHaveBeenCalledWith(
            expect.objectContaining({ order: 'asc' }),
            undefined
        )
    })

    it('order() sets desc', async () => {
        const driver = makeDriver()
        const f = newFilter(Promise.resolve(driver), 'event', [])
        f.order('desc')
        await f.apply(0, 10)
        expect(driver.filterEventLogs).toHaveBeenCalledWith(
            expect.objectContaining({ order: 'desc' }),
            undefined
        )
    })

    it('order() throws BadParameter for invalid value', () => {
        const driver = makeDriver()
        const f = newFilter(Promise.resolve(driver), 'event', [])
        expect(() => f.order('random' as any)).toThrow(BadParameter)
    })

    it('cache() sets address hints (lowercased)', async () => {
        const driver = makeDriver()
        const f = newFilter(Promise.resolve(driver), 'event', [])
        const addr = '0x' + 'AA'.repeat(20)
        f.cache([addr])
        await f.apply(0, 10)
        expect(driver.filterEventLogs).toHaveBeenCalledWith(
            expect.anything(),
            [addr.toLowerCase()]
        )
    })

    it('apply() passes offset and limit to driver', async () => {
        const driver = makeDriver()
        const f = newFilter(Promise.resolve(driver), 'event', [])
        await f.apply(50, 100)
        expect(driver.filterEventLogs).toHaveBeenCalledWith(
            expect.objectContaining({ options: { offset: 50, limit: 100 } }),
            undefined
        )
    })

    it('apply() throws BadParameter when limit > 256', () => {
        const driver = makeDriver()
        const f = newFilter(Promise.resolve(driver), 'event', [])
        expect(() => f.apply(0, 257)).toThrow(BadParameter)
    })

    it('apply() throws BadParameter for negative offset', () => {
        const driver = makeDriver()
        const f = newFilter(Promise.resolve(driver), 'event', [])
        expect(() => f.apply(-1, 10)).toThrow(BadParameter)
    })

    it('passes criteria to driver', async () => {
        const driver = makeDriver()
        const criteria = [{ address: '0x' + 'aa'.repeat(20) }]
        const f = newFilter(Promise.resolve(driver), 'event', criteria)
        await f.apply(0, 10)
        expect(driver.filterEventLogs).toHaveBeenCalledWith(
            expect.objectContaining({ criteriaSet: criteria }),
            undefined
        )
    })
})

describe('newFilter - transfer', () => {
    it('routes to filterTransferLogs', async () => {
        const driver = makeDriver()
        const f = newFilter(Promise.resolve(driver), 'transfer', [])
        await f.apply(0, 10)
        expect(driver.filterTransferLogs).toHaveBeenCalled()
        expect(driver.filterEventLogs).not.toHaveBeenCalled()
    })
})
