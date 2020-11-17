import { openUri } from './open-uri'
import { browser } from './browser'
/**
 * connect to native wallet app
 * @param rUrl the url where to fetch the request object
 */
export function connectApp(rUrl: string): Promise<unknown> | null {
    const uri = `connex:sign?rurl=${encodeURIComponent(rUrl)}`
    return openUri(uri, 1000)
}

/**
 * connect to SPA wallet
 * @param rUrl the url where to fetch the request object
 * @param walletUrl the url of SPA wallet
 */
export function connectSPA(rUrl: string, walletUrl: string): Window | null {
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
        `${walletUrl}sign?rurl=${encodeURIComponent(rUrl)}`,
        options.target,
        options.features,
        true)
}
