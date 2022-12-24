package model

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
