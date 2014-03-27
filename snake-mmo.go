package main

import (
	"fmt"
	"github.com/samertm/snake-mmo/server"
	_ "github.com/samertm/snake-mmo/engine" // DEBUG
)

func main() {
	fmt.Println("Liftoff")
	server.ListenAndServe("localhost:4027")
}
