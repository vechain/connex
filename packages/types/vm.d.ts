
declare namespace Connex.VM {
    interface Explainer {
        /**
         * set caller
         * @param addr caller address 
         */
        caller(addr: string): this

        /**
         * set max allowed gas
         * @param gas 
         */
        gas(gas: number): this

        /**
         * set gas price
         * @param gp gas price in number or hex/dec string
         */
        gasPrice(gp: string | number): this

        /**
         * Turn on result cache.
         * TODO: More detailed description
         * @param hints a set of addresses, as the condition of cache invalidation
         */
        cache(hints: string[]): this

        /**
         * execute clauses
         * @param clauses 
         */
        execute(clauses: Clause[]): Promise<Output[]>
    }


    type Clause = {
        to: string | null
        value: string | number
        data?: string
    }

    type Output = {
        data: string
        vmError: string
        gasUsed: number
        reverted: boolean
        revertReason?: string
        events: Event[]
        transfers: Transfer[]
    }

    type Event = {
        address: string
        topics: string[]
        data: string
    }

    type Transfer = {
        sender: string
        recipient: string
        amount: string
    }
}
