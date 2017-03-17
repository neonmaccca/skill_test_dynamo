var aws = require('aws-sdk')
var config = require('./config/config.json')
    aws.config.loadFromPath('./config/config.json');
var DynamoDBStream = require('dynamodb-stream')
var schedule = require('tempus-fugit').schedule
var deepDiff = require('deep-diff').diff
var adb = require('./adb/adb.js')
var pk = 'id'
var ddb = new aws.DynamoDB()
var ddbStream = new DynamoDBStream(new aws.DynamoDBStreams(), config.dynamodbArn)
var localState = {}
    adb.configure({
      androidDeviceIP: "192.168.0.106",
      adbCommand: "adb shell input keyevent 85"
    })

    if(!adb.initialize()){
      console.log("couldnt connect to adb device")
      process.exit();
    }

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
    console.log("record inserted "+data.action);
})
