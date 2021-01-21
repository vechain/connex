import { openUri } from './open-uri'
import { browser } from './browser'

const LITE_WALLET_URL = 'https://lite.sync.vecha.in/'

function connectApp(src: string): Promise<unknown> | null {
    const uri = `connex:sign?src=${encodeURIComponent(src)}`
    return openUri(uri, 1000)
}

function connectLite(src: string): Window | null {
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
        new URL(`#/sign?src=${encodeURIComponent(src)}`, LITE_WALLET_URL).href,
        options.target,
        options.features,
        true)
}

/**
 * open wallet app or lite wallet in browser window.
 * @param src the url where to fetch the request object
 */
export async function connect(src: string): Promise<Window | null> {
    try {
        const r = connectApp(src)
        if (r) {
            await r
            return null
        }
    } catch { /** */ }

    return connectLite(src)
}
