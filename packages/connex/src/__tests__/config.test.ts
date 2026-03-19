import { describe, it, expect } from 'vitest'
import { genesisBlocks } from '../config'

describe('genesisBlocks', () => {
    describe('main', () => {
        const main = genesisBlocks.main

        it('has correct id', () => {
            expect(main.id).toBe('0x00000000851caf3cfdb6e899cf5958bfb1ac3413d346d43539627e6be7ec1b4a')
        })

        it('is block 0', () => {
            expect(main.number).toBe(0)
        })

        it('has correct timestamp (2018-06-30)', () => {
            expect(main.timestamp).toBe(1530316800)
        })

        it('has correct gasLimit', () => {
            expect(main.gasLimit).toBe(10000000)
        })

        it('has empty transactions', () => {
            expect(main.transactions).toEqual([])
        })

        it('isTrunk is true', () => {
            expect(main.isTrunk).toBe(true)
        })
    })

    describe('test', () => {
        const test = genesisBlocks.test

        it('has correct id', () => {
            expect(test.id).toBe('0x000000000b2bce3c70bc649a02749e8687721b09ed2e15997f466536b20bb127')
        })

        it('is block 0', () => {
            expect(test.number).toBe(0)
        })

        it('has correct timestamp (2018-06-26)', () => {
            expect(test.timestamp).toBe(1530014400)
        })

        it('has different id from main', () => {
            expect(test.id).not.toBe(genesisBlocks.main.id)
        })

        it('has different stateRoot from main', () => {
            expect(test.stateRoot).not.toBe(genesisBlocks.main.stateRoot)
        })

        it('has empty transactions', () => {
            expect(test.transactions).toEqual([])
        })
    })
})
