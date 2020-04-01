import { abi } from 'thor-devkit/dist/abi'
import { newFilter } from './filter'
import { BadParameter, test } from './rules'

export function newEventVisitor(
    ctx: Context,
    addr: string,
    coder: abi.Event
): Connex.Thor.EventVisitor {

    const encode = (indexed: object) => {
        const topics = coder.encode(indexed)
        return {
            address: addr,
            topic0: topics[0] || undefined,
            topic1: topics[1] || undefined,
            topic2: topics[2] || undefined,
            topic3: topics[3] || undefined,
            topic4: topics[4] || undefined
        }
    }

    return {
        asCriteria: indexed => {
            try {
                return encode(indexed)
            } catch (err) {
                throw new BadParameter(`arg0: can not be encoded (${err.message})`)
            }
        },
        filter: (indexed) => {
            test(indexed, [{}], 'arg0')

            if (indexed.length === 0) {
                indexed = [{}]
            }

            const criteriaSet = indexed.map((o, i) => {
                try {
                    return encode(o)
                } catch (err) {
                    throw new BadParameter(`arg0.#${i}: can not be encoded (${err.message})`)
                }
            })
            const filter = newFilter(ctx, 'event').criteria(criteriaSet)
            return {
                criteria(set) {
                    filter.criteria(set)
                    return this
                },
                range(range: Connex.Thor.Filter.Range) {
                    filter.range(range)
                    return this
                },
                order(order) {
                    filter.order(order)
                    return this
                },
                apply(offset: number, limit: number) {
                    return filter.apply(offset, limit)
                        .then(events => events.map(event => {
                            const decoded = coder.decode(event.data, event.topics)
                            return { ...event, decoded }
                        }))
                }
            }
        }
    }
}
