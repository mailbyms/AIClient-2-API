import { QwenApiService } from './openai/qwen-core.js'; // 导入QwenApiService
import { MODEL_PROVIDER } from './common.js'; // 导入 MODEL_PROVIDER

// 定义AI服务适配器接口
// 所有的服务适配器都应该实现这些方法
export class ApiServiceAdapter {
    constructor() {
        if (new.target === ApiServiceAdapter) {
            throw new TypeError("Cannot construct ApiServiceAdapter instances directly");
        }
    }

    /**
     * 生成内容
     * @param {string} model - 模型名称
     * @param {object} requestBody - 请求体
     * @returns {Promise<object>} - API响应
     */
    async generateContent(model, requestBody) {
        throw new Error("Method 'generateContent()' must be implemented.");
    }

    /**
     * 流式生成内容
     * @param {string} model - 模型名称
     * @param {object} requestBody - 请求体
     * @returns {AsyncIterable<object>} - API响应流
     */
    async *generateContentStream(model, requestBody) {
        throw new Error("Method 'generateContentStream()' must be implemented.");
    }

    /**
     * 列出可用模型
     * @returns {Promise<object>} - 模型列表
     */
    async listModels() {
        throw new Error("Method 'listModels()' must be implemented.");
    }

    /**
     * 刷新认证令牌
     * @returns {Promise<void>}
     */
    async refreshToken() {
        throw new Error("Method 'refreshToken()' must be implemented.");
    }
}

// Qwen API 服务适配器
export class QwenApiServiceAdapter extends ApiServiceAdapter {
    constructor(config) {
        super();
        this.qwenApiService = new QwenApiService(config);
    }

    async generateContent(model, requestBody) {
        if (!this.qwenApiService.isInitialized) {
            console.warn("qwenApiService not initialized, attempting to re-initialize...");
            await this.qwenApiService.initialize();
        }
        return this.qwenApiService.generateContent(model, requestBody);
    }

    async *generateContentStream(model, requestBody) {
        if (!this.qwenApiService.isInitialized) {
            console.warn("qwenApiService not initialized, attempting to re-initialize...");
            await this.qwenApiService.initialize();
        }
        yield* this.qwenApiService.generateContentStream(model, requestBody);
    }

    async listModels() {
        if (!this.qwenApiService.isInitialized) {
            console.warn("qwenApiService not initialized, attempting to re-initialize...");
            await this.qwenApiService.initialize();
        }
        return this.qwenApiService.listModels();
    }

    async refreshToken() {
        if (this.qwenApiService.isExpiryDateNear()) {
            console.log(`[Qwen] Expiry date is near, refreshing token...`);
            return this.qwenApiService._initializeAuth(true);
        }
        return Promise.resolve();
    }
}

// 用于存储服务适配器单例的映射
export const serviceInstances = {};

// 服务适配器工厂
export function getServiceAdapter(config) {
    console.log(`[Adapter] getServiceAdapter, provider: ${config.MODEL_PROVIDER}, uuid: ${config.uuid}`);
    const provider = config.MODEL_PROVIDER;
    const providerKey = config.uuid ? provider + config.uuid : provider;
    if (!serviceInstances[providerKey]) {
        switch (provider) {
            case MODEL_PROVIDER.QWEN_API:
                serviceInstances[providerKey] = new QwenApiServiceAdapter(config);
                break;
            default:
                throw new Error(`Unsupported model provider: ${provider}`);
        }
    }
    return serviceInstances[providerKey];
}
