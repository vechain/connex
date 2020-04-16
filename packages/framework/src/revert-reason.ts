import { abi } from 'thor-devkit/dist/abi'

// https://solidity.readthedocs.io/en/v0.5.5/control-structures.html#error-handling-assert-require-revert-and-exceptions
// 0x08c379a0
// Function selector for Error(string)

const errorSig = '0x08c379a0'

export function decodeRevertReason(data: string) {
    try {
        if (data.startsWith(errorSig)) {
            return abi.decodeParameter('string', '0x' + data.slice(errorSig.length)) as string
        }
        return ''
    } catch {
        return ''
    }
}
