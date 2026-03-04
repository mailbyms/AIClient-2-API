import * as http from 'http';
import { initializeConfig, CONFIG, logProviderSpecificDetails } from './config-manager.js';
import { initApiService } from './service-manager.js';
import { initializeAPIManagement } from './api-manager.js';
import { createRequestHandler } from './request-handler.js';

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * 描述 / Description:
 * (Qwen 专用版本 / Qwen Dedicated Version)
 * 此脚本创建一个独立的 Node.js HTTP 服务器，作为 Qwen API 的本地代理。
 * 设计为健壮、灵活且易于通过全面可控的日志系统进行监控。
 *
 * This script creates a standalone Node.js HTTP server that acts as a local proxy for Qwen API.
 * Designed to be robust, flexible, and easy to monitor through a comprehensive and controllable logging system.
 *
 * 主要功能 / Key Features:
 * - Qwen API 专用：仅支持 Qwen 模型，原样返回上游响应，不进行任何格式转换。
 *   Qwen API Only: Only supports Qwen models, returns upstream responses as-is without any format conversion.
 *
 * - 强大的身份验证管理：支持通过 OAuth 2.0 配置进行身份验证。能够自动刷新过期令牌以确保服务持续运行。
 *   Robust Authentication Management: Supports authentication via OAuth 2.0 configuration. Capable of automatically refreshing expired tokens to ensure continuous service operation.
 *
 * - 灵活的 API 密钥验证：支持多种 API 密钥验证方法：`Authorization: Bearer <key>` 请求头、`x-goog-api-key` 请求头和 `?key=` URL 查询参数。
 *   Flexible API Key Validation: Supports multiple API key validation methods: `Authorization: Bearer <key>` request header, `x-goog-api-key` request header, and `?key=` URL query parameter.
 *
 * - 动态系统提示管理 / Dynamic System Prompt Management:
 *   - 文件注入：通过 `--system-prompt-file` 从外部文件加载系统提示，并通过 `--system-prompt-mode` 控制其行为（覆盖或追加）。
 *     File Injection: Loads system prompts from external files via `--system-prompt-file` and controls their behavior (overwrite or append) with `--system-prompt-mode`.
 *
 * - 全面可控的日志系统：提供两种日志模式（控制台或文件），详细记录每个请求的输入和输出。
 *   Comprehensive and Controllable Logging System: Provides two logging modes (console or file), detailing input and output of each request.
 *
 * - 高度可配置的启动：支持通过命令行参数配置服务监听地址、端口、API 密钥和日志模式。
 *   Highly Configurable Startup: Supports configuring service listening address, port, API key, and logging mode via command-line parameters.
 *
 * 使用示例 / Usage Examples:
 *
 * 基本用法 / Basic Usage:
 * node src/api-server.js
 *
 * 服务器配置 / Server Configuration:
 * node src/api-server.js --host 0.0.0.0 --port 8080 --api-key your-secret-key
 *
 * Qwen 提供商（使用凭据文件的 OAuth）/ Qwen Provider (OAuth with credentials file):
 * node src/api-server.js --model-provider openai-qwen-oauth --qwen-oauth-creds-file /path/to/credentials.json
 *
 * 系统提示管理 / System Prompt Management:
 * node src/api-server.js --system-prompt-file custom-prompt.txt --system-prompt-mode append
 *
 * 日志配置 / Logging Configuration:
 * node src/api-server.js --log-prompts console
 * node src/api-server.js --log-prompts file --prompt-log-base-name my-logs
 *
 * 完整示例 / Complete Example:
 * node src/api-server.js \
 *   --host 0.0.0.0 \
 *   --port 3000 \
 *   --api-key my-secret-key \
 *   --model-provider openai-qwen-oauth \
 *   --qwen-oauth-creds-file ./configs/qwen/credentials.json \
 *   --system-prompt-file ./custom-system-prompt.txt \
 *   --system-prompt-mode overwrite \
 *   --log-prompts file \
 *   --prompt-log-base-name api-logs
 *
 * 命令行参数 / Command Line Parameters:
 * --host <address>                    服务器监听地址 / Server listening address (default: localhost)
 * --port <number>                     服务器监听端口 / Server listening port (default: 3000)
 * --api-key <key>                     身份验证所需的 API 密钥 / Required API key for authentication (default: 123456)
 * --model-provider <provider>         AI 模型提供商（仅支持 qwen）/ AI model provider (qwen only): openai-qwen-oauth
 * --qwen-oauth-creds-file <path>      Qwen OAuth 凭据 JSON 文件路径 / Path to Qwen OAuth credentials JSON file
 * --system-prompt-file <path>         系统提示文件路径 / Path to system prompt file (default: input_system_prompt.txt)
 * --system-prompt-mode <mode>         系统提示模式 / System prompt mode: overwrite or append (default: overwrite)
 * --log-prompts <mode>                提示日志模式 / Prompt logging mode: console, file, or none (default: none)
 * --prompt-log-base-name <name>       提示日志文件基础名称 / Base name for prompt log files (default: prompt_log)
 * --request-max-retries <number>      API 请求失败时，自动重试的最大次数 / Max retries for API requests on failure (default: 3)
 * --request-base-delay <number>       自动重试之间的基础延迟时间（毫秒）/ Base delay in milliseconds between retries (default: 1000)
 * --cron-near-minutes <number>        OAuth 令牌刷新任务计划的间隔时间（分钟）/ Interval for OAuth token refresh task in minutes (default: 15)
 * --cron-refresh-token <boolean>      是否开启 OAuth 令牌自动刷新任务 / Whether to enable automatic OAuth token refresh task (default: true)
 *
 */

import 'dotenv/config'; // Import dotenv and configure it

// --- Server Initialization ---
async function startServer() {
    // Initialize configuration
    await initializeConfig();

    // Initialize API services
    const services = await initApiService(CONFIG);

    // Initialize API management and get heartbeat function
    const heartbeatAndRefreshToken = initializeAPIManagement(services);

    // Create request handler
    const requestHandlerInstance = createRequestHandler(CONFIG);

    const server = http.createServer(requestHandlerInstance);
    server.listen(CONFIG.SERVER_PORT, CONFIG.HOST, async () => {
        console.log(`--- Qwen API Server Configuration ---`);
        console.log(`  Model Provider: ${CONFIG.MODEL_PROVIDER}`);
        logProviderSpecificDetails(CONFIG.MODEL_PROVIDER, CONFIG);
        console.log(`  System Prompt File: ${CONFIG.SYSTEM_PROMPT_FILE_PATH || 'Default'}`);
        console.log(`  System Prompt Mode: ${CONFIG.SYSTEM_PROMPT_MODE}`);
        console.log(`  Host: ${CONFIG.HOST}`);
        console.log(`  Port: ${CONFIG.SERVER_PORT}`);
        console.log(`  Required API Key: ${CONFIG.REQUIRED_API_KEY}`);
        console.log(`  Prompt Logging: ${CONFIG.PROMPT_LOG_MODE}${CONFIG.PROMPT_LOG_FILENAME ? ` (to ${CONFIG.PROMPT_LOG_FILENAME})` : ''}`);
        console.log(`------------------------------------------`);
        console.log(`\nQwen API Server running on http://${CONFIG.HOST}:${CONFIG.SERVER_PORT}`);
        console.log(`Supported endpoints:`);
        console.log(`  • /v1/chat/completions - Chat completions endpoint`);
        console.log(`  • /v1/models - Model list endpoint`);
        console.log(`  • /health - Health check endpoint`);

        if (CONFIG.CRON_REFRESH_TOKEN) {
            console.log(`  • Cron Near Minutes: ${CONFIG.CRON_NEAR_MINUTES}`);
            console.log(`  • Cron Refresh Token: ${CONFIG.CRON_REFRESH_TOKEN}`);
            // 每 CRON_NEAR_MINUTES 分钟执行一次心跳日志和令牌刷新
            setInterval(heartbeatAndRefreshToken, CONFIG.CRON_NEAR_MINUTES * 60 * 1000);
        }
    });
    return server; // Return the server instance for testing purposes
}

startServer().catch(err => {
    console.error("[Server] Failed to start server:", err.message);
    process.exit(1);
});
