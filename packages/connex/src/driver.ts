import { DriverNoVendor } from '@vechain/connex-driver/dist/driver-no-vendor'
import { DriverInterface } from '@vechain/connex-driver/dist/driver-interface'

type SignTxArg = DriverInterface.SignTxArg
type SignTxOption = DriverInterface.SignTxOption
type SignTxResult = DriverInterface.SignTxResult
type SignCertArg = DriverInterface.SignCertArg
type SignCertOption = DriverInterface.SignCertOption
type SignCertResult = DriverInterface.SignCertResult

type RelayedRequest = {
    type: 'tx' | 'cert'
    gid?: string
    payload: {
        arg: object
        options: object
    }
}

type RelayedResponse = {
    error?: Error
    payload?: object
}

export class Driver extends DriverNoVendor {
    signTx(msg: SignTxArg, option: SignTxOption): Promise<SignTxResult> {

    }
    signCert(msg: SignCertArg, options: SignCertOption): Promise<SignCertResult> {

    }

    submitRequest() {
    }
    awaitResponse() {
    }
}
