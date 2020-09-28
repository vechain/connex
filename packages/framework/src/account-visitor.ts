import { newEventVisitor } from './event-visitor'
import { newMethod } from './method'
import { abi } from 'thor-devkit/dist/abi'
import * as R from './rules'

export function newAccountVisitor(
    driver: Connex.Driver,
    addr: string
): Connex.Thor.AccountVisitor {
    return {
        get address() { return addr },
        get: () => {
            return driver.getAccount(addr, driver.head.id)
        },
        getCode: () => {
            return driver.getCode(addr, driver.head.id)
        },
        getStorage: key => {
            key = R.test(key, R.bytes32, 'arg0').toLowerCase()
            return driver.getStorage(addr, key, driver.head.id)
        },
        method: jsonABI => {
            let coder
            try {
                coder = new abi.Function(JSON.parse(JSON.stringify(jsonABI)))
            } catch (err) {
                throw new R.BadParameter(`arg0: expected valid ABI (${err.message})`)
            }
            return newMethod(driver, addr, coder)
        },
        event: jsonABI => {
            let coder
            try {
                coder = new abi.Event(JSON.parse(JSON.stringify(jsonABI)))
            } catch (err) {
                throw new R.BadParameter(`arg0: expected valid ABI (${err.message})`)
            }
            return newEventVisitor(driver, addr, coder)
        }
    }
}
