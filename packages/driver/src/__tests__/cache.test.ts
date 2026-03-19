import { describe, it, expect, vi } from 'vitest'
import { Cache } from '../cache'

function makeHead(number: number, id?: string, parentID?: string): Connex.Thor.Status['head'] {
    const myId = id ?? ('0x' + number.toString(16).padStart(64, '0'))
    const myParent = parentID ?? ('0x' + (number - 1).toString(16).padStart(64, '0'))
    return {
        id: myId,
        number,
        timestamp: 1000000 + number * 10,
        parentID: myParent,
        gasLimit: 10000000,
    }
}

function makeBlock(number: number, id?: string): Connex.Thor.Block {
    const head = makeHead(number, id)
    return {
        id: head.id,
        number,
        size: 256,
        parentID: head.parentID,
        timestamp: head.timestamp,
        gasLimit: head.gasLimit,
        beneficiary: '0x' + 'aa'.repeat(20),
        gasUsed: 0,
        totalScore: number,
        txsRoot: '0x' + '00'.repeat(32),
        stateRoot: '0x' + '00'.repeat(32),
        receiptsRoot: '0x' + '00'.repeat(32),
        signer: '0x' + 'aa'.repeat(20),
        transactions: [],
        isTrunk: true,
    }
}

function makeTx(blockNumber: number, txid: string): Connex.Thor.Transaction {
    return {
        id: txid,
        chainTag: 0,
        blockRef: '0x0000000000000001',
        expiration: 32,
        clauses: [],
        gasPriceCoef: 0,
        gas: 21000,
        origin: '0x' + 'aa'.repeat(20),
        delegator: null,
        nonce: '0x1',
        dependsOn: null,
        size: 100,
        meta: {
            blockID: makeHead(blockNumber).id,
            blockNumber,
            blockTimestamp: 1000000 + blockNumber * 10,
        },
    }
}

function makeReceipt(blockNumber: number, txid: string): Connex.Thor.Transaction.Receipt {
    return {
        gasUsed: 21000,
        gasPayer: '0x' + 'aa'.repeat(20),
        paid: '0x0',
        reward: '0x0',
        reverted: false,
        outputs: [],
        meta: {
            blockID: makeHead(blockNumber).id,
            blockNumber,
            blockTimestamp: 1000000 + blockNumber * 10,
            txID: txid,
            txOrigin: '0x' + 'aa'.repeat(20),
        },
    }
}

describe('Cache.handleNewBlock', () => {
    it('adds first block to window', () => {
        const cache = new Cache()
        const head = makeHead(1)
        cache.handleNewBlock(head)
        // Window should have 1 slot — verify via getBlock
        const fetch = vi.fn(async () => null)
        cache.getBlock(head.id, fetch)
        // fetch called because block not cached yet (no block passed to handleNewBlock)
        expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('ignores duplicate heads', async () => {
        const cache = new Cache()
        const head = makeHead(1)
        const block = makeBlock(1)
        cache.handleNewBlock(head, undefined, block)
        cache.handleNewBlock(head, undefined, block) // duplicate
        // Block should still be findable once
        const fetch = vi.fn(async () => null)
        const result = await cache.getBlock(head.id, fetch)
        expect(result).toEqual(block)
        expect(fetch).not.toHaveBeenCalled()
    })

    it('evicts oldest slot after 12 blocks and moves to irreversible LRU', async () => {
        const cache = new Cache()
        // Build a chain of 13 blocks
        let prevId = '0x' + 'ff'.repeat(32)
        for (let i = 1; i <= 13; i++) {
            const id = '0x' + i.toString(16).padStart(64, '0')
            const head = { ...makeHead(i, id, prevId) }
            const block = makeBlock(i, id)
            cache.handleNewBlock(head, undefined, block)
            prevId = id
        }
        // Block 1 should be evicted from window but moved to irreversible LRU
        const block1Id = '0x' + (1).toString(16).padStart(64, '0')
        const fetch = vi.fn(async () => null)
        const result = await cache.getBlock(block1Id, fetch)
        // fetch should not be called — block 1 is in irreversible cache
        expect(fetch).not.toHaveBeenCalled()
        expect(result?.number).toBe(1)
    })
})

describe('Cache.getBlock', () => {
    it('returns null and calls fetch on cache miss', async () => {
        const cache = new Cache()
        const fetch = vi.fn(async () => null)
        const result = await cache.getBlock('0x' + '00'.repeat(32), fetch)
        expect(result).toBeNull()
        expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('returns block from window without calling fetch', async () => {
        const cache = new Cache()
        const block = makeBlock(5)
        cache.handleNewBlock(makeHead(5), undefined, block)
        const fetch = vi.fn(async () => null)
        const result = await cache.getBlock(block.id, fetch)
        expect(result).toEqual(block)
        expect(fetch).not.toHaveBeenCalled()
    })

    it('caches fetched block in window slot', async () => {
        const cache = new Cache()
        const head = makeHead(5)
        cache.handleNewBlock(head)
        const block = makeBlock(5)
        const fetch = vi.fn(async () => block)
        await cache.getBlock(head.id, fetch)
        // Second call should hit cache
        const fetch2 = vi.fn(async () => null)
        const result = await cache.getBlock(head.id, fetch2)
        expect(result).toEqual(block)
        expect(fetch2).not.toHaveBeenCalled()
    })
})

describe('Cache.getTx', () => {
    it('calls fetch on miss and returns result', async () => {
        const cache = new Cache()
        const txid = '0x' + 'ab'.repeat(32)
        const tx = makeTx(5, txid)
        const fetch = vi.fn(async () => tx)
        const result = await cache.getTx(txid, fetch)
        expect(result).toEqual(tx)
    })

    it('returns cached tx without fetch on second call', async () => {
        const cache = new Cache()
        const head = makeHead(5)
        cache.handleNewBlock(head)
        const txid = '0x' + 'ab'.repeat(32)
        const tx = makeTx(5, txid)
        await cache.getTx(txid, async () => tx)
        const fetch2 = vi.fn(async () => null)
        const result = await cache.getTx(txid, fetch2)
        expect(result).toEqual(tx)
        expect(fetch2).not.toHaveBeenCalled()
    })
})

describe('Cache.getReceipt', () => {
    it('calls fetch on miss', async () => {
        const cache = new Cache()
        const txid = '0x' + 'cd'.repeat(32)
        const receipt = makeReceipt(5, txid)
        const fetch = vi.fn(async () => receipt)
        const result = await cache.getReceipt(txid, fetch)
        expect(result).toEqual(receipt)
    })

    it('returns cached receipt without fetch on second call', async () => {
        const cache = new Cache()
        const head = makeHead(5)
        cache.handleNewBlock(head)
        const txid = '0x' + 'cd'.repeat(32)
        const receipt = makeReceipt(5, txid)
        await cache.getReceipt(txid, async () => receipt)
        const fetch2 = vi.fn(async () => null)
        const result = await cache.getReceipt(txid, fetch2)
        expect(result).toEqual(receipt)
        expect(fetch2).not.toHaveBeenCalled()
    })
})

describe('Cache.getAccount', () => {
    it('calls fetch on miss', async () => {
        const cache = new Cache()
        const head = makeHead(1)
        cache.handleNewBlock(head)
        const acc = { balance: '0x64', energy: '0x0', hasCode: false }
        const fetch = vi.fn(async () => acc)
        const result = await cache.getAccount('0x' + 'aa'.repeat(20), head.id, fetch)
        expect(result.balance).toBe('0x64')
    })
})

describe('Cache.getFeesHistory', () => {
    it('calls fetch on miss and caches result', async () => {
        const cache = new Cache()
        const history: Connex.Thor.Fees.History = {
            oldestBlock: '0x' + '00'.repeat(32),
            baseFeePerGas: ['0x1', '0x2'],
            gasUsedRatio: [0.5, 0.6],
        }
        const fetch = vi.fn(async () => history)
        const result = await cache.getFeesHistory('best', 2, [], fetch)
        expect(result).toEqual(history)
        // Second call should hit cache
        const fetch2 = vi.fn(async () => history)
        await cache.getFeesHistory('best', 2, [], fetch2)
        expect(fetch2).not.toHaveBeenCalled()
    })

    it('includes rewardPercentiles in cache key', async () => {
        const cache = new Cache()
        const history: Connex.Thor.Fees.History = {
            oldestBlock: '0x' + '00'.repeat(32),
            baseFeePerGas: ['0x1'],
            gasUsedRatio: [0.5],
            reward: [['0x10']],
        }
        const fetch1 = vi.fn(async () => history)
        const fetch2 = vi.fn(async () => history)
        await cache.getFeesHistory('best', 1, [25, 75], fetch1)
        await cache.getFeesHistory('best', 1, [50], fetch2)
        // Different percentiles → different cache key → fetch2 called
        expect(fetch2).toHaveBeenCalledTimes(1)
    })
})
