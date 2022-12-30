package main

import (
	"fmt"

	"github.com/kajikentaro/VSCodeVim/wasm/controller"
	_ "github.com/kajikentaro/VSCodeVim/wasm/handler"
	. "github.com/kajikentaro/VSCodeVim/wasm/model"
)

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
	cursorOrigin := Position{Line: 3, Character: 0}
	cursorDestination := Position{Line: 7, Character: 10}

	optIn := OptimizerInput{Origin: cursorOrigin,
		Destination: cursorDestination, EditorText: editorText}
	optOut, err := controller.Optimize(optIn)

	var res OptimizerOutputJson
	if err != nil {
		res = OptimizerOutputJson{Actions: []Action{}, IsOk: false, ErrorMessage: err.Error()}
	} else {
		res = OptimizerOutputJson{Actions: optOut.Actions, IsOk: true, ErrorMessage: ""}
	}
	optOutStr, _ := res.MarshalJSON()
	// fmt.Println(string(optOutStr))
	_ = optOutStr

	// DEBUG:
	for _, v := range optOut.Actions {
		fmt.Println(v.ActionKeys)
	}
}
