var exec = require('child_process').exec,
    waterfall = require('async-waterfall'),
    config = require('./config/adbConfig.js'),
    time = 0

function docmd(command){
  var cmd = exec(command);
  cmd.on('data',function(data){
    console.log(data);
  })
  cmd.on('close', function(err,stdout,stderr) {
    if (err) {
    console.error(command+` exec error: ${err}`);
    return;
  }else{
        console.log("done with "+command)
  }
  })
}

function killServer(callBack) {
    docmd('adb kill-server')
    callBack()
}

function tcpip(callBack) {
    docmd('adb tcpip 5555')
    callBack()
}

function connect(callBack) {
    docmd('adb connect ' + config.androidDevice.IP + ':5555')
    callBack()
}

function sendADBCommand(command){
  switch(command){
    case "play"||"pause":
      console.log("sent command "+command)
      docmd(config.androidDevice.adbCmd)
    break;
    default:
    break;
  }

}

function controller() {
    var devices = exec('adb devices')
    devices.stdout.on('data', function(data) {
        if (data.search(config.androidDevice.IP) == -1) {
          console.log("no connection to "+config.androidDevice.IP+" attempting tp connect")
            waterfall([killServer,
                tcpip,
                connect
            ], function(err, result) {
              if(err){
                return false;
              }
                console.log(result)
            })
        }else{
          console.log("connected to "+config.androidDevice.IP+" awaiting arps")
        }
    })
}

function setConf(conf){
  config.androidDevice.IP = conf.androidDeviceIP
  config.androidDevice.adbCmd = conf.adbCommand
}

exports.configure = setConf
exports.initialize = controller
