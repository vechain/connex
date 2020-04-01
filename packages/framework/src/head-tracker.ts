export function newHeadTracker(driver: Connex.Driver) {
    let head = { ...driver.head }
    let resolvers: Array<(head: Connex.Thor.Status['head']) => void> = [];

    (async () => {
        for (; ;) {
            try {
                const newHead = await driver.pollHead()
                if (newHead.id !== head.id && newHead.number >= head.number) {
                    head = { ...newHead }
                    const resolversCopy = resolvers
                    resolvers = []
                    resolversCopy.forEach(r => r(newHead))
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1 * 1000))
                }
            } catch {
                // rejection from driver.getHead means driver closed
                break
            }
        }
    })()

    const genesisTs = driver.genesis.timestamp

    return {
        get head() { return head },
        get progress() {
            const nowTsMs = Date.now()
            const headTsMs = head.timestamp * 1000
            if (nowTsMs - headTsMs < 30 * 1000) {
                return 1
            }
            const genesisTsMs = genesisTs * 1000
            const p = (headTsMs - genesisTsMs) / (nowTsMs - genesisTsMs)
            return p < 0 ? NaN : p
        },
        ticker: () => {
            let lastHeadId = head.id
            return {
                next: () => {
                    return new Promise<Connex.Thor.Status['head']>(resolve => {
                        if (lastHeadId !== head.id) {
                            return resolve({ ...head })
                        }
                        resolvers.push(newHead => {
                            resolve({ ...newHead })
                        })
                    }).then(h => {
                        lastHeadId = h.id
                        return h
                    })
                }
            }
        }
    }
}
