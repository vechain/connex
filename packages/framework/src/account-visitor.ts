import { newEventVisitor } from './event-visitor'
import { newMethod } from './method'
import { abi } from 'thor-devkit/dist/abi'
import * as R from './rules'

export function newAccountVisitor(
    ctx: Context,
    addr: string
): Connex.Thor.AccountVisitor {
    return {
        get address() { return addr },
        get: () => {
            return ctx.driver.getAccount(addr, ctx.trackedHead.id)
        },
        getCode: () => {
            return ctx.driver.getCode(addr, ctx.trackedHead.id)
        },
        getStorage: key => {
            key = R.test(key, R.bytes32, 'arg0').toLowerCase()
            return ctx.driver.getStorage(addr, key, ctx.trackedHead.id)
        },
        method: jsonABI => {
            let coder
            try {
                coder = new abi.Function(JSON.parse(JSON.stringify(jsonABI)))
            } catch (err) {
                throw new R.BadParameter(`arg0: expected valid ABI (${err.message})`)
            }
            return newMethod(ctx, addr, coder)
        },
        event: jsonABI => {
            let coder
            try {
                coder = new abi.Event(JSON.parse(JSON.stringify(jsonABI)))
            } catch (err) {
                throw new R.BadParameter(`arg0: expected valid ABI (${err.message})`)
            }
            return newEventVisitor(ctx, addr, coder)
        }
    }
}
