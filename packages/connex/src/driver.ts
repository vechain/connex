import { DriverNoVendor } from '@vechain/connex-driver/dist/driver-no-vendor'
import { blake2b256 } from 'thor-devkit/dist/cry/blake2b'
import { urls } from './config'
import { open } from './opener'

type RelayedRequest = {
    type: 'tx' | 'cert'
    gid?: string
    payload: {
        message: object
        options: object
    }
    nonce: string
}

type RelayedResponse = {
    error?: string
    payload?: object
}

function generateNonce(n: number) {
    if (window) {
        const bytes = new Uint8Array(n)
        window.crypto.getRandomValues(bytes)
        return btoa(String.fromCharCode(...bytes))
    }
    return require('crypto').randomBytes(n).toString('hex')
}

export class Driver extends DriverNoVendor {
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
        const onPrepared = options.onPrepared
        options = { ...options, onPrepared: undefined }
        const reqId = await this.submitRequest({
            type,
            gid: this.genesis.id,
            payload: {
                message: msg,
                options: options
            },
            nonce: generateNonce(16)
        })
        onPrepared && onPrepared()

        await open(reqId)

        const resp = await this.awaitResponse(reqId)
        if (resp.error) {
            throw new Error(resp.error)
        }
        return resp.payload as any
    }

    async submitRequest(req: RelayedRequest) {
        const data = JSON.stringify(req)
        const reqId = blake2b256(data).toString('hex')
        await this.net.http(
            'POST',
            urls.tos + reqId,
            {
                body: data,
                headers: { 'content-type': 'application/json' }
            })
        return reqId
    }

    async awaitResponse(reqId: string): Promise<RelayedResponse> {
        for (let i = 0, errCount = 0; i < 5 && errCount < 2; i++) {
            try {
                const resp = await this.net.http(
                    'GET',
                    urls.tos + reqId + '-resp',
                    { query: { wait: '1' } })

                if (resp) {
                    return resp
                }
            } catch (err) {
                await new Promise(resolve => setTimeout(resolve, 2000))
                errCount++
            }
        }
        return { error: 'timeout' }
    }
}
