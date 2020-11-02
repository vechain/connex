import { detect } from 'detect-browser'

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

let hiddenIframe = null as HTMLIFrameElement | null
function getHiddenIframe() {
    if (!hiddenIframe) {
        const iframe = parent.document.createElement("iframe")
        iframe.style.display = "none"
        parent.document.body.appendChild(iframe)
        hiddenIframe = iframe
    }
    return hiddenIframe
}

function openWithHiddenFrame(uri: string, timeout: number) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    getHiddenIframe().contentWindow!.location.href = uri;
    return watchEvent(parent, 'blur', timeout)
}

function openWithTimeoutHack(uri: string, timeout: number) {
    parent.location.href = uri
    return watchEvent(parent, 'blur', timeout)
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

/**
 * open custom protocol uri with installed native app 
 * @param uri the custom protocol uri
 * @param timeout 
 */
export function openUri(uri: string, timeout: number): Promise<unknown> {
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!navigator.msLaunchUri) { //for IE and Edge in Win 8 and Win 10
        return openWithMsLaunchUri(uri)
    }

    const browser = detect()
    if (!browser) {
        return Promise.reject()
    }

    // iOS is not supported
    if (browser.os === 'iOS') {
        return Promise.reject()
    }

    switch (browser.name) {
        case 'firefox':
            return openInFirefox(uri)
        case 'chrome':
        case 'edge-chromium':
            return openWithTimeoutHack(uri, timeout)
        case 'safari':
            return openWithHiddenFrame(uri, timeout)
        default:
            return Promise.reject()
    }
}