import { describe, it, expect } from 'vitest'
import { newFilter } from '../bloom'

// Test vector from the source comment
const TEST_BITS = Buffer.from(
    '63b2a4758c74e246c818e080b870437f5327a15cf81172512d98e61c54361a851ba8f108420e6b2b74a4196fb8e7bfe2b96c985e49abddb21c0600063997c93edb7c54921551600bcfc80fb62bfcd045c030b328eb8b5498e06dce610d22e901201226226441b8da094141526e0e58f5baf53064d63d598a4024bf68e0',
    'hex'
)
const TEST_K = 6

describe('bloom.newFilter', () => {
    it('contains() returns true for all items inserted in test vector', () => {
        const f = newFilter(TEST_BITS, TEST_K)
        for (let i = 0; i < 100; i++) {
            expect(f.contains(Buffer.from(String(i)))).toBe(true)
        }
    })

    it('contains() returns false for items not in filter (empty filter)', () => {
        const emptyBits = Buffer.alloc(128, 0)
        const f = newFilter(emptyBits, TEST_K)
        expect(f.contains(Buffer.from('hello'))).toBe(false)
        expect(f.contains(Buffer.from('world'))).toBe(false)
    })

    it('contains() returns true for all-ones filter (everything matches)', () => {
        const fullBits = Buffer.alloc(128, 0xff)
        const f = newFilter(fullBits, TEST_K)
        expect(f.contains(Buffer.from('anything'))).toBe(true)
        expect(f.contains(Buffer.from('vechain'))).toBe(true)
    })

    it('handles single-byte filter', () => {
        const bits = Buffer.alloc(1, 0)
        const f = newFilter(bits, 1)
        expect(f.contains(Buffer.from('test'))).toBe(false)
    })
})
