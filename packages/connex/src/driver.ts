import { DriverNoVendor } from '@vechain/connex-driver'
import { cry } from 'thor-devkit'
import { urls } from './config'
import * as randomBytes from 'randombytes'
import * as W from './wallet'

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

async function connectWallet(rid: string, overrideSpa?: string) {
    try {
        await W.connectApp(rid)
        return
    } catch { /** */ }
    try {
        await W.connectSPA(rid, overrideSpa)
        return
    } catch {/** */ }

    throw new Error('unexpected')
}

export class Driver extends DriverNoVendor {
    spaWallet?: string
    signTx(msg: Connex.Vendor.TxMessage, options: Connex.Driver.TxOptions): Promise<Connex.Vendor.TxResponse> {
        return this.sign('tx', msg, options)
    }

    signCert(msg: Connex.Vendor.CertMessage, options: Connex.Driver.CertOptions): Promise<Connex.Vendor.CertResponse> {
        return this.sign('cert', msg, options)
    }

    async sign<T extends 'tx' | 'cert'>(
        type: T,
        msg: T extends 'tx' ? Connex.Vendor.TxMessage : Connex.Vendor.CertMessage,
        options: T extends 'tx' ? Connex.Driver.TxOptions : Connex.Driver.CertOptions
    ): Promise<T extends 'tx' ? Connex.Vendor.TxResponse : Connex.Vendor.CertResponse> {
        let onAccepted = options.onAccepted
        options = { ...options, onAccepted: undefined }
        try {
            const rid = await this.submitRequest({
                type,
                gid: this.genesis.id,
                payload: {
                    message: msg,
                    options: options
                },
                nonce: randomBytes(16).toString('hex')
            })


            onAccepted && void (async () => {
                try {
                    await this.pollData(rid, '-accepted', 60 * 1000)
                    onAccepted && onAccepted()
                } catch (err) {
                    console.warn(err)
                }
            })()

            await connectWallet(rid, this.spaWallet)

            const resp: RelayedResponse = await this.pollData(rid, '-resp', 2 * 60 * 1000)
            if (resp.error) {
                throw new Error(resp.error)
            }
            return resp.payload as any
        } finally {
            onAccepted = undefined
        }
    }

    async submitRequest(req: RelayedRequest): Promise<string> {
        const data = JSON.stringify(req)
        const reqId = cry.blake2b256(data).toString('hex')
        await this.net.http(
            'POST',
            urls.tos + reqId,
            {
                body: data,
                headers: { 'content-type': 'application/json' }
            })
        return reqId
    }

    async pollData(reqId: string, suffix: string, timeout: number): Promise<any> {
        let errCount = 0
        const deadline = Date.now() + timeout
        while (Date.now() < deadline) {
            try {
                const resp = await this.net.http(
                    'GET',
                    `${urls.tos}${reqId}${suffix}`,
                    { query: { wait: '1' } })

                if (resp) {
                    return resp
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
}
