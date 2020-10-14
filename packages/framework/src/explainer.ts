import { decodeRevertReason } from './revert-reason'
import * as R from './rules'
import * as V from 'validator-ts'

export function newExplainer(driver: Connex.Driver): Connex.VM.Explainer {
    const opts: {
        caller?: string
        gas?: number
        gasPrice?: string
    } = {}
    let cacheHints: string[] | undefined

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
        cache(hints) {
            cacheHints = R.test(hints, [R.address], 'arg0').map(t => t.toLowerCase())
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

            return driver.explain(
                {
                    clauses: transformedClauses,
                    ...opts
                },
                driver.head.id, cacheHints)
                .then(outputs => {
                    return outputs.map(o => {
                        if (o.reverted) {
                            const revertReason = decodeRevertReason(o.data)
                            return { ...o, revertReason }
                        }
                        return o
                    })
                })
        }
    }
}

const clauseScheme: V.Scheme<Connex.VM.Clause> = {
    to: V.nullable(R.address),
    value: R.bigInt,
    data: V.optional(R.bytes)
}
