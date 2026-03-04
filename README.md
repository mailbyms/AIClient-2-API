<div align="center">

# Qwen API 代理 🔮

**一个轻量级的 Qwen Code API 代理服务，支持 OAuth 认证。**

</div>

<div align="center">

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js](https://img.shields.io/badge/Node.js-≥20.0.0-green.svg)](https://nodejs.org/)

[**中文**](./README-ZH.md)

</div>

`Qwen API 代理` 是一个专门为 Qwen Code 模型设计的简化 API 代理服务。它提供 OpenAI 兼容的接口来访问基于 OAuth 的 Qwen API，以原始格式透传响应，不进行任何转换。

## 功能特性

- **🎯 Qwen 专用支持**：专门通过 OAuth 支持 Qwen Code 模型
- **📡 透明代理**：以原始格式返回响应，无数据转换
- **🔐 OAuth 认证**：内置 OAuth 2.0 流程，自动刷新令牌
- **📝 请求日志**：可选的控制台或文件日志记录
- **🔧 系统提示管理**：支持自定义系统提示

## 快速开始

### 安装

```bash
# 安装依赖
npm install
```

### 配置

1. **获取 OAuth 凭据**：设置 Qwen OAuth 凭据并保存到 `configs/qwen/credentials.json`

2. **启动服务器**：
```bash
npm start
```

或使用自定义配置：
```bash
node src/api-server.js \
  --model-provider openai-qwen-oauth \
  --qwen-oauth-creds-file ./configs/qwen/credentials.json \
  --port 3000
```

### 使用方法

代理提供 OpenAI 兼容的端点：

```bash
# 聊天补全
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 123456" \
  -d '{
    "model": "qwen-coder-plus",
    "messages": [{"role": "user", "content": "你好！"}]
  }'

# 列出模型
curl http://localhost:3000/v1/models \
  -H "Authorization: Bearer 123456"

# 健康检查
curl http://localhost:3000/health
```

## 配置说明

### 命令行参数

| 参数 | 类型 | 默认值 | 说明 |
|-----------|------|---------|-------------|
| `--host` | string | localhost | 服务器监听地址 |
| `--port` | number | 3000 | 服务器监听端口 |
| `--api-key` | string | 123456 | API 认证密钥 |
| `--model-provider` | string | openai-qwen-oauth | 模型提供商（仅支持 Qwen） |
| `--qwen-oauth-creds-file` | string | null | Qwen OAuth 凭据 JSON 文件路径 |
| `--system-prompt-file` | string | input_system_prompt.txt | 系统提示文件路径 |
| `--system-prompt-mode` | string | overwrite | 系统提示模式（overwrite/append） |
| `--log-prompts` | string | none | 提示日志模式（console/file/none） |
| `--prompt-log-base-name` | string | prompt_log | 提示日志文件基础名称 |
| `--request-max-retries` | number | 3 | 请求失败时的最大重试次数 |
| `--request-base-delay` | number | 1000 | 重试之间的基础延迟（毫秒） |
| `--cron-near-minutes` | number | 15 | OAuth 令牌刷新间隔（分钟） |
| `--cron-refresh-token` | boolean | true | 是否启用自动令牌刷新 |

### 支持的模型

- `qwen-coder-plus` - Qwen Code Plus 模型
- `qwen-coder-latest` - 最新 Qwen Code 模型
- `qwen-plus` - Qwen Plus 模型
- `qwen-turbo` - Qwen Turbo 模型
- `qwen-max` - Qwen Max 模型

## OAuth 认证

### 首次设置

1. 使用 OAuth 配置启动服务器
2. 系统会在浏览器中打开授权页面
3. 授权完成后，凭据会自动保存到 `~/.qwen/oauth_creds.json`

### 凭据存储位置

| 平台 | 默认路径 |
|----------|--------------|
| Linux/macOS | `~/.qwen/oauth_creds.json` |
| Windows | `C:\Users\用户名\.qwen\oauth_creds.json` |

## API 端点

| 端点 | 方法 | 说明 |
|----------|--------|-------------|
| `/v1/chat/completions` | POST | 聊天补全（OpenAI 兼容） |
| `/v1/models` | GET | 列出可用模型 |
| `/health` | GET | 健康检查 |

## 系统提示管理

### 覆盖模式（默认）
将请求中的任何系统提示替换为配置的系统提示：

```bash
node src/api-server.js --system-prompt-file custom.txt --system-prompt-mode overwrite
```

### 追加模式
将配置的系统提示添加到现有提示：

```bash
node src/api-server.js --system-prompt-file custom.txt --system-prompt-mode append
```

## 请求日志

### 控制台日志
```bash
node src/api-server.js --log-prompts console
```

### 文件日志
```bash
node src/api-server.js --log-prompts file --prompt-log-base-name my-logs
```

## 配置示例

### config.json

```json
{
  "MODEL_PROVIDER": "openai-qwen-oauth",
  "QWEN_OAUTH_CREDS_FILE_PATH": "./configs/qwen/credentials.json",
  "HOST": "localhost",
  "SERVER_PORT": 3000,
  "REQUIRED_API_KEY": "your-api-key",
  "SYSTEM_PROMPT_FILE_PATH": "input_system_prompt.txt",
  "SYSTEM_PROMPT_MODE": "overwrite",
  "PROMPT_LOG_MODE": "none",
  "CRON_REFRESH_TOKEN": true
}
```

## Docker 使用

```bash
# 构建镜像
docker build -t qwen-api-proxy .

# 运行容器
docker run -p 3000:3000 \
  -v $(pwd)/configs:/app/configs \
  qwen-api-proxy
```

## 项目结构

```
AIClient-2-API/
├── src/
│   ├── api-server.js       # 主服务器入口
│   ├── request-handler.js   # HTTP 请求处理
│   ├── api-manager.js       # API 路由
│   ├── common.js            # 核心工具函数
│   ├── adapter.js           # Qwen 适配器
│   ├── config-manager.js    # 配置管理
│   ├── service-manager.js   # 服务初始化
│   └── openai/
│       └── qwen-core.js     # Qwen OAuth 实现
├── configs/                 # 配置文件
├── package.json
└── README.md
```

## 开源许可

本项目遵循 **GNU General Public License v3 (GPLv3)** 开源许可。详情请查看 [LICENSE](./LICENSE) 文件。

## 免责声明

本项目仅供学习和研究使用。用户在使用本项目时，应自行承担所有风险。作者不对因使用本项目而导致的任何直接、间接或附带损失承担责任。

用户在使用本代理访问 Qwen API 时，应遵守 Qwen 的服务条款和政策。

## 致谢

本项目受官方 Qwen Code CLI 的启发，并参考了各种开源项目的实现。我们向 Qwen 团队和开源社区表示衷心的感谢！
