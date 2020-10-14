import * as R from './rules'
import * as V from 'validator-ts'

const MAX_LIMIT = 256

export function newFilter<T extends 'event' | 'transfer'>(
    driver: Connex.Driver,
    kind: T
): Connex.Thor.Filter<T> {

    const filterBody = {
        range: {
            unit: 'block',
            from: 0,
            to: 2 ** 32 - 1
        },
        options: {
            offset: 0,
            limit: 10
        },
        criteriaSet: [] as Array<Connex.Thor.Filter.Criteria<'event' | 'transfer'>>,
        order: 'asc'
    }

    return {
        criteria(set) {
            if (kind === 'event') {
                R.test(set as Connex.Thor.Filter.Criteria<'event'>[], [eventCriteriaScheme], 'arg0')
                filterBody.criteriaSet = (set as Connex.Thor.Filter.Criteria<'event'>[])
                    .map(c => {
                        return {
                            address: c.address ? c.address.toLowerCase() : undefined,
                            topic0: c.topic0 ? c.topic0.toLowerCase() : undefined,
                            topic1: c.topic1 ? c.topic1.toLowerCase() : undefined,
                            topic2: c.topic2 ? c.topic2.toLowerCase() : undefined,
                            topic3: c.topic3 ? c.topic3.toLowerCase() : undefined,
                            topic4: c.topic4 ? c.topic4.toLowerCase() : undefined
                        }
                    })
            } else {
                R.test(set as Connex.Thor.Filter.Criteria<'transfer'>[], [transferCriteriaScheme], 'arg0')
                filterBody.criteriaSet = (set as Connex.Thor.Filter.Criteria<'transfer'>[])
                    .map(c => {
                        return {
                            txOrigin: c.txOrigin ? c.txOrigin.toLowerCase() : undefined,
                            sender: c.sender ? c.sender.toLowerCase() : undefined,
                            recipient: c.recipient ? c.recipient.toLowerCase() : undefined
                        }
                    })

            }
            return this
        },
        range(range) {
            R.test(range, {
                unit: v => (v === 'block' || v === 'time') ? '' : `expected 'block' or 'time'`,
                from: R.uint64,
                to: R.uint64
            }, 'arg0')
            R.ensure(range.from <= range.to, 'arg0.from: expected <= arg0.to')

            filterBody.range = { ...range }
            return this
        },
        order(order) {
            R.ensure(order === 'asc' || order === 'desc',
                `arg0: expected 'asc' or 'desc'`)
            filterBody.order = order
            return this
        },
        apply(offset, limit) {
            R.test(offset, R.uint64, 'arg0')
            R.ensure(limit >= 0 && limit <= MAX_LIMIT && Number.isInteger(limit),
                `arg1: expected unsigned integer <= ${MAX_LIMIT}`)

            filterBody.options.offset = offset
            filterBody.options.limit = limit

            if (kind === 'transfer') {
                return driver.filterTransferLogs(filterBody as any) as Promise<any>
            } else {
                return driver.filterEventLogs(filterBody as any) as Promise<any>
            }
        }
    }
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
