import html from '../helper.html'
import { browser } from './browser'

const LITE_WALLET_URL = 'https://lite.sync.vecha.in/'

function openLiteWallet(src: string): Window | null {
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
        options.features)
}

export function show(src: string) {
    const iframe = document.createElement('iframe')

    iframe.style.border = 'none'
    iframe.style.position = 'fixed'
    iframe.style.zIndex = '999'
    iframe.style.width = '100vw'
    iframe.style.height = '110px'
    iframe.style.left = iframe.style.bottom = '0px'
    iframe.src = URL.createObjectURL(new Blob([html], { type: 'text/html' }))

    document.body.appendChild(iframe)
    let hide = () => {
        document.body.removeChild(iframe)
        hide = () => { }
    }

    window.addEventListener('message', ev => {
        if (ev.data && ev.data.src === 'connex-helper' && ev.data.action) {
            switch (ev.data.action) {
                case 'close':
                    hide()
                    return
                case 'lite':
                    openLiteWallet(src)
                    return
            }
        }
    })
    return {
        hide() { hide() }
    }
}

