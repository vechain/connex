import { openUri } from './open-uri'
import { browser } from './browser'
/**
 * connect to native wallet app
 * @param rid the request id
 */
export function connectApp(rid: string): Promise<unknown> | null {
    const uri = `connex:sign?rid=${encodeURIComponent(rid)}`
    return openUri(uri, 1000)
}

/**
 * connect to SPA wallet
 * @param rid the request id
 * @param walletUrl the url of SPA wallet
 */
export function connectSPA(rid: string, walletUrl: string): void {
    const target = 'sync/sign'
    const features = (() => {
        switch (browser && browser.os) {
            case 'iOS':
            case 'android':
                return undefined
            default:
                return 'width=360,height=640,resizable,scrollbars=yes,dependent,modal'
        }
    })()
    window.open(`${walletUrl}sign?rid=${encodeURIComponent(rid)}`, target, features, true)
}
