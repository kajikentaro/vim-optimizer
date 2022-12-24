package handler

import (
	"unsafe"

	"github.com/kajikentaro/VSCodeVim/wasm/controller"
	. "github.com/kajikentaro/VSCodeVim/wasm/model"
)

var buf [1048576]byte
var bufSize uint32

//export wasmHandler
func wasmHandler() uint32 {
	optIn := OptimizerInput{originPosition, destinationPosition, editorText}
	optOut, err := controller.Optimize(optIn)

	var res OptimizerOutputJson

	if err != nil {
		res = OptimizerOutputJson{[]Action{}, false, err.Error()}
	} else {
		res = OptimizerOutputJson{optOut.Actions, true, ""}
	}

	optOutStr, _ := res.MarshalJSON()

	ptr, size := stringToPtr(string(optOutStr))
	bufSize = size
	return ptr
}

var destinationPosition Position

//export setDestinationPosition
func setDestinationPosition(line, character int) {
	destinationPosition.Line = line
	destinationPosition.Character = character
}

var originPosition Position

//export setOriginPosition
func setOriginPosition(line, character int) {
	// originPosition.Line = line
	// originPosition.Character = character
	originPosition = Position{line, character}
}

var editorText string

//export setEditorText
func setEditorText(editorTextIn string) {
	editorText = editorTextIn
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
