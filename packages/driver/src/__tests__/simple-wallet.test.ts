import { describe, it, expect } from 'vitest'
import { SimpleWallet } from '../simple-wallet'
import { secp256k1, address } from 'thor-devkit'

// A deterministic test private key (32 bytes of 0x01)
const TEST_PRIVATE_KEY = '01'.repeat(32)
const TEST_PRIVATE_KEY_0X = '0x' + TEST_PRIVATE_KEY

// Derive expected address from the private key
const TEST_PUBLIC_KEY = secp256k1.derivePublicKey(Buffer.from(TEST_PRIVATE_KEY, 'hex'))
const TEST_ADDRESS = address.fromPublicKey(TEST_PUBLIC_KEY)

describe('SimpleWallet.import()', () => {
    it('imports a valid hex private key and returns derived address', () => {
        const wallet = new SimpleWallet()
        const addr = wallet.import(TEST_PRIVATE_KEY)
        expect(addr).toBe(TEST_ADDRESS)
    })

    it('imports a 0x-prefixed private key', () => {
        const wallet = new SimpleWallet()
        const addr = wallet.import(TEST_PRIVATE_KEY_0X)
        expect(addr).toBe(TEST_ADDRESS)
    })

    it('throws on invalid private key (too short)', () => {
        const wallet = new SimpleWallet()
        expect(() => wallet.import('abcd1234')).toThrow('invalid private key')
    })

    it('throws on non-hex private key', () => {
        const wallet = new SimpleWallet()
        expect(() => wallet.import('z'.repeat(64))).toThrow('invalid private key')
    })

    it('throws on empty string', () => {
        const wallet = new SimpleWallet()
        expect(() => wallet.import('')).toThrow('invalid private key')
    })

    it('can import multiple keys', () => {
        const wallet = new SimpleWallet()
        const addr1 = wallet.import('01'.repeat(32))
        const addr2 = wallet.import('02'.repeat(32))
        expect(wallet.list).toHaveLength(2)
        expect(wallet.list.map(k => k.address)).toContain(addr1)
        expect(wallet.list.map(k => k.address)).toContain(addr2)
    })
})

describe('SimpleWallet.remove()', () => {
    it('removes an existing key and returns true', () => {
        const wallet = new SimpleWallet()
        wallet.import(TEST_PRIVATE_KEY)
        expect(wallet.remove(TEST_ADDRESS)).toBe(true)
        expect(wallet.list).toHaveLength(0)
    })

    it('returns false when address not found', () => {
        const wallet = new SimpleWallet()
        expect(wallet.remove(TEST_ADDRESS)).toBe(false)
    })

    it('removes by lowercase address even if input is uppercase', () => {
        const wallet = new SimpleWallet()
        wallet.import(TEST_PRIVATE_KEY)
        expect(wallet.remove(TEST_ADDRESS.toUpperCase())).toBe(true)
    })
})

describe('SimpleWallet.list', () => {
    it('returns empty array when no keys', () => {
        const wallet = new SimpleWallet()
        expect(wallet.list).toHaveLength(0)
    })

    it('list.sign() produces a valid signature', async () => {
        const wallet = new SimpleWallet()
        wallet.import(TEST_PRIVATE_KEY)
        const key = wallet.list[0]
        const msgHash = Buffer.alloc(32, 0xab)
        const sig = await key.sign(msgHash)
        // Signature should be 65 bytes (r + s + v)
        expect(sig).toHaveLength(65)
        // Verify the signature recovers to the expected address
        const pubKey = secp256k1.recover(msgHash, sig)
        const recoveredAddr = address.fromPublicKey(pubKey)
        expect(recoveredAddr).toBe(TEST_ADDRESS)
    })
})
