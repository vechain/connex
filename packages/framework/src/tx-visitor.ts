export function newTxVisitor(
    ctx: Context,
    id: string
): Connex.Thor.TransactionVisitor {
    let allowPending = false
    return {
        get id() {
            return id
        },
        allowPending() {
            allowPending = true
            return this
        },
        get: () => ctx.driver.getTransaction(id, allowPending),
        getReceipt: () => ctx.driver.getReceipt(id)
    }
}
