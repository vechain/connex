import { DriverNoVendor } from '@vechain/connex-driver/dist/driver-no-vendor'
import { blake2b256 } from 'thor-devkit/dist/cry/blake2b'
import { urls } from './config'

type RelayedRequest = {
    type: 'tx' | 'cert'
    gid?: string
    payload: {
        message: object
        options: object
    }
}

type RelayedResponse = {
    error?: string
    payload?: object
}

export class Driver extends DriverNoVendor {
    async signTx(msg: Connex.Vendor.TxMessage, options: Connex.Driver.TxOptions): Promise<Connex.Vendor.TxResponse> {
        const onPrepared = options.onPrepared
        options = { ...options, onPrepared: undefined }
        const reqId = await this.submitRequest({
            type: 'tx',
            gid: this.genesis.id,
            payload: {
                message: msg,
                options: options
            }
        })
        onPrepared && onPrepared()

        
        const resp = await this.awaitResponse(reqId)
        return resp as any
    }

    async signCert(msg: Connex.Vendor.CertMessage, options: Connex.Driver.CertOptions): Promise<Connex.Vendor.CertResponse> {
        const onPrepared = options.onPrepared
        options = { ...options, onPrepared: undefined }
        const reqId = await this.submitRequest({
            type: 'cert',
            gid: this.genesis.id,
            payload: {
                message: msg,
                options: options
            }
        })
        onPrepared && onPrepared()

        

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
