import * as WS from 'ws/index'
import { JSONRPC } from '@vechain/json-rpc'
import * as Http from 'http'
import * as Https from 'https'
import { options } from './options'

const methods: Array<keyof Connex.Driver> = [
    'pollHead',
    'getBlock',
    'getTransaction',
    'getReceipt',
    'getAccount',
    'getCode',
    'getStorage',
    'explain',
    'filterEventLogs',
    'filterTransferLogs',
    'signTx',
    'signCert',
    'isAddressOwned',
]

export class DriverHost {
    private readonly wss: WS.Server
    constructor(
        server: Http.Server | Https.Server,
        path: string,
        acceptor: DriverHost.Acceptor
    ) {
        this.wss = new WS.Server({
            server,
            path
        })

        this.wss.on('connection', async (ws, req) => {
            this.handleConnection(ws, req, acceptor)
        })
    }

    public close() {
        this.wss.close()
    }

    private handleConnection(ws: WS, req: Http.IncomingMessage, acceptor: DriverHost.Acceptor) {
        const rpc = new JSONRPC((data, isRequest) => {
            if (!isRequest) {
                data = ' ' + data
            }
            ws.send(data)
            return Promise.resolve()
        })

        ws.on('message', data => {
            const isRequest = (data as string)[0] !== ' '
            rpc.receive(data as string, isRequest).catch(err => {
                if (!options.disableErrorLog) {
                    // tslint:disable-next-line: no-console
                    console.warn('receive jsonrpc payload: ', err)
                }
            })
        })
        let driver: Connex.Driver | undefined

        rpc.serve(method => {
            if (method === 'connect') {
                return async (genesisId?: string) => {
                    if (driver) {
                        throw new Error('already accepted')
                    }
                    driver = await acceptor(ws as any, req, genesisId)
                    return {
                        genesis: driver.genesis,
                        head: driver.head
                    }
                }
            }
            if (methods.includes(method as any)) {
                return (...args: any[]) => {
                    if (!driver) {
                        throw new Error('not accepted')
                    }
                    return (driver as any)[method](...args)
                }
            }
        })
    }
}

export namespace DriverHost {
    export type Acceptor = (ws: WebSocket, request: Http.IncomingMessage, genesisId?: string) => Promise<Connex.Driver>
}
