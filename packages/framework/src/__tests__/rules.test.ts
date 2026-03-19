import { describe, it, expect } from 'vitest'
import * as R from '../rules'

describe('isDecString', () => {
    it('accepts valid decimal strings', () => {
        expect(R.isDecString('0')).toBe(true)
        expect(R.isDecString('123')).toBe(true)
        expect(R.isDecString('99999')).toBe(true)
    })
    it('rejects non-decimal strings', () => {
        expect(R.isDecString('')).toBe(false)
        expect(R.isDecString('0x1')).toBe(false)
        expect(R.isDecString('1.5')).toBe(false)
        expect(R.isDecString('abc')).toBe(false)
        expect(R.isDecString('-1')).toBe(false)
    })
    it('rejects non-strings', () => {
        expect(R.isDecString(123 as any)).toBe(false)
    })
})

describe('isHexString', () => {
    it('accepts valid hex strings', () => {
        expect(R.isHexString('0x0')).toBe(true)
        expect(R.isHexString('0xabcdef')).toBe(true)
        expect(R.isHexString('0xABCDEF')).toBe(true)
        expect(R.isHexString('0x1234567890abcdef')).toBe(true)
    })
    it('rejects invalid hex strings', () => {
        expect(R.isHexString('')).toBe(false)
        expect(R.isHexString('0x')).toBe(false)
        expect(R.isHexString('123')).toBe(false)
        expect(R.isHexString('0xgg')).toBe(false)
    })
})

describe('isHexBytes', () => {
    it('accepts hex bytes without length check', () => {
        expect(R.isHexBytes('0x')).toBe(true)
        expect(R.isHexBytes('0xabcd')).toBe(true)
    })
    it('accepts hex bytes with exact length', () => {
        const addr = '0x' + 'ab'.repeat(20)
        expect(R.isHexBytes(addr, 20)).toBe(true)
        const hash = '0x' + 'cd'.repeat(32)
        expect(R.isHexBytes(hash, 32)).toBe(true)
    })
    it('rejects wrong length', () => {
        expect(R.isHexBytes('0xabcd', 20)).toBe(false)
        expect(R.isHexBytes('0x' + 'ab'.repeat(32), 20)).toBe(false)
    })
    it('rejects odd-length bytes', () => {
        expect(R.isHexBytes('0xabc')).toBe(false)
    })
    it('rejects non-hex', () => {
        expect(R.isHexBytes('not-hex')).toBe(false)
    })
})

describe('isUInt', () => {
    it('accepts valid unsigned integers', () => {
        expect(R.isUInt(0, 8)).toBe(true)
        expect(R.isUInt(255, 8)).toBe(true)
        expect(R.isUInt(65535, 16)).toBe(true)
        expect(R.isUInt(0, 0)).toBe(true)
    })
    it('rejects out-of-range values', () => {
        expect(R.isUInt(256, 8)).toBe(false)
        expect(R.isUInt(-1, 8)).toBe(false)
    })
    it('rejects non-integers', () => {
        expect(R.isUInt(1.5, 8)).toBe(false)
    })
})

describe('isBigInt', () => {
    it('accepts decimal strings', () => {
        expect(R.isBigInt('0')).toBe(true)
        expect(R.isBigInt('12345678901234567890')).toBe(true)
    })
    it('accepts hex strings', () => {
        expect(R.isBigInt('0xabcdef')).toBe(true)
    })
    it('accepts non-negative integers', () => {
        expect(R.isBigInt(0)).toBe(true)
        expect(R.isBigInt(100)).toBe(true)
    })
    it('rejects negatives and floats', () => {
        expect(R.isBigInt(-1)).toBe(false)
        expect(R.isBigInt(1.5)).toBe(false)
    })
})

describe('BadParameter', () => {
    it('has name BadParameter', () => {
        const e = new R.BadParameter('test error')
        expect(e.name).toBe('BadParameter')
        expect(e.message).toBe('test error')
        expect(e instanceof Error).toBe(true)
    })
})

describe('ensure', () => {
    it('does not throw when condition is true', () => {
        expect(() => R.ensure(true, 'msg')).not.toThrow()
    })
    it('throws BadParameter when condition is false', () => {
        expect(() => R.ensure(false, 'bad input')).toThrow(R.BadParameter)
        expect(() => R.ensure(false, 'bad input')).toThrow('bad input')
    })
})

describe('test()', () => {
    it('returns value on valid input', () => {
        const result = R.test('0x' + 'aa'.repeat(20), R.address, 'addr')
        expect(result).toBe('0x' + 'aa'.repeat(20))
    })
    it('throws BadParameter on invalid input', () => {
        expect(() => R.test('not-an-address', R.address, 'addr')).toThrow(R.BadParameter)
    })
})

describe('rule functions', () => {
    it('bytes: returns empty string for valid, error for invalid', () => {
        expect(R.bytes('0xabcd')).toBe('')
        expect(R.bytes('not-bytes')).toBeTruthy()
    })
    it('bytes32: validates 32-byte hex', () => {
        expect(R.bytes32('0x' + 'aa'.repeat(32))).toBe('')
        expect(R.bytes32('0xabcd')).toBeTruthy()
    })
    it('uint32: validates 32-bit unsigned integer', () => {
        expect(R.uint32(0)).toBe('')
        expect(R.uint32(2 ** 32 - 1)).toBe('')
        expect(R.uint32(2 ** 32)).toBeTruthy()
    })
    it('uint64: validates 64-bit unsigned integer', () => {
        expect(R.uint64(0)).toBe('')
        expect(R.uint64(-1)).toBeTruthy()
    })
    it('address: validates 20-byte hex', () => {
        expect(R.address('0x' + 'aa'.repeat(20))).toBe('')
        expect(R.address('0x1234')).toBeTruthy()
    })
    it('bool: validates boolean', () => {
        expect(R.bool(true)).toBe('')
        expect(R.bool(false)).toBe('')
        expect(R.bool(1 as any)).toBeTruthy()
    })
    it('bigInt: validates big integer', () => {
        expect(R.bigInt('12345')).toBe('')
        expect(R.bigInt('0xabcd')).toBe('')
        expect(R.bigInt(100)).toBe('')
        expect(R.bigInt(-1)).toBeTruthy()
    })
    it('hexString: validates hex string', () => {
        expect(R.hexString('0xabcd')).toBe('')
        expect(R.hexString('123')).toBeTruthy()
    })
    it('string: validates string type', () => {
        expect(R.string('hello')).toBe('')
        expect(R.string(123 as any)).toBeTruthy()
    })
})
