import { openUri } from './open-uri'

/**
 * connect to native wallet app
 * @param rid the request id
 */
export function connectApp(rid: string): Promise<unknown> {
    const uri = `connex:sign?rid=${encodeURIComponent(rid)}`
    return openUri(uri, 1000)
}

/**
 * connect to SPA wallet
 * @param rid the request id
 * @param walletUrl the url of SPA wallet
 */
export function connectSPA(rid: string, walletUrl: string): Promise<unknown> {
    const target = 'sync/sign'
    const features = 'width=360,height=640,resizable,scrollbars=yes,dependent,modal'
    window.open(`${walletUrl}sign?rid=${encodeURIComponent(rid)}`, target, features, true)
    return Promise.resolve()
}
