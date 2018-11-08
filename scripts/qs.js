'use strict'

module.exports = (robot) =>
  robot.respond (/qs/i, (res) => {
      let qs_string = `def qsort(arr):\n  return [] if arr == [] else qsort([y for y in arr[1:] if y < arr[0]]) + [arr[0]] + qsort([y for y in arr[1:] if y >= arr[0]])`
      res.send (qs_string)
    }
  )
