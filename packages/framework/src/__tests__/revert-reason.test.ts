import { describe, it, expect } from 'vitest'
import { abi, keccak256 } from 'thor-devkit'
import { decodeRevertReason } from '../revert-reason'

// Pre-compute selectors
const errorSelector = '0x' + keccak256('Error(string)').toString('hex').slice(0, 8)
const panicSelector = '0x' + keccak256('Panic(uint256)').toString('hex').slice(0, 8)

function encodeError(msg: string): string {
    const encoded = abi.encodeParameter('string', msg) as string
    return errorSelector + encoded.slice(2)
}

function encodePanic(code: number): string {
    const encoded = abi.encodeParameter('uint256', code) as string
    return panicSelector + encoded.slice(2)
}

describe('decodeRevertReason', () => {
    it('decodes Error(string) revert', () => {
        const data = encodeError('insufficient balance')
        expect(decodeRevertReason(data)).toBe('insufficient balance')
    })

    it('decodes empty Error(string)', () => {
        const data = encodeError('')
        expect(decodeRevertReason(data)).toBe('')
    })

    it('decodes Panic(uint256) with known code', () => {
        const data = encodePanic(0x11)
        expect(decodeRevertReason(data)).toBe('Panic(0x11)')
    })

    it('decodes Panic(uint256) with code 0x01', () => {
        const data = encodePanic(0x01)
        expect(decodeRevertReason(data)).toBe('Panic(0x01)')
    })

    it('returns empty string for unknown selector', () => {
        expect(decodeRevertReason('0xdeadbeef')).toBe('')
    })

    it('returns empty string for empty data', () => {
        expect(decodeRevertReason('0x')).toBe('')
    })

    it('returns empty string for malformed data', () => {
        // Starts with error selector but truncated body
        expect(decodeRevertReason(errorSelector + 'deadbeef')).toBe('')
    })
})
