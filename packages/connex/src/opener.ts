import { urls } from './config'

function openExternal(requestId: string) {
    const check = require('custom-protocol-detection')
    const url = `connex:sign?rid=${encodeURIComponent(requestId)}`
    return new Promise((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        check(
            url,
            () => reject(new Error('protocol not found')),
            () => resolve(),
            () => reject(new Error('protocol not found')),
        )
    })
}

export async function open(requestId: string): Promise<void> {
    try {
        await openExternal(requestId)
        return
    } catch {
        /** */
    }
    try {
        const spaWindowTarget = 'sync/sign'
        const spaWindowFeatures = 'width=360,height=640,resizable,scrollbars=yes,dependent,modal'
        window.open(`${urls.spaWallet}sign?rid=${encodeURIComponent(requestId)}`, spaWindowTarget, spaWindowFeatures, true)
        return
    } catch {
        /** */
    }
    throw new Error('unsupported')
}
