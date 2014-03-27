package server

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/websocket"
	"github.com/samertm/snake-mmo/engine"
)

const (
	writeWait = 10 * time.Second
	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

func createSendData() []byte {
	// naive send
	data := make([]byte, 0, 50)
	for i := 0; i < engine.BoardSize; i++ {
		for j := 0; j < engine.BoardSize; j++ {
			val := engine.Board[i][j]
			if val == "" {
				continue
			}
			data = append(data, '(')
			data = append(data, strconv.Itoa(i)...)
			data = append(data, ' ')
			data = append(data, strconv.Itoa(j)...)
			data = append(data, ' ')
			data = append(data, val...)
			data = append(data, ')')
		}
	}
	return data
}

func decodeDir(dir []byte) (engine.Direction, error) {
	d := string(dir)
	var result engine.Direction = engine.Right
	var err error = nil
	switch d {
	case "up":
		result = engine.Up
	case "down":
		result = engine.Down
	case "right":
		result = engine.Right
	case "left":
		result = engine.Left
	default:
		err = errors.New("decodeDir: invalid dir")
	}
	return result, err
}

func handleWs(w http.ResponseWriter, r *http.Request) {
	ws, err := websocket.Upgrade(w, r, nil, 1024, 1024)
	if _, ok := err.(websocket.HandshakeError); ok {
		http.Error(w, "Not a websocket handshake", 400)
		return
	} else if err != nil {
		log.Println(err)
		return
	}
	c := &client{
		ws:            ws,
		send:          make(chan []byte, 256),
		move:          make([]byte, 0, 15),
		moveSemaphore: make(chan int),
	}
	h.register <- c
	go c.writePump()
	c.readPump()
}

type hub struct {
	clients    map[*client]int
	broadcast  chan []byte
	register   chan *client
	unregister chan *client
	update     chan *client
	tick       <-chan time.Time
}

var h = hub{
	clients:    make(map[*client]int),
	broadcast:  make(chan []byte),
	register:   make(chan *client),
	unregister: make(chan *client),
	update:     make(chan *client),
	tick:       time.Tick(time.Second),
}

func (h *hub) run() {
	id := 0
	for {
		select {
		case c := <-h.register:
			h.clients[c] = id
			id++
			// DEBUG add engine stuff
			engine.AddSnakeEmptyPoint(h.clients[c])
		case c := <-h.unregister:
			engine.RemoveSnake(h.clients[c])
			delete(h.clients, c)
			close(c.send)
		case c := <-h.update:
			// DEBUG
			fmt.Println(string(c.move))
			dir, err := decodeDir(c.move)
			c.moveSemaphore <- 0
			if err != nil {
				fmt.Println(err)
			}
			engine.AddDir(h.clients[c], dir)
		case <-h.tick:
			if len(h.clients) != 0 {
				go func() {
					engine.Tick()
					h.broadcast <- createSendData()
				}()
			}
		case d := <-h.broadcast:
			for c := range h.clients {
				select {
				case c.send <- d:
				default:
					close(c.send)
					delete(h.clients, c)
				}
			}
		}
	}
}

func ListenAndServe(ipaddr string) {
	fmt.Printf("Setup server on ws://%s\n", ipaddr)
	http.HandleFunc("/", handleWs)
	go h.run()
	if err := http.ListenAndServe(ipaddr, nil); err != nil {
		log.Fatal(err)
	}
}
