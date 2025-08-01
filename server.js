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
    /^http:\/\/localhost:\d+$/,
    null // Allow file:// protocol for testing
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
      chatWithContext: '/api/chat-with-context (alternative endpoint)',
      ocr: '/api/ocr (AI-powered document text analysis and data extraction)'
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

// AI-Powered OCR Text Analysis Endpoint
app.post('/api/ocr', async (req, res) => {
  try {
    const { text, documentType = 'modeling_document' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Text content is required for OCR analysis',
        code: 'MISSING_TEXT'
      });
    }

    if (!process.env.OPENAI_API_KEY || !openai) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        code: 'MISSING_API_KEY'
      });
    }

    console.log('🔍 OCR Analysis Request:', {
      textLength: text.length,
      documentType: documentType,
      timestamp: new Date().toISOString()
    });

    // Create AI prompt for intelligent data extraction
    const systemPrompt = `You are an expert AI assistant specialized in extracting structured data from modeling industry documents, contracts, booking confirmations, and related business documents.

TASK: Analyze the provided text and extract ALL relevant information into a structured JSON format.

EXTRACTION RULES:
1. Extract EVERY piece of information you can identify
2. Handle various document formats (emails, contracts, booking forms, etc.)
3. Understand context and relationships between data points
4. Extract both explicit and implicit information
5. Handle different date formats, currencies, and naming conventions
6. Be intelligent about synonyms and industry terminology

REQUIRED OUTPUT FORMAT (JSON):
{
  "clientName": "string | null",
  "location": "string | null",
  "date": "YYYY-MM-DD format | null",
  "endDate": "YYYY-MM-DD format | null",
  "dayRate": "number | null",
  "usageRate": "number | null",
  "currency": "USD|EUR|GBP|etc | null",
  "bookingAgent": "string | null",
  "contactPerson": "string | null",
  "notes": "string | null",
  "optionType": "string | null",
  "jobType": "string | null",
  "jobTitle": "string | null",
  "media": "string | null",
  "usagePeriod": "string | null",
  "exclusivity": "string | null",
  "releaseCountry": "string | null",
  "budget": "number | null",
  "paymentTerms": "string | null",
  "requirements": "string | null",
  "timeline": "string | null",
  "additionalInfo": "string | null",
  "phoneNumber": "string | null",
  "email": "string | null",
  "address": "string | null",
  "company": "string | null",
  "extraHours": "number | null",
  "agencyFee": "number | null",
  "tax": "number | null",
  "additionalFees": "number | null",
  "callTime": "string | null",
  "startTime": "string | null",
  "endTime": "string | null",
  "checkInDate": "YYYY-MM-DD format | null",
  "checkOutDate": "YYYY-MM-DD format | null",
  "hotelAddress": "string | null",
  "hotelCost": "number | null",
  "pocketMoney": "number | null",
  "agencyName": "string | null",
  "agencyAddress": "string | null",
  "contractDetails": "string | null",
  "subject": "string | null",
  "industryContact": "string | null",
  "photographer": "string | null",
  "eventName": "string | null",
  "flightCost": "number | null",
  "name": "string | null",
  "fullName": "string | null",
  "contactName": "string | null",
  "website": "string | null",
  "agencyType": "string | null",
  "commissionRate": "number | null",
  "jobTitle": "string | null",
  "mobile": "string | null",
  "instagram": "string | null",
  "organization": "string | null"
}

INTELLIGENCE GUIDELINES:
- If you see "Client: SAMSUNG", extract clientName as "SAMSUNG"
- If you see "Agent: Sarah Johnson", extract bookingAgent as "Sarah Johnson"
- If you see "Budget: 6000 euros", extract budget as 6000 and currency as "EUR"
- If you see "2nd week of May 2025", convert to approximate date like "2025-05-15"
- If you see payment information, extract to paymentTerms
- If you see requirements or specifications, extract to requirements
- Combine related information intelligently in notes
- Handle typos and OCR errors gracefully
- Extract phone numbers, emails, addresses when present

PAYMENT EXTRACTION RULES:
- If you see "Day Rate: 500 EUR", extract dayRate as 500
- If you see "Usage Rate: 5500 EUR", extract usageRate as 5500
- If you see "Budget: 6000 euros gross" without separate day rate and usage rate:
  * Set dayRate to the EXACT budget amount (6000)
  * Leave usageRate as null (do not auto-calculate)
  * This means the entire budget goes to day rate when rates are not specified separately
- If both day rate and usage rate are explicitly mentioned, use those exact values
- NEVER auto-calculate or split budget amounts - use exact values only
- Always extract currency from any monetary amount

DYNAMIC FIELD EXTRACTION RULES:

JOB TYPE EXTRACTION (jobType):
- Look for: "Commercial", "Editorial", "Fashion show", "Lookbook", "E-commerce", "Beauty", "Portrait", "Runway", "Campaign", "Catalog", "Social media", "Web content", "Print", "Digital", "Video", "TVC", "Advertisement"
- Extract from phrases like: "Commercial shoot", "Editorial job", "Fashion campaign", "Beauty lookbook", "E-commerce photography"
- Also check for brand names that indicate job type (e.g., "Samsung Galaxy" = Commercial)

FINANCIAL FIELDS EXTRACTION:
- agencyFee: "Agency fee: 20%", "Commission: 15%", "Agent commission: 10%", "Booking fee: 25%"
- extraHours: "Extra hours: 2", "Overtime: 3 hours", "Additional time: 1.5h", "Extended shoot: 2 hours"
- tax: "Tax: 19%", "VAT: 21%", "Income tax: 15%", "Withholding: 10%"
- additionalFees: "Additional fees: 100", "Extra costs: 50", "Travel expenses: 200", "Accommodation: 150"

TIME EXTRACTION:
- callTime: "Call time: 09:00", "Arrival: 8:30 AM", "Be ready at: 7:30", "Makeup call: 06:00"
- startTime: "Start time: 10:00", "Shoot starts: 9:00 AM", "Begin: 08:30"
- endTime: "End time: 17:00", "Finish: 5:00 PM", "Wrap: 18:00"
- Handle formats: "9:00", "09:00", "9:00 AM", "09:00 AM", "9 AM", "0900"

OPTION TYPE EXTRACTION (optionType):
- Same as jobType but for option/casting contexts
- Look for casting-specific terms: "Casting", "Test shoot", "Fitting", "Go-see", "Audition"

SMART CONTEXT DETECTION & DYNAMIC SCENARIOS:
- If document mentions "casting" or "audition" → likely optionType, focus on: date, time, location, agent
- If document mentions "shoot" or "job" → likely jobType, focus on: rates, times, duration, crew
- If document mentions "hotel" or "accommodation" → likely onStay, focus on: check-in/out dates, hotel details, costs
- If document mentions "meeting" or "conference" → likely meeting, focus on: subject, industry contact, agenda
- If document has rates and dates → likely confirmed job, extract all financial details
- If document says "option" or "hold" → likely option/casting, focus on option status and terms
- If document mentions "direct booking" → skip option status, focus on confirmed details
- If document mentions travel/flight → extract travel costs and accommodation details
- If document is a contract → extract contract details, terms, and legal information
- If document mentions "agency" or "model management" → likely agency document, focus on: name, type, commission, contact details
- If document mentions "agent" or "booker" → likely agent document, focus on: name, email, phone, title
- If document mentions "industry contact" or "client contact" → likely contact document, focus on: name, company, title, contact info
- If document mentions "shooting" or "shoot schedule" → likely shooting document, focus on: client, type, location, date, times, rate

ACCOMMODATION & TRAVEL EXTRACTION:
- checkInDate/checkOutDate: "Check-in: 2025-07-20", "Arrival: July 20", "Stay from: 20/07/2025"
- hotelAddress: "Hotel: Marriott Warsaw", "Accommodation: Hotel Bristol", "Stay at: Hilton"
- hotelCost: "Hotel cost: 150 EUR", "Accommodation: €120/night", "Room rate: $200"
- pocketMoney: "Pocket money: 50 EUR", "Daily allowance: €30", "Per diem: $40"
- flightCost: "Flight: 300 EUR", "Travel cost: €250", "Airfare: $400"

AGENCY & EVENT EXTRACTION:
- agencyName: "Agency: Elite Models", "Represented by: IMG", "Booking agency: Next"
- agencyAddress: "Agency address:", "Office:", "Located at:"
- contractDetails: "Contract:", "Agreement:", "Terms:", "Conditions:"
- subject: "Subject:", "Re:", "Regarding:", "About:"
- industryContact: "Contact:", "Industry contact:", "Client contact:"
- photographer: "Photographer:", "Shot by:", "Photo by:"
- eventName: "Event:", "Campaign:", "Project:", "Shoot name:"

AGENCY-SPECIFIC EXTRACTION:
- name/agencyName: "Agency Name:", "Company:", "Organization:", "Agency:"
- agencyType: "Type:", "Agency type:", "Mother agency", "Subsidiary", "Independent"
- website: "Website:", "URL:", "Web:", "Site:", "www."
- commissionRate: "Commission:", "Rate:", "Percentage:", "Fee:", "15%", "20%"

AGENT-SPECIFIC EXTRACTION:
- name/fullName: "Agent Name:", "Full Name:", "Name:", "Agent:"
- email: "Email:", "E-mail:", "@", "Contact email:"
- mobile: "Mobile:", "Phone:", "Cell:", "Contact:", "+", "Tel:"
- jobTitle: "Title:", "Position:", "Role:", "Agent", "Booker", "Manager"

INDUSTRY CONTACT EXTRACTION:
- name/contactName: "Contact Name:", "Full Name:", "Industry Contact:", "Name:"
- company: "Company:", "Organization:", "Firm:", "Agency:", "Studio:"
- jobTitle: "Title:", "Position:", "Role:", "Job:", "Department:"
- instagram: "Instagram:", "IG:", "@", "Social:", "Handle:"

SHOOTING-SPECIFIC EXTRACTION:
- clientName: "Client:", "Brand:", "Company:", "Shooting for:", "Campaign for:"
- type: "Type:", "Shooting type:", "Campaign", "Editorial", "E-commerce", "Lookbook", "TVC"
- location: "Location:", "Studio:", "Address:", "Venue:", "Set:"
- date: "Date:", "Shooting date:", "Schedule:", "When:"
- startTime/endTime: "Time:", "Start:", "End:", "From:", "To:", "9:00-17:00"
- rate: "Rate:", "Fee:", "Payment:", "Budget:", "Cost:"

FLEXIBLE PATTERN MATCHING:
- Use fuzzy matching for field names (e.g., "Day rate", "Daily rate", "Per day", "Day fee")
- Handle multiple currencies and formats
- Extract from tables, lists, or paragraph text
- Handle typos and variations in field names
- Recognize date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, "July 20, 2025"

RESPOND WITH ONLY THE JSON OBJECT - NO OTHER TEXT.`;

    // Call OpenAI for intelligent extraction
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use GPT-4 for better accuracy
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Please analyze this text and extract all relevant information:\n\n${text}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for consistent extraction
      response_format: { type: "json_object" }
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let extractedData;
    try {
      extractedData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Invalid JSON response from AI');
    }

    console.log('✅ OCR Analysis Complete:', {
      fieldsExtracted: Object.keys(extractedData).filter(key => extractedData[key] !== null).length,
      totalFields: Object.keys(extractedData).length,
      extractedData: extractedData
    });

    res.json({
      success: true,
      extractedData: extractedData,
      usage: completion.usage,
      model: completion.model,
      timestamp: new Date().toISOString(),
      textLength: text.length,
      fieldsExtracted: Object.keys(extractedData).filter(key => extractedData[key] !== null).length,
      confidence: 'high' // GPT-4 provides high confidence extraction
    });

  } catch (error) {
    console.error('OCR API Error:', error);

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
      code: 'OCR_ERROR',
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
