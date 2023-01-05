package controller

import (
	"github.com/kajikentaro/VSCodeVim/wasm/model"
)

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

func genMoveToMatchingBracket() Action {
	action := Action{}
	action.ActionName = "MoveToMatchingBracket"
	action.ActionKeys = []string{"%"}
	action.run = func(editorText []string, origin model.Position) model.Position {
		if editorText[origin.Line] == "" {
			return origin
		}

		// カーソルを実際に表示されている位置にする
		origin.Character = min(origin.Character, len(editorText[origin.Line])-1)

		// カーソルより後ろで同じ行内の最も近い括弧を検索する
		bracketCursor := ""
		bracketList := []string{"(", ")", "[", "]", "{", "}"}
		for j := origin.Character; j < len(editorText[origin.Line]); j++ {
			char := editorText[origin.Line][j : j+1]
			if find(bracketList, char) != -1 {
				bracketCursor = char
				origin.Character = j
				break
			}
		}

		if bracketCursor == "" {
			// 見つからなかった場合
			return origin
		}

		// 対になる括弧が何かを導く
		var bracketOpposite string
		idx := find(bracketList, bracketCursor)
		if idx%2 == 0 {
			bracketOpposite = bracketList[idx+1]
		} else {
			bracketOpposite = bracketList[idx-1]
		}

		// 対になる括弧を検索する
		cursorNestCnt := 0
		for i := origin.Line; i < len(editorText); i++ {
			for j := origin.Character; j < len(editorText[i]); j++ {
				if editorText[i][j:j+1] == bracketOpposite {
					cursorNestCnt--
				}
				if editorText[i][j:j+1] == bracketCursor {
					cursorNestCnt++
				}
				if cursorNestCnt == 0 {
					return model.Position{Line: i, Character: j}
				}
			}
		}

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

func find(s []string, e string) int {
	for idx, a := range s {
		if a == e {
			return idx
		}
	}
	return -1
}
