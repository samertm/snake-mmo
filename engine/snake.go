package engine

import "container/list"

const (
	startTailMax int       = 4
	up           Direction = iota
	down         Direction = iota
	left         Direction = iota
	right        Direction = iota
	alive        state     = iota
	dead         state     = iota
)

type Direction int
type state int

type Snake struct {
	TailMax   int
	Direction Direction
	State     state
	Body      *list.List
	Color     color
	NextDir   *list.List
}

func NewSnake() *Snake {
	return &Snake{
		TailMax:   startTailMax,
		Direction: right,
		State:     alive,
		Body:      list.New(),
		Color:     red,
		NextDir:   list.New(),
	}
}

// TODO is this needed?
func NewSnakeAtPoint(p Point) *Snake {
	s := NewSnake()
	s.Body.PushBack(p)
	return s
}

func pop(l *list.List) interface{} {
	front := l.Front()
	return l.Remove(front)
}


func (s *Snake) nextMove() Point {
	var nextDir Direction
	if s.NextDir.Len() != 0 {
		nextDir = pop(s.NextDir).(Direction)
	} else {
		nextDir = s.Direction
	}
	head := s.Body.Back().Value.(Point)
	var nextMove Point
	// compute move
	switch nextDir {
	case up:
		if s.Direction != down {
			nextMove = Point{head[0] - 1, head[1]}
			s.Direction = nextDir
		} else {
			nextMove = Point{head[0] + 1, head[1]}
		}
	case down:
		if s.Direction != up {
			nextMove = Point{head[0] + 1, head[1]}
			s.Direction = nextDir
		} else {
			nextMove = Point{head[0] - 1, head[1]}
		}
	case left:
		if s.Direction != right {
			nextMove = Point{head[0], head[1] - 1}
			s.Direction = nextDir
		} else {
			nextMove = Point{head[0], head[1] + 1}
		}
	case right:
		if s.Direction != left {
			nextMove = Point{head[0], head[1] + 1}
			s.Direction = nextDir
		} else {
			nextMove = Point{head[0], head[1] - 1}
		}
	}
	return nextMove
}
