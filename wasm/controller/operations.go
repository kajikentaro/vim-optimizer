package controller

import "github.com/kajikentaro/VSCodeVim/wasm/model"

type Action struct {
	model.Action
	run func([]string, model.Position) model.Position
}

func genMoveUp() Action {
	action := Action{}
	action.ActionName = "MoveUp"
	action.ActionKeys = []string{"k"}
	action.run = func(editorText []string, origin model.Position) model.Position {
		origin.Line = max(0, origin.Line-1)
		return origin
	}
	return action
}

func genMoveDown() Action {
	action := Action{}
	action.ActionName = "MoveDown"
	action.ActionKeys = []string{"j"}
	action.run = func(editorText []string, origin model.Position) model.Position {
		origin.Line = min(len(editorText)-1, origin.Line+1)
		return origin
	}
	return action
}

func genMoveRight() Action {
	action := Action{}
	action.ActionName = "MoveRight"
	action.ActionKeys = []string{"l"}
	action.run = func(editorText []string, origin model.Position) model.Position {
		origin.Character = min(origin.Character+1, len(editorText[origin.Line])-1)
		origin.Character = max(0, origin.Character)
		return origin
	}
	return action
}

func genMoveLeft() Action {
	action := Action{}
	action.ActionName = "MoveLeft"
	action.ActionKeys = []string{"h"}
	action.run = func(editorText []string, origin model.Position) model.Position {
		origin.Character = min(origin.Character-1, len(editorText[origin.Line])-2)
		origin.Character = max(0, origin.Character)
		return origin
	}
	return action
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a < b {
		return b
	}
	return a
}
