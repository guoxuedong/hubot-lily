'use strict'

const NEXT_ID = 'next_id'
const TAGS = 'tags'
const SEP = '_'

const KEY_T = 't';
const KEY_V = 'v';

const TODO = 'todo'
const BUCKET = 'bucket'
const MONITOR = 'monitor'
const ARCHIVE = 'archive'
const DONE = 'done'

function change_tag(robot, id, data, tag_src, tag_dest) {
    // update data's tag
    data[KEY_T] = tag_dest
    robot.brain.set(id, data)
    
    // delete id from src tag
    let ids = robot.brain.get(tag_src)
    let index = ids.indexOf(id)
    if (index < 0) {
        return `t:${tag_src} has no ${id} in ${ids}`
    }
    ids.splice(index, 1)
    robot.brain.set(tag_src, ids)
    
    // remove tag if need
    if (ids.length == 0) {
        remove_tag(robot, tag_src)
    }
    
    // add id to dest tag
    let ids_add = robot.brain.get(tag_dest) || []
    ids_add.push(id)
    robot.brain.set(tag_dest, ids_add)

    add_tag(robot, tag_dest)

    return `mv ${id}> ${data[KEY_V]} from t:${tag_src} to t:${tag_dest}`
}

function remove_tag_data(robot, id, data) {
    // delete id from tag list
    let tag = data[KEY_T]
    let ids = robot.brain.get(tag)
    let index = ids.indexOf(id)
    ids.splice(index, 1)
    robot.brain.set(tag, ids)

    // remove tag if need
    if (ids.length == 0) {
        remove_tag(robot, tag)
    }

    // delete data
    robot.brain.remove(id)
    return `rm ${id}> ${data[KEY_V]} in t:${tag}`
}

function add_tag(robot, tag){
    let taglist = robot.brain.get(TAGS) || []
    let index = taglist.indexOf(tag)
    if (index < 0) {
        taglist.push(tag)
        robot.brain.set(TAGS, taglist)
    }
}

function remove_tag(robot, tag) {
    // remove tag
    robot.brain.remove(tag)

    // update tag list
    let taglist = robot.brain.get(TAGS)
    let index = taglist.indexOf(tag)
    if (index >= 0) {
        taglist.splice(index, 1)
        robot.brain.set(TAGS, taglist)
    }
} 

module.exports = (robot) => {

    // TODO -ok-> DONE
    // TODO -rm-> BUCKET
    // TODO -see-> MONITOR

    // BUCKET -do-> TODO
    // BUCKET -see-> MONITOR
    // BUCKET -rm-> ARCHIVE

    // MONITOR -do-> TODO
    // MONITOR -ok-> DONE
    // MONITOR -rm-> ARCHIVE

    // ARCHIVE -rm-> delete

    // todo list functions
    robot.respond (/add(?: t:(.+))? (.+)/i, (msg) => {
        let tag = msg.match[1] || TODO
        let work = msg.match[2]

        let data = Object.create(null)
        data[KEY_T] = tag
        data[KEY_V] = work

        let id = robot.brain.get(NEXT_ID) || 1
        let ids = robot.brain.get(tag) || []
        ids.push(id)

        robot.brain.set(id, data)
        robot.brain.set(NEXT_ID, id + 1)
        robot.brain.set(tag, ids)
        add_tag(robot, tag)
        msg.send (`OK: add t:${tag} ${id}> ${work}`)
    })

    robot.respond (/rm (\d+)/i, (msg) => {
        let id = parseInt(msg.match[1])

        let data  = robot.brain.get(id)
        if (data == null) {
            msg.send (`ERR: no data for ${id}`)
            return
        }
        let tag = data[KEY_T]
        let res = ''
        switch (tag) {
            case TODO:
                res = change_tag(robot, id, data, TODO, BUCKET)
                break
            case BUCKET:
                res = change_tag(robot, id, data, BUCKET, ARCHIVE)
                break
            case MONITOR:
                res = change_tag(robot, id, data, MONITOR, ARCHIVE)
                break
            case ARCHIVE:
            default:
                res = remove_tag_data(robot, id, data)
        }

        msg.send (`OK: ${res}`)
    })

    robot.respond (/do (\d+)/i, (msg) => {
        let id = parseInt(msg.match[1])

        let data  = robot.brain.get(id)
        if (data == null) {
            msg.send (`ERR: no data for ${id}`)
            return
        }
        let tag = data[KEY_T]
        let res = ''
        switch (tag) {
            case BUCKET:
                res = change_tag(robot, id, data, BUCKET, TODO)
                break
            case MONITOR:
                res = change_tag(robot, id, data, MONITOR, TODO)
                break
            default:
                msg.send (`ERR: can't do ${tag}`)
                return
        }

        msg.send (`OK: ${res}`)
    })

    robot.respond (/see (\d+)/i, (msg) => {
        let id = parseInt(msg.match[1])

        let data  = robot.brain.get(id)
        if (data == null) {
            msg.send (`ERR: no data for ${id}`)
            return
        }
        let tag = data[KEY_T]
        let res = ''
        switch (tag) {
            case BUCKET:
                res = change_tag(robot, id, data, BUCKET, MONITOR)
                break
            case TODO:
                res = change_tag(robot, id, data, TODO, MONITOR)
                break
            default:
                msg.send (`ERR: can't see ${tag}`)
                return
        }

        msg.send (`OK: ${res}`)
    })

    robot.respond (/ok (\d+)/i, (msg) => {
        let id = parseInt(msg.match[1])

        let data  = robot.brain.get(id)
        if (data == null) {
            msg.send (`ERR: no data for ${id}`)
            return
        }
        let tag = data[KEY_T]
        let res = ''
        switch (tag) {
            case MONITOR:
                res = change_tag(robot, id, data, MONITOR, DONE)
                break
            case TODO:
                res = change_tag(robot, id, data, TODO, DONE)
                break
            default:
                msg.send (`ERR: can't finish ${tag}`)
                return
        }

        msg.send (`OK: ${res}`)
    })

    robot.respond (/mv (\d+) (\d+)/i, (msg) => {
        let src_id = parseInt(msg.match[1])
        let des_id = parseInt(msg.match[2])

        // update id 
        let id = robot.brain.get(NEXT_ID)
        if (id == null || des_id >= id) {
            robot.brain.set(NEXT_ID, des_id + 1)
        }

        // return if dest has value
        let check = robot.brain.get(des_id)
        if (check != null) {
            msg.send (`ERR: ${des_id} has value ${check}`)
            return
        }

        // mv to dest
        let data = robot.brain.get(src_id)
        robot.brain.set(des_id, data) 
        robot.brain.remove(src_id)

        // update ids
        let tag = data[KEY_T]
        let ids = robot.brain.get(tag)
        let index = ids.indexOf(src_id)
        ids.splice(index, 1, des_id)
        robot.brain.set(tag, ids)

        msg.send (`OK: mv ${src_id} to ${des_id}`)
    })

    robot.respond (/ls(?: t:(.+))?/i, (msg) => {
        let tag_query = msg.match[1] // undefined if not exist

        let taglist = []
        if (tag_query == undefined) {
            taglist = robot.brain.get(TAGS) || []
        } else {
            taglist.push(tag_query)
        }

        let res = ''
        taglist.forEach((tag) => {
            let ids = robot.brain.get(tag)
            let sort_ids = ids.sort((a, b) => {
                return a > b ? 1 : -1;
            })

            res += `${tag}:\n`
            sort_ids.forEach((id) => {
                let data = robot.brain.get(id)
                if (tag != data[KEY_T]) {
                    throw new Error(`ERR: ${tag} != ${data[KEY_T]}`)
                }
                res += `${id}> ${data[KEY_V]}\n`
            })
            res += '--------\n'
        })
      
        msg.send(res)
    })

    robot.respond (/up t:(.+)/i, (msg) => {
        let tag = msg.match[1]

        let taglist = robot.brain.get(TAGS) || []
        let index = taglist.indexOf(tag)
        if (index < 0) {
            msg.send ('ERR: ${tag} not exist')
            return
        } else if (index == 0) {
            msg.send ('ERR: ${tag} is the first')
            return
        }

        taglist.splice(index, 1)
        taglist.splice(index-1 , 0, tag)
        robot.brain.set(TAGS, taglist)
        msg.send ('OK: up ${tag}')
    })

    robot.respond (/down t:(.+)/i, (msg) => {
        let tag = msg.match[1]

        let taglist = robot.brain.get(TAGS) || []
        let index = taglist.indexOf(tag)
        if (index < 0) {
            msg.send ('ERR: ${tag} not exist')
            return
        } else if (index == taglist.length - 1) {
            msg.send ('ERR: ${tag} is the last')
            return
        }

        taglist.splice(index, 1)
        taglist.splice(index+1 , 0, tag)
        robot.brain.set(TAGS, taglist)
        msg.send ('OK: down ${tag}')
    })

    robot.respond (/save/i, (msg) => {
        robot.brain.save()
        msg.send ('OK: save')
    })

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
}