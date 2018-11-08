fs = require('fs')

module.exports = (robot) ->
    robot.respond /pm25/i, (res) ->
        robot.emit 'bearychat.attachment',
            message: res.message
            text: 'Beijing pm2.5'
            attachments: [
              {
                color: '#cb3f20',
                text: '北京pm2.5',
              },
              {
                images: [
                  #{url: 'https://img.pconline.com.cn/images/upload/upc/tx/wallpaper/1302/28/c4/18501796_1362032328501.jpg'},
                  #{file: fs.createReadStream("/home/guoxuedong/bin/cutycapt/bin/google.jpg")},
                  {file: "/home/guoxuedong/bin/cutycapt/bin/google.jpg"},
                ]
              }
            ]
