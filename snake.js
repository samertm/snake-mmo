/* the height and width of the canvas should be
 * boardlength * offset.
 */

var scheme = "ws://";
var host = "localhost";
var port = "4027";
var ip = scheme + host + ":" + port;

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
        var colorToString = {
            rd: "Red",
            bk: "Black",
            bl: "Blue",
            wh: "White",
            cy: "Cyan",
            pu: "Purple",
            gr: "Green",
            fo: "Food",
        }
        var canv = document.getElementById("snakegame")
        var ctx = canv.getContext('2d')
        // initialize canvas to white.
        ctx.fillStyle = color["wh"]
        ctx.fillRect(0, 0, offset * boardlength, offset * boardlength)
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
                } else if (scores[i].score > pivot.score) {
                    left.push(scores[i])
                } else if (scores[i].color > pivot.color) {
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
                    str += "<li>" + colorToString[scores[i].color] + " " +
                        scores[i].score + "</li>"
                }
                ul.innerHTML = str
            }
            oldScores = scores
        }
        var drawScreen = function(data, oldTiles) {
            var tmpstr = ""
            var tmparr = []
            var scores = []
            var newTiles = []
            var state = "out"
            // ctx.fillStyle = color["wh"]
            // ctx.fillRect(0, 0, offset * boardlength, offset * boardlength)
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
                        // ctx.fillStyle = color[tmparr[2]]
                        // ctx.fillRect(offset * parseInt(tmparr[0]),
                        //              offset * parseInt(tmparr[1]),
                        //              offset, offset)
                        newTiles.push({color: color[tmparr[2]], x: parseInt(tmparr[0]), y: parseInt(tmparr[1])});
                        tmparr = []
                        tmpstr = ""
                        state = "out"
                    } else {
                        tmpstr += c
                    }
                    break;
                }
            }
            tiles = newTiles.slice(0); // clone tiles
            // Does javascript test member-wise equality?
            var tileEqual = function(t0, t1) {
                return t0.color == t1.color && t0.x == t1.x && t0.y == t1.y;
            }
            for (var i = 0; i < tiles.length; i++) {
                for (var j = 0; j < oldTiles.length; j++) {
                    if (tileEqual(tiles[i], oldTiles[j])) {
                        tiles.splice(i, 1);
                        oldTiles.splice(j, 1);
                        i--;
                        j--;
                        break;
                    }
                }
            }
            for (var i = 0; i < oldTiles.length; i++) {
                ctx.fillStyle = color["wh"];
                ctx.fillRect(offset * oldTiles[i].x, offset * oldTiles[i].y, offset, offset);
            }
            for (var i = 0; i < tiles.length; i++) {
                ctx.fillStyle = tiles[i].color;
                ctx.fillRect(offset * tiles[i].x, offset * tiles[i].y, offset, offset);
            }
            addScores(scores);
            return newTiles;
        }
        var conn = new WebSocket(ip);
        conn.onclose = function(evt) {
            var test = document.createTextNode("connection closed")
            document.getElementById("snakepar").appendChild(test)
        }
        var tiles = []
        conn.onmessage = function(evt) {
            tiles = drawScreen(evt.data, tiles)
        }
        
        var parseKeydown = function(evt) {
            if (conn.readyState == 2 || conn.readyState == 3) {
                // connection is closed or closing
                return
            }
            var code = evt.keyCode;
            switch (code) {
            case 37:
                evt.preventDefault();
                conn.send("left");
                break;
            case 38:
                evt.preventDefault();
                conn.send("up");
                break;
            case 39:
                evt.preventDefault();
                conn.send("right");
                break;
            case 40:
                evt.preventDefault();
                conn.send("down");
                break;
            }
        }
        window.addEventListener('keydown', parseKeydown, true)
    } else {
        var msg = document.createTextNode("Your browser does not support websockets.")
        document.getElementById("snakepar").appendChild(msg)
    }
}
