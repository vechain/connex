import { DriverVendorOnly } from './driver'
import { newVendor } from '@vechain/connex-framework'
import { genesisBlocks } from './config'
import { compat1 } from './compat'

function normalizeGenesisId(id?: 'main' | 'test' | string) {
    id = id || 'main'
    if (/^0x[0-9a-f]{64}$/.test(id)) {
        return id
    }
    const gb = genesisBlocks[id as 'main' | 'test']
    if (gb) {
        return gb.id
    }
    throw new Error('invalid genesis id')
}

class ConnexVendorClass implements Connex.Vendor {
    sign !: Connex.Vendor['sign']
    constructor(genesisId?: 'main' | 'test' | string) {
        genesisId = normalizeGenesisId(genesisId)
        try {
            const injected = ((window || {}) as any).connex
            if (injected && injected.thor.genesis.id === genesisId) {
                if (/^1\./.test(injected.version)) {
                    return compat1(injected).vendor
                }
                return injected.vendor
            }
        } catch { /**/ }
        const driver = new DriverVendorOnly(genesisId)
        const vendor = newVendor(driver)
        return {
            get sign() {
                // eslint-disable-next-line @typescript-eslint/unbound-method
                return vendor.sign
            }
        }
    }
}

export default ConnexVendorClass
export { ConnexVendorClass as ConnexVendor }
