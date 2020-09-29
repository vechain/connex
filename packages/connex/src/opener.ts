import { urls } from './config'

function openExternal(requestId: string) {
    const check = require('custom-protocol-check')
    const url = `connex:sign?rid=${encodeURIComponent(requestId)}`
    return new Promise((resolve, reject) => {
        check(
            url,
            () => reject(new Error('protocol not found')),
            () => resolve(),
            // timeout, default 2000
        )
    })
}


export async function open(requestId: string) {
    // try {
    //     await openExternal(requestId)
    //     return
    // } catch {
    // }
    try {
        const spaWindowTarget = 'sync/sign'
        const spaWindowFeatures = 'width=360,height=640,resizable,scrollbars=yes,dependent,modal'
        window.open(`${urls.spaWallet}#/sign?rid=${encodeURIComponent(requestId)}`, spaWindowTarget, spaWindowFeatures, true)
    } catch {
    }
    throw new Error('unsupported')
}
