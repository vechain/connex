declare namespace Connex.Thor {
    /** the filter interface, to filter event/transfer logs */
    interface Filter<T extends 'event' | 'transfer', E = {}> {
        /** set range */
        range(range: Filter.Range): this

        /** set sort order */
        order(order: 'asc' | 'desc'): this

        /**
         * turn on result cache
         * @param hints a set of addresses, as the condition of cache invalidation
         */
        cache(hints: string[]): this

        /** do query */
        apply(offset: number, limit: number): Promise<Filter.Row<T, E>[]>
    }

    namespace Filter {
        type Criteria<T extends 'event' | 'transfer'> =
            T extends 'event' ? {
                address?: string
                topic0?: string
                topic1?: string
                topic2?: string
                topic3?: string
                topic4?: string
            } :
            T extends 'transfer' ? {
                txOrigin?: string
                sender?: string
                recipient?: string
            } : never

        type Range = {
            unit: 'block' | 'time'
            from: number
            to: number
        }

        type WithMeta = {
            meta: {
                blockID: string
                blockNumber: number
                blockTimestamp: number
                txID: string
                txOrigin: string
                clauseIndex: number
            }
        }

        type Row<T extends 'event' | 'transfer', E = {}> = (
            T extends 'event' ? VM.Event :
            T extends 'transfer' ? VM.Transfer : never
        ) & WithMeta & E
    }
}
