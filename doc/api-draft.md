# API Reference

## Connex.Version

`connex.version` is a read-only property that indicates the implemented `connex` version in the client. For the differences you can check the [release note]().

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

#### Get account code

Returns `Thor.Code`

- `code` - `string`: Contract code of account

``` javascript
const acc = connex.thor.account('0x0000000000000000000000000000456E65726779')
acc.getCode().then(code=>{
    console.log(code)
})

>{
    "code": "0x6080604052600436106100af576000357c010000000000000000000000000000000000..."
}
```

#### Get account storage

**Parameters**

- `key` - `string`: The key to access in  account storage

Returns `Thor.Storage`

- `value` - `string`: The value to the key in account storage

``` javascript
const acc = connex.thor.account('0x0000000000000000000000000000456E65726779')
acc.getStorage('0x0000000000000000000000000000000000000000000000000000000000000001').then(storage=>{
    console.log(storage)
})

>{
    "value": "0x7107c9b15a7254dd92173d5421359b33bf40ea4ef0fa278ceaf1d320659d5c7b..."
}
```

#### Contract method

With the ABI of contract,we can create an `Thor.Method` object that will be able to simulate a contract call without altering contract state or pack method with arguments to an clause that is ready to sign.

**Parameters**

- `abi` - `object`: ABI definition of contract method

Returns `Thor.Method`

- `value` - `(val: string|number) :this`: Set value for call and as Clause
- `caller` - `(addr: string):this`: Set caller for call
- `gas` - `(gas: string):this`: Set maximum gas allowed for call 
- `gasPrice` - `(gp: string)`: Set gas price for call in wei
- `call`: Simulate calling the method to obtain the output without 
- `asClause`: Pack arguments and setted value into clause

##### Simulate contract call

**Parameters**

- `arguments` - `any`: Arguments defined in method ABI

Returns `Thor.VMOutput`

``` javascript
// Simulate get name from a VIP-180 compatible contract
// Solidity: function name() public pure returns(string)
const nameABI = {}
const nameMethod = connex.thor.account('0x0000000000000000000000000000456E65726779').method(nameABI)
nameMethod.call().then(output=>{
    console.log(output)
})
>{
    "data": "0x0000000000000000000000...",
    "events": [],
    "transfers": [],
    "gasUsed": 605,
    "reverted": false,
    "vmError": "",
    "decoded": {
        "0": "VeThor"
    }
}

// Simulate the VIP-180 transfer 1 wei token from Alex to Bob
// Solidity: function transfer(address _to, uint256 _amount) public returns(bool success)
const transferABI = {}
const transferMethod = connex.thor.account('0x0000000000000000000000000000456E65726779').method(transferABI)
// Set the args for simulate call
transferMethod
    .caller('0x7567d83b7b8d80addcb281a71d54fc7b3364ffed') // Bob's address
    .gas(100000) // Max gas for simulate 
    .gasPrice('1000000000000000') // 1 VeThor can buy 1000 gas

// Alice's address and amount in wei
transferMethod.call('0xd3ae78222beadb038203be21ed5ce7c9b1bff602', 1).then(output=>{
    console.log(output)
})
>{
    "data": "0x0000000000000000000000000000000000000000000000000000000000000001",
    "events": [
        {
            "address": "0x0000000000000000000000000000456e65726779",
            "topics": [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x0000000000000000000000007567d83b7b8d80addcb281a71d54fc7b3364ffed",
                "0x000000000000000000000000d3ae78222beadb038203be21ed5ce7c9b1bff602"
            ],
            "data": "0x0000000000000000000000000000000000000000000000000000000000000001"
        }
    ],
    "transfers": [],
    "gasUsed": 13326,
    "reverted": false,
    "vmError": "",
    "decoded": {
        "0": true,
        "success": true
    }
}

// Simulate EnergyStation convertForEnergy call
// Solidity:  function convertForEnergy(uint256 _minReturn) public payable
const convertForEnergyABI = {}
const convertForEnergyMethod = connex.thor.account('0x0000000000000000000000000000456E65726779').method(convertForEnergyABI)
// Set value, leave other arguments unset
convertForEnergyMethod
    .value('1000000000000000000') // 1e18 wei

// minReturn in wei(1e16 wei)
convertForEnergyMethod.call('10000000000000000').then(output=>{
    console.log(output)
})
> ...
```

##### Create a clause for signing

**Parameters**

- `arguments` - `any`: Arguments defined in method ABI

Returns [`Thor.Clause`](#thor.clause)

``` javascript
// Pack a clause that perform the VIP-180 transfer 1 wei token from Alex to Bob
// Solidity: function transfer(address _to, uint256 _amount) public returns(bool success)
const transferABI = {}
const transferMethod = connex.thor.account('0x0000000000000000000000000000456E65726779').method(transferABI)

// Alice's address and amount in wei
const clause = transferMethod.asClause('0xd3ae78222beadb038203be21ed5ce7c9b1bff602', 1)
console.log(clause)
>{
    "to": "0x0000000000000000000000000000456E65726779",
    "value": "0",
    "data": "0xa9059cb......"
}

// Pack a clause that convents 1 VET to VeThor
// Solidity: function convertForEnergy(uint256 _minReturn) public payable
const convertForEnergyABI = {}
const convertForEnergyMethod = connex.thor.account('0x0000000000000000000000000000456E65726779').method(convertForEnergyABI)
// Set value, leave other arguments unset
convertForEnergyMethod
    .value('1000000000000000000') // 1e18 wei

// minReturn in wei(1e16 wei)
const clause = convertForEnergyMethod.asClause('10000000000000000')
console.log(clause)
> {
    "to": "0x0000000000000000000000000000456E65726779",
    "value": "1000000000000000000",
    "data": "0xa9059cb......"
}
// Next you can ask vendor to sign your clause or pack more clause then sign them together
```

#### Contract Event

With the ABI of contract,we can create an `Thor.Event` object that will be able to filter contracts events with arguments or pack the arguments to criteria for assemble combined filters.

**Parameters**

- `abi` - `object`: ABI definition of contract event

Returns `Thor.Event`

- `asCriteria`: Pack indexed arguments into criteria for future use, see [`Thor.Filter`](#thor.filter)
- `filter`: Create a event filter, only accept indexed arguments, see [`Thor.Filter`](#thor.filter)

##### Pack into criteria

**Parameters**

- `indexed` - `object`: Indexed arguments defined in event ABI needed to be filtered

Returns `Thor.Criteria`

``` javascript
// Solidity: event Transfer(address indexed _from, address indexed _to, uint256 _value)
const transferEventABI = {}
const transferEvent = connex.thor.account('0x0000000000000000000000000000456E65726779').event(transferEventABI)

// Pack into criteria filters events that the '_to' is Bob's address
const criteria = transferEvent.asCriteria({
    _to: '0xd3ae78222beadb038203be21ed5ce7c9b1bff602'
})
console.log(criteria)
>{
    "address": "0x0000000000000000000000000000456E65726779",
    "topic0": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "topic2": "0x000000000000000000000000d3ae78222beadb038203be21ed5ce7c9b1bff602"
}
// Next you can combine different criteria together and put them into filter
```

#### Create a filter

**Parameters**

- `indexed` - `Array<object>`: Array of filter conditions of indexed arguments, 

Returns `Thor.Filter`

``` javascript
// Solidity: event Transfer(address indexed _from, address indexed _to, uint256 _value)
const transferEventABI = {}
const transferEvent = connex.thor.account('0x0000000000000000000000000000456E65726779').event(transferEventABI)

// Filter the events whether '_to' is Bob's address or '_from' is Alice's address
const filter = transferEvent.filter([{
    _to: '0xd3ae78222beadb038203be21ed5ce7c9b1bff602'
},{
    _from: '0x733b7269443c70de16bbf9b0615307884bcc5636'
}])
// Next you can call the methods of Thor.Filter
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

