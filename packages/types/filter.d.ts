
declare namespace Connex.Thor {

    interface Filter<T extends 'event' | 'transfer', E = {}> {
        /**
         * set criteria
         * @param set 
         */
        criteria(set: Filter.Criteria<T>[]): this

        /**
         * Set the range to filter in
         * @param range 
         */
        range(range: Filter.Range): this

        /**
         * Set sort order
         * @param order
         */
        order(order: 'asc' | 'desc'): this

        /**
         * Apply the filter
         * @param offset 
         * @param limit 
         * @returns filtered recordss
         */
        apply(offset: number, limit: number): Promise<Array<Filter.Row<T> & E>>
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

        type Row<T extends 'event' | 'transfer'> =
            T extends 'event' ? VM.Event & WithMeta :
            T extends 'transfer' ? VM.Transfer & WithMeta : never
    }
}
