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


async function connectWallet(rid: string, walletUrl: string) {
    try {
        await W.connectApp(rid)
        return
    } catch { /** */ }
    try {
        await W.connectSPA(rid, walletUrl)
        return
    } catch {/** */ }

    throw new Error('unexpected')
}

async function submitRequest(req: RelayedRequest): Promise<string> {
    const data = JSON.stringify(req)
    const reqId = blake2b256(data).toString('hex')
    await fetch(TOS_URL + reqId, {
        method: 'POST',
        body: data,
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
    return reqId
}

async function pollData(reqId: string, suffix: string, timeout: number): Promise<any> {
    let errCount = 0
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
        try {
            const resp = await fetch(`${TOS_URL}${reqId}${suffix}?wait=1`)
            if (resp.body) {
                return await resp.json()
            }
        } catch (err) {
            if (++errCount > 2) {
                throw err
            }
            await new Promise(resolve => setTimeout(resolve, 3000))
        }
    }
    throw new Error('timeout')
}

async function sign<T extends 'tx' | 'cert'>(
    type: T,
    msg: T extends 'tx' ? Connex.Vendor.TxMessage : Connex.Vendor.CertMessage,
    options: T extends 'tx' ? Connex.Driver.TxOptions : Connex.Driver.CertOptions,
    genesisId: string,
    spaWalletUrl: string
): Promise<T extends 'tx' ? Connex.Vendor.TxResponse : Connex.Vendor.CertResponse> {
    let onAccepted = options.onAccepted
    options = { ...options, onAccepted: undefined }
    try {
        const rid = await submitRequest({
            type,
            gid: genesisId,
            payload: {
                message: msg,
                options: options
            },
            nonce: randomBytes(16).toString('hex')
        })


        onAccepted && void (async () => {
            try {
                await pollData(rid, '-accepted', 60 * 1000)
                onAccepted && onAccepted()
            } catch (err) {
                console.warn(err)
            }
        })()

        await connectWallet(rid, spaWalletUrl)

        const resp: RelayedResponse = await pollData(rid, '-resp', 2 * 60 * 1000)
        if (resp.error) {
            throw new Error(resp.error)
        }
        return resp.payload as any
    } finally {
        onAccepted = undefined
    }
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
    return {
        signTx(msg: Connex.Vendor.TxMessage, options: Connex.Driver.TxOptions): Promise<Connex.Vendor.TxResponse> {
            return sign('tx', msg, options, genesisId, spaWalletUrl || SPA_WALLET_URL)
        },
        signCert(msg: Connex.Vendor.CertMessage, options: Connex.Driver.CertOptions): Promise<Connex.Vendor.CertResponse> {
            return sign('cert', msg, options, genesisId, spaWalletUrl || SPA_WALLET_URL)
        }
    }
}
