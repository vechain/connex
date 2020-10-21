import { urls } from './config'

function registerEvent(target: Window, event: string, cb: () => void) {
    target.addEventListener(event, cb)
    return {
        remove: () => {
            target.removeEventListener(event, cb)
        }
    }
}

function createOrGetHiddenIframe() {
    const id = 'hiddenIframe'
    const exist = document.getElementById(id)
    if (exist) {
        return exist as HTMLIFrameElement
    }
    const iframe = document.createElement("iframe")
    iframe.src = 'about:blank'
    iframe.id = id
    iframe.style.display = "none"
    document.body.appendChild(iframe)
    return iframe
}

function openUriWithHiddenFrame(uri: string, timeout: number) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject()
            handler.remove()
        }, timeout)

        const handler = registerEvent(window, "blur", () => {
            clearTimeout(timer)
            handler.remove()
            resolve()
        })

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        createOrGetHiddenIframe().contentWindow!.location.href = uri;
    })
}

function openUriWithTimeoutHack(uri: string, timeout: number) {
    return new Promise((resolve, reject) => {
        //handle page running in an iframe (blur must be registered with top level window)
        let target: Window = window
        while (target != target.parent) {
            target = target.parent;
        }

        const timer = setTimeout(() => {
            reject()
            handler.remove()
        }, timeout)

        const handler = registerEvent(target, "blur", () => {
            clearTimeout(timer)
            handler.remove()
            resolve()
        })
        window.location.href = uri
    })
}

function openUriUsingFirefox(uri: string) {
    return new Promise((resolve, reject) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            createOrGetHiddenIframe().contentWindow!.location.href = uri
            resolve()
        } catch (e) {
            // if (e.name == "NS_ERROR_UNKNOWN_PROTOCOL") {
            reject()
            // }
        }
    })
}

function openUriWithMsLaunchUri(uri: string) {
    return new Promise((resolve, reject) => {
        navigator.msLaunchUri(uri,
            resolve,
            reject
        )
    })
}

function checkBrowser() {
    const isOpera = !!(window as any).opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    const ua = navigator.userAgent.toLowerCase();
    return {
        isOpera: isOpera,
        isFirefox: typeof (window as any).InstallTrigger !== 'undefined',
        isSafari: (~ua.indexOf('safari') && !~ua.indexOf('chrome')) || Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
        isChrome: !!(window as any).chrome && !isOpera,
        isIE: /*@cc_on!@*/false || !!(document as any).documentMode // At least IE6
    }
}

function openUri(requestId: string, timeout: number) {
    const uri = `connex:sign?rid=${encodeURIComponent(requestId)}`
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!navigator.msLaunchUri) { //for IE and Edge in Win 8 and Win 10
        return openUriWithMsLaunchUri(uri)
    } else {
        const browser = checkBrowser()
        if (browser.isFirefox) {
            return openUriUsingFirefox(uri)
        } else if (browser.isChrome || browser.isIOS) {
            return openUriWithTimeoutHack(uri, timeout)
        } else if (browser.isSafari) {
            return openUriWithHiddenFrame(uri, timeout)
        } else {
            return Promise.reject()
            //not supported, implement please
        }
    }
}

export async function open(requestId: string, spaWallet?: string): Promise<void> {
    try {
        await openUri(requestId, 1000)
        return
    } catch {
        /** */
    }
    try {
        const spaWindowTarget = 'sync/sign'
        const spaWindowFeatures = 'width=360,height=640,resizable,scrollbars=yes,dependent,modal'
        window.open(`${spaWallet || urls.spaWallet}sign?rid=${encodeURIComponent(requestId)}`, spaWindowTarget, spaWindowFeatures, true)
        return
    } catch {
        /** */
    }
    throw new Error('unsupported')
}
