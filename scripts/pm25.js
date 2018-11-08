'use strict'

// let request = require('request');
let spawn = require('child_process').spawn;


function makePm25Pic(){
}

function upload(){
}

function pm(robot, res){
  let handle = spawn("/home/guoxuedong/bin/cutycapt/bin/run.sh", [], {})
  handle.stdout.on('data', (data) => 
  {
    console.log("xx:" + data)
  })
}


module.exports = function (robot) {
  robot.respond (/pm3/i, (res) => pm(robot, res))
}
