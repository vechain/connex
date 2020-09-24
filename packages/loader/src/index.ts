import { Framework } from '@vechain/connex-framework'
import { DriverNoVendor } from '@vechain/connex-driver/dist/driver-no-vendor'
import { DriverInterface } from '@vechain/connex-driver/dist/driver-interface'
import { SimpleNet } from '@vechain/connex-driver/dist/simple-net'

type SignTxArg = DriverInterface.SignTxArg
type SignTxOption = DriverInterface.SignTxOption
type SignTxResult = DriverInterface.SignTxResult
type SignCertArg = DriverInterface.SignCertArg
type SignCertOption = DriverInterface.SignCertOption
type SignCertResult = DriverInterface.SignCertResult

class Driver extends DriverNoVendor {
    // signTx(msg: SignTxArg, option: SignTxOption): Promise<SignTxResult> {

    // }
    // signCert(msg: SignCertArg, options: SignCertOption): Promise<SignCertResult> {

    // }
}

type options = {
    nodeUrl: string
}

export async function init(opts: options) {

    if (window.connex) {
        return window.connex
    }

    const net = new SimpleNet(opts.nodeUrl)

    const genesis: Connex.Thor.Block = await net.http('GET', 'blocks/0')

    const driver = new Driver(net, genesis)

    const framework = new Framework(driver)

    const ticker = framework.thor.ticker()
    while (framework.thor.status.head.number === 0) {
        await ticker.next()
    }
    return framework
}
