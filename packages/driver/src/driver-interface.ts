/** Connex driver interface */
import Thor = Connex.Thor
import Vendor = Connex.Vendor

export interface DriverInterface {
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

    explain(arg: DriverInterface.ExplainArg, revision: string, cacheHints?: string[]): Promise<Thor.VMOutput[]>

    filterEventLogs(arg: DriverInterface.FilterEventLogsArg): Promise<Thor.Event[]>
    filterTransferLogs(arg: DriverInterface.FilterTransferLogsArg): Promise<Thor.Transfer[]>

    // vendor methods
    signTx(msg: DriverInterface.SignTxMessage, options: DriverInterface.SignTxOptions): Promise<DriverInterface.SignTxResult>
    signCert(msg: DriverInterface.SignCertMessage, option: DriverInterface.SignCertOptions): Promise<DriverInterface.SignCertResult>
    isAddressOwned(addr: string): Promise<boolean>
}

export namespace DriverInterface {
    export type ExplainArg = {
        clauses: Array<{
            to: string | null
            value: string
            data: string
        }>,
        caller?: string
        gas?: number
        gasPrice?: string
    }

    export type FilterEventLogsArg = {
        range: Thor.Filter.Range
        options: {
            offset: number
            limit: number
        }
        criteriaSet: Thor.Event.Criteria[]
        order: 'asc' | 'desc'
    }

    export type FilterTransferLogsArg = {
        range: Thor.Filter.Range
        options: {
            offset: number
            limit: number
        }
        criteriaSet: Thor.Transfer.Criteria[]
        order: 'asc' | 'desc'
    }

    export type SignTxMessage = Array<{
        to: string | null
        value: string
        data: string
        comment?: string
        abi?: object
    }>
    export type SignTxOptions = {
        signer?: string
        gas?: number
        dependsOn?: string
        link?: string
        comment?: string
        delegator?: Vendor.Delegator
        onPrepared?: () => void
    }
    export type SignTxResult = Vendor.TxResponse

    export type SignCertMessage = Vendor.CertMessage
    export type SignCertOptions = {
        signer?: string
        link?: string
        onPrepared?: () => void
    }
    export type SignCertResult = Vendor.CertResponse
}
