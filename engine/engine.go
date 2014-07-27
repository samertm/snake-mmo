package engine

import (
	"container/list"
	"errors"
	"math/rand"
	"time"
)

const (
	BoardSize int = 32
)

var (
	Board  [BoardSize][BoardSize]string
	Snakes map[int]*Snake
	food   Point
)

type Point [2]int

func init() {
	Snakes = make(map[int]*Snake)
	food = findPoint()
	rand.Seed(time.Now().UnixNano())
}

// TODO refactor into (b *Board) functions?
func findPoint() Point {
	var p Point
	for {
		p = Point{rand.Intn(BoardSize), rand.Intn(BoardSize)}
		if val := Board[p[0]][p[1]]; val == "" {
			break
		}
	}
	return p
}

func endCondition(p Point) bool {
	if p[0] < 0 || p[0] >= BoardSize || p[1] < 0 || p[1] >= BoardSize ||
		(Board[p[0]][p[1]] != "" && Board[p[0]][p[1]] != "fo") {
		return true
	}
	return false
}

// refactor into *Board method?
func updateBoard() {
	// zero board
	for i := 0; i < BoardSize; i++ {
		for j := 0; j < BoardSize; j++ {
			Board[i][j] = ""
		}
	}
	Board[food[0]][food[1]] = "fo"
	for _, s := range Snakes {
		body := s.Body
		for e := body.Front(); e != nil; e = e.Next() {
			p := e.Value.(Point)
			Board[p[0]][p[1]] = ColorString(s.Color)
		}
	}
}

func isFood(p Point) bool {
	return Board[p[0]][p[1]] == "fo"
}

func AddDir(id int, d Direction) error {
	if Snakes[id] == nil {
		return errors.New("This ID does not exist")
	}
	Snakes[id].NextDir.PushBack(d)
	return nil
}

func AddSnake(id int) error {
	if Snakes[id] != nil {
		return errors.New("This ID exists")
	}
	Snakes[id] = NewSnake()
	return nil
}

func AddSnakeAtPoint(id int, p Point) error {
	err := AddSnake(id)
	if err != nil {
		return err
	}
	Snakes[id].Body.PushBack(p)
	return nil
}

func AddSnakeEmptyPoint(id int) error {
	err := AddSnake(id)
	if err != nil {
		return err
	}
	Snakes[id].Body.PushBack(findPoint())
	// make snake random color
	Snakes[id].Color = color(rand.Intn(6) + 1)
	return nil
}

func AddMove(id int, d Direction) error {
	s, ok := Snakes[id]
	if ok == false {
		return errors.New("This ID does not exist")
	}
	s.NextDir.PushBack(d)
	return nil
}

func RemoveSnake(id int) error {
	if _, ok := Snakes[id]; ok == false {
		return errors.New("This ID does not exist")
	}
	delete(Snakes, id)
	return nil
}

func Tick() {
	for _, snake := range Snakes {
		switch snake.State {
		case alive:
			nextHead := snake.nextMove()
			if endCondition(nextHead) {
				snake.State = dead
				continue
			}
			if isFood(nextHead) {
				snake.TailMax += 4
				food = findPoint()
			}
			snake.Body.PushBack(nextHead)
			if snake.Body.Len() > snake.TailMax {
				pop(snake.Body)
			}
		case dead:
			if snake.Body.Len() == 0 {
				// TODO create new snake instead?
				newHead := findPoint()
				snake.Body.PushBack(newHead)
				snake.NextDir = list.New()
				snake.Direction = Right // TODO direction based on place in board
				snake.TailMax = startTailMax
				snake.State = alive
			} else {
				pop(snake.Body)
			}
		}
	}
	updateBoard()
}
