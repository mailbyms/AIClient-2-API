import { MODEL_PROTOCOL_PREFIX } from './common.js';
import { OpenAIStrategy } from './openai/openai-strategy.js';

/**
 * Strategy factory that returns the appropriate strategy instance based on the provider protocol.
 * 仅支持 OpenAI 协议（Qwen 使用 OpenAI 协议）
 */
class ProviderStrategyFactory {
    static getStrategy(providerProtocol) {
        switch (providerProtocol) {
            case MODEL_PROTOCOL_PREFIX.OPENAI:
            case MODEL_PROTOCOL_PREFIX.OPENAI_RESPONSES:
                return new OpenAIStrategy();
            default:
                // 对于 Qwen，使用 OpenAI 策略
                return new OpenAIStrategy();
        }
    }
}

export { ProviderStrategyFactory };
