export function newTxVisitor(
    driver: Connex.Driver,
    id: string
): Connex.Thor.Transaction.Visitor {
    let allowPending = false
    return {
        get id() {
            return id
        },
        allowPending() {
            allowPending = true
            return this
        },
        get: () => driver.getTransaction(id, allowPending),
        getReceipt: () => driver.getReceipt(id)
    }
}
