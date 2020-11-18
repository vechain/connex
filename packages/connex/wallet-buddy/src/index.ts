import '@vechain/connex-framework/dist/driver-interface'
import { blake2b256 } from 'thor-devkit'
import * as randomBytes from 'randombytes'
import * as W from './wallet'

const TOS_URL = 'https://tos.vecha.in:5678/'
const SPA_WALLET_URL = 'https://qianbin.github.io/sync-spa/#/'

/** sign request relayed by tos */
type RelayedRequest = {
    type: 'tx' | 'cert'
    gid?: string
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

type WalletStatus = {
    closed: boolean
}

async function connectWallet(rid: string, walletUrl: string) {
    const rUrl = TOS_URL + rid
    try {
        const r = W.connectApp(rUrl)
        if (r) {
            await r
            return null
        }
    } catch { /** */ }

    const w = W.connectSPA(rUrl, walletUrl)
    if (!w) {
        throw new Error('failed to open wallet window')
    }
    return w
}

async function submitRequest(reqId: string, json: string, wStatus: WalletStatus) {
    for (let i = 0; i < 3 && !wStatus.closed; i++) {
        try {
            return await fetch(TOS_URL + reqId, {
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

async function pollResponse(reqId: string, suffix: string, timeout: number, wStatus: WalletStatus) {
    let errCount = 0
    const deadline = Date.now() + timeout
    while (Date.now() < deadline && !wStatus.closed) {
        try {
            const resp = await fetch(`${TOS_URL}${reqId}${suffix}?wait=1`)
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
    spaWalletUrl: string
): Promise<T extends 'tx' ? Connex.Vendor.TxResponse : Connex.Vendor.CertResponse> {
    return new Promise((resolve, reject) => {
        const req: RelayedRequest = {
            type,
            gid: genesisId,
            payload: {
                message: msg,
                options: options
            },
            nonce: randomBytes(16).toString('hex')
        }
        const json = JSON.stringify(req)
        const rid = blake2b256(json).toString('hex')

        let completed = false
        const walletStatus = {
            closed: false
        }

        void (async () => {
            try {
                const w = await connectWallet(rid, spaWalletUrl)
                while (w && !completed) {
                    if (w.closed) {
                        reject(new Error('wallet window closed'))
                        walletStatus.closed = true
                        break
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }
            } catch (err) {
                reject(err)
            }
        })()

        void (async () => {
            let onAccepted = options.onAccepted
            options = { ...options, onAccepted: undefined }
            try {
                await submitRequest(rid, json, walletStatus)

                onAccepted && void (async () => {
                    try {
                        await pollResponse(rid, '-accepted', 60 * 1000, walletStatus)
                        onAccepted && onAccepted()
                    } catch (err) {
                        console.warn(err)
                    }
                })()

                const respJson = await pollResponse(rid, '-resp', 2 * 60 * 1000, walletStatus)
                const resp: RelayedResponse = JSON.parse(respJson)
                if (resp.error) {
                    throw new Error(resp.error)
                }
                resolve(resp.payload as any)
            } catch (err) {
                reject(err)
            } finally {
                onAccepted = undefined
                completed = true
            }
        })()
    })
}

/**
 * create a instance of wallet buddy to help make signing requests to wallet app
 * @param genesisId the genesis id of requests binding to
 * @param spaWalletUrl customized spa wallet url, dev only
 */
export function create(
    genesisId: string,
    spaWalletUrl?: string
): Pick<Connex.Driver, 'signTx' | 'signCert'> {
    const walletUrl = spaWalletUrl || SPA_WALLET_URL
    return {
        signTx(msg: Connex.Vendor.TxMessage, options: Connex.Driver.TxOptions): Promise<Connex.Vendor.TxResponse> {
            return sign('tx', msg, options, genesisId, walletUrl)
        },
        signCert(msg: Connex.Vendor.CertMessage, options: Connex.Driver.CertOptions): Promise<Connex.Vendor.CertResponse> {
            return sign('cert', msg, options, genesisId, walletUrl)
        }
    }
}
