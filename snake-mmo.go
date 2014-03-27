package main

import (
	"fmt"
	"github.com/samertm/snake-mmo/server"
)

func main() {
	fmt.Println("Liftoff")
	server.ListenAndServe("localhost:4027")
}
