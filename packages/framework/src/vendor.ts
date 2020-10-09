import * as R from './rules'
import * as V from 'validator-ts'
import { abi } from 'thor-devkit/dist/abi'

export function newVendor(driver: Connex.Driver): Connex.Vendor {
    return {
        sign: (kind: 'tx' | 'cert') => {
            if (kind === 'tx') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return newTxSigningService(driver) as any
            } else if (kind === 'cert') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return newCertSigningService(driver) as any
            } else {
                throw new R.BadParameter(`arg0: expected 'tx' or 'cert'`)
            }
        },
        owned: (addr) => {
            addr = R.test(addr, R.address, 'arg0').toLowerCase()
            return driver.isAddressOwned(addr)
        }
    }
}

function newTxSigningService(driver: Connex.Driver): Connex.Vendor.TxSigningService {
    const opts: Connex.Driver.TxOptions = {}

    return {
        signer(addr) {
            opts.signer = R.test(addr, R.address, 'arg0').toLowerCase()
            return this
        },
        gas(gas) {
            opts.gas = R.test(gas, R.uint64, 'arg0')
            return this
        },
        dependsOn(txid) {
            opts.dependsOn = R.test(txid, R.bytes32, 'arg0').toLowerCase()
            return this
        },
        link(url) {
            opts.link = R.test(url, R.string, 'arg0')
            return this
        },
        comment(text) {
            opts.comment = R.test(text, R.string, 'arg0')
            return this
        },
        delegate(delegator) {
            R.ensure(typeof delegator === 'string', `arg0: expected url string`)
            opts.delegator = delegator
            return this
        },
        prepared(callback) {
            R.ensure(typeof callback === 'function', 'arg0: expected function')
            opts.onPrepared = callback
            return this
        },
        request(msg) {
            R.test(msg, [clauseScheme], 'arg0')
            return (async () => {
                try {
                    return await driver.signTx(msg, opts)
                } catch (err) {
                    throw new Rejected(err.message)
                }
            })()
        }
    }
}

function newCertSigningService(driver: Connex.Driver): Connex.Vendor.CertSigningService {
    const opts: Connex.Driver.CertOptions = {}

    return {
        signer(addr) {
            opts.signer = R.test(addr, R.address, 'arg0').toLowerCase()
            return this
        },
        link(url) {
            opts.link = R.test(url, R.string, 'arg0')
            return this
        },
        prepared(callback) {
            R.ensure(typeof callback === 'function', 'arg0: expected function')
            opts.onPrepared = callback
            return this
        },
        request(msg) {
            R.test(msg, {
                purpose: v => (v === 'agreement' || v === 'identification') ?
                    '' : `expected 'agreement' or 'identification'`,
                payload: {
                    type: v => v === 'text' ? '' : `expected 'text'`,
                    content: R.string
                }
            }, 'arg0')

            return (async () => {
                try {
                    return await driver.signCert(msg, opts)
                } catch (err) {
                    throw new Rejected(err.message)
                }
            })()
        }
    }
}

class Rejected extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

Rejected.prototype.name = 'Rejected'

const clauseScheme: V.Scheme<Connex.Vendor.TxMessage[number]> = {
    to: V.nullable(R.address),
    value: R.bigInt,
    data: V.optional(R.bytes),
    comment: V.optional(R.string),
    abi: V.optional(v => {
        if (!(v instanceof Object)) {
            return 'expected object'
        }
        try {
            // tslint:disable-next-line: no-unused-expression
            new abi.Function(v as any)
            return ''
        } catch (err) {
            return `expected valid ABI (${err.message})`
        }
    })
}
