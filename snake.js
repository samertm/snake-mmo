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
            gr: "rgb(0,0,255)",
            fo: "rgb(192,192,192)"
        }
        var canv = document.getElementById("snakegame")
        var ctx = canv.getContext('2d')
        var drawScreen = function(data) {
            var tmpstr = ""
            var tmparr = []
            var state = "out"
            ctx.fillStyle = color["wh"]
            ctx.fillRect(0, 0, offset * boardlength, offset * boardlength)
            for (var i = 0; i < data.length; i++) {
                var c = data[i]
                switch (state) {
                case "out":
                    if (c == "(") {
                        state = "in"
                        tmpstr = ""
                        tmparr = []
                    } else {
                        return false
                    }
                    break;
                case "in":
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
