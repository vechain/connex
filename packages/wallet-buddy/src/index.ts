import '@vechain/connex-framework/dist/driver-interface'
import Deferred from './deferred'
import * as Helper from './helper'

const DEFAULT_TOS_URL = 'https://tos.vecha.in:5678/'
const ACCEPTED_SUFFIX = '.accepted'
const RESP_SUFFIX = '.resp'

/** sign request relayed by tos */
type RelayedRequest = {
    type: 'tx' | 'cert'
    gid: string
    payload: {
        message: object
        options: object
    }
    nonce: string
}

/** sign response relayed by tos */
type RelayedResponse = {
    error?: string
    payload?: object
}

function sleep(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}


async function submitRequest(rid: string, json: string, tosUrl: string, abort: Promise<never>) {
    const src = new URL(rid, tosUrl).href
    for (let i = 0; i < 3; i++) {
        try {
            return await Promise.race([
                abort,
                fetch(src, {
                    method: 'POST',
                    body: json,
                    headers: new Headers({
                        'Content-Type': 'application/json'
                    })
                })])
        } catch {
            await Promise.race([
                abort,
                sleep(2000)
            ])
        }
    }
    throw new Error('failed to submit request')
}

async function pollResponse(rid: string, suffix: string, timeout: number, tosUrl: string, abort: Promise<never>) {
    let errCount = 0
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
        try {
            const resp = await Promise.race([
                abort,
                fetch(new URL(`${rid}${suffix}?wait=1`, tosUrl).href)
            ])
            const text = await Promise.race([
                abort,
                resp.text()
            ])
            if (text) {
                return text
            }
        } catch (err) {
            if (++errCount > 2) {
                throw new Error('failed fetch response')
            }
            await Promise.race([
                abort,
                sleep(3000)
            ])
        }
    }
    throw new Error('timeout')
}

async function sign<T extends 'tx' | 'cert'>(
    type: T,
    msg: T extends 'tx' ? Connex.Vendor.TxMessage : Connex.Vendor.CertMessage,
    options: T extends 'tx' ? Connex.Driver.TxOptions : Connex.Driver.CertOptions,
    genesisId: string,
    nonce: () => string,
    blake2b256: (val: string) => string,
    tosUrl: string
): Promise<T extends 'tx' ? Connex.Vendor.TxResponse : Connex.Vendor.CertResponse> {
    const onAccepted = options.onAccepted
    const req: RelayedRequest = {
        type,
        gid: genesisId,
        payload: {
            message: msg,
            options: { ...options, onAccepted: undefined }
        },
        nonce: nonce()
    }
    const json = JSON.stringify(req)
    const rid = blake2b256(json)

    const src = new URL(rid, tosUrl).href
    const abort = new Deferred<never>()
    let shownHelper: undefined | ReturnType<typeof Helper.show>
    let accepted = false
    try {
        window.location.href = `connex:sign?src=${encodeURIComponent(src)}`
    } catch { }

    try {
        // submit request and poll response
        await submitRequest(rid, json, tosUrl, abort)

        void (async () => {
            await sleep(2000)
            if (!accepted) {
                shownHelper = Helper.show(src)
            }
        })()

        void (async () => {
            try {
                await pollResponse(rid, ACCEPTED_SUFFIX, 60 * 1000, tosUrl, abort)
                accepted = true
                shownHelper && shownHelper.hide()
                onAccepted && onAccepted()
            } catch (err) {
                console.warn(err)
            }
        })()


        const respJson = await pollResponse(rid, RESP_SUFFIX, 10 * 60 * 1000, tosUrl, abort)
        const resp: RelayedResponse = JSON.parse(respJson)
        if (resp.error) {
            throw new Error(resp.error)
        }
        return resp.payload as any
    } finally {
        shownHelper && shownHelper.hide()
        abort.reject('aborted')
    }
}

/**
 * create an instance of wallet buddy to help send signing requests to wallet app
 * @param genesisId the genesis id of requests binding to
 * @param nonce random bytes generator
 * @param blake2b256 blake2b256 hash function
 * @param tosUrl the optional customized tos url
 */
export function create(
    genesisId: string,
    nonce: () => string,
    blake2b256: (val: string) => string,
    tosUrl?: string
): Pick<Connex.Driver, 'signTx' | 'signCert'> {
    return {
        signTx(msg: Connex.Vendor.TxMessage, options: Connex.Driver.TxOptions): Promise<Connex.Vendor.TxResponse> {
            return sign('tx', msg, options, genesisId, nonce, blake2b256, tosUrl || DEFAULT_TOS_URL)
        },
        signCert(msg: Connex.Vendor.CertMessage, options: Connex.Driver.CertOptions): Promise<Connex.Vendor.CertResponse> {
            return sign('cert', msg, options, genesisId, nonce, blake2b256, tosUrl || DEFAULT_TOS_URL)
        }
    }
}
