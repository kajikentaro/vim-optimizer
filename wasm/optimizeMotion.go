package main

import (
	"errors"
	"fmt"
)

type OptimizerInput struct {
	Origin      Position
	Destination Position
	EditorText  string
}

type Action struct {
	ActionKeys []string `json:"actionKeys"`
	ActionName string   `json:"actionName"`
}

func (v Action) MarshalJSON() ([]byte, error) {
	return MarshalActionAsJSON(&v)
}

type OptimizerOutput struct {
	Actions []Action
}

type Position struct {
	Line      int
	Character int
}

//go:generate json-ice --type=AwesomeStruct
type OptimizerOutputJson struct {
	Actions      []Action `json:"actions"`
	IsOk         bool     `json:"isOk"`
	ErrorMessage string   `json:"errorMessage"`
}

func (v OptimizerOutputJson) MarshalJSON() ([]byte, error) {
	return MarshalOptimizerOutputJsonAsJSON(&v)
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
	optOut, err := optimize(optIn)

	var res OptimizerOutputJson

	if err != nil {
		res = OptimizerOutputJson{[]Action{}, false, err.Error()}
	} else {
		res = OptimizerOutputJson{optOut.Actions, true, ""}
	}

	optOutStr, _ := res.MarshalJSON()

	fmt.Println(string(optOutStr))
}
