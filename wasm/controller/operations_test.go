package controller

import (
	"testing"

	"github.com/kajikentaro/VSCodeVim/wasm/model"
)

var sampleEditorText_1 = []string{
	"#include<bits/stdc++.h>",
	"using namespace std;",
	"int main(){",
	"  cin >> n;",
	"  for(int i=0;i<n;i++){",
	"    if(i % 2 == 0){",
	"    cout << i << endl;",
	"    }",
	"  }",
	"}",
}

func TestGenMoveToMatchingBracketForward(t *testing.T) {
	action := genMoveToMatchingBracket()
	origin := model.Position{Line: 2, Character: 10}
	expected := model.Position{Line: 9, Character: 0}

	actual := action.run(sampleEditorText_1, origin)

	if actual.Line != expected.Line {
		t.Errorf("Got Line = %d, want %d", actual.Line, expected.Line)
	}
	if actual.Character != expected.Character {
		t.Errorf("Got Character = %d, want %d", actual.Character, expected.Character)
	}
}

func TestGenMoveToMatchingBracketBackward(t *testing.T) {
	action := genMoveToMatchingBracket()
	origin := model.Position{Line: 4, Character: 19}
	expected := model.Position{Line: 4, Character: 5}

	actual := action.run(sampleEditorText_1, origin)

	if actual.Line != expected.Line {
		t.Errorf("Got Line = %d, want %d", actual.Line, expected.Line)
	}
	if actual.Character != expected.Character {
		t.Errorf("Got Character = %d, want %d", actual.Character, expected.Character)
	}
}
