
/** Connex driver interface */
declare namespace Connex {
    interface Driver extends Connex.Signer{
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
        getReceipt(id: string): Promise<Thor.Transaction.Receipt | null>

        getAccount(addr: string, revision: string): Promise<Thor.Account>
        getCode(addr: string, revision: string): Promise<Thor.Account.Code>
        getStorage(addr: string, key: string, revision: string): Promise<Thor.Account.Storage>

        explain(arg: Driver.ExplainArg, revision: string, cacheHints?: string[]): Promise<VM.Output[]>

        filterEventLogs(arg: Driver.FilterEventLogsArg, cacheHints?: string[]): Promise<Thor.Filter.Row<'event'>[]>
        filterTransferLogs(arg: Driver.FilterTransferLogsArg, cacheHints?: string[]): Promise<Thor.Filter.Row<'transfer'>[]>

        getFeesHistory(newestBlock: string | number, blockCount: number, rewardPercentiles?: number[]): Promise<Thor.Fees.History>
        getPriorityFeeSuggestion(): Promise<string>
    }

    namespace Driver {
        type ExplainArg = {
            clauses: Thor.Transaction['clauses'],
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
            criteriaSet: Thor.Filter.Criteria<'event'>[]
            order: 'asc' | 'desc'
        }

        type FilterTransferLogsArg = {
            range: Thor.Filter.Range
            options: {
                offset: number
                limit: number
            }
            criteriaSet: Thor.Filter.Criteria<'transfer'>[]
            order: 'asc' | 'desc'
        }
    }
}
