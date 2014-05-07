package engine

/* add this to the client? server has no need
type color [3]int

var (
	white color = color{255, 255, 255}
	black color = color{0, 0, 0}
	red   color = color{255, 0, 0}
	blue  color = color{0, 0, 255}
)
*/

type color int

const (
	white  color = iota
	black  color = iota
	red    color = iota
	blue   color = iota
	cyan   color = iota
	purple color = iota
	green  color = iota
)

func colorString(c color) string {
	var str string
	switch c {
	case white:
		str = "wh"
	case black:
		str = "bk"
	case blue:
		str = "bl"
	case red:
		str = "rd"
	case cyan:
		str = "cy"
	case purple:
		str = "pu"
	case green:
		str = "gr"
	default:
		str = "bk"
	}
	return str
}
