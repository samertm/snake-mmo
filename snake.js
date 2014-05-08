/* the height and width of the canvas should be
 * boardlength * offset. Substitute ws://localhost:4027
 * with your url.
 */
window.onload = function () {
    if (window["WebSocket"]) {
        var boardlength = 32
        var offset = 16
        var color = {
            rd: "rgb(255,0,0)",
            bk: "rgb(0,0,0)",
            bl: "rgb(0,0,255)",
            wh: "rgb(255,255,255)",
            cy: "rgb(0,255,255)",
            pu: "rgb(128,0,128",
            gr: "rgb(0,255,0)",
            fo: "rgb(192,192,192)"
        }
        var canv = document.getElementById("snakegame")
        var ctx = canv.getContext('2d')
        var oldScores = []
        var scoresEqual = function(scores0, scores1) {
            if (scores0.length != scores1.length) {
                return false
            }
            for (var i = 0; i < scores0.length; i++) {
                if (scores0[i].color != scores1[i].color) {
                    return false
                } else if (scores0[i].score != scores1[i].score) {
                    return false
                }
            }
            return true
        }
        var sortScores = function(scores) {
            if (scores.length == 0) {
                return []
            } else if (scores.length == 1) {
                return scores
            }
            var pivotindex = Math.floor(scores.length/2)
            var pivot = scores[pivotindex]
            scores.splice(pivotindex, 1)
            var left = []
            var right = []
            for (var i = 0; i < scores.length; i++) {
                if (scores[i].score < pivot.score) {
                    right.push(scores[i])
                } else {
                    left.push(scores[i])
                }
            }
            return sortScores(left).concat(pivot).concat(sortScores(right))
        }
        var snakepar = document.getElementById("snakepar")
        var ul = document.getElementById("snakescores")
        var addScores = function(scores) {
            scores = sortScores(scores)
            if (!scoresEqual(oldScores, scores)) {
                var str = ""
                for (var i = 0; i < scores.length; i++) {
                    str += "<li>" + scores[i].color + " " +
                        scores[i].score + "</li>"
                }
                ul.innerHTML = str
            }
            oldScores = scores
        }
        var drawScreen = function(data) {
            var tmpstr = ""
            var tmparr = []
            var scores = []
            var state = "out"
            ctx.fillStyle = color["wh"]
            ctx.fillRect(0, 0, offset * boardlength, offset * boardlength)
            for (var i = 0; i < data.length; i++) {
                var c = data[i]
                switch (state) {
                case "out":
                    if (c == "(") {
                        state = "in-msg"
                        tmpstr = ""
                        tmparr = []
                    } else {
                        return false
                    }
                    break;
                case "in-msg":
                    if (c == " ") {
                        if (tmpstr == "loc") {
                            state = "in-loc"
                            tmpstr = ""
                        } else if (tmpstr = "score") {
                            state = "in-score"
                            tmpstr = ""
                        } else {
                            console.log("ERROR: " + tmpstr)
                            state = "out"
                            tmpstr = ""
                        }
                    } else {
                        tmpstr += c
                    }
                    break;
                case "in-score":
                    if (c == " ") {
                        tmparr.push(tmpstr)
                        tmpstr = ""
                    } else if (c == ")") {
                        tmparr.push(tmpstr)
                        // tmparr[0] is the color, tmparr[1] is the score
                        scores.push({color: tmparr[0], score: Number(tmparr[1])})
                        tmparr = []
                        tmpstr = ""
                        state = "out"
                    } else {
                        tmpstr += c
                    }
                    break;
                case "in-loc":
                    if (c == " ") {
                        tmparr.push(tmpstr)
                        tmpstr = ""
                    } else if (c == ")") {
                        tmparr.push(tmpstr)
                        ctx.fillStyle = color[tmparr[2]]
                        ctx.fillRect(offset * parseInt(tmparr[0]),
                                     offset * parseInt(tmparr[1]),
                                     offset, offset)
                        tmparr = []
                        tmpstr = ""
                        state = "out"
                    } else {
                        tmpstr += c
                    }
                    break;
                }
            }
            addScores(scores)
        }
        var conn = new WebSocket("ws://localhost:4027")
        conn.onclose = function(evt) {
            var test = document.createTextNode("connection closed")
            document.getElementById("snakepar").appendChild(test)
        }
        conn.onmessage = function(evt) {
            drawScreen(evt.data)
        }
        
        var parseKeydown = function(evt) {
            if (conn.readyState == 2 || conn.readyState == 3) {
                // connection is closed or closing
                return
            }
            evt.preventDefault()
            var code = evt.keyCode;
            switch (code) {
            case 37: conn.send("left"); break;
            case 38: conn.send("up"); break;
            case 39: conn.send("right"); break;
            case 40: conn.send("down"); break;
            }
        }
        window.addEventListener('keydown', parseKeydown, true)
    } else {
        var msg = document.createTextNode("Your browser does not support websockets.")
        document.getElementById("snakepar").appendChild(msg)
    }
}
