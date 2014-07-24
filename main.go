package main

import (
	"flag"
	"fmt"

	"github.com/samertm/snake-mmo/server"
)

func main() {
	host := flag.String("host", "localhost", "Sets the host name.")
	port := flag.String("port", "4027", "Sets the port.")
	fmt.Println("Liftoff")
	ip := *host + ":" + *port
	server.ListenAndServe(ip)
}
