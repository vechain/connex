import * as V from 'validator-ts'
import { newAccountVisitor } from './account-visitor'
import { newBlockVisitor } from './block-visitor'
import { newExplainer } from './explainer'
import { newFeesVisitor } from './fees-visitor'
import { newFilter } from './filter'
import { newHeadTracker } from './head-tracker'
import * as R from './rules'
import { newTxVisitor } from './tx-visitor'

export function newThor(driver: Connex.Driver): Connex.Thor {
    const headTracker = newHeadTracker(driver)

    const readyDriver = (async () => {
        if (headTracker.head.number > 0) {
            return driver
        }
        await headTracker.ticker().next()
        return driver
    })()

    const genesis = JSON.parse(JSON.stringify(driver.genesis)) as Connex.Thor.Block
    return {
        get genesis() { return genesis },
        get status() {
            return {
                head: headTracker.head,
                progress: headTracker.progress,
                finalized: headTracker.finalized
            }
        },
        ticker: () => headTracker.ticker(),
        account: addr => {
            addr = R.test(addr, R.address, 'arg0').toLowerCase()
            return newAccountVisitor(readyDriver, addr)
        },
        block: revision => {
            if (typeof revision === 'undefined') {
                revision = driver.head.id
            } else {
                R.ensure(typeof revision === 'string' ? R.isHexBytes(revision, 32) : R.isUInt(revision, 32),
                    'arg0: expected bytes32 or unsigned 32-bit integer')
            }
            return newBlockVisitor(driver, typeof revision === 'string' ? revision.toLowerCase() : revision)
        },
        transaction: id => {
            id = R.test(id, R.bytes32, 'arg0').toLowerCase()
            return newTxVisitor(readyDriver, id)
        },
        filter: <T extends 'event' | 'transfer'>(kind: T, criteria: Connex.Thor.Filter.Criteria<T>[]): any => {
            R.ensure(kind === 'event' || kind === 'transfer',
                `arg0: expected 'event' or 'transfer'`)
            if (kind === 'event') {
                R.test(criteria as Connex.Thor.Filter.Criteria<'event'>[], [eventCriteriaScheme], 'arg1')
                return newFilter(readyDriver, 'event', (criteria as Connex.Thor.Filter.Criteria<'event'>[])
                    .map(c => {
                        return {
                            address: c.address ? c.address.toLowerCase() : undefined,
                            topic0: c.topic0 ? c.topic0.toLowerCase() : undefined,
                            topic1: c.topic1 ? c.topic1.toLowerCase() : undefined,
                            topic2: c.topic2 ? c.topic2.toLowerCase() : undefined,
                            topic3: c.topic3 ? c.topic3.toLowerCase() : undefined,
                            topic4: c.topic4 ? c.topic4.toLowerCase() : undefined
                        }
                    }))
            } else {
                R.test(criteria as Connex.Thor.Filter.Criteria<'transfer'>[], [transferCriteriaScheme], 'arg1')
                return newFilter(readyDriver, 'transfer', (criteria as Connex.Thor.Filter.Criteria<'transfer'>[])
                    .map(c => {
                        return {
                            txOrigin: c.txOrigin ? c.txOrigin.toLowerCase() : undefined,
                            sender: c.sender ? c.sender.toLowerCase() : undefined,
                            recipient: c.recipient ? c.recipient.toLowerCase() : undefined
                        }
                    }))
            }
        },
        explain: (clauses) => {
            R.test(clauses, [clauseScheme], 'arg0')
            return newExplainer(readyDriver, clauses)
        },
        fees: (newestBlock, blockCount, rewardPercentiles) => {
            if (typeof newestBlock === 'undefined') {
                newestBlock = driver.head.id
            } else {
                R.ensure(typeof newestBlock === 'string' ? R.isHexBytes(newestBlock, 32) : R.isUInt(newestBlock, 32),
                    'arg0: expected bytes32 or unsigned 32-bit integer')
            }

            if (typeof blockCount === 'undefined') {
                blockCount = 1
            } else {
                R.ensure(R.isUInt(blockCount, 32),
                    'arg1: expected unsigned 32-bit integer')
            }

            if (typeof rewardPercentiles === 'undefined') {
                rewardPercentiles = []
            } else {
                R.ensure(
                    Array.isArray(rewardPercentiles) && 
                    rewardPercentiles.length <= 100 &&
                    rewardPercentiles.every((rewardPercentile, index) => {
                        const isValid = R.isUInt(rewardPercentile, 32) && rewardPercentile >= 1 && rewardPercentile <= 100;
                        const isAscending = index === 0 || rewardPercentile > (rewardPercentiles as number[])[index - 1];
                        return isValid && isAscending;
                    }),
                    'arg2: expected an array of integers between 1 and 100, in ascending order, with maximum 100 elements'
                )
            }
            return newFeesVisitor(driver, newestBlock, blockCount, rewardPercentiles)
        },
        priorityFeeSuggestion: () => {
            return driver.getPriorityFeeSuggestion()
        }
    }
}


const clauseScheme: V.Scheme<Connex.VM.Clause> = {
    to: V.nullable(R.address),
    value: R.bigInt,
    data: V.optional(R.bytes)
}

const eventCriteriaScheme: V.Scheme<Connex.Thor.Filter.Criteria<'event'>> = {
    address: V.optional(R.address),
    topic0: V.optional(R.bytes32),
    topic1: V.optional(R.bytes32),
    topic2: V.optional(R.bytes32),
    topic3: V.optional(R.bytes32),
    topic4: V.optional(R.bytes32)
}
const transferCriteriaScheme: V.Scheme<Connex.Thor.Filter.Criteria<'transfer'>> = {
    sender: V.optional(R.address),
    recipient: V.optional(R.address),
    txOrigin: V.optional(R.address)
}
