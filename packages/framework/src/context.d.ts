
interface Context {
    readonly driver: Connex.Driver
    readonly trackedHead: Connex.Thor.Status['head']
}
