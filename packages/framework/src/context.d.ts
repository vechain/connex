
import { DriverInterface } from './driver-interface'

declare global {
    interface Context {
        readonly driver: DriverInterface
        readonly trackedHead: Connex.Thor.Status['head']
    }
}
