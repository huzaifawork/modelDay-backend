/**
 * Frontend Integration Examples for ModelDay Backend
 * Shows how to use the enhanced /api/chat endpoint with context building
 */

// Example 1: Send userData directly in the chat request (RECOMMENDED)
export const chatWithUserData = async (message, userData, conversation = []) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        conversation: conversation,
        userData: userData // Backend will automatically build context from this
      })
    });

    const result = await response.json();
    
    console.log('Context Status:', {
      hasUserData: result.hasUserData,
      contextLimited: result.contextLimited,
      contextSource: result.contextSource
    });

    return result;
  } catch (error) {
    console.error('Chat API Error:', error);
    throw error;
  }
};

// Example 2: Send pre-built context (if you want to build context on frontend)
export const chatWithPreBuiltContext = async (message, context, conversation = []) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        conversation: conversation,
        context: context // Pre-built context string
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Chat API Error:', error);
    throw error;
  }
};

// Example 3: Embed userData in conversation (for persistent context)
export const chatWithEmbeddedContext = async (message, userData, conversation = []) => {
  try {
    // Add userData to the first message in conversation for context
    const enhancedConversation = [
      {
        role: 'system',
        content: 'Context data attached',
        userData: userData // Backend will detect this and build context
      },
      ...conversation
    ];

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        conversation: enhancedConversation
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Chat API Error:', error);
    throw error;
  }
};

// Example 4: Fallback chat without user data (will show limitations)
export const chatWithoutData = async (message, conversation = []) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        conversation: conversation
        // No userData - backend will use limitation context
      })
    });

    const result = await response.json();
    
    if (result.contextLimited) {
      console.log('⚠️ Context is limited - no user data available');
      console.log('💡 Suggestion:', result.dataFormat);
    }

    return result;
  } catch (error) {
    console.error('Chat API Error:', error);
    throw error;
  }
};

// Example 5: Build context separately then use it (two-step process)
export const buildContextThenChat = async (message, userData, conversation = []) => {
  try {
    // Step 1: Build context
    const contextResponse = await fetch('/api/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userData: userData
      })
    });

    const contextResult = await contextResponse.json();
    
    if (!contextResult.success) {
      throw new Error('Failed to build context');
    }

    // Step 2: Use pre-built context in chat
    const chatResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        conversation: conversation,
        context: contextResult.context
      })
    });

    return await chatResponse.json();
  } catch (error) {
    console.error('Build Context Then Chat Error:', error);
    throw error;
  }
};

// Sample user data structure for testing
export const sampleUserData = {
  userProfile: {
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1-555-0123"
  },
  jobs: [
    {
      clientName: "Fashion Magazine",
      type: "Editorial",
      date: "2025-08-15",
      rate: 2500,
      currency: "USD",
      status: "Confirmed",
      location: "New York, NY"
    }
  ],
  events: [
    {
      type: "casting",
      clientName: "Elite Agency",
      date: "2025-08-05",
      startTime: "10:00",
      location: "Manhattan, NY"
    }
  ],
  agencies: [
    {
      name: "Elite Model Management",
      city: "New York",
      country: "USA",
      commissionRate: 20
    }
  ]
  // ... other data sections
};

// Usage examples:

// RECOMMENDED: Direct userData approach
// chatWithUserData("Analyze my upcoming bookings", sampleUserData);

// Alternative: Pre-built context approach  
// buildContextThenChat("Show me my earnings", sampleUserData);

// Fallback: No data (will show limitations)
// chatWithoutData("Tell me about my career");

// Response format you'll receive:
/*
{
  "success": true,
  "response": "Based on your data, you have 1 upcoming job...",
  "hasUserData": true,
  "contextLimited": false,
  "contextSource": "userData",
  "dataFormat": {
    "userData": "Send user data in 'userData' field",
    "context": "Send pre-built context in 'context' field",
    "conversation": "Embed userData/context in conversation messages"
  },
  "usage": {...},
  "model": "gpt-3.5-turbo",
  "timestamp": "2025-07-29T17:30:00.000Z"
}
*/
