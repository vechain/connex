declare namespace Connex {
    interface Vendor {
        /** Initiate the tx signing service */
        sign(kind: 'tx'): Vendor.TxSigningService

        /** Initiate the cert signing service */
        sign(kind: 'cert'): Vendor.CertSigningService

        /**
         * Returns whether an address is owned by user
         * @param addr account address
         */
        owned(addr: string): Promise<boolean>
    }

    namespace Vendor {
        interface TxSigningService {
            /**
             * enforce the signer
             * @param addr signer address
             */
            signer(addr: string): this

            /**
             * enforce max allowed gas
             * @param gas 
             */
            gas(gas: number): this

            /**
             * set another txid as dependency
             * @param txid 
             */
            dependsOn(txid: string): this

            /**
             * set the link to reveal tx related information.
             * first appearance of slice '{txid}' in the given link url will be replaced with txid.
             * @param url link url
             */
            link(url: string): this

            /**
             * set comment for the message
             * @param text 
             */
            comment(text: string): this

            /**
             * enable VIP-191 by providing url of delegation web service
             * @param url the url of delegation web service
             */
            delegate(url: string): this

            prepared(callback: () => void): this
            /**
             * send request
             * @param msg clauses with comments
             */
            request(msg: TxMessage): Promise<TxResponse>
        }

        interface CertSigningService {
            /**
             * enforce the signer
             * @param addr signer address
             */
            signer(addr: string): this

            /**
             * set the link to reveal cert related information.
             * first appearance of slice '{certid}' in the given link url will be replaced with cert id.
             * @param url link url
             */
            link(url: string): this

            prepared(callback: () => void): this

            /**
             * send request
             * @param msg 
             */
            request(msg: CertMessage): Promise<CertResponse>
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
