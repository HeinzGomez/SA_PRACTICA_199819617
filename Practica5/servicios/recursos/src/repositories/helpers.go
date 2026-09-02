package repositories

func strToNil(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
