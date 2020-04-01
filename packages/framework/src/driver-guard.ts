import * as V from 'validator-ts'
import * as R from './rules'

export function newDriverGuard(
    driver: Connex.Driver,
    errHandler?: (err: Error) => void
): Connex.Driver {

    const test = <T>(obj: T, scheme: V.Scheme<T>, path: string) => {
        try {
            V.validate(obj, scheme, path)
        } catch (err) {
            if (errHandler) {
                errHandler(err)
            } else {
                // tslint:disable-next-line:no-console
                console.warn(`Connex-Driver[MALFORMED RESPONSE]: ${err.message}`)
            }
        }
        return obj
    }

    const genesis = test(driver.genesis, blockScheme, 'genesis')
    return {
        genesis,
        get head() {
            return test(driver.head, headScheme, 'head')
        },
        pollHead() {
            return driver.pollHead()
                .then(h => test(h, headScheme, 'getHead()'))
        },
        getBlock(revision) {
            return driver.getBlock(revision)
                .then(b => b ? test(b, blockScheme, 'getBlock()') : b)
        },
        getTransaction(id) {
            return driver.getTransaction(id)
                .then(tx => tx ? test(tx, txScheme, 'getTransaction()') : tx)
        },
        getReceipt(id) {
            return driver.getReceipt(id)
                .then(r => r ? test(r, receiptScheme, 'getReceipt()') : r)
        },
        getAccount(addr: string, revision: string): Promise<Connex.Thor.Account> {
            return driver.getAccount(addr, revision)
                .then(a => test(a, {
                    balance: R.hexString,
                    energy: R.hexString,
                    hasCode: R.bool
                }, 'getAccount()'))
        },
        getCode(addr: string, revision: string): Promise<Connex.Thor.Code> {
            return driver.getCode(addr, revision)
                .then(c => test(c, {
                    code: R.bytes
                }, 'getCode()'))
        },
        getStorage(addr: string, key: string, revision: string) {
            return driver.getStorage(addr, key, revision)
                .then(s => test(s, {
                    value: R.bytes32
                }, 'getStorage()'))
        },
        explain(arg, revision) {
            return driver.explain(arg, revision)
                .then(r => test(r, [vmOutputScheme], 'explain()'))
        },
        filterEventLogs(arg) {
            return driver.filterEventLogs(arg)
                .then(r => test(r, [eventWithMetaScheme], 'filterEventLogs()'))
        },
        filterTransferLogs(arg) {
            return driver.filterTransferLogs(arg)
                .then(r => test(r, [transferWithMetaScheme], 'filterTransferLogs()'))
        },
        signTx(msg, option) {
            return driver.signTx(msg, {
                ...option,
                delegationHandler: option.delegationHandler ?
                    unsigned => {
                        test(unsigned, {
                            raw: R.bytes,
                            origin: R.address
                        }, 'delegationHandler.arg')
                        return option.delegationHandler!(unsigned)
                    } : undefined
            })
                .then(r => test(r, {
                    txid: R.bytes32,
                    signer: R.address
                }, 'signTx()'))
        },
        signCert(msg, option) {
            return driver.signCert(msg, option)
                .then(r => test(r, {
                    annex: {
                        domain: R.string,
                        timestamp: R.uint64,
                        signer: R.address
                    },
                    signature: v => R.isHexBytes(v, 65) ? '' : 'expected 65 bytes'
                }, 'signCert()'))
        },
        isAddressOwned(addr) {
            return driver.isAddressOwned(addr)
                .then(r => test(r, R.bool, 'isAddressOwned()'))
        }
    }
}

const headScheme: V.Scheme<Connex.Thor.Status['head']> = {
    id: R.bytes32,
    number: R.uint32,
    timestamp: R.uint64,
    parentID: R.bytes32,
    txsFeatures: V.optional(R.uint32)
}

const blockScheme: V.Scheme<Connex.Thor.Block> = {
    id: R.bytes32,
    number: R.uint32,
    size: R.uint32,
    parentID: R.bytes32,
    timestamp: R.uint64,
    gasLimit: R.uint64,
    beneficiary: R.address,
    gasUsed: R.uint64,
    totalScore: R.uint64,
    txsRoot: R.bytes32,
    txsFeatures: V.optional(R.uint32),
    stateRoot: R.bytes32,
    receiptsRoot: R.bytes32,
    signer: R.address,
    isTrunk: R.bool,
    transactions: [R.bytes32]
}

const txScheme: V.Scheme<Connex.Thor.Transaction> = {
    id: R.bytes32,
    chainTag: R.uint8,
    blockRef: R.bytes8,
    expiration: R.uint32,
    gasPriceCoef: R.uint8,
    gas: R.uint64,
    origin: R.address,
    delegator: V.nullable(V.optional(R.address)),
    nonce: R.hexString,
    dependsOn: V.nullable(R.bytes32),
    size: R.uint32,
    clauses: [{
        to: V.nullable(R.address),
        value: R.hexString,
        data: R.bytes
    }],
    meta: {
        blockID: R.bytes32,
        blockNumber: R.uint32,
        blockTimestamp: R.uint64
    }
}

const logMetaScheme: V.Scheme<Connex.Thor.LogMeta> = {
    blockID: R.bytes32,
    blockNumber: R.uint32,
    blockTimestamp: R.uint64,
    txID: R.bytes32,
    txOrigin: R.address,
    clauseIndex: R.uint32
}

const eventScheme: V.Scheme<Connex.Thor.Event> = {
    address: R.address,
    topics: [R.bytes32],
    data: R.bytes,
    meta: () => '',
    decoded: () => ''
}
const eventWithMetaScheme: V.Scheme<Connex.Thor.Event> = {
    ...eventScheme,
    meta: logMetaScheme
}

const transferScheme: V.Scheme<Connex.Thor.Transfer> = {
    sender: R.address,
    recipient: R.address,
    amount: R.hexString,
    meta: () => '',
}

const transferWithMetaScheme: V.Scheme<Connex.Thor.Transfer> = {
    ...transferScheme,
    meta: logMetaScheme
}

const receiptScheme: V.Scheme<Connex.Thor.Receipt> = {
    gasUsed: R.uint64,
    gasPayer: R.address,
    paid: R.hexString,
    reward: R.hexString,
    reverted: R.bool,
    outputs: [{
        contractAddress: V.nullable(R.address),
        events: [eventScheme],
        transfers: [transferScheme]
    }],
    meta: {
        blockID: R.bytes32,
        blockNumber: R.uint32,
        blockTimestamp: R.uint64,
        txID: R.bytes32,
        txOrigin: R.address
    }
}

const vmOutputScheme: V.Scheme<Connex.Thor.VMOutput> = {
    data: R.bytes,
    vmError: R.string,
    gasUsed: R.uint64,
    reverted: R.bool,
    events: [{
        address: R.address,
        topics: [R.bytes32],
        data: R.bytes,
        meta: () => '',
        decoded: () => ''
    }],
    transfers: [{
        sender: R.address,
        recipient: R.address,
        amount: R.hexString,
        meta: () => '',
    }],
    decoded: () => ''
}
