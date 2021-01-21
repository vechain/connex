declare namespace Connex {
    /** the vendor interface to interact with wallets */
    interface Vendor {
        /** create the tx signing service */
        sign(kind: 'tx', msg: Vendor.TxMessage): Vendor.TxSigningService

        /** create the cert signing service */
        sign(kind: 'cert', msg: Vendor.CertMessage): Vendor.CertSigningService
    }

    namespace Vendor {
        /** the interface is for requesting user wallet to sign transactions */
        interface TxSigningService {
            /** designate the signer address */
            signer(addr: string): this

            /** set the max allowed gas */
            gas(gas: number): this

            /** set another txid as dependency */
            dependsOn(txid: string): this

            /** 
             * provides the url of web page to reveal tx related information.
             * first appearance of slice '{txid}' in the given link url will be replaced with txid.
             */
            link(url: string): this

            /** set comment for the tx content */
            comment(text: string): this

            /**
             * enable VIP-191 by providing url of web api, which provides delegation service 
             * @param url the url of web api
             * @param signer hint of the delegator address
             */
            delegate(url: string, signer?: string): this

            /** register a callback function fired when the request is accepted by user wallet */
            accepted(cb: () => void): this

            /** send the request */
            request(): Promise<TxResponse>
        }

        /** the interface is for requesting user wallet to sign certificates */
        interface CertSigningService {
            /** designate the signer address */
            signer(addr: string): this

            /** 
             * provides the url of web page to reveal cert related information.
             * first appearance of slice '{certid}' in the given link url will be replaced with certid.
             */
            link(url: string): this

            /** register a callback function fired when the request is accepted by user wallet */
            accepted(cb: () => void): this

            /** send the request */
            request(): Promise<CertResponse>
        }

        type TxMessage = Array<Connex.VM.Clause & {
            /** comment to the clause */
            comment?: string
            /** as the hint for wallet to decode clause data */
            abi?: object
        }>

        type CertMessage = {
            purpose: 'identification' | 'agreement'
            payload: {
                type: 'text'
                content: string
            }
        }

        type TxResponse = {
            txid: string
            signer: string
        }

        type CertResponse = {
            annex: {
                domain: string
                timestamp: number
                signer: string
            }
            signature: string
        }
    }
}
