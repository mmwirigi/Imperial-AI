package ke.imperialenterprise.imperialai.ui.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import ke.imperialenterprise.imperialai.domain.agent.AIProvider
import ke.imperialenterprise.imperialai.domain.agent.AIStreamChunk
import ke.imperialenterprise.imperialai.domain.agent.McpManager
import ke.imperialenterprise.imperialai.domain.agent.ToolRegistry
import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.repository.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

data class ChatUiState(
    val sites: List<Site> = emptyList(),
    val activeSite: Site? = null,
    val conversation: ChatConversation? = null,
    val messages: List<ChatMessage> = emptyList(),
    val inputText: String = "",
    val isSiteSelectorOpen: Boolean = false,
    val isModelPickerOpen: Boolean = false,
    val isToolsDrawerOpen: Boolean = false,
    val isStreaming: Boolean = false,
    val streamingPartialText: String = "",
    val activeAiModelId: String = "google/gemini-2.0-flash-exp:free",
    val activeAiModel: AIModel? = null,
    val availableModels: List<AIModel> = emptyList(),
    val isOpenRouterConfigured: Boolean = false,
    val activeError: AIError? = null,
    val pendingDangerousApproval: ApprovalPromptData? = null,
    val pendingToolExecutionRequest: ToolExecutionRequest? = null,
    val activeMcpStatus: McpConnectionStatus = McpConnectionStatus.NOT_CONFIGURED,
    val activeSiteTools: List<McpTool> = emptyList()
)

class ChatViewModel(
    private val siteRepository: SiteRepository,
    private val conversationRepository: ConversationRepository,
    private val aiProvider: AIProvider,
    private val modelRepository: ModelRepository,
    private val credentialStore: CredentialStore,
    private val mcpManager: McpManager,
    private val toolRegistry: ToolRegistry
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    private var activeGenerationJob: Job? = null

    init {
        loadSites()
        observeOpenRouterStatus()
        observeModels()
        observeMcpState()
    }

    private fun loadSites() {
        viewModelScope.launch {
            siteRepository.getSites().collect { siteList ->
                val currentActive = _uiState.value.activeSite
                val newActive = if (currentActive != null && siteList.any { it.id == currentActive.id }) {
                    siteList.first { it.id == currentActive.id }
                } else {
                    siteList.firstOrNull()
                }

                _uiState.update {
                    it.copy(
                        sites = siteList,
                        activeSite = newActive
                    )
                }

                if (newActive != null) {
                    loadConversationForSite(newActive)
                    mcpManager.switchActiveSite(newActive, _uiState.value.conversation?.id)
                }
            }
        }
    }

    private fun observeOpenRouterStatus() {
        viewModelScope.launch {
            val hasKey = credentialStore.hasOpenRouterApiKey()
            _uiState.update { it.copy(isOpenRouterConfigured = hasKey) }
        }
    }

    private fun observeMcpState() {
        viewModelScope.launch {
            combine(
                mcpManager.activeConnectionStatus,
                mcpManager.activeSiteTools
            ) { status, tools ->
                _uiState.update {
                    it.copy(
                        activeMcpStatus = status,
                        activeSiteTools = tools
                    )
                }
            }.collect()
        }
    }

    private fun observeModels() {
        viewModelScope.launch {
            combine(
                modelRepository.catalogState,
                modelRepository.getGlobalDefaultModelId()
            ) { catalog, globalDefaultId ->
                val currentConv = _uiState.value.conversation
                val effectiveModelId = if (currentConv != null) {
                    modelRepository.getConversationModelId(currentConv.id).first() ?: globalDefaultId
                } else {
                    globalDefaultId
                }

                val modelObj = catalog.models.find { it.id == effectiveModelId }
                    ?: catalog.models.find { it.id == globalDefaultId }

                _uiState.update {
                    it.copy(
                        availableModels = catalog.models,
                        activeAiModelId = effectiveModelId,
                        activeAiModel = modelObj
                    )
                }
            }.collect()
        }
    }

    fun openSiteSelector() {
        _uiState.update { it.copy(isSiteSelectorOpen = true) }
    }

    fun closeSiteSelector() {
        _uiState.update { it.copy(isSiteSelectorOpen = false) }
    }

    fun openModelPicker() {
        _uiState.update { it.copy(isModelPickerOpen = true) }
    }

    fun closeModelPicker() {
        _uiState.update { it.copy(isModelPickerOpen = false) }
    }

    fun toggleToolsDrawer() {
        _uiState.update { it.copy(isToolsDrawerOpen = !it.isToolsDrawerOpen) }
    }

    fun selectActiveSite(site: Site) {
        if (_uiState.value.activeSite?.id == site.id) {
            closeSiteSelector()
            return
        }
        _uiState.update {
            it.copy(
                activeSite = site,
                isSiteSelectorOpen = false
            )
        }
        loadConversationForSite(site)
        viewModelScope.launch {
            mcpManager.switchActiveSite(site, _uiState.value.conversation?.id)
        }
    }

    fun selectModel(modelId: String) {
        viewModelScope.launch {
            val conv = _uiState.value.conversation
            if (conv != null) {
                modelRepository.setConversationModelId(conv.id, modelId)
            }
            val modelObj = _uiState.value.availableModels.find { it.id == modelId }
            _uiState.update {
                it.copy(
                    activeAiModelId = modelId,
                    activeAiModel = modelObj,
                    isModelPickerOpen = false
                )
            }
        }
    }

    private fun loadConversationForSite(site: Site) {
        viewModelScope.launch {
            var conv = conversationRepository.getActiveConversationForSite(site.id)
            if (conv == null) {
                conv = conversationRepository.createConversation(
                    siteId = site.id,
                    title = "Site Operations: ${site.siteName}"
                )
            }

            _uiState.update { it.copy(conversation = conv) }

            // Switch MCP context with new conversation ID
            mcpManager.switchActiveSite(site, conv.id)

            // Observe messages
            conversationRepository.getMessages(conv.id).collect { msgList ->
                _uiState.update { it.copy(messages = msgList) }
            }
        }
    }

    fun onInputTextChanged(newText: String) {
        _uiState.update { it.copy(inputText = newText) }
    }

    fun cancelGeneration() {
        activeGenerationJob?.cancel()
        aiProvider.cancelGeneration()
        _uiState.update {
            it.copy(
                isStreaming = false,
                streamingPartialText = ""
            )
        }
    }

    fun sendMessage() {
        val text = _uiState.value.inputText.trim()
        val site = _uiState.value.activeSite ?: return
        val conv = _uiState.value.conversation ?: return
        if (text.isBlank() || _uiState.value.isStreaming) return

        _uiState.update { it.copy(inputText = "", activeError = null) }

        val userMessage = ChatMessage(
            id = "msg_${System.currentTimeMillis()}",
            conversationId = conv.id,
            siteId = site.id,
            sender = MessageRole.USER,
            content = text,
            timestamp = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
        )

        viewModelScope.launch {
            conversationRepository.addMessage(userMessage)
            generateAiResponse(site, conv, text)
        }
    }

    private fun generateAiResponse(site: Site, conv: ChatConversation, promptText: String) {
        val modelId = _uiState.value.activeAiModelId
        val mcpTools = _uiState.value.activeSiteTools

        // Format system instructions with strict MCP context & available tools
        val toolsListing = if (mcpTools.isNotEmpty()) {
            mcpTools.joinToString("\n") { "- ${it.name} (${it.riskLevel.displayName}): ${it.description}" }
        } else {
            "No remote MCP tools currently discovered for this site."
        }

        val systemPrompt = """
            You are Imperial AI, an elite autonomous executive engineering agent managing the WordPress installation for ${site.siteName} (${site.websiteUrl}).
            Strict Site Isolation: You are solely operating on site ID ${site.id}.
            Active MCP Server Tools:
            $toolsListing
            
            Always evaluate security risks before suggesting actions. Destructive operations require explicit human approval.
        """.trimIndent()

        val fullRequest = AIRequest(
            model = modelId,
            messages = listOf(
                AIMessage(role = "system", content = systemPrompt),
                AIMessage(role = "user", content = promptText)
            ),
            temperature = 0.4f
        )

        _uiState.update {
            it.copy(
                isStreaming = true,
                streamingPartialText = ""
            )
        }

        activeGenerationJob = viewModelScope.launch {
            val streamFlow = aiProvider.streamMessage(fullRequest)
            var accumulatedText = ""
            var reportedUsage: AIUsage? = null

            streamFlow.catch { e ->
                val aiError = if (e is AIProviderException) e.error else AIError.NetworkError("Network interrupted: ${e.message}")
                _uiState.update {
                    it.copy(
                        isStreaming = false,
                        activeError = aiError
                    )
                }
            }.collect { chunk ->
                when (chunk) {
                    is AIStreamChunk.Delta -> {
                        accumulatedText += chunk.text
                        _uiState.update { it.copy(streamingPartialText = accumulatedText) }
                    }
                    is AIStreamChunk.UsageReport -> {
                        reportedUsage = chunk.usage
                    }
                    is AIStreamChunk.Complete -> {
                        accumulatedText = chunk.fullContent
                        reportedUsage = chunk.usage ?: reportedUsage
                    }
                    is AIStreamChunk.Error -> {
                        _uiState.update {
                            it.copy(
                                isStreaming = false,
                                activeError = chunk.error
                            )
                        }
                    }
                }
            }

            // Save completed assistant message
            if (accumulatedText.isNotBlank()) {
                val assistantMsg = ChatMessage(
                    id = "msg_${System.currentTimeMillis()}",
                    conversationId = conv.id,
                    siteId = site.id,
                    sender = MessageRole.ASSISTANT,
                    content = accumulatedText,
                    timestamp = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date()),
                    usage = reportedUsage
                )
                conversationRepository.addMessage(assistantMsg)
            }

            _uiState.update {
                it.copy(
                    isStreaming = false,
                    streamingPartialText = ""
                )
            }
        }
    }

    /**
     * Executes an MCP tool proposed by the agent or triggered from UI with strict client isolation.
     */
    fun triggerToolExecution(tool: McpTool, arguments: Map<String, Any?>) {
        val site = _uiState.value.activeSite ?: return
        val conv = _uiState.value.conversation ?: return

        val request = ToolExecutionRequest(
            siteId = site.id,
            mcpServerId = tool.serverId,
            toolName = tool.name,
            arguments = arguments,
            conversationId = conv.id,
            operatorAuthorized = false
        )

        // If tool requires approval, show operator confirmation prompt
        if (tool.requiresApproval || tool.riskLevel != ToolRiskLevel.READ) {
            val prompt = ApprovalPromptData(
                actionType = toolRegistry.mapToolToDangerousAction(tool.name),
                description = "Execute remote MCP tool: ${tool.name} on ${site.siteName}\nParameters: ${request.sanitizedArgumentsSummary()}",
                targetResource = site.websiteUrl,
                status = "PENDING"
            )
            _uiState.update {
                it.copy(
                    pendingDangerousApproval = prompt,
                    pendingToolExecutionRequest = request
                )
            }
            return
        }

        // Direct execution for read-only tools
        executeValidatedTool(request.copy(operatorAuthorized = true), tool)
    }

    fun approvePendingAction() {
        val request = _uiState.value.pendingToolExecutionRequest ?: return
        val site = _uiState.value.activeSite ?: return
        val tool = toolRegistry.findTool(site.id, request.toolName) ?: return

        _uiState.update {
            it.copy(
                pendingDangerousApproval = null,
                pendingToolExecutionRequest = null
            )
        }

        executeValidatedTool(request.copy(operatorAuthorized = true), tool)
    }

    fun rejectPendingAction() {
        _uiState.update {
            it.copy(
                pendingDangerousApproval = null,
                pendingToolExecutionRequest = null
            )
        }
    }

    private fun executeValidatedTool(request: ToolExecutionRequest, tool: McpTool) {
        val site = _uiState.value.activeSite ?: return
        val conv = _uiState.value.conversation ?: return

        viewModelScope.launch {
            // Log tool call in chat
            val callMsg = ChatMessage(
                id = "msg_${System.currentTimeMillis()}",
                conversationId = conv.id,
                siteId = site.id,
                sender = MessageRole.ASSISTANT,
                content = "Calling tool: ${tool.name}",
                timestamp = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date()),
                toolCall = ToolCallData(
                    toolName = tool.name,
                    callId = request.executionId,
                    argumentsSummary = request.sanitizedArgumentsSummary(),
                    status = "RUNNING"
                )
            )
            conversationRepository.addMessage(callMsg)

            val result = mcpManager.executeTool(request)
            if (result.isSuccess) {
                val toolResult = result.getOrThrow()
                val resultMsg = ChatMessage(
                    id = "msg_${System.currentTimeMillis() + 1}",
                    conversationId = conv.id,
                    siteId = site.id,
                    sender = MessageRole.TOOL,
                    content = toolResult.toDisplayText(),
                    timestamp = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date()),
                    toolResult = ToolResultData(
                        toolName = tool.name,
                        callId = request.executionId,
                        outputSummary = toolResult.toDisplayText().take(120),
                        executionDurationMs = toolResult.executionDurationMs,
                        isError = toolResult.isError
                    )
                )
                conversationRepository.addMessage(resultMsg)
            } else {
                val err = result.exceptionOrNull()?.message ?: "Execution failed"
                val resultMsg = ChatMessage(
                    id = "msg_${System.currentTimeMillis() + 1}",
                    conversationId = conv.id,
                    siteId = site.id,
                    sender = MessageRole.TOOL,
                    content = "Error: $err",
                    timestamp = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date()),
                    toolResult = ToolResultData(
                        toolName = tool.name,
                        callId = request.executionId,
                        outputSummary = err,
                        executionDurationMs = 0L,
                        isError = true
                    )
                )
                conversationRepository.addMessage(resultMsg)
            }
        }
    }
}
