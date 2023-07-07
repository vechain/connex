declare namespace Connex {
    /** 
     * signer defines the interfaces needs be to implemented of a wallet. 
     * it is the driver of vendor, exposing the interface for any possible 
     * wallet implementing a custom signer
    */
    interface Signer {
        signTx(msg: Vendor.TxMessage, options: Signer.TxOptions): Promise<Vendor.TxResponse>
        signCert(msg: Vendor.CertMessage, options: Signer.CertOptions): Promise<Vendor.CertResponse>
    }

    namespace Signer {
        type TxOptions = {
            signer?: string;
            gas?: number;
            dependsOn?: string;
            link?: string;
            comment?: string;
            delegator?: {
                url: string;
                signer?: string;
            };
            onAccepted?: () => void;
        };
        type CertOptions = {
            signer?: string;
            link?: string;
            onAccepted?: () => void;
        };
    }

    // NewSigner creates a singer with genesis id.
    type NewSigner = (genesisId: string)=> Promise<Signer>
}
