import { abi } from 'thor-devkit/dist/abi'
import { decodeRevertReason } from './revert-reason'
import * as R from './rules'

export function newMethod(
    ctx: Context,
    addr: string,
    coder: abi.Function
): Connex.Thor.Method {

    let value: string | number = 0
    const opts: {
        caller?: string
        gas?: number
        gasPrice?: string
    } = {}

    let cacheTies: string[] | undefined

    return {
        value(val) {
            value = R.test(val, R.bigInt, 'arg0')
            return this
        },
        caller(caller) {
            opts.caller = R.test(caller, R.address, 'arg0').toLowerCase()
            return this
        },
        gas(gas) {
            opts.gas = R.test(gas, R.uint64, 'arg0')
            return this
        },
        gasPrice(gp) {
            opts.gasPrice = R.test(gp, R.bigInt, 'arg0').toString().toLowerCase()
            return this
        },
        cache(ties: string[]) {
            cacheTies = R.test(ties, [R.address], 'arg0').map(t => t.toLowerCase())
            return this
        },
        asClause: (...args) => {
            const inputsLen = (coder.definition.inputs || []).length
            R.ensure(inputsLen === args.length, `args count expected ${inputsLen}`)
            try {
                const data = coder.encode(...args)
                return {
                    to: addr,
                    value: value.toString().toLowerCase(),
                    data
                }
            } catch (err) {
                throw new R.BadParameter(`args can not be encoded (${err.message})`)
            }
        },
        call(...args) {
            const clause = this.asClause(...args)
            return ctx.driver.explain(
                {
                    clauses: [clause as any],
                    ...opts
                },
                ctx.trackedHead.id,
                cacheTies
            )
                .then(outputs => outputs[0])
                .then(output => {
                    if (output.reverted) {
                        const revertReason = decodeRevertReason(output.data)
                        return { ...output, decoded: { revertReason } }
                    } else {
                        const decoded = coder.decode(output.data)
                        return { ...output, decoded }
                    }
                })
        }
    }
}
