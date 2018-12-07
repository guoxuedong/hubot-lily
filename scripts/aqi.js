'use strict'

let exec = require('child_process').exec

function makeUrl2Pic(){
}

function upload(){
}

function aqi(robot, msg){
  let cmd = `curl -s "http://aqicn.org/city/beijing/haidianwanliu/" | awk -F"http://wgt.aqicn.org/aqiwgt/" '{print $2}' | awk -F".png" '{print "http://wgt.aqicn.org/aqiwgt/"$1".png"}'`

  exec(cmd, function(error, stdout, stderr) {
    if(error) {
        msg.send (`ERR: get aqi error ${error}:${stderr}`)
        return;
    }

    robot.emit ('bearychat.attachment',
      {
        message: msg.message,
        text: '北京海淀 pm2.5',
        attachments: [
        /*
          {
            color: '#cb3f20',
            text: '北京pm2.5',
          },
          */
          {
            images: [{url: stdout}]
          }
        ]
      }
    )
  })
}

module.exports = (robot) => {
  robot.respond (/aqi/i, (msg) => aqi(robot, msg))
}
