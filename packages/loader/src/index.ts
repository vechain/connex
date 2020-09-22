import { Framework } from '@vechain/connex-framework'
import { DriverNoVendor } from '@vechain/connex-driver/dist/driver-no-vendor'
import { DriverInterface } from '@vechain/connex-driver/dist/driver-interface'
import { SimpleNet } from '@vechain/connex-driver/dist/simple-net'

// import SignTxArg = DriverInterface.SignTxArg
// import SignTxOption = DriverInterface.SignTxOption
// import SignTxResult = DriverInterface.SignTxResult
// import SignCertArg = DriverInterface.SignCertArg
// import SignCertOption = DriverInterface.SignCertOption
// import SignCertResult = DriverInterface.SignCertResult

class Driver extends DriverNoVendor {
    // signTx(msg: SignTxArg, option: SignTxOption): Promise<SignTxResult> {

    // }
    // signCert(msg: SignCertArg, options: SignCertOption): Promise<SignCertResult> {

    // }
}

type options = {
    nodeUrl: string
}


export default async function init(opts: options) {
    if (window.connex) {
        return window.connex
    }

    console.log(opts)
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
