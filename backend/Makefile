SHELL := /bin/bash
.DEFAULT_GOAL := help

VERSION    := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME := $(shell date -u '+%Y-%m-%dT%H:%M:%SZ')
GIT_COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")

GO     := go
GOPATH := $(shell $(GO) env GOPATH)
GOBIN  := $(shell $(GO) env GOBIN)
ifeq ($(GOBIN),)
GOBIN = $(GOPATH)/bin
endif

DOCKER         := docker
DOCKER_COMPOSE := docker compose

GREEN  := \033[32m
YELLOW := \033[33m
RED    := \033[31m
CYAN   := \033[36m
RESET  := \033[0m

.PHONY: help
help: ## 显示帮助信息
	@echo -e "$(CYAN)API 服务脚手架 - Makefile 命令$(RESET)"
	@echo -e ""
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'

.PHONY: install
install: ## 安装依赖工具
	@echo -e "$(CYAN)Checking goctl...$(RESET)"
	@if ! command -v goctl > /dev/null 2>&1; then \
		echo "$(YELLOW)goctl not found, installing...$(RESET)"; \
		$(GO) install github.com/zeromicro/go-zero/tools/goctl@latest; \
	fi
	goctl --version
	@echo -e "$(GREEN)✓ Dependencies installed$(RESET)"

# ==============================================================================
# 代码生成
# ==============================================================================
.PHONY: gen

gen: gen-api gen-model gen-swagger ## 生成所有代码

.PHONY: gen-api
gen-api: ## 生成 API 代码
	@echo -e "$(CYAN)生成 API 代码...$(RESET)"
	cd service/api && goctl api go -api api.api -dir . --style=goZero
	@echo -e "$(GREEN)✓ API 代码生成完成$(RESET)"

.PHONY: gen-model
gen-model: ## 生成 Model 代码
	@echo -e "$(CYAN)生成 Model 代码...$(RESET)"
	@if [ -d "pkg/model/sql" ] && [ "$$(ls -A pkg/model/sql/*.sql 2>/dev/null)" ]; then \
		for sql_file in pkg/model/sql/*.sql; do \
			echo "$(CYAN)Processing $$sql_file...$(RESET)"; \
			table_name=$$(grep -i 'CREATE TABLE' "$$sql_file" | head -1 | sed -E 's/.*CREATE TABLE[[:space:]]+`?([a-zA-Z0-9_]+)`?.*/\1/i' | tr '[:upper:]' '[:lower:]'); \
			if [ -n "$$table_name" ]; then \
				model_dir="pkg/model/$$table_name"; \
				mkdir -p "$$model_dir"; \
				echo "$(CYAN)  Table: $$table_name -> $$model_dir$(RESET)"; \
				goctl model mysql ddl -src="$$sql_file" -dir="$$model_dir" --style=goZero -c; \
			else \
				echo "$(RED)  Failed to extract table name from $$sql_file$(RESET)"; \
			fi; \
		done; \
		echo "$(GREEN)✓ Model 代码生成完成$(RESET)"; \
	else \
		echo "$(YELLOW)No SQL files found in pkg/model/sql/, skipping model generation$(RESET)"; \
	fi

.PHONY: gen-swagger
gen-swagger: ## 生成 Swagger 文档
	@echo -e "$(CYAN)生成 Swagger 文档...$(RESET)"
	@mkdir -p docs/swagger
	goctl api swagger --api service/api/api.api --dir docs/swagger
	@echo -e "$(GREEN)✓ Swagger 文档生成完成: docs/swagger/api.json$(RESET)"

.PHONY: tidy
tidy: ## go mod tidy
	@echo -e "$(CYAN)Running go mod tidy...$(RESET)"
	$(GO) mod tidy
	@echo -e "$(GREEN)✓ Dependencies updated$(RESET)"

# ==============================================================================
# 构建
# ==============================================================================
.PHONY: build
build: ## 构建 API 服务（本机平台）
	@echo -e "$(CYAN)构建 API 服务...$(RESET)"
	@mkdir -p bin
	$(GO) build -ldflags "-s -w -X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME) -X main.GitCommit=$(GIT_COMMIT)" -o bin/api-local ./service/api/
	@echo -e "$(GREEN)✓ bin/api-local$(RESET)"

LINUX_ARCH ?= amd64

.PHONY: build-linux
build-linux: ## 构建 Linux 二进制（用于服务器部署，默认 amd64，可 LINUX_ARCH=arm64）
	@echo -e "$(CYAN)构建 Linux $(LINUX_ARCH) 二进制...$(RESET)"
	@mkdir -p bin
	CGO_ENABLED=0 GOOS=linux GOARCH=$(LINUX_ARCH) $(GO) build -ldflags "-s -w -X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME) -X main.GitCommit=$(GIT_COMMIT)" -o bin/api ./service/api/
	@echo -e "$(GREEN)✓ bin/api$(RESET)"

# ==============================================================================
# 运行
# ==============================================================================
.PHONY: run
run: ## 运行 API 服务
	@echo -e "$(CYAN)Starting API server...$(RESET)"
	set -a; source .env 2>/dev/null || true; set +a; $(GO) run ./service/api/ -f service/api/etc/api.yaml

# ==============================================================================
# Docker
# ==============================================================================
.PHONY: docker
docker: ## 构建 Docker 镜像
	@echo -e "$(CYAN)Building API Docker image...$(RESET)"
	$(DOCKER) build -f docker/Dockerfile.api -t api:$(VERSION) .
	@echo -e "$(GREEN)✓ Image: api:$(VERSION)$(RESET)"

# ==============================================================================
# 基础设施
# ==============================================================================
INFRA_DIR := deploy
INFRA_ENV := --env-file $(INFRA_DIR)/.env.infra

.PHONY: infra-up
infra-up: ## 启动核心基础设施（MySQL+Redis）
	@echo -e "$(CYAN)Starting core infrastructure...$(RESET)"
	@if [ ! -f $(INFRA_DIR)/.env.infra ]; then cp $(INFRA_DIR)/.env.infra.example $(INFRA_DIR)/.env.infra; fi
	$(DOCKER_COMPOSE) -f $(INFRA_DIR)/docker-compose.base.yml $(INFRA_ENV) up -d
	@echo -e "$(YELLOW)Waiting for MySQL to be ready...$(RESET)"
	@sleep 10
	@echo -e "$(CYAN)Syncing and importing SQL schema...$(RESET)"
	@chmod +x scripts/sync-sql.sh && ./scripts/sync-sql.sh
	@echo -e "$(GREEN)✓ Core infrastructure ready$(RESET)"
	@echo -e ""
	@echo -e "$(CYAN)========================================$(RESET)"
	@echo -e "$(CYAN)  Core Services$(RESET)"
	@echo -e "$(CYAN)========================================$(RESET)"
	@echo -e "  $(GREEN)MySQL Adminer:$(RESET)     http://localhost:8085"
	@echo -e "  $(GREEN)Redis Insight:$(RESET)     http://localhost:5540"
	@echo -e "$(CYAN)========================================$(RESET)"

.PHONY: infra-down
infra-down: ## 停止所有基础设施
	@$(DOCKER_COMPOSE) -f $(INFRA_DIR)/docker-compose.base.yml $(INFRA_ENV) down 2>/dev/null || true

.PHONY: db-import
db-import: ## 导入 SQL
	@echo -e "$(CYAN)Syncing and importing SQL schema...$(RESET)"
	@chmod +x scripts/sync-sql.sh && ./scripts/sync-sql.sh

# ==============================================================================
# 测试 & Lint
# ==============================================================================
.PHONY: test
test: ## 运行测试
	@echo -e "$(CYAN)Running tests...$(RESET)"
	$(GO) test -v -race ./...
	@echo -e "$(GREEN)✓ Tests completed$(RESET)"

.PHONY: lint
lint: ## 代码检查
	@which golangci-lint > /dev/null 2>&1 || { \
		echo "$(CYAN)Installing golangci-lint...$(RESET)"; \
		$(GO) install github.com/golangci/golangci-lint/cmd/golangci-lint@latest; \
	}
	@echo -e "$(CYAN)Running linter...$(RESET)"
	golangci-lint run ./...
	@echo -e "$(GREEN)✓ Linting completed$(RESET)"

# ==============================================================================
# 清理
# ==============================================================================
.PHONY: clean
clean: ## 清理构建产物
	@echo -e "$(CYAN)Cleaning...$(RESET)"
	rm -rf bin/
	find . -name "*.test" -delete
	find . -name "coverage.out" -delete
	@echo -e "$(GREEN)✓ Cleaned$(RESET)"
