package main

import (
	"fmt"
)

//export fuga
func hoge(a, b int) int {
	return a + b
}

func main() {
	fmt.Println("Hello World")
}