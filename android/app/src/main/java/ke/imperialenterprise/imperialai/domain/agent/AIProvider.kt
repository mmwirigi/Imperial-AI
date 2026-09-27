package ke.imperialenterprise.imperialai.domain.agent

import ke.imperialenterprise.imperialai.domain.model.*
import kotlinx.coroutines.flow.Flow

/**
 * Universal interface abstraction for AI providers (OpenRouter, Gemini, Anthropic, local LLMs).
 * The UI layer communicates strictly with this abstraction and never directly invokes
 * OpenRouter-specific endpoints or HTTP clients.
 */
interface AIProvider {
    val providerId: String
    val providerDisplayName: String

    /**
     * Non-streaming single-turn generation.
     */
    suspend fun sendMessage(request: AIRequest): Result<AIResponse>

    /**
     * Progressive streaming token generator.
     */
    fun streamMessage(request: AIRequest): Flow<AIStreamChunk>

    /**
     * Dynamic model catalog retrieval.
     */
    suspend fun listModels(forceRefresh: Boolean = false): List<AIModel>

    /**
     * Retrieve single model metadata.
     */
    suspend fun getModel(modelId: String): AIModel?

    /**
     * Validates API credentials and connectivity.
     */
    suspend fun testConnection(apiKey: String? = null): ConnectionTestResult

    /**
     * Cancels an ongoing generation job.
     */
    fun cancelGeneration()
}

/**
 * Stream events emitted during token progression.
 */
sealed class AIStreamChunk {
    data class Delta(val text: String) : AIStreamChunk()
    data class Usage(val usage: AIUsage) : AIStreamChunk()
    data class Completed(val fullContent: String, val usage: AIUsage?) : AIStreamChunk()
    data class Error(val error: AIError) : AIStreamChunk()
}

data class ConnectionTestResult(
    val isSuccessful: Boolean,
    val latencyMs: Long,
    val message: String,
    val error: AIError? = null
)
