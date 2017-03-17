var aws = require('aws-sdk')
var config = require('./config.json')
    aws.config.loadFromPath('./config.json');
var DynamoDBStream = require('dynamodb-stream')
var schedule = require('tempus-fugit').schedule
var deepDiff = require('deep-diff').diff

var pk = 'id'
var ddb = new aws.DynamoDB()
var ddbStream = new DynamoDBStream(new aws.DynamoDBStreams(), config.dynamodbArn)

var localState = {}


// fetch stream state initially
ddbStream.fetchStreamState(function (err) {
    if (err) {
        console.error(err)
        return process.exit(1)
    }

    // fetch all the data
    ddb.scan({ TableName: 'macca_macca' }, function (err, results) {
        localState = // parse result and store in localSate
        // do this every 1 minute, starting from the next round minute
        schedule({ minute: 0.001 }, function (job) {
            ddbStream.fetchStreamState(job.callback())
        })
    })
})

ddbStream.on('insert record', function (data) {
    localState[data.id] = data
    console.log("record inserted");
})

ddbStream.on('remove record', function (data) {
    delete localState[data.id]
})

ddbStream.on('modify record', function (newData, oldData) {
    var diff = deepDiff(oldData, newData)
    if (diff) {
        // handle the diffs
    }
})

ddbStream.on('new shards', function (shardIds) {})
ddbStream.on('remove shards', function (shardIds) {})
