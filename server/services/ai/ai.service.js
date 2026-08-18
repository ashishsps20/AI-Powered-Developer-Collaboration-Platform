import AIConversation from '../../models/AIConversation.js';
import AIMessage from '../../models/AIMessage.js';
import AIUsageLog from '../../models/AIUsageLog.js';
import contextBuilderService from './contextBuilder.service.js';
import ragService from '../rag/rag.service.js';
import llmService from './llm.service.js';
import responseParserService from './responseParser.service.js';
import { SYSTEM_PROMPT } from './prompts/projectAssistant.prompt.js';

class AIService {
  async chat(organizationId, projectId, userId, data) {
    const { message, conversationId } = data;
    if (!message) throw new Error('Message is required');

    let conversation;

    // 1. Load or Create Conversation
    if (conversationId) {
      conversation = await AIConversation.findOne({
        _id: conversationId,
        project: projectId,
        user: userId,
      });
      if (!conversation) throw new Error('Conversation not found or unauthorized');
    } else {
      conversation = await AIConversation.create({
        user: userId,
        organization: organizationId,
        project: projectId,
        title: message.substring(0, 50),
      });
    }

    // 2. Save User Message
    const userMessage = await AIMessage.create({
      conversation: conversation._id,
      role: 'USER',
      content: message,
    });

    // Update conversation timestamp
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const startTime = Date.now();

    try {
      // 3. Build Project Context
      const context = await contextBuilderService.buildProjectContext(
        organizationId,
        projectId,
        userId,
        message
      );

      // 4. Load RAG Knowledge (Semantic Search)
      const ragKnowledge = await ragService.retrieveKnowledge(organizationId, projectId, message);
      let ragContextText = '';
      if (ragKnowledge.length > 0) {
        ragContextText = '\n\nKNOWLEDGE BASE CONTEXT (Retrieved Documents):\n';
        ragContextText += ragKnowledge.map((k, index) => 
          `[Source ${index + 1}: ${k.title} - ${k.section}]\n${k.content}\n`
        ).join('\n');
      }

      // 5. Load Conversation History (last 10 messages)
      const history = await AIMessage.find({ conversation: conversation._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      
      history.reverse(); // chronological order

      // 6. Assemble Messages for LLM
      const systemPromptContent = `${SYSTEM_PROMPT}\n\nPROJECT CONTEXT:\n${JSON.stringify(context, null, 2)}${ragContextText}`;
      
      const llmMessages = [
        {
          role: 'system',
          content: systemPromptContent
        },
        ...history.map(msg => ({
          role: msg.role === 'ASSISTANT' ? 'assistant' : 'user',
          content: msg.content
        }))
      ];

      // 6. Call LLM Service
      const llmResponse = await llmService.generateResponse(llmMessages);

      // 7. Parse and Validate Response
      const parsed = responseParserService.parseResponse(llmResponse.content);

      // 8. Map sources and Save Assistant Message
      const mappedSources = (parsed.sources || []).map(s => {
        if (s.type === 'DOCUMENT' && s.id && ragKnowledge[parseInt(s.id) - 1]) {
          const k = ragKnowledge[parseInt(s.id) - 1];
          return {
            type: 'DOCUMENT',
            documentId: k.documentId,
            chunkId: k.chunkId,
            title: k.title,
            section: k.section
          };
        }
        return s;
      });

      const assistantMessage = await AIMessage.create({
        conversation: conversation._id,
        role: 'ASSISTANT',
        content: parsed.answer,
        metadata: {
          sources: mappedSources,
        },
      });

      // Update conversation timestamp again
      conversation.lastMessageAt = new Date();
      await conversation.save();

      // 9. Save Usage Log
      const processingTimeMs = Date.now() - startTime;
      await AIUsageLog.create({
        user: userId,
        organization: organizationId,
        project: projectId,
        conversation: conversation._id,
        model: llmResponse.model,
        requestTokens: llmResponse.usage.promptTokens,
        responseTokens: llmResponse.usage.completionTokens,
        totalTokens: llmResponse.usage.totalTokens,
        processingTimeMs,
        status: 'SUCCESS',
      });

      return {
        conversationId: conversation._id,
        message: {
          id: assistantMessage._id,
          role: assistantMessage.role,
          content: assistantMessage.content,
          sources: assistantMessage.metadata.sources,
          createdAt: assistantMessage.createdAt,
        }
      };

    } catch (error) {
      // Log failed usage
      const processingTimeMs = Date.now() - startTime;
      await AIUsageLog.create({
        user: userId,
        organization: organizationId,
        project: projectId,
        conversation: conversation._id,
        model: process.env.AI_MODEL || 'unknown',
        processingTimeMs,
        status: 'ERROR',
      }).catch(err => console.error('Failed to save error log', err));

      throw error;
    }
  }

  async getConversations(projectId, userId) {
    return AIConversation.find({ project: projectId, user: userId })
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .lean();
  }

  async createConversation(organizationId, projectId, userId, title) {
    return AIConversation.create({
      user: userId,
      organization: organizationId,
      project: projectId,
      title: title || 'New Conversation',
    });
  }

  async getMessages(projectId, userId, conversationId, limit = 50, skip = 0) {
    const conversation = await AIConversation.findOne({
      _id: conversationId,
      project: projectId,
      user: userId,
    });
    if (!conversation) throw new Error('Conversation not found');

    const messages = await AIMessage.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return messages.map(msg => ({
      id: msg._id,
      role: msg.role,
      content: msg.content,
      sources: msg.metadata?.sources || [],
      createdAt: msg.createdAt,
    }));
  }

  async deleteConversation(projectId, userId, conversationId) {
    const conversation = await AIConversation.findOne({
      _id: conversationId,
      project: projectId,
      user: userId,
    });
    
    if (!conversation) {
      const error = new Error('Conversation not found');
      error.status = 404;
      throw error;
    }

    await AIMessage.deleteMany({ conversation: conversationId });
    await AIConversation.deleteOne({ _id: conversationId });
    
    return true;
  }
}

export default new AIService();
