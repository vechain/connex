// ref: https://github.com/ismailhabib/custom-protocol-detection

function watchEvent(target: Window, event: string, timeout: number) {
    return new Promise<Event>((resolve, reject) => {
        // eslint-disable-next-line prefer-const
        let cb: (ev: Event) => void
        const timer = setTimeout(() => {
            target.removeEventListener(event, cb)
            reject()
        }, timeout)
        cb = ev => {
            target.removeEventListener(event, cb)
            clearTimeout(timer)
            resolve(ev)
        }
        target.addEventListener(event, cb)
    })
}

function getHiddenIframe() {
    const id = 'connex-hiddenIframe'
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

function openWithHiddenFrame(uri: string, timeout: number) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    getHiddenIframe().contentWindow!.location.href = uri;
    return watchEvent(window, 'blur', timeout)
}

function openWithTimeoutHack(uri: string, timeout: number) {
    window.location.href = uri
    return watchEvent(window, 'blur', timeout)
}

function openInFirefox(uri: string) {
    return new Promise((resolve, reject) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            getHiddenIframe().contentWindow!.location.href = uri
            resolve()
        } catch (e) {
            // if (e.name == "NS_ERROR_UNKNOWN_PROTOCOL") {
            reject()
            // }
        }
    })
}

function openWithMsLaunchUri(uri: string) {
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

/**
 * open custom protocol uri with installed native app 
 * @param uri the custom protocol uri
 * @param timeout 
 */
export function openUri(uri: string, timeout: number): Promise<unknown> {
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!navigator.msLaunchUri) { //for IE and Edge in Win 8 and Win 10
        return openWithMsLaunchUri(uri)
    } else {
        const browser = checkBrowser()
        if (browser.isFirefox) {
            return openInFirefox(uri)
        } else if (browser.isChrome || browser.isIOS) {
            return openWithTimeoutHack(uri, timeout)
        } else if (browser.isSafari) {
            return openWithHiddenFrame(uri, timeout)
        } else {
            return Promise.reject()
            //not supported, implement please
        }
    }
}