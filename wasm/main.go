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
	cursorOrigin := Position{3, 2}
	cursorDestination := Position{7, 23}

	optIn := OptimizerInput{cursorOrigin, cursorDestination, editorText}
	optOut, err := controller.Optimize(optIn)

	var res OptimizerOutputJson

	if err != nil {
		res = OptimizerOutputJson{[]Action{}, false, err.Error()}
	} else {
		res = OptimizerOutputJson{optOut.Actions, true, ""}
	}

	optOutStr, _ := res.MarshalJSON()

	fmt.Println(string(optOutStr))
}
