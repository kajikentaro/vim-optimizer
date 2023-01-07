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

func TestGenMoveToMatchingBracket(t *testing.T) {
	action := genMoveToMatchingBracket()

	tests := []struct {
		name     string
		origin   model.Position
		expected model.Position
	}{
		{
			name:     "search forward brackets",
			origin:   model.Position{Line: 2, Character: 10},
			expected: model.Position{Line: 9, Character: 0},
		},
		{
			name:     "search backward brackets",
			origin:   model.Position{Line: 4, Character: 19},
			expected: model.Position{Line: 4, Character: 5},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			actual := action.run(sampleEditorText_1, test.origin)
			if actual.Line != test.expected.Line {
				t.Errorf("Got Line = %d, want %d", actual.Line, test.expected.Line)
			}
			if actual.Character != test.expected.Character {
				t.Errorf("Got Character = %d, want %d", actual.Character, test.expected.Character)
			}
		})
	}
}

func TestGenMoveUp(t *testing.T) {
	action := genMoveUp()

	tests := []struct {
		name     string
		origin   model.Position
		expected model.Position
	}{
		{
			name:     "execute top of line",
			origin:   model.Position{Line: 0, Character: 5},
			expected: model.Position{Line: 0, Character: 5},
		},
		{
			name:     "move up normally",
			origin:   model.Position{Line: 1, Character: 5},
			expected: model.Position{Line: 0, Character: 5},
		},
		{
			name:     "move up from out of text",
			origin:   model.Position{Line: 3, Character: 20},
			expected: model.Position{Line: 2, Character: 20},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			actual := action.run(sampleEditorText_1, test.origin)
			if actual.Line != test.expected.Line {
				t.Errorf("Got Line = %d, want %d", actual.Line, test.expected.Line)
			}
			if actual.Character != test.expected.Character {
				t.Errorf("Got Character = %d, want %d", actual.Character, test.expected.Character)
			}
		})
	}

}

func TestGenMoveDown(t *testing.T) {
	action := genMoveDown()

	tests := []struct {
		name     string
		origin   model.Position
		expected model.Position
	}{
		{
			name:     "execute bottom of line",
			origin:   model.Position{Line: 9, Character: 0},
			expected: model.Position{Line: 9, Character: 0},
		},
		{
			name:     "move down normally",
			origin:   model.Position{Line: 1, Character: 5},
			expected: model.Position{Line: 2, Character: 5},
		},
		{
			name:     "move down from out of text",
			origin:   model.Position{Line: 3, Character: 20},
			expected: model.Position{Line: 4, Character: 20},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			actual := action.run(sampleEditorText_1, test.origin)
			if actual.Line != test.expected.Line {
				t.Errorf("Got Line = %d, want %d", actual.Line, test.expected.Line)
			}
			if actual.Character != test.expected.Character {
				t.Errorf("Got Character = %d, want %d", actual.Character, test.expected.Character)
			}
		})
	}
}

func TestGenMoveRight(t *testing.T) {
	action := genMoveRight()

	tests := []struct {
		name     string
		origin   model.Position
		expected model.Position
	}{
		{
			name:     "move right normally",
			origin:   model.Position{Line: 1, Character: 5},
			expected: model.Position{Line: 1, Character: 6},
		},
		{
			name:     "move right from out of the text",
			origin:   model.Position{Line: 3, Character: 20},
			expected: model.Position{Line: 3, Character: 10},
		},
		{
			name:     "move right from end of the line",
			origin:   model.Position{Line: 3, Character: 10},
			expected: model.Position{Line: 3, Character: 10},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			actual := action.run(sampleEditorText_1, test.origin)
			if actual.Line != test.expected.Line {
				t.Errorf("Got Line = %d, want %d", actual.Line, test.expected.Line)
			}
			if actual.Character != test.expected.Character {
				t.Errorf("Got Character = %d, want %d", actual.Character, test.expected.Character)
			}
		})
	}
}

func TestGenMoveLeft(t *testing.T) {
	action := genMoveLeft()

	tests := []struct {
		name     string
		origin   model.Position
		expected model.Position
	}{
		{
			name:     "move left normally",
			origin:   model.Position{Line: 1, Character: 5},
			expected: model.Position{Line: 1, Character: 4},
		},
		{
			name:     "move left from out of the text",
			origin:   model.Position{Line: 3, Character: 20},
			expected: model.Position{Line: 3, Character: 9},
		},
		{
			name:     "move right from head of the line",
			origin:   model.Position{Line: 3, Character: 0},
			expected: model.Position{Line: 3, Character: 0},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			actual := action.run(sampleEditorText_1, test.origin)
			if actual.Line != test.expected.Line {
				t.Errorf("Got Line = %d, want %d", actual.Line, test.expected.Line)
			}
			if actual.Character != test.expected.Character {
				t.Errorf("Got Character = %d, want %d", actual.Character, test.expected.Character)
			}
		})
	}
}
