package ke.imperialenterprise.imperialai.domain.model

/**
 * Encapsulates an AI inference request to any AIProvider.
 * Architecturally leaves space for future tool definitions (MCP / WordPress),
 * attachments, and system instructions without coupling the UI to OpenRouter.
 */
data class AIRequest(
    val messages: List<ChatMessage>,
    val modelId: String,
    val systemPrompt: String? = null,
    val temperature: Double? = 0.7,
    val maxTokens: Int? = null,
    val stream: Boolean = true,
    // Architectural foundation for Phase 3 MCP tool schemas
    val tools: List<Map<String, Any?>> = emptyList(),
    val toolChoice: String? = null,
    val siteId: String? = null
)

/**
 * Non-streaming response payload.
 */
data class AIResponse(
    val content: String,
    val modelUsed: String,
    val usage: AIUsage? = null,
    val finishReason: String? = "stop"
)
