import { describe, it, expect, vi } from 'vitest'
import { newExplainer } from '../explainer'
import { abi, keccak256 } from 'thor-devkit'

const ADDR = '0x' + 'AA'.repeat(20)
const HASH = '0x' + 'bb'.repeat(32)

const mockHead: Connex.Thor.Status['head'] = {
    id: HASH,
    number: 1,
    timestamp: 1000000,
    parentID: '0x' + 'cc'.repeat(32),
    gasLimit: 10000000,
}

function makeDriver(explainResult: Connex.VM.Output[] = []) {
    return {
        get head() { return mockHead },
        explain: vi.fn(async () => explainResult),
    } as unknown as Connex.Driver
}

const nonRevertedOutput: Connex.VM.Output = {
    data: '0x',
    vmError: '',
    gasUsed: 1000,
    reverted: false,
    revertReason: '',
    events: [],
    transfers: [],
}

describe('newExplainer builder API', () => {
    it('caller() sets caller address (lowercased)', async () => {
        const driver = makeDriver([nonRevertedOutput])
        const ex = newExplainer(Promise.resolve(driver), [])
        ex.caller(ADDR)
        await ex.execute()
        expect(driver.explain).toHaveBeenCalledWith(
            expect.objectContaining({ caller: ADDR.toLowerCase() }),
            HASH,
            undefined
        )
    })

    it('gas() sets gas limit', async () => {
        const driver = makeDriver([nonRevertedOutput])
        const ex = newExplainer(Promise.resolve(driver), [])
        ex.gas(50000)
        await ex.execute()
        expect(driver.explain).toHaveBeenCalledWith(
            expect.objectContaining({ gas: 50000 }),
            HASH,
            undefined
        )
    })

    it('gasPrice() sets gas price', async () => {
        const driver = makeDriver([nonRevertedOutput])
        const ex = newExplainer(Promise.resolve(driver), [])
        ex.gasPrice('1000')
        await ex.execute()
        expect(driver.explain).toHaveBeenCalledWith(
            expect.objectContaining({ gasPrice: '1000' }),
            HASH,
            undefined
        )
    })

    it('gasPayer() sets gas payer (lowercased)', async () => {
        const driver = makeDriver([nonRevertedOutput])
        const ex = newExplainer(Promise.resolve(driver), [])
        ex.gasPayer(ADDR)
        await ex.execute()
        expect(driver.explain).toHaveBeenCalledWith(
            expect.objectContaining({ gasPayer: ADDR.toLowerCase() }),
            HASH,
            undefined
        )
    })

    it('cache() sets hints (lowercased)', async () => {
        const driver = makeDriver([nonRevertedOutput])
        const ex = newExplainer(Promise.resolve(driver), [])
        ex.cache([ADDR])
        await ex.execute()
        expect(driver.explain).toHaveBeenCalledWith(
            expect.anything(),
            HASH,
            [ADDR.toLowerCase()]
        )
    })

    it('builder methods are chainable', async () => {
        const driver = makeDriver([nonRevertedOutput])
        const ex = newExplainer(Promise.resolve(driver), [])
        const result = ex.caller(ADDR).gas(1000).gasPrice('100').gasPayer(ADDR)
        expect(result).toBe(ex)
    })
})

describe('newExplainer execute()', () => {
    it('lowercases clause `to` address', async () => {
        const driver = makeDriver([nonRevertedOutput])
        const clauses = [{ to: ADDR, value: '0', data: '0x' }]
        const ex = newExplainer(Promise.resolve(driver), clauses)
        await ex.execute()
        expect(driver.explain).toHaveBeenCalledWith(
            expect.objectContaining({
                clauses: [expect.objectContaining({ to: ADDR.toLowerCase() })]
            }),
            expect.anything(),
            undefined
        )
    })

    it('converts value to decimal string', async () => {
        const driver = makeDriver([nonRevertedOutput])
        const clauses = [{ to: ADDR, value: '0xff', data: '0x' }]
        const ex = newExplainer(Promise.resolve(driver), clauses)
        await ex.execute()
        expect(driver.explain).toHaveBeenCalledWith(
            expect.objectContaining({
                clauses: [expect.objectContaining({ value: '255' })]
            }),
            expect.anything(),
            undefined
        )
    })

    it('sets null to when clause.to is null/undefined', async () => {
        const driver = makeDriver([nonRevertedOutput])
        const clauses = [{ to: null, value: '0', data: '0x' }]
        const ex = newExplainer(Promise.resolve(driver), clauses as any)
        await ex.execute()
        expect(driver.explain).toHaveBeenCalledWith(
            expect.objectContaining({
                clauses: [expect.objectContaining({ to: null })]
            }),
            expect.anything(),
            undefined
        )
    })

    it('decodes revert reason from reverted output', async () => {
        const errorSelector = '0x' + keccak256('Error(string)').toString('hex').slice(0, 8)
        const encoded = abi.encodeParameter('string', 'out of gas') as string
        const revertData = errorSelector + encoded.slice(2)

        const revertedOutput: Connex.VM.Output = {
            data: revertData,
            vmError: 'revert',
            gasUsed: 100,
            reverted: true,
            revertReason: '',
            events: [],
            transfers: [],
        }
        const driver = makeDriver([revertedOutput])
        const ex = newExplainer(Promise.resolve(driver), [])
        const outputs = await ex.execute()
        expect(outputs[0].reverted).toBe(true)
        expect(outputs[0].revertReason).toBe('out of gas')
    })

    it('passes through non-reverted output unchanged (no revertReason decode)', async () => {
        const driver = makeDriver([nonRevertedOutput])
        const ex = newExplainer(Promise.resolve(driver), [])
        const outputs = await ex.execute()
        expect(outputs[0].reverted).toBe(false)
        expect(outputs[0].data).toBe('0x')
    })
})
