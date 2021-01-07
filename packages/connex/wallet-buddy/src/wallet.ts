import { openUri } from './open-uri'
import { browser } from './browser'
/**
 * connect to native wallet app
 * @param src the url where to fetch the request object
 */
export function connectApp(src: string): Promise<unknown> | null {
    const uri = `connex:sign?src=${encodeURIComponent(src)}`
    return openUri(uri, 1000)
}

/**
 * connect to SPA wallet
 * @param src the url where to fetch the request object
 * @param walletUrl the url of SPA wallet
 */
export function connectSPA(src: string, walletUrl: string): Window | null {
    const options = (() => {
        switch (browser && browser.os) {
            case 'iOS':
            case 'android':
                return {}
            default:
                return {
                    target: `sync|${window.location.host}`,
                    features: 'width=360,height=640,resizable,scrollbars=yes,dependent,modal'
                }
        }
    })()
    return window.open(
        `${walletUrl}sign?src=${encodeURIComponent(src)}`,
        options.target,
        options.features,
        true)
}
