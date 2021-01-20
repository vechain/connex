import '@vechain/connex-framework/dist/driver-interface'
import * as W from './wallet'

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

type Signal = {
    done: boolean
}

async function submitRequest(rid: string, json: string, signal: Signal, tosUrl: string) {
    const src = new URL(rid, tosUrl).href
    for (let i = 0; i < 3 && !signal.done; i++) {
        try {
            return await fetch(src, {
                method: 'POST',
                body: json,
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            })
        } catch {
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    }
    throw new Error('failed to submit request')
}

async function pollResponse(rid: string, suffix: string, timeout: number, signal: Signal, tosUrl: string) {
    let errCount = 0
    const deadline = Date.now() + timeout
    while (Date.now() < deadline && !signal.done) {
        try {
            const resp = await fetch(new URL(`${rid}${suffix}?wait=1`, tosUrl).href)
            const text = await resp.text()
            if (text) {
                return text
            }
        } catch (err) {
            if (++errCount > 2) {
                throw new Error('failed fetch response')
            }
            await new Promise(resolve => setTimeout(resolve, 3000))
        }
    }
    throw new Error('timeout')
}

function sign<T extends 'tx' | 'cert'>(
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

    const signal = {
        done: false
    }

    return Promise.race([
        // open wallet and watch wallet closing
        (async () => {
            try {
                const w = await W.connect(new URL(rid, tosUrl).href)
                while (!signal.done) {
                    if (w && w.closed) {
                        throw new Error('wallet window closed')
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }
            } finally {
                signal.done = true
            }
        })(),
        // submit request and poll response
        (async () => {
            try {
                await submitRequest(rid, json, signal, tosUrl)

                onAccepted && void (async () => {
                    try {
                        await pollResponse(rid, ACCEPTED_SUFFIX, 60 * 1000, signal, tosUrl)
                        !signal.done && onAccepted && onAccepted()
                    } catch (err) {
                        console.warn(err)
                    }
                })()

                const respJson = await pollResponse(rid, RESP_SUFFIX, 10 * 60 * 1000, signal, tosUrl)
                const resp: RelayedResponse = JSON.parse(respJson)
                if (resp.error) {
                    throw new Error(resp.error)
                }
                return resp.payload as any
            } finally {
                signal.done = true
            }
        })()
    ])
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
