package main

import (
	"unsafe"
)

var buf [1048576]byte
var bufSize uint32

//export wasmHandler
func wasmHandler(message string) uint32{
	optimizeResult := optimizeFromJson(message)
	ptr, size:=stringToPtr(optimizeResult)
	bufSize = size
	return ptr
}

//export getBufSize
func getBufSize() uint32 {
	return bufSize
}

func stringToPtr(s string) (uint32, uint32) {
	buf := []byte(s)
	ptr := &buf[0]
	unsafePtr := uintptr(unsafe.Pointer(ptr))
	return uint32(unsafePtr), uint32(len(buf))
}

//export getBuffer
func getBuffer() *byte {
	return &buf[0]
}