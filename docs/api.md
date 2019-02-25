# API Reference

## Connex.Version

`connex.version` is a read-only property that indicates the implemented `connex` version in the current client. For the differences between versions, you can check the [release note](https://github.com/vechain/connex/releases).

``` javascript
connex.version
> '0.3.0'
```

## Connex.Thor

### Get Genesis Block Info

Returns [`Thor.Block`](#thorblock)

``` javascript
console.log(connex.thor.genesis)

>{
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

### Get Blockchain Status

Returns `Thor.Status`:

+ `progress` - `number`: A number [0-1] indicates the syncing progress of the currently connected node
+ `head`: Summarized block info that indicates the head block of the currently connected node
    + `id` - `string`: Identifier of the block (bytes32)
    + `number` - `number`: Number of the block
    + `timestamp` - `number`: Unix timestamp of the block
    + `parentID` - `string`: ID of the parent block (bytes32)

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

### Create a Ticker

`Ticker` is a concept that describes chain increment, when there is a new block added to the chain, tickers will be triggered. This API will create a ticker which has a function that creates a `Promise` that will resolve when a new block is truly added, please be advised that it never rejects.

Returns `Thor.Ticker`

+ `next` - `(): Promise<void>`: Call `next` will create a promise that resolves when there is a new block added

``` javascript
const ticker = connex.thor.ticker()
ticker.next().then(()=>{
    console.log('ticker triggered')
})

// A few seconds after
> 'ticker triggered'
```

### Account Visitor

Account visitor is a bunch of APIs to get account details and interact with account methods.

#### Create an Account Visitor

``` javascript
const acc = connex.thor.account('0x7567d83b7b8d80addcb281a71d54fc7b3364ffed')
```

Returns `AccountVisitor`

+ `address` - `string`: Account to visit

#### Get Account Detail

Returns [`Promise<Thor.Account>`](#thoraccount)

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

#### Get Account Code

Returns `Promise<Thor.Code>`

+ `code` - `string`: Contract code of an account

``` javascript
const acc = connex.thor.account('0x0000000000000000000000000000456E65726779')
acc.getCode().then(code=>{
    console.log(code)
})

>{
    "code": "0x6080604052600436106100af576000357c010000000000000000000000000000000000..."
}
```

#### Get Account Storage

**Parameters**

+ `key` - `string`: The key to accessing in  account storage

Returns `Promise<Thor.Storage>`

+ `value` - `string`: The value to the key in account storage

``` javascript
const acc = connex.thor.account('0x0000000000000000000000000000456E65726779')
acc.getStorage('0x0000000000000000000000000000000000000000000000000000000000000001').then(storage=>{
    console.log(storage)
})

>{
    "value": "0x7107c9b15a7254dd92173d5421359b33bf40ea4ef0fa278ceaf1d320659d5c7b..."
}
```

#### Contract Method

Given the ABI of contract, we can create a `Thor.Method` object that will be able to simulate a contract call without altering contract state or pack method with arguments to a clause that is ready to sign.

**Parameters**

+ `abi` - `object`: ABI definition of a contract method

Returns `Thor.Method`

+ `value` - `(val: string|number):this`: Set value for call and as Clause
+ `caller` - `(addr: string):this`: Set caller for call
+ `gas` - `(gas: string):this`: Set maximum gas allowed for call 
+ `gasPrice` - `(gp: string)`: Set gas price for call in wei
+ `call`: Simulate calling the method to obtain the output without altering the contract state
+ `asClause`: Pack arguments and setted value into clause

##### Simulate a Contract Call

**Parameters**

+ `arguments` - `any`: Arguments defined in method ABI

Returns [`Promise<Thor.VMOutput>`](#thorvmoutput)

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
        "0": "VeThor",
         "__length__": 1
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
        "__length__": 1,
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

##### Create a Clause for Signing

**Parameters**

+ `arguments` - `any`: Arguments defined in method ABI

Returns [`Thor.Clause`](#thorclause)

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
>{
    "to": "0x0000000000000000000000000000456E65726779",
    "value": "1000000000000000000",
    "data": "0xa9059cb......"
}
// Next you can ask vendor to sign your clause or pack more clause then sign them together
```

#### Contract Event

Given the ABI of a contract, we can create a `Thor.Event` object that will be able to filter contracts events with arguments or pack the arguments to criteria for assembling combined filters.

**Parameters**

+ `abi` - `object`: ABI definition of contract event

Returns `Thor.Event`

+ `asCriteria`: Pack indexed arguments into criteria for future use, see [`Thor.Filter`](#thorfilter)
+ `filter`: Create an event filter, only accept indexed arguments, see [`Thor.Filter`](#thorfilter)

##### Pack into Criteria

**Parameters**

+ `indexed` - `object`: Indexed arguments defined in event ABI that needs to be filtered, the items in the object will be combined with `AND` operator: e.g. {"ConA": "A", "ConB": "B"} is '`ConA=A` AND `ConB=B`'

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

+ `indexed` - `Array<object>`: Array of filter conditions of indexed arguments, the items in the array will be combined by `OR` operator to filter the events: e.g. [{"ConA": "A"}, {"ConB": "B", "ConC": "C"}] is '`ConA=A` OR (`ConB=B` AND `ConC=C`)'

Returns [`Thor.Filter`](#filter)

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

### Block Visitor

**Parameters**

+ `revision` - `number|string|undefined`: Block number or ID to visit or leave it unset the function will get the latest block ID as the revision (As long as the revision is set, it can't be changed again)

Returns `Thor.BlockVisitor`

+ `revision` - `number|string`: Block number or ID to be visited.

#### Get Block Detail

Returns [`Promise<Thor.Block>`](#thorblock)

``` javascript
const blk=connex.thor.block(0)

blk.get().then(block=>{
    console.log(block)
})
>{
    "number": 0,
    "id": "0x000000000b2bce3c70bc649a02749e8687721b09ed2e15997f466536b20bb127",
    "size": 170,
    "parentID": "0xffffffff00000000000000000000000000000000000000000000000000000000",
    "timestamp": 1530014400,
    "gasLimit": 10000000,
    "beneficiary": "0x0000000000000000000000000000000000000000",
    "gasUsed": 0,
    "totalScore": 0,
    "txsRoot": "0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0",
    "stateRoot": "0x4ec3af0acbad1ae467ad569337d2fe8576fe303928d35b8cdd91de47e9ac84bb",
    "receiptsRoot": "0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0",
    "signer": "0x0000000000000000000000000000000000000000",
    "isTrunk": true,
    "transactions": []
}
```

### Transaction Visitor

**Parameters**

+ `id` - `string`: Transaction ID to be visited (As long as the revision is set, it can't be changed again)

Returns `Thor.TransactionVisitor`

+ `id` - `number|string`: Block number or ID to be visited

#### Get Transaction Detail

Returns [`Thor.Transaction`](#thortransaction)

``` javascript
const transaction=connex.thor.transaction('0x9daa5b584a98976dfca3d70348b44ba5332f966e187ba84510efb810a0f9f851')

transaction.get().then(tx=>{
    console.log(tx)
})
>{
    "id": "0x9daa5b584a98976dfca3d70348b44ba5332f966e187ba84510efb810a0f9f851",
    "chainTag": 39,
    "blockRef": "0x00003abac0432454",
    "expiration": 720,
    "clauses": [
        {
            "to": "0x7567d83b7b8d80addcb281a71d54fc7b3364ffed",
            "value": "0x152d02c7e14af6800000",
            "data": "0x"
        }
    ],
    "gasPriceCoef": 128,
    "gas": 21000,
    "origin": "0xe59d475abe695c7f67a8a2321f33a856b0b4c71d",
    "nonce": "0x12256df6fb",
    "dependsOn": null,
    "size": 128,
    "meta": {
        "blockID": "0x00003abbf8435573e0c50fed42647160eabbe140a87efbe0ffab8ef895b7686e",
        "blockNumber": 15035,
        "blockTimestamp": 1530164750
    }
}
```

#### Get Transaction Receipt

Returns [`Thor.Receipt`](#thorreceipt)

``` javascript
const transaction=connex.thor.transaction('0x9daa5b584a98976dfca3d70348b44ba5332f966e187ba84510efb810a0f9f851')

transaction.getReceipt().then(tx=>{
    console.log(tx)
})
>{
    "gasUsed": 21000,
    "gasPayer": "0xe59d475abe695c7f67a8a2321f33a856b0b4c71d",
    "paid": "0x1b5b8c4e33f51f5e8",
    "reward": "0x835107ddc632302c",
    "reverted": false,
    "meta": {
        "blockID": "0x00003abbf8435573e0c50fed42647160eabbe140a87efbe0ffab8ef895b7686e",
        "blockNumber": 15035,
        "blockTimestamp": 1530164750,
        "txID": "0x9daa5b584a98976dfca3d70348b44ba5332f966e187ba84510efb810a0f9f851",
        "txOrigin": "0xe59d475abe695c7f67a8a2321f33a856b0b4c71d"
    },
    "outputs": [
        {
            "contractAddress": null,
            "events": [],
            "transfers": []
        }
    ]
}
```

### Filter

Filter event and transfer logs on the blockchain. Filter often works with `Connex.Thor.Account`, either creates a filter from an event or packs criteria and then assembles several criteria and sets to a filter. But also there is a way of creating a filter and assembling criteria as per your need then apply it.

**Parameters**

+ `kind` - `'event'|'transfer'`: Kind of filter

Returns `Thor.Filter`

+ `order` - `(order: 'asc'|'desc'): this`: Set the order for filter
+ `range` - `(range: Thor.Filter.Range): this`: Set the range for the filter 
+ `criteria` - `(set: Array<Thor.Filter.Criteria>): this`: Set criteria set for the filter
+ `apply` - `(offset: number, limit: number): Promise<Thor.Filter.Result`: Apply the filter and get the result

#### Filter range

**Parameters**

`Thor.Filter.Range`:

+ `unit` - `'block'|'time'`: Range unit, can be filtered by block number or timestamp in second
+ `from` - `Number`: Filter start point in unit
+ `to` - `Number`: Filter stop point in unit

Returns `this`

``` javascript
const filter =  connex.thor.filter('transfer')

// Set the filter range as block 0 to block 100
filter.range({
    unit: 'block',
    from: 0,
    to: 100
})
// Next you can set other options or perform apply, complete demo code will be provided below
```

#### Filter criteria

Filters support two different types of log: `event` and `transfer` so there are two types of `Thor.Filter.Criteria`.

`Thor.Filter.Event.Criteria`:

+ `address` - `string(optional)`: An address to get logs from particular account
+ `topic0` - `string(optional)`: Topic0 to match
+ `topic1` - `string(optional)`: Topic1 to match
+ `topic2` - `string(optional)`: Topic2 to match
+ `topic3` - `string(optional)`: Topic3 to match
+ `topic4` - `string(optional)`: Topic4 to match

`Thor.Filter.Transfer.Criteria`:

+ `txOrigin` - `string(optional)`: Signer address of tx 
+ `sender` - `string(optional)`: Vet sender address
+ `recipient` - `string(optional)`: Vet recipient address

**Parameters**

+ `set` - `Array<Thor.Filter.Criteria>`: Criteria set for the filter, either array of `Event.Criteria` or an array of `Transfer.Criteria`,items in the criteria array will be combined by `OR` operator to filter the events: e.g. [{"ConA": "A"}, {"ConB": "B", "ConC": "C"}] is '`ConA=A` OR (`ConB=B` AND `ConC=C`)'

``` javascript
const filter=connex.thor.filter('event')

filter.criteria([
    // Matches VIP-180 Transfer from '0xd3ae78222beadb038203be21ed5ce7c9b1bff602'
    {
        "address": "0x0000000000000000000000000000456E65726779",
        "topic0": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "topic1": "0x000000000000000000000000d3ae78222beadb038203be21ed5ce7c9b1bff602"
    },
    // Matches VIP-180 Transfer to '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed'
    {
        "address": "0x0000000000000000000000000000456E65726779",
        "topic0": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "topic2": "0x0000000000000000000000007567d83b7b8d80addcb281a71d54fc7b3364ffed"
    }
])
// Next you can set other options or call apply to executes the filter
```

#### Apply

**Parameters**

+ `offset` - `Number`: Start cursor in the result 
+ `limit` - `Number`: Constrain the number of result returned

Returns [`Promise<Array<Thor.Filter.Result>>`](#thorfilterresult)

``` javascript
// Solidity: event Transfer(address indexed _from, address indexed _to, uint256 _value)
const transferEventABI = {}
const transferEvent = connex.thor.account('0x0000000000000000000000000000456E65726779').event(transferEventABI)

// Create a filter from eventABI
filter=transferEvent.filter([{
    _to: '0xd3ae78222beadb038203be21ed5ce7c9b1bff602'
}])
// Set filter options
filter
    .order('desc') // Work from the last event
    .range({
        unit: 'block',
        from: '10000',
        to: '40000'
    }) // Set the range
// Apply the filter, get the first one
filter.apply(0, 1).then(logs=>{
    console.log(logs)
})
>[
    {
        "address": "0x0000000000000000000000000000456e65726779",
        "topics": [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x0000000000000000000000007567d83b7b8d80addcb281a71d54fc7b3364ffed",
            "0x00000000000000000000000000f34f4462c0f6a6f5e76fb1b6d63f05a32ed2c6"
        ],
        "data": "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
        "meta": {
            "blockID": "0x0000813fbe48421dfdc9400f1f4e1d67ce34256538afd1c2149c4047d72c4175",
            "blockNumber": 33087,
            "blockTimestamp": 1530345270,
            "txID": "0x29b0af3ffb8eff4cc48a24ce9a800aaf4d0e92b72dbcf17ce01b14fd01af1290",
            "txOrigin": "0x7567d83b7b8d80addcb281a71d54fc7b3364ffed"
        },
        "decoded": {
            "0": "0x7567D83b7b8d80ADdCb281A71d54Fc7B3364ffed",
            "1": "0x00F34f4462c0f6a6f5E76Fb1b6D63F05A32eD2C6",
            "2": "1000000000000000000",
            "__length__": 3,
            "_from": "0x7567D83b7b8d80ADdCb281A71d54Fc7B3364ffed",
            "_to": "0x00F34f4462c0f6a6f5E76Fb1b6D63F05A32eD2C6",
            "_value": "1000000000000000000"
        }
    }
]

// Filter the transfer log that from 0x7567d83b7b8d80addcb281a71d54fc7b3364ffed
const filter=connex.thor.filter('transfer')

filter.criteria([{
    sender: '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed'
}])

filter.apply(0,1).then(logs=>{
    console.log(logs)
})
>[
    {
        "sender": "0x7567d83b7b8d80addcb281a71d54fc7b3364ffed",
        "recipient": "0x3cc190d342a0d3a7365538d94adffec34f789cd0",
        "amount": "0xde0b6b3a7640000",
        "meta": {
            "blockID": "0x00005be5d2129f01cb60ef20b43208091722bf6e0086ac24745cd26698e9d93d",
            "blockNumber": 23525,
            "blockTimestamp": 1530249650,
            "txID": "0xd08e959c0ae918ab72d4da162856e7a4556c576b8ae849d09dbd38e5a419e94b",
            "txOrigin": "0x7567d83b7b8d80addcb281a71d54fc7b3364ffed"
        }
    }
] 
```

### Explainer

Explainer gets what would be produced after blockchain executes a tx.

Returns `Thor.Explainer`

+ `caller` - `(addr: string): this`: Set caller
+ `gas` - `(gas: number): this`: Set max allowed gas 
+ `gasPrice` - `(gp: string): this`: Set gas price in hex string
+ `execute`: execute the explainer

#### Execute

**Parameters**

- `Clauses`  - [`Array<Thor.Clause>`](#thorclause)

Returns [`Promise<Array<Thor.VMOutput>>`](#thorvmoutput)

``` javascript
const explainer=connex.thor.explain()
explainer
    .gas(200000) // Set maximum gas
    .caller('0x7567d83b7b8d80addcb281a71d54fc7b3364ffed') // Set caller

// Prepare energy transfer clause
const transferABI = {}
const transferMethod = connex.thor.account('0x0000000000000000000000000000456E65726779').method(transferABI)
// Alice's address and amount in wei
const energyClause = transferMethod.asClause('0xd3ae78222beadb038203be21ed5ce7c9b1bff602', 1)

explainer.execute([
    {
        to: '0xd3ae78222beadb038203be21ed5ce7c9b1bff602',
        value: 1,
        data: '0x'
    },
    energyClause
]).then(outputs=>{
    console.log(outputs)
})
>[
    {
        "data": "0x",
        "events": [],
        "transfers": [
            {
                "sender": "0x7567d83b7b8d80addcb281a71d54fc7b3364ffed",
                "recipient": "0xd3ae78222beadb038203be21ed5ce7c9b1bff602",
                "amount": "0x1"
            }
        ],
        "gasUsed": 0,
        "reverted": false,
        "vmError": ""
    },
    {
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
        "vmError": ""
 
``` 

## Connex.Vendor

### Acquire a Signing Service


**Parameters**

+ `kind` - `'tx'|'cert'`: Kind of singing service

Returns `Thor.Vendor.SigningService`: `Thor.Vendor.TXSigningService` or `Thor.Vendor.CertSigningService`

### Transaction Signing Service

`Thor.Vendor.TXSigningService`:

+ `signer` - `(addr: string): this`: Enforces the specified address to sign the transaction
+ `gas` - `(gas: number): this`: Enforces the specified number as the maximum gas that can be consumed for the transaction
+ `link` - `(url: string): this`: Set the link to reveal transaction-related information, the link will be used for connex to assemble a `callback url` by replacing the placeholder `{txid}` to `txid`
+ `comment` - `(text: string): this`: Set the comment for the transaction that will be revealed to the user
+ `request`: Send the request

#### Perform Transaction Signing Request

**Parameters**

+ `msg` - `Array<TxMessage>`

`TxMessage`:
+ `to`:  Same as [`Thor.Clause.To`](#thorclause)
+ `value`:  Same as [`Thor.Clause.Value`](#thorclause)
+ `data`:  Same as [`Thor.Clause.Data`](#thorclause)
+ `comment` - `string(optional)`: Comment to the clause

Returns `Promise<Thor.Vendor.SigningService.TXResponse>`:
+ `txid` - `string`: Transaction identifier
+ `signer` - `string`: Signer address

``` javascript
const signingService = connex.vendor.sign('tx')

signingService
    .signer('0x7567d83b7b8d80addcb281a71d54fc7b3364ffed') // Enforce signer
    .gas(200000) // Set maximum gas
    .link('https://connex.vecha.in/{txid}') // User will be back to the app by the url https://connex.vecha.in/0xffff....
    .comment('Donate 100 VET and 1000 VeThor to the author of connex')

// Prepare energy transfer clause
const transferABI = {}
const transferMethod = connex.thor.account('0x0000000000000000000000000000456E65726779').method(transferABI)
// Connex author's address and amount in wei
const energyClause = transferMethod.asClause('0xd3ae78222beadb038203be21ed5ce7c9b1bff602', '1000000000000000000000')

signingService.request([
    {
        to: '0xd3ae78222beadb038203be21ed5ce7c9b1bff602',
        value: '100000000000000000000',
        data: '0x',
        comment: 'Transfer 100 VET'
    },
    {
        comment: 'Transfer 1000 VeThor',
        ...energyClause
    }
]).then(result=>{
    console.log(result)
})
>{
    "signer": "0x7567d83b7b8d80addcb281a71d54fc7b3364ffed",
    "txId": "0x4e9a7eec33ef6cfff8ff5589211a94070a0284df17c2ead6267f1913169bd340"
}
```

### Certificate Signing Service

The certificate is a message signing based mechanism which can easily request user's identification(address) or user to agree to your terms or agreements.

`Thor.Vendor.CertSigningService`:

+ `signer` - `(addr: string): this`: Enforces the specified address to sign the certificate
+ `request`: Send the request

#### Perform Certificate Signing Request

**Parameters**

`CertMessage`: 

+ `purpose` - `'identification' | 'agreement'`:  Purpose of the request, `identification` means request the user to sign a random message to get the address and `agreement` means ask user to sign the agreement for using the VeChain apps
+ `payload`:
    + `type` - `'text'`: Payload type,only `text` is supported
    + `content` - `string`: Content of of the request

Returns  `Promise<Thor.Vendor.SigningService.CertResponse>`:
+ `annex`:
    + `domain` - `string`: Domain of the VeChain apps
    + `timestamp` - `number`: Head block timestamp when user accepts the request
    + `signer` - `string`: Signer address
+ `signature` - `string`: Signature

``` javascript
const signingService = connex.vendor.sign('cert')

// Generate a random string and request the identification
signingService.request({
    purpose: 'identification',
    payload: {
        type: 'text',
        content: 'random generated string'
    }
}).then(result=>{
    console.log(result)
})

>{
    "annex": {
        "domain": "vechain.github.io",
        "timestamp": 1545826680,
        "signer": "0xf6e78a5584c06e2dec5c675d357f050a5402a730"
    },
    "signature": "0x30db85935f620f7c506462f3ec7552479a56db8cbd0c2a3f295a92ad4e2f37ae2d2b2a2a212c45c43eeaf6e5caa8b3348038c01192ed226d12a118f204c6729200"
}

// Ask user to sign the agreement
signingService.request({
    purpose: 'agreement',
    payload: {
        type: 'text',
        content: 'agreement'
    }
}).then(result=>{
    console.log(result)
})

>{
    "annex": {
        "domain": "vechain.github.io",
        "timestamp": 1545826770,
        "signer": "0xf6e78a5584c06e2dec5c675d357f050a5402a730"
    },
    "signature": "0x2078a8a2fdfa61df579516162d373cd18b889fc5cb5c5ab51f4e1d71b21742ec6a8072f645502c82bf997529a126bcaefd38df385a079c94f9b2fd03b546aa1400"
}
```

## Types

### Thor.Block

+ `id` - `string`: Identifier of the block (bytes32)
+ `number` - `number`: Number of block
+ `parentID` - `string`: ID of parent block (bytes32)
+ `timestamp` - `number`: Unix timestamp of block
+ `gasLimit` - `number`: Gas limit of the block
+ `beneficiary` - `string`: Address of account to receive block reward
+ `gasUsed` - `number`: Actual gas used of block
+ `totalScore` - `number`: Score of the main chain
+ `txRoot` - `string`: Root hash of transaction in the block (bytes32)
+ `stateRoot` - `string`: Root hash of state (bytes32)
+ `signer` - `string`: Address of who signed the block (bytes20)
+ `transactions` - `Array<string>`: Array of transaction IDs
+ `isTrunk` - `bool`: Whether the block is in trunk

### Thor.Account

+ `balance` - `string`: Account balance in hex string
+ `energy` - `string`: Account energy in hex string
+ `hasCode` - `bool`: Whether the account is a smart contract

### Thor.Transaction

+ `id` - `string`: Identifier of the transaction
+ `chainTag` - `number`: Last byte of genesis block ID
+ `blockRef` - `string`: The BlockRef (an eight-byte array string) includes two parts: the first four bytes contains the block height (number) and the rest four bytes is part of the referred block’s ID. If the referred block is future block, blockNumber + "00000000" should be added
+ `expiration` - `number` : Expiration relative to blockRef (in unit block)
+ `clauses` - [`Array<Thor.Clause>`](#thorclause)
+ `gasPriceCoef` - `number`: Coefficient used to calculate the final gas price
+ `gas`  - `number`: Maximum of gas can be consumed to execute this transaction
origin
+ `nonce` - `string`: Transaction nonce
+ `dependsOn` - `string|null`: ID of the transaction which the current transaction depends (bytes32)
+ `size` - `number`: Byte size of the transaction that is RLP encoded
+ `meta` - [`Thor.Transaction.Meta`](#thortransaction.meta)

### Thor.Clause

+ `to` - `string|null`: The destination address of the message, null for a contract-creation transaction
+ `value`- `string|number`: The value, with a unit of `wei`, transferred through the transaction. Specifically, it plays the role of endowment when the transaction is contract-creation type
+ `data` - `string`: Either the [ABI byte string](http://solidity.readthedocs.io/en/latest/abi-spec.html) containing the data of the function call on a contract or the initialization code of a contract-creation transaction

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
+ `outputs` - [`Array<Thor.Receipt.Output>`](#thorreceiptoutput): Clause's corresponding outputs
+ `meta` - [`Thor.Log.Meta`](#thorlogmeta)

### Thor.Receipt.Output

+ `contractAddress` - `string`: Deployed contract address, if the corresponding clause is a contract deployment clause
+ `events` - [`Array<Thor.Log.Event>`](#thorlogevent): Event log objects produced during clause execution
+ `transfers` - [`Array<Thor.Log.Transfer>`](#thorlogtransfer) Transfer log produced during clause execution

### Thor.Log.Event

+ `address` - `string`: The address of contract which produces the event (bytes20)
+ `topics` - `Array<string>`: an array with max 5 32 Byte topics, topic 1-4 contains indexed parameters of the log
+ `data` - `string`: The data containing non-indexed log parameter
+ `meta`  - [`Thor.Log.Meta`](#thorlog.meta)
+ `decoded`  - [`Thor.Decoded(optional)`](#thordecoded): Decoded event log based on the event ABI

### Thor.Log.Transfer

+ `sender` - `string`: Address that sends vet.
+ `recipient` - `string`: Address that receives vet.
+ `amount` - `string`: Amount of vet in `wei`.
+ `meta`  - [`Thor.Log.Meta`](#thorlogmeta)

### Thor.Log.Meta

+ `blockID` - `string`: Block identifier of log
+ `blockNumber` - `number`: Block number of log
+ `blockTimestamp` - `number`: Block unix timestamp of log
+ `txID` - `string`: Transaction identifier of the log
+ `txOrigin` - `string`: Transaction signer the log

### Thor.VMOutput

+ `data` - `string`: The returned data of the operation(hex string), e.g. a smart contract function returned value
+ `vmError` - `string`: VM error that occurred during the execution
+ `reverted` - `boolean`: Indicated whether the execution is reverted by the VM
+ `events` - [`Array<Thor.Log.Event>`](#thorlogevent): Event logs that produced during the execution
+ `transfer` - [`Array<Thor.Log.Transfer`](#thorlogtransfer): Transfer logs that produced during the execution
+ `decoded`  - [`Thor.Decoded(optional)`](#thordecoded): Decoded returned data based on the method ABI

### Thor.Filter.Result

+ `Thor.Filter.Event.Result` - [`Thor.Log.Event`](#thorlogevent)
+ `Thor.Filter.Transfer.Result` - [`Thor.Log.Transfer`](#thorlogtransfer)

### Thor.Decoded

`Decoded` is a mixed object that produced by `ABI.decode` with the ABI definition of `EVENT` or `METHOD`.Decoded will be present only at the ABI definition is provided.

+ `string` - `any`: Decoded property based on the ABI

For example if a method's definition is `function name() public pure returns(string name)` after perform the simulate call `decoded` will be like following: 

``` javascript
{
    "0": "VeThor",
    "__length__": 1,
    "name": "VeThor"
}
```

You can access the name by calling `decoded['name']` or `decoded['0']`(Number index is for non-named outputs).

Another example if an event's definition is `event Transfer(address indexed _from, address indexed _to, uint256 _value)` after performing the filter `decoded` will be the following: 

``` javascript
{
    "0": "0x7567D83b7b8d80ADdCb281A71d54Fc7B3364ffed",
    "1": "0x00F34f4462c0f6a6f5E76Fb1b6D63F05A32eD2C6",
    "2": "1000000000000000000",
    "__length__": 3,
    "_from": "0x7567D83b7b8d80ADdCb281A71d54Fc7B3364ffed",
    "_to": "0x00F34f4462c0f6a6f5E76Fb1b6D63F05A32eD2C6",
    "_value": "1000000000000000000"
}
```
