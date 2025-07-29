import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import ContextService from './services/contextService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI (only if API key is available)
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://modelday-flutter-web-v2.vercel.app',
    'https://modelday-frontend.vercel.app',
    /^https:\/\/.*\.vercel\.app$/,
    /^http:\/\/localhost:\d+$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ModelDay Backend Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      chat: '/api/chat (enhanced with automatic context building)',
      context: '/api/context (for testing and manual context building)',
      chatWithContext: '/api/chat-with-context (alternative endpoint)'
    },
    features: {
      contextBuilding: 'Automatic context building from userData',
      contextLimitations: 'Intelligent fallback when no data available',
      multipleDataSources: 'userData, context, or conversation embedding',
      backwardCompatible: 'Works with existing frontend without changes'
    }
  });
});

// Chat endpoint with OpenAI integration and automatic context building
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversation = [], userData = null, context = null } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        code: 'MISSING_MESSAGE'
      });
    }

    if (!process.env.OPENAI_API_KEY || !openai) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        code: 'MISSING_API_KEY'
      });
    }

    // Automatically build comprehensive user context using ContextService
    let systemContext;

    // Priority 1: Use pre-built context if provided
    if (context && typeof context === 'string' && context.trim().length > 0) {
      console.log('🔄 Using pre-built context from request');
      systemContext = context;
    }
    // Priority 2: Build context from userData if available
    else if (userData && Object.keys(userData).length > 0) {
      console.log('🔄 Building context from userData');
      systemContext = ContextService.buildUserContext(userData);
    }
    // Priority 3: Check if userData is embedded in conversation history
    else if (conversation && conversation.length > 0) {
      console.log('🔄 Checking conversation for embedded userData');
      // Look for userData in conversation metadata
      const contextMessage = conversation.find(msg => msg.userData || msg.context);
      if (contextMessage) {
        if (contextMessage.userData) {
          systemContext = ContextService.buildUserContext(contextMessage.userData);
        } else if (contextMessage.context) {
          systemContext = contextMessage.context;
        }
      }
    }

    // Fallback: Use basic context with limitations
    if (!systemContext) {
      console.log('🔄 Using fallback context with limitations');
      systemContext = `You are ModelDay AI, a helpful assistant for the ModelDay platform.

IMPORTANT CONTEXT LIMITATIONS:
- You currently have NO ACCESS to the user's personal modeling data (jobs, events, bookings, etc.)
- You cannot provide specific insights about their career, earnings, or schedule
- You cannot analyze their booking patterns, agent relationships, or financial data
- You should NOT make up or assume any personal information about the user

What you CAN help with:
1. General modeling industry advice and guidance
2. Portfolio creation tips and best practices
3. Career development strategies in fashion and modeling
4. Industry insights and trends
5. Professional networking advice
6. Casting preparation and audition tips
7. General business advice for models

If the user asks about their specific data, politely explain that you need access to their ModelDay account data to provide personalized insights. Suggest they ensure their data is properly synced or contact support if needed.

Be professional, encouraging, and provide practical general advice while being transparent about your current limitations.`;
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: systemContext
      },
      ...conversation.map(msg => ({
        role: msg.role || 'user',
        content: msg.content || msg.message
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Determine context status for response
    const hasUserData = (userData && Object.keys(userData).length > 0) ||
                       (context && context.includes('USER PROFILE:')) ||
                       (conversation && conversation.some(msg => msg.userData || (msg.context && msg.context.includes('USER PROFILE:'))));

    const contextLimited = !hasUserData;

    res.json({
      success: true,
      response: aiResponse,
      usage: completion.usage,
      model: completion.model,
      timestamp: new Date().toISOString(),
      hasUserData: hasUserData,
      contextLimited: contextLimited,
      contextSource: context ? 'pre-built' :
                    (userData ? 'userData' :
                    (conversation.some(msg => msg.userData || msg.context) ? 'conversation' : 'fallback')),
      // Helper for frontend to understand how to send data
      dataFormat: {
        userData: "Send user data in 'userData' field",
        context: "Send pre-built context in 'context' field",
        conversation: "Embed userData/context in conversation messages"
      }
    });

  } catch (error) {
    console.error('Chat API Error:', error);

    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({
        error: 'API quota exceeded. Please try again later.',
        code: 'QUOTA_EXCEEDED'
      });
    }

    if (error.code === 'invalid_api_key') {
      return res.status(401).json({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }

    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Context building endpoint for testing and integration
app.post('/api/context', async (req, res) => {
  try {
    const { userData } = req.body;

    if (!userData) {
      return res.status(400).json({
        error: 'User data is required',
        code: 'MISSING_USER_DATA'
      });
    }

    // Build context using ContextService
    const context = ContextService.buildUserContext(userData);

    res.json({
      success: true,
      context: context,
      timestamp: new Date().toISOString(),
      dataStats: {
        jobs: userData.jobs?.length || 0,
        events: userData.events?.length || 0,
        aiJobs: userData.aiJobs?.length || 0,
        agencies: userData.agencies?.length || 0,
        agents: userData.agents?.length || 0,
        meetings: userData.meetings?.length || 0,
        onStays: userData.onStays?.length || 0,
        shootings: userData.shootings?.length || 0
      },
      // Instructions for using with /api/chat
      usage: {
        method1: "Send this context in 'context' field to /api/chat",
        method2: "Send original userData in 'userData' field to /api/chat",
        method3: "Embed userData in conversation message metadata"
      }
    });

  } catch (error) {
    console.error('Context API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'CONTEXT_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Helper endpoint: Build context and chat in one call (alternative to separate calls)
app.post('/api/chat-with-context', async (req, res) => {
  try {
    const { message, conversation = [], userData } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        code: 'MISSING_MESSAGE'
      });
    }

    if (!userData) {
      return res.status(400).json({
        error: 'User data is required for this endpoint',
        code: 'MISSING_USER_DATA'
      });
    }

    // Build context first
    const context = ContextService.buildUserContext(userData);

    // Then make the chat request internally
    const chatRequest = {
      message,
      conversation,
      context // Use pre-built context
    };

    // Forward to chat endpoint logic (reuse the same logic)
    req.body = chatRequest;

    // Redirect to chat endpoint
    return res.redirect(307, '/api/chat');

  } catch (error) {
    console.error('Chat with Context API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'CHAT_CONTEXT_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'UNHANDLED_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Start server (only in non-serverless environments)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 ModelDay Backend Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
  });
}

export default app;
