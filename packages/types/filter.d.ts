declare namespace Connex.Thor {
    /** the filter interface, to filter event/transfer logs */
    interface Filter<T extends 'event' | 'transfer', E = {}> {
        /** set range */
        range(range: Filter.Range): this

        /** set sort order */
        order(order: 'asc' | 'desc'): this

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
            meta: Thor.Transaction.Receipt['meta'] & { clauseIndex: number }
        }

        type Row<T extends 'event' | 'transfer', E = {}> = (
            T extends 'event' ? VM.Event :
            T extends 'transfer' ? VM.Transfer : never
        ) & WithMeta & E
    }
}
