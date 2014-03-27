package server

import (
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

func CreateSendData() []byte {
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
}

type hub struct {
	clients    map[*client]bool
	broadcast  chan []byte
	register   chan *client
	unregister chan *client
	update     chan *client
}

var h = hub{
	clients:    make(map[*client]bool),
	broadcast:  make(chan []byte),
	register:   make(chan *client),
	unregister: make(chan *client),
	update:     make(chan *client),
}

func (h *hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.clients[c] = true
			// DEBUG add engine stuff
		case c := <-h.unregister:
			delete(h.clients, c)
			close(c.send)
		case c := <-h.update:
			// DEBUG
			fmt.Println(string(c.move))
			c.moveSemaphore <- 0
		case d := <-h.broadcast:
			for c := range h.clients {
				select {
				case c.send <- d:
					continue
				default:
					close(c.send)
					delete(h.clients, c)
				}
			}
		}
	}
}

func ListenAndServe(ipaddr string) {
	fmt.Printf("Setup server on ws://%s/ws\n", ipaddr)
	http.HandleFunc("/ws", handleWs)
	if err := http.ListenAndServe(ipaddr, nil); err != nil {
		log.Fatal(err)
	}
}
