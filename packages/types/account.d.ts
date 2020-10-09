
declare namespace Connex.Thor {
    type Account = {
        /**
         * account balance in hex string
         */
        balance: string
        /**
         * account energy in hex string
         */
        energy: string
        /**
         * true indicates contract account
         */
        hasCode: boolean
    }

    namespace Account {
        type Storage = { value: string }
        type Code = { code: string }

        interface Visitor {
            /**
             * the address of account to be visited
             */
            readonly address: string

            /**
             * query the account
             * 
             * @returns promise of account
             */
            get(): Promise<Account>

            /**
             * query account code
             * 
             * @returns promise of account code
             */
            getCode(): Promise<Code>

            /**
             * query account storage
             * 
             * @param key storage key
             * @returns promise of account storage
             */
            getStorage(key: string): Promise<Storage>

            /**
             * Create a method object, to perform contract call, or build transaction clause.
             * 
             * @param abi method's JSON ABI object
             * @returns method object
             */
            method(abi: object): Method

            /**
             * Create an event visitor
             * @param abi event's JSON ABI object
             * @returns event visitor
             */
            event(abi: object): Event
        }

        interface Method {
            /**
             * set value
             * @param val amount of VET to transfer
             */
            value(val: string | number): this

            /**
             * set caller(msg.sender) 
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
             * Pack arguments into {@link Clause}.
             * @param args method arguments
             */
            asClause(...args: any[]): VM.Clause

            /**
             * Call the method to obtain output without altering contract state.
             * @param args method arguments
             */
            call(...args: any[]): Promise<VM.Output & WithDecoded>
        }

        interface Event {
            asCriteria(indexed: object): Thor.Filter.Criteria<'event'>
            filter(indexedSet: object[]): Thor.Filter<'event', WithDecoded>
        }

        type WithDecoded = {
            decoded: Record<string | number, any>
        }
    }
}
