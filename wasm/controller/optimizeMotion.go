package controller

import (
	"errors"
	"regexp"

	"github.com/kajikentaro/VSCodeVim/wasm/model"
)

func getAllActions() []Action {
	actions := []Action{}
	actions = append(actions, genMoveUp())
	actions = append(actions, genMoveDown())
	actions = append(actions, genMoveRight())
	actions = append(actions, genMoveLeft())
	actions = append(actions, genMoveToMatchingBracket())
	return actions
}

func Optimize(optIn model.OptimizerInput) (model.OptimizerOutput, error) {
	if optIn.EditorText == "" {
		return model.OptimizerOutput{}, errors.New("EditorText is blank")
	}

	textArray := regexp.MustCompile("\r\n|\n").Split(optIn.EditorText, -1)
	allActions := getAllActions()

	h := len(textArray)
	w := 0
	for _, v := range textArray {
		w = max(w, len(v))
	}

	if h*w >= 1e9 {
		return model.OptimizerOutput{}, errors.New("the length of EditorText exceeds the limit")
	}
	if h < optIn.Destination.Line || w < optIn.Destination.Character || optIn.Destination.Line < 0 || optIn.Destination.Character < 0 {
		return model.OptimizerOutput{}, errors.New("destination out of range")
	}

	optimalActions, err := runBFS(h, w, optIn.Origin, optIn.Destination, textArray, allActions)
	if err != nil {
		return model.OptimizerOutput{}, err
	}

	// _ = optimalActions
	// action := model.Action{ActionKeys: []string{"k" + strconv.Itoa(len(textArray))}, ActionName: "up"}
	// actions := []model.Action{action}
	return model.OptimizerOutput{Actions: optimalActions}, nil
}

func runBFS(h, w int, origin, destination model.Position,
	textArray []string, allActions []Action) ([]model.Action, error) {
	INF := int(1e9)

	dp := make([][]int, h)
	dpHistory := make([][][]int, h)
	for i := range dp {
		dp[i] = make([]int, w)
		dpHistory[i] = make([][]int, w)
		for j := range dp[i] {
			dp[i][j] = INF
		}
	}

	dp[origin.Line][origin.Character] = 0
	queue := []model.Position{origin}
	for len(queue) > 0 {
		nowPos := queue[0]
		nowScore := dp[nowPos.Line][nowPos.Character]
		queue = queue[1:]
		for idx, action := range allActions {
			nextPos := action.run(textArray, nowPos)
			nextScore := nowScore + 1
			// fmt.Printf("(%d, %d) (%d, %d) : %s\n", nowPos.Line, nowPos.Character, nextPos.Line, nextPos.Character, action.ActionName)
			if dp[nextPos.Line][nextPos.Character] > nextScore {
				dp[nextPos.Line][nextPos.Character] = nextScore
				queue = append(queue, nextPos)

				dpHistory[nextPos.Line][nextPos.Character] = make([]int, nextScore)
				copy(dpHistory[nextPos.Line][nextPos.Character],
					dpHistory[nowPos.Line][nowPos.Character])
				dpHistory[nextPos.Line][nextPos.Character][nextScore-1] = idx
			}
		}

		if dp[destination.Line][destination.Character] != INF {
			break
		}
	}

	if dp[destination.Line][destination.Character] == INF {
		return []model.Action{}, errors.New("can't resolve")
	}

	result := []model.Action{}
	for _, actionIdx := range dpHistory[destination.Line][destination.Character] {
		result = append(result, allActions[actionIdx].Action)
	}
	return result, nil
}
