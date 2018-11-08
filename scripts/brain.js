'use strict'

module.exports = (robot) => {
    const ID = 'id'
    const TODO = 'todo_'
    const TAG = 'tag'

    // simple interface for test
    robot.respond (/set (.+) (.+)/i, (msg) => {
        let key = msg.match[1]
        let value = msg.match[2]

        robot.brain.set(key, value)
        msg.send (`set ${key} = ${value}`)
    })

    robot.respond (/get (.+)/i, (msg) => {
        let key = msg.match[1]
        let value = robot.brain.get(key)
        msg.send (`get ${key} = ${value}`)
    })

    robot.respond (/del (.+)/i, (msg) => {
        let key = msg.match[1]
        let value = robot.brain.get(key)

        robot.brain.remove(key)
        msg.send (`del ${key} = ${value}`)
    })

    // todo list functions
    robot.respond (/add(?: t:(.+))? (.+)/i, (msg) => {
        let tag = msg.match[1]
        if (tag == undefined) {
            tag = TODO
        } else { 
            tag = `${tag}${SEP}`
        }
        
        let work = msg.match[2]

        let id = robot.brain.get(ID)
        if (id == null) {
            id = 1
        }

        let work_id = `${tag}${id}`
        let next_id = id + 1

        robot.brain.set(work_id, work)
        robot.brain.set(ID, next_id)
        msg.send (`DONE:add ${id}> ${work}`)
    })

    robot.respond (/rm (\d+)/i, (msg) => {
        let id = msg.match[1]
        let del_id = `${TODO}${id}`

        let del_todo  = robot.brain.get(del_id)

        robot.brain.remove(del_id)
        msg.send (`DONE:rm ${id}> ${del_todo}`)
    })

    robot.respond (/mv (\d+) (\d+)/i, (msg) => {
        let src_id = msg.match[1]
        let des_id = parseInt(msg.match[2])

        // update id 
        let id = robot.brain.get(ID)
        if (id == null || des_id > id) {
            let next_id = des_id + 1
            robot.brain.set(ID, next_id)
        }

        let src_todo_id = `${TODO}${src_id}`
        let des_todo_id = `${TODO}${des_id}`

        // return if dest has value
        let check = robot.brain.get(des_todo_id)
        if (check != null) {
            msg.send (`ERR:${des_id} has value ${check}`)
            return
        }

        // mv to dest
        let todo = robot.brain.get(src_todo_id)
        robot.brain.set(des_todo_id, todo) 
        robot.brain.remove(src_todo_id)
        msg.send (`DONE:mv ${src_id} to ${des_id}`)
    })

    robot.respond (/ls/i, (msg) => {
        let data = robot.brain.data._private
        let res = ''
        let keys = Object.keys(data).sort((a, b) => {
            let a_id = parseInt(a.substring('todo_'.length))
            let b_id = parseInt(b.substring('todo_'.length))
            return a_id > b_id ? 1 : -1;
        })
        keys.forEach((key) => {
            if (key.startsWith('todo_')) {
                let id = key.substring('todo_'.length)
                res += `${id}> ${data[key]}\n`
            }
        })
        
        msg.send (res)
    })

    robot.respond (/save/i, (msg) => {
        robot.brain.save()
        msg.send ('DONE:save')
    })
}
