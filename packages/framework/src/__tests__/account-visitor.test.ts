import { describe, it, expect, vi } from 'vitest'
import { newAccountVisitor } from '../account-visitor'
import { BadParameter } from '../rules'

const ADDR = '0x' + 'aa'.repeat(20)
const ADDR_UPPER = '0x' + 'AA'.repeat(20)
const HEAD_ID = '0x' + 'bb'.repeat(32)

const mockAccount: Connex.Thor.Account = { balance: '0x1', energy: '0x2', hasCode: false }
const mockCode: Connex.Thor.Account.Code = { code: '0x600160' }
const mockStorage: Connex.Thor.Account.Storage = { value: '0x' + '00'.repeat(32) }

function makeDriver() {
    return {
        get head() { return { id: HEAD_ID, number: 1, timestamp: 1000, parentID: '0x' + 'cc'.repeat(32), gasLimit: 10000000 } },
        getAccount: vi.fn(async () => mockAccount),
        getCode: vi.fn(async () => mockCode),
        getStorage: vi.fn(async () => mockStorage),
        explain: vi.fn(async () => [{
            data: '0x0000000000000000000000000000000000000000000000000000000000000001',
            vmError: '', gasUsed: 1000, reverted: false, revertReason: '',
            events: [], transfers: [],
        }]),
    } as unknown as Connex.Driver
}

describe('newAccountVisitor', () => {
    it('address getter returns the address', () => {
        const v = newAccountVisitor(Promise.resolve(makeDriver()), ADDR)
        expect(v.address).toBe(ADDR)
    })

    it('get() returns account data', async () => {
        const driver = makeDriver()
        const v = newAccountVisitor(Promise.resolve(driver), ADDR)
        const account = await v.get()
        expect(account).toEqual(mockAccount)
        expect(driver.getAccount).toHaveBeenCalledWith(ADDR, HEAD_ID)
    })

    it('getCode() returns code', async () => {
        const driver = makeDriver()
        const v = newAccountVisitor(Promise.resolve(driver), ADDR)
        const code = await v.getCode()
        expect(code).toEqual(mockCode)
    })

    it('getStorage() returns storage value', async () => {
        const driver = makeDriver()
        const v = newAccountVisitor(Promise.resolve(driver), ADDR)
        const key = '0x' + '00'.repeat(32)
        const storage = await v.getStorage(key)
        expect(storage).toEqual(mockStorage)
        expect(driver.getStorage).toHaveBeenCalledWith(ADDR, key, HEAD_ID)
    })

    it('getStorage() throws BadParameter for invalid key', async () => {
        const driver = makeDriver()
        const v = newAccountVisitor(Promise.resolve(driver), ADDR)
        expect(() => v.getStorage('invalid-key')).toThrow(BadParameter)
    })
})

describe('newAccountVisitor.method()', () => {
    // A simple ERC20 balanceOf ABI
    const balanceOfABI = {
        name: 'balanceOf',
        type: 'function',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: 'balance', type: 'uint256' }],
        stateMutability: 'view',
    }

    it('throws BadParameter for invalid ABI', () => {
        const v = newAccountVisitor(Promise.resolve(makeDriver()), ADDR)
        expect(() => v.method({ name: 123 } as any)).toThrow(BadParameter)
    })

    it('asClause() encodes method call', () => {
        const v = newAccountVisitor(Promise.resolve(makeDriver()), ADDR)
        const method = v.method(balanceOfABI)
        const clause = method.asClause(ADDR)
        expect(clause.to).toBe(ADDR)
        expect(clause.data).toMatch(/^0x/)
        expect(clause.data.length).toBeGreaterThan(2)
    })

    it('asClause() throws BadParameter for wrong arg count', () => {
        const v = newAccountVisitor(Promise.resolve(makeDriver()), ADDR)
        const method = v.method(balanceOfABI)
        expect(() => method.asClause()).toThrow(BadParameter)
    })

    it('builder: caller() sets address (lowercased)', () => {
        const v = newAccountVisitor(Promise.resolve(makeDriver()), ADDR)
        const method = v.method(balanceOfABI)
        const result = method.caller(ADDR_UPPER)
        expect(result).toBe(method)
    })

    it('builder: gas() is chainable', () => {
        const v = newAccountVisitor(Promise.resolve(makeDriver()), ADDR)
        const method = v.method(balanceOfABI)
        expect(method.gas(50000)).toBe(method)
    })

    it('call() returns output with decoded field', async () => {
        const driver = makeDriver()
        const v = newAccountVisitor(Promise.resolve(driver), ADDR)
        const method = v.method(balanceOfABI)
        const output = await method.call(ADDR)
        expect(output).toHaveProperty('decoded')
        expect(output.decoded).toBeDefined()
    })
})

describe('newAccountVisitor.event()', () => {
    const transferEventABI = {
        name: 'Transfer',
        type: 'event',
        inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'value', type: 'uint256', indexed: false },
        ],
    }

    it('throws BadParameter for invalid ABI', () => {
        const v = newAccountVisitor(Promise.resolve(makeDriver()), ADDR)
        expect(() => v.event({ type: 'not-event' } as any)).toThrow(BadParameter)
    })

    it('asCriteria() encodes indexed params', () => {
        const v = newAccountVisitor(Promise.resolve(makeDriver()), ADDR)
        const event = v.event(transferEventABI)
        const criteria = event.asCriteria({ from: ADDR })
        expect(criteria.address).toBe(ADDR)
        expect(criteria.topic0).toMatch(/^0x/)
    })

    it('asCriteria() throws BadParameter for invalid params', () => {
        const v = newAccountVisitor(Promise.resolve(makeDriver()), ADDR)
        const event = v.event(transferEventABI)
        expect(() => event.asCriteria({ from: 'invalid-address' })).toThrow(BadParameter)
    })
})
