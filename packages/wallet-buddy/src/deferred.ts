export class Deferred<T> extends Promise<T> {
    constructor() {
        if (arguments.length > 0) {
            // fallback to Promise constructor
            // eslint-disable-next-line prefer-rest-params
            super(arguments[0])
            this.resolve = () => { throw new Error('Deferred.resolve is not callable') }
            this.reject = () => { throw new Error('Deferred.reject is not callable') }
            return
        }

        let _resolve: (v: T | PromiseLike<T>) => void
        let _reject: (reason?: unknown) => void
        super((resolve, reject) => {
            _resolve = resolve
            _reject = reject
        })

        this.resolve = _resolve!
        this.reject = _reject!
    }

    resolve!: (v: T | PromiseLike<T>) => void
    reject!: (reason?: unknown) => void
}

export default Deferred
