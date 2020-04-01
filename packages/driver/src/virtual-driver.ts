import { JSONRPC } from '@vechain/json-rpc'
import * as WebSocket from 'isomorphic-ws'
import { sleep } from './common'
import { options } from './options'

function openWebSocket(url: string) {
    return new Promise<WebSocket>((resolve, reject) => {
        const ws = new WebSocket(url)
        ws.onopen = () => {
            offWebSocket(ws)
            resolve(ws)
        }
        ws.onclose = ev => {
            offWebSocket(ws)
            reject(new Error(`websocket closed: ${ev.reason} (${ev.code})`))
        }
        ws.onerror = ev => {
            offWebSocket(ws)
            reject(ev.error || new Error('websocket error'))
            ws.close()
        }
    })
}

function offWebSocket(ws: WebSocket) {
    ws.onclose = null as any
    ws.onerror = null as any
    ws.onmessage = null as any
    ws.onopen = null as any
}

async function setupRPC(ws: WebSocket) {
    const rpc = new JSONRPC((data, isRequest) => {
        if (!isRequest) {
            data = ' ' + data
        }
        ws.send(data)
        return Promise.resolve()
    })
    ws.onmessage = ev => {
        const isRequest = (ev.data as string)[0] !== ' '
        rpc.receive(ev.data as string, isRequest)
            .catch(err => {
                if (!options.disableErrorLog) {
                    // tslint:disable-next-line: no-console
                    console.warn('receive jsonrpc payload: ', err)
                }
            })
    }
    ws.onclose = () => {
        offWebSocket(ws)
        rpc.setError(new Error('closed'))
    }
    ws.onerror = ev => {
        offWebSocket(ws)
        rpc.setError(ev.error)
        ws.close()
    }
    return rpc
}

async function _connect(url: string, genesisId?: string) {
    const ws = await openWebSocket(url)
    const rpc = await setupRPC(ws)
    try {
        const info = await rpc.call('connect', genesisId)
        return {
            ws,
            rpc,
            genesis: info.genesis as Connex.Thor.Block,
            initHead: info.head as Connex.Thor.Status['head']
        }
    } catch (err) {
        ws.close()
        throw err
    }
}

export async function connect(url: string): Promise<Connex.Driver> {
    let conn = await _connect(url)
    const genesisId = conn.genesis.id

    const reconnect = () => {
        setTimeout(async () => {
            try {
                conn = await _connect(url, genesisId)
            } catch (err) {
                reconnect()
            }
        }, 10 * 1000)
    }

    const rpcCall = (method: string, ...args: any[]) => {
        if (conn) {
            if (conn.ws.readyState === WebSocket.OPEN) {
                return conn.rpc.call(method, ...args)
            }
            conn = null as any
            reconnect()
        }
        return Promise.reject(new Error('closed'))
    }

    let currentHead = conn.initHead
    return {
        genesis: conn.genesis,
        get head() { return currentHead },
        pollHead: async () => {
            for (; ;) {
                try {
                    const newHead = await rpcCall('pollHead')
                    currentHead = newHead
                    return newHead
                } catch {
                    await sleep(5 * 1000)
                }
            }
        },
        getBlock: rev => {
            return rpcCall('getBlock', rev)
        },
        getTransaction: id => {
            return rpcCall('getTransaction', id)
        },
        getReceipt: id => {
            return rpcCall('getReceipt', id)
        },
        getAccount: (addr, rev) => {
            return rpcCall('getAccount', addr, rev)
        },
        getCode: (addr, rev) => {
            return rpcCall('getCode', addr, rev)
        },
        getStorage: (addr, key, rev) => {
            return rpcCall('getStorage', addr, key, rev)
        },
        explain: (arg, rev, cacheTies) => {
            return rpcCall('explain', arg, rev, cacheTies)
        },
        filterEventLogs: arg => {
            return rpcCall('filterEventLogs', arg)
        },
        filterTransferLogs: arg => {
            return rpcCall('filterTransferLogs', arg)
        },
        signTx: (msg, opt) => {
            return rpcCall('signTx', msg, opt)
        },
        signCert: (msg, opt) => {
            return rpcCall('signCert', msg, opt)
        },
        isAddressOwned: addr => {
            return rpcCall('isAddressOwned', addr)
        }
    }
}
