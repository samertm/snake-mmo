# Multiplayer Snake

I'm porting the server from my previous snake-python project from Python 3 to Go, and the frontend to Javascript using HTML5 bindings.

## Setup

Run the command 'go get github.com/gorilla/websocket' to grab the only dependency. Run 'go install' inside of the source directory to install 'snake-mmo' into '$GOPATH/bin'. Then, start the server with 'snake-mmo' (or '$GOPATH/bin/snake-mmo'), and open snake.html in a web browser.

## Hacker School Task: Highscores and Current Scores List

We need to modify the server to compute and pass the high/current scores, and we need to modify the frontend to parse the high/current scores and attach them to the DOM. Changes that need to be made:

### Message Passing and Parsing
* The message format needs to be changed from "\(\d+ \d+ \w+\)*" (the escaped parentheses, like "\(", mean literal parentheses in the string) to the following in BNF:

````
          message ::== "(" \<message-part\> ")"
     message-part ::== \<location-message\> 
                     | \<score-message\>
                     | \<name-message\>
                     | \<direction-message\>
 location-message ::== "loc  " \<number\> " " \<number\> " " \<color\>
    score-message ::== "score " \<string\> " " \<number\>
     name-message ::== "name " \<string\>
direction-message ::== "dir " \<direction\>
        direction ::== "left" | "right" | "up" | "down"
            color ::== a string defined as a constant in color.go
````

#### Server side

* func createSendData's internals should be refactored into two functions, createLocationData and createScoreData, which are then concatenated together and returned by createSendData.

* func decodeMessage needs to be created, which parses the message passed througrh the websocket connection and calls either func decodeDir or func decodeName. It should be called in the "case c := <-h.update" block in func (h *hub) run.

* func decodeName needs to be created, to parse and return a name.

#### Client side

* Update drawScreen to parse incoming messages. Think about refactoring the parsing part into multiple functions.

### Name/Score Functionality

#### Server side

* Update snake data structure in snake.go to hold name. Update all add snake functions in engine.go and snake.go.

* Update server.go to wait until a name message has been passed from the client to create a snake.

#### Client side

* Add a prompt for entering your name at start up.

* Create function to pass name to the the server.
