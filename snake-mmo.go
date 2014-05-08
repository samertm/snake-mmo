package main

import (
	"fmt"
	"github.com/samertm/snake-mmo/server"
)

func main() {
	fmt.Println("Liftoff")
	server.ListenAndServe("samertm.com:4027")
}
