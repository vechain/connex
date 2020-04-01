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
        getTransaction(id: string): Promise<Thor.Transaction | null>
        getReceipt(id: string): Promise<Thor.Receipt | null>

        getAccount(addr: string, revision: string): Promise<Thor.Account>
        getCode(addr: string, revision: string): Promise<Thor.Code>
        getStorage(addr: string, key: string, revision: string): Promise<Thor.Storage>

        explain(arg: Driver.ExplainArg, revision: string, cacheTies?: string[]): Promise<Thor.VMOutput[]>

        filterEventLogs(arg: Driver.FilterEventLogsArg): Promise<Thor.Event[]>
        filterTransferLogs(arg: Driver.FilterTransferLogsArg): Promise<Thor.Transfer[]>

        // vendor methods
        signTx(msg: Driver.SignTxArg, options: Driver.SignTxOption): Promise<Driver.SignTxResult>
        signCert(msg: Driver.SignCertArg, option: Driver.SignCertOption): Promise<Driver.SignCertResult>
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

        type SignTxArg = Array<{
            to: string | null
            value: string
            data: string
            comment?: string
            abi?: object
        }>
        type SignTxOption = {
            signer?: string
            gas?: number
            dependsOn?: string
            link?: string
            comment?: string
            delegationHandler?: Vendor.DelegationHandler
        }
        type SignTxResult = Vendor.TxResponse

        type SignCertArg = Vendor.CertMessage
        type SignCertOption = {
            signer?: string
            link?: string
        }
        type SignCertResult = Vendor.CertResponse
    }
}
