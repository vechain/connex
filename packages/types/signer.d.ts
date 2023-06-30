/** Connex driver interface */
declare namespace Connex {
    interface Signer {
        signTx(msg: Connex.Vendor.TxMessage, options: Connex.Driver.TxOptions): Promise<Connex.Vendor.TxResponse>
        signCert(msg: Connex.Vendor.CertMessage, option: Connex.Driver.CertOptions): Promise<Connex.Vendor.CertResponse>
    }
}
