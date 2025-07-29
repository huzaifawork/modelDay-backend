const OpenAI = require('openai');
const cors = require('cors');

// Initialize OpenAI (only if API key is available)
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// CORS configuration
const corsOptions = {
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
};

// Helper function to run CORS
function runCors(req, res) {
  return new Promise((resolve, reject) => {
    cors(corsOptions)(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

module.exports = async function handler(req, res) {
  // Run CORS
  await runCors(req, res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
      allowedMethods: ['POST']
    });
  }

  try {
    const { message, conversation = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        code: 'MISSING_MESSAGE'
      });
    }

    // Basic input validation for security
    if (typeof message !== 'string' || message.length > 4000) {
      return res.status(400).json({
        error: 'Invalid message format or too long',
        code: 'INVALID_MESSAGE'
      });
    }

    if (!process.env.OPENAI_API_KEY || !openai) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        code: 'MISSING_API_KEY'
      });
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `You are ModelDay AI, a helpful assistant for the ModelDay platform. You help users with modeling, portfolio creation, and career guidance in the fashion and modeling industry. Be professional, encouraging, and provide practical advice.`
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

    res.status(200).json({
      success: true,
      response: aiResponse,
      usage: completion.usage,
      model: completion.model,
      timestamp: new Date().toISOString()
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
}
