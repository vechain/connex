# API Reference

## Connex.Version

`connex.version` is a read-only property that indicates the implemented `connex` version in the client. For the differences you can check the [release note]()

``` javascript
connex.version
> '0.3.0'
```

## Connex.Thor

### Get genesis block info

Returns [`Thor.Block`](#thor.block)

``` javascript
console.log(connex.thor.genesis)

> {
    "beneficiary": "0x0000000000000000000000000000000000000000",
    "gasLimit": 10000000,
    "gasUsed": 0,
    "id": "0x000000000b2bce3c70bc649a02749e8687721b09ed2e15997f466536b20bb127",
    "number": 0,
    "parentID": "0xffffffff00000000000000000000000000000000000000000000000000000000",
    "receiptsRoot": "0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0",
    "signer": "0x0000000000000000000000000000000000000000",
    "size": 170,
    "stateRoot": "0x4ec3af0acbad1ae467ad569337d2fe8576fe303928d35b8cdd91de47e9ac84bb",
    "timestamp": 1530014400,
    "totalScore": 0,
    "transactions": [],
    "txsRoot": "0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0"
}
```

### Get get blockchain status

Returns `Thor.Status`:

+ `progress` - `number`: A number(0-1) indicates syncing progress of the current connected node
+ `head`: Summary block info indicates the head block of the current connected node
    + `id` - `string`: Identifier of the block(bytes32)
    + `number` - `number`: Number of block
    + `timestamp` - `number`: Unix timestamp of block
    + `parentID` - `string`: ID of parent block(bytes32)

``` javascript
console.log(connex.thor.status)

>{
    "progress": 1,
    "head": {
        "id": "0x0016611b340204e5bd76a83f70eea4731575309f23a27e11011169c491359b7d",
        "number": 1466651,
        "timestamp": 1544688650,
        "parentID": "0x0016611a3fc23044b8b4cbb27283b50f04deb4d132dfdd72342770f35206a8ad"
    }
}
```

### Create a ticker

Ticker is an concept that describes chain increment, when there is new block added to the chain, tickers will be triggered.This API will create an ticker which has a function that creates an promise that will resolve when it's triggered, please be noted that it never rejects.

Returns `Thor.Ticker`

+ `next` - `() => Promise<void>`: Call next will create a promise that resolves when there is a new block added

``` javascript
const ticker = connex.thor.ticker()
ticker().next().then(()=>{
    console.log('ticker triggered')
})

// Few seconds after
> ticker triggered'
```

### Account visitor

Account visitor a bunch of APIs to get account details and interact with account methods.

#### Create a account visitor

``` javascript
const acc = connex.thor.account('0x7567d83b7b8d80addcb281a71d54fc7b3364ffed')
```

Returns `AccountVisitor`

+ `address` - `string`: Account to visit

#### Set block revision for methods

Set the block revision which will be used when you perform methods query info from the blockchain. 

**Parameters**

`revision` - `number|string`: Block ID or block number as revision

Returns `AccountVisitor itself`

``` javascript
const acc = connex.thor.account('0x7567d83b7b8d80addcb281a71d54fc7b3364ffed')
acc.revision(0)
// Display the account detail of genesis block
acc.get().then(accInfo=>{
    console.log(accInfo)
})

>{
    "balance": "0x0",
    "energy": "0x0",
    "hasCode": false
}
```




#### Get account detail

Returns [`Thor.Account`](#thor.account)

``` javascript
const acc = connex.thor.account('0x7567d83b7b8d80addcb281a71d54fc7b3364ffed')
acc.get().then(accInfo=>{
    console.log(accInfo)
})

>{
    "balance": "0xe95ea52e8e07eddd24e",
    "energy": "0x920d91d3ff3bb7f1d527",
    "hasCode": false
}

```


### Create a block visitor

### Create a transaction visitor

### Create a filter for event logs or transfers

### Create a explainer

## Connex.Vendor

### Acquire a sign service

## Data Modals

### Thor.Block

+ `id` - `string`: Identifier of the block(bytes32)
+ `number` - `number`: Number of block
+ `parentID` - `string`: ID of parent block(bytes32)
+ `timestamp` - `number`: Unix timestamp of block
+ `gasLimit` - `number`: Gas limit of the block
+ `beneficiary` - `string`: Address of account to receive block reward
+ `gasUsed` - `number`: Actual gas used of block
+ `totalScore` - `number`: Score of the main chain
+ `txRoot` - `string`: Root hash of transaction in the block(bytes32)
+ `stateRoot` - `string`: Root hash of state(bytes32)
+ `singer` - `string`: Address of who signed the block(bytes20)
+ `transactions` - `Array<string>`: Array of transaction IDs
+ `isTrunk` - `bool`: Whether the block is in trunk

### Thor.Account

+ `balance` - `string`: Account balance in hex string
+ `energy` - `string`: Account energy in hex string
+ `hasCode` - `bool`: Whether the is a smart contract

### Thor.Transaction

+ `id` - `string`: Identifier of the transaction
+ `chainTag` - `number`: Last byte of genesis block ID
+ `blockRef` - `string`: The BlockRef (an eight-byte array string) includes two parts: the first four bytes contains the block height (number) and the rest four bytes is part of the referred block’s ID. If the referred block is future block, blockNumber + "00000000" should be added
+ `expiration` - `number` : Expiration relative to blockRef(in unit block)
+ `clauses` - [`Array<Thor.Clause>`](#thor.clause)
+ `gasPriceCoef` - `number`: Coefficient used to calculate the final gas price
+ `gas`  - `number`: Maximum of gas can be consumed to execute this transaction
origin
+ `nonce` - `string`: Transaction nonce
+ `dependsOn` - `string|null`: ID of the transaction which the current transaction depends(bytes32)
+ `size` - `number`: Byte size of the transaction that is RLP encoded
+ `meta` - [`Thor.Transaction.Meta`](#thor.transaction.meta)

### Thor.Clause

+ `to` - `string|null`: The destination address of the message, null for a contract-creation transaction
+ `value`- `string|number`: The value, with an unit of `wei`, transferred through the transaction. Specifically, it plays the role of endowment when the transaction is contract-creation type
+ `data` - `string`: Either the [ABI byte string](http://solidity.readthedocs.io/en/latest/abi-spec.html) containing the data of the function call on a contract, or the initialization code of a contract-creation transaction

### Thor.Transaction.Meta

+ `blockID` - `string`: Block identifier of transaction
+ `blockNumber` - `number`: Block number of transaction
+ `blockTimestamp` - `number`: Block unix timestamp of transaction

### Thor.Receipt

+ `gasUsed` - `number`: Actual gas used of block
+ `gasPayer` - `string`: Address of account who paid used gas
+ `paid` - `string`: Hex form of amount of paid energy
+ `reward` - `string`: Hex form of amount of reward
+ `reverted` - `boolean`: true means the transaction was reverted
+ `outputs` - [`Array<Thor.Receipt.Output>`]('#thor.receipt.output'): Clause's corresponding outputs
+ `meta` - [`Thor.Transaction.Meta`](#thor.transaction.meta)

### Thor.Receipt.Output

+ `contractAddress` - `string`: Deployed contract address, if the corresponding clause is a contract deployment clause
+ `events` - [`Array<Thor.Event>`](#thor.event): Event log objects produced during clause execution
+ `transfers` - [`Array<Thor.Transfer>`](#thor.transfer) Transfer log produced during clause execution

### Thor.Event

+ `address` - `string`: The address of contract which produces the event (bytes20)
+ `topics` - `Array<string>`: an array with max 5 32 Byte topics, topic 1-4 contains indexed parameters of the log
+ `data` - `string`: The data containing non-indexed log parameter
+ `meta`  - [`Thor.Log.Meta`](#thor.log.meta)
+ `decoded`  - [`Thor.Decoded`](#thor.decoded)

### Thor.Transfer

+ `sender` - `string`: Address that sends vet.
+ `recipient` - `string`: Address that receives vet.
+ `amount` - `string`: Amount of vet in `wei`.
+ `meta`  - [`Thor.Log.Meta`](#thor.log.meta)

### Thor.Log.Meta

+ `blockID` - `string`: Block identifier of log
+ `blockNumber` - `number`: Block number of log
+ `blockTimestamp` - `number`: Block unix timestamp of log
+ `txID` - `string`: Transaction identifier of the log
+ `txOrigin` - `string`: Transaction signer the log

### Thor.Decoded

