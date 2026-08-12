package env

import "os"

func IsDev() bool {
	return os.Getenv("GO_ENV") == "" || os.Getenv("GO_ENV") == "dev"
}

func IsTest() bool {
	return os.Getenv("GO_ENV") == "test"
}

func IsProd() bool {
	return os.Getenv("GO_ENV") == "prod"
}

func GetServerName() string {
	name := os.Getenv("SERVER_NAME")
	if name == "" {
		return "api"
	}
	return name
}
