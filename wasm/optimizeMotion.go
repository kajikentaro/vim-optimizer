package main

import (
	"encoding/json"
	"errors"
	"fmt"
)

type OptimizerInput struct {
	Origin      Position `json:"origin"`
	Destination Position `json:"destination"`
	EditorText  string   `json:"EditorText"`
}

type Action struct {
	ActionKeys []string `json:"actionKeys"`
	ActionName string   `json:"actionName"`
}

type OptimizerOutput struct {
	Actions []Action `json:"actions"`
}

type Position struct {
	Line      int `json:"line"`
	Character int `json:"character"`
}

func optimizeFromJson(jsonStr string) string {
	type OptimizerOutputJson struct {
		OptimizerOutput
		IsOk         bool   `json:"isOk"`
		ErrorMessage string `json:"errorMessage"`
	}


	var optIn OptimizerInput
	// TODO: ココまでしか動かない
	return "hoge"
	json.Unmarshal([]byte(jsonStr), &optIn)
	optOut, err := optimize(optIn)


	// 最適化に失敗した場合
	if err != nil {
		res := OptimizerOutputJson{OptimizerOutput{}, false, err.Error()}
		resStr, _ := json.Marshal(res)
		return string(resStr)
	}

	res := OptimizerOutputJson{optOut, true, ""}
	resStr, _ := json.Marshal(res)
	return string(resStr)
}

func optimize(optIn OptimizerInput) (OptimizerOutput, error) {
	if optIn.EditorText == "" {
		return OptimizerOutput{}, errors.New("テキストが空です")
	}

	action := Action{[]string{"k"}, "up"}
	actions := []Action{action}
	return OptimizerOutput{actions}, nil
}

func main() {
	editorText := `
	#include<bits/stdc++.h>
	using namespace std;

	int main(){
		cin >> n;
		for(int i=0;i<n;i++){
			if(i % 2 == 0){
				cout << i << endl;
			}
		}
	}`
	cursorOrigin := Position{3, 2}
	cursorDestination := Position{7, 23}

	optIn := OptimizerInput{cursorOrigin, cursorDestination, editorText}
	optInStr, _ := json.Marshal(optIn)
	fmt.Println(string(optInStr))

	optOutStr := optimizeFromJson(string(optInStr))
	fmt.Println(optOutStr)
}
