/** Connex driver interface */
declare namespace Connex {
    interface Driver {
        readonly genesis: Thor.Block
        /** current known head */
        readonly head: Thor.Status['head']

        /**
         * poll new head
         * rejected only when driver closed
         */
        pollHead(): Promise<Thor.Status['head']>

        getBlock(revision: string | number): Promise<Thor.Block | null>
        getTransaction(id: string, allowPending: boolean): Promise<Thor.Transaction | null>
        getReceipt(id: string): Promise<Thor.Receipt | null>

        getAccount(addr: string, revision: string): Promise<Thor.Account>
        getCode(addr: string, revision: string): Promise<Thor.Code>
        getStorage(addr: string, key: string, revision: string): Promise<Thor.Storage>

        explain(arg: Driver.ExplainArg, revision: string, cacheHints?: string[]): Promise<Thor.VMOutput[]>

        filterEventLogs(arg: Driver.FilterEventLogsArg): Promise<Thor.Event[]>
        filterTransferLogs(arg: Driver.FilterTransferLogsArg): Promise<Thor.Transfer[]>

        // vendor methods
        signTx(msg: Vendor.TxMessage, options: Driver.TxOptions): Promise<Vendor.TxResponse>
        signCert(msg: Vendor.CertMessage, option: Driver.CertOptions): Promise<Vendor.CertResponse>
        isAddressOwned(addr: string): Promise<boolean>
    }

    namespace Driver {
        type ExplainArg = {
            clauses: Array<{
                to: string | null
                value: string
                data: string
            }>,
            caller?: string
            gas?: number
            gasPrice?: string
        }

        type FilterEventLogsArg = {
            range: Thor.Filter.Range
            options: {
                offset: number
                limit: number
            }
            criteriaSet: Thor.Event.Criteria[]
            order: 'asc' | 'desc'
        }

        type FilterTransferLogsArg = {
            range: Thor.Filter.Range
            options: {
                offset: number
                limit: number
            }
            criteriaSet: Thor.Transfer.Criteria[]
            order: 'asc' | 'desc'
        }

        type TxOptions = {
            signer?: string
            gas?: number
            dependsOn?: string
            link?: string
            comment?: string
            delegator?: string
            onPrepared?: () => void
        }

        type CertOptions = {
            signer?: string
            link?: string
            onPrepared?: () => void
        }
    }
}
