declare namespace Connex.VM {
    /** the Explainer interface, to simulate tx execution */
    interface Explainer {
        /** set caller address (msg.sender) */
        caller(addr: string): this

        /** set max allowed gas */
        gas(gas: number): this

        /** set gas price as the VM context */
        gasPrice(gp: string | number): this

        /** set gas payer */
        gasPayer(addr: string): this

        /**
         * turn on result cache
         * @param hints a set of addresses, as the condition of cache invalidation
         */
        cache(hints: string[]): this

        /** execute clauses (dry-run, without altering blockchain) */
        execute(): Promise<Output[]>
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