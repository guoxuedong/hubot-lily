module.exports = (robot) ->
    robot.respond /qr (.+)/i, (res) ->
        quest_url = res.match[1]

        robot.emit 'bearychat.attachment',
            message: res.message
            text: quest_url
            attachments: [
              {
                images: [
                  {url: 'http://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + quest_url},
                ]
              }
            ]

