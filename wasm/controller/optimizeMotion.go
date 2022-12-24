package controller

import (
	"errors"

	. "github.com/kajikentaro/VSCodeVim/wasm/model"
)

func Optimize(optIn OptimizerInput) (OptimizerOutput, error) {
	if optIn.EditorText == "" {
		return OptimizerOutput{}, errors.New("テキストが空です")
	}

	action := Action{[]string{"k"}, "up"}
	actions := []Action{action}
	return OptimizerOutput{actions}, nil
}
