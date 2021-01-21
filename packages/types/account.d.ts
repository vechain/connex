declare namespace Connex.Thor {
    /** the account model */
    type Account = {
        /** balance (VET) in hex string */
        balance: string
        /** energy (VTHO) in hex string */
        energy: string
        /** whether the account has code */
        hasCode: boolean
    }

    namespace Account {
        /** storage entry */
        type Storage = {
            value: string
        }

        /** code entry */
        type Code = {
            code: string
        }

        /** the account visitor interface */
        interface Visitor {
            /** the account address to be visited */
            readonly address: string

            /** query the account */
            get(): Promise<Account>

            /** query the account code */
            getCode(): Promise<Code>

            /**
             * query the account storage
             * @param key storage key
             * @returns the storage entry
             */
            getStorage(key: string): Promise<Storage>

            /**
             * Create a method object, to perform contract call, or build vm clause
             * @param abi method's JSON ABI object
             * @returns method object
             */
            method(abi: object): Method

            /**
             * Create an object to visit events associated to this account 
             * @param abi event's JSON ABI object
             * @returns event visitor
             */
            event(abi: object): Event
        }

        /** the account method interface */
        interface Method {
            /** set VET amount to transfer in unit WEI, presented by hex/dec string or number type */
            value(val: string | number): this

            /** set method caller (msg.sender) */
            caller(addr: string): this

            /** set max allowed gas */
            gas(gas: number): this

            /** set gas price, presented by hex/dec string or number type */
            gasPrice(gp: string | number): this

            /** set gas payer */
            gasPayer(addr: string): this

            /**
             * turn on call result cache
             * @param hints a set of addresses, as the condition of cache invalidation
             */
            cache(hints: string[]): this

            /** encode arguments into clause */
            asClause(...args: any[]): Transaction['clauses'][0]

            /** call the method (dry-run, without altering blockchain) */
            call(...args: any[]): Promise<VM.Output & WithDecoded>

            /** initiate a signing service to commit this method as a transaction */
            transact(...args: any[]): Vendor.TxSigningService
        }

        /** the interface to visit account associated events */
        interface Event {
            /** encode indexed event args into Criteria */
            asCriteria(indexed: object): Thor.Filter.Criteria<'event'>

            /** create a filter with a set of Criteria encoded by a set of indexed event args */
            filter(indexedSet: object[]): Thor.Filter<'event', WithDecoded>
        }

        type WithDecoded = {
            decoded: Record<string | number, any>
        }
    }
}
