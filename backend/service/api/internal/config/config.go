package config

import (
	"regexp"
	"strings"

	"cizhima-backend/pkg/ai"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/rest"
)

type Config struct {
	rest.RestConf

	Auth struct {
		AccessSecret  string
		AccessExpire  int64
		RefreshExpire int64 `json:",default=604800"`
	}

	DataSource string `json:",optional"`

	Redis cache.CacheConf `json:",optional"`

	MySQL MySQLConfig `json:",optional"`

	AI ai.AIConfig `json:",optional"`
}

type MySQLConfig struct {
	MaxOpenConns    int `json:",default=50"`
	MaxIdleConns    int `json:",default=10"`
	ConnMaxLifetime int `json:",default=300"`
}

type MySQLConnInfo struct {
	Host string
	Port string
	User string
	Pass string
	DB   string
}

func (c *Config) ParseMySQLConnInfo() *MySQLConnInfo {
	ds := c.DataSource
	if ds == "" {
		return nil
	}

	info := &MySQLConnInfo{}

	re := regexp.MustCompile(`^([^:]+):([^@]+)@tcp\(([^:]+):([^)]+)\)/([^?]+)`)
	matches := re.FindStringSubmatch(ds)
	if len(matches) == 7 {
		info.User = matches[1]
		info.Pass = matches[2]
		info.Host = matches[3]
		info.Port = matches[4]
		info.DB = matches[5]
	} else {
		parts := strings.SplitN(ds, "@", 2)
		if len(parts) == 2 {
			userPass := strings.SplitN(parts[0], ":", 2)
			if len(userPass) == 2 {
				info.User = userPass[0]
				info.Pass = userPass[1]
			}
			hostPortDB := parts[1]
			if strings.HasPrefix(hostPortDB, "tcp(") {
				hostPortDB = strings.TrimPrefix(hostPortDB, "tcp(")
				hostPortDB = strings.TrimSuffix(hostPortDB, ")")
				hostPort := strings.SplitN(hostPortDB, ":", 2)
				if len(hostPort) == 2 {
					info.Host = hostPort[0]
					info.Port = hostPort[1]
				}
			}
			if idx := strings.Index(hostPortDB, "/"); idx != -1 {
				info.DB = hostPortDB[idx+1:]
				if qIdx := strings.Index(info.DB, "?"); qIdx != -1 {
					info.DB = info.DB[:qIdx]
				}
			}
		}
	}

	if info.Host == "" {
		info.Host = "localhost"
	}
	if info.Port == "" {
		info.Port = "3306"
	}

	return info
}
