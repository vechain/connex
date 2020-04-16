import { decodeRevertReason } from './revert-reason'
import * as R from './rules'
import * as V from 'validator-ts'

export function newExplainer(ctx: Context): Connex.Thor.Explainer {
    const opts: {
        caller?: string
        gas?: number
        gasPrice?: string
    } = {}

    return {
        caller(addr) {
            opts.caller = R.test(addr, R.address, 'arg0').toLowerCase()
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
        execute(clauses) {
            R.test(clauses, [clauseScheme], 'arg0')

            const transformedClauses = clauses.map(c => {
                return {
                    to: c.to ? c.to.toLowerCase() : null,
                    value: c.value.toString().toLowerCase(),
                    data: (c.data || '0x').toLowerCase()
                }
            })

            return ctx.driver.explain(
                {
                    clauses: transformedClauses,
                    ...opts
                },
                ctx.trackedHead.id)
                .then(outputs => {
                    return outputs.map(o => {
                        if (o.reverted) {
                            const revertReason = decodeRevertReason(o.data)
                            return { ...o, decoded: { revertReason } }
                        }
                        return o
                    })
                })
        }
    }
}

const clauseScheme: V.Scheme<Connex.Thor.Clause> = {
    to: V.nullable(R.address),
    value: R.bigInt,
    data: V.optional(R.bytes)
}
