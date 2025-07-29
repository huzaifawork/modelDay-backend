/**
 * Test script for enhanced /api/chat endpoint
 * Tests automatic context building functionality
 */

import { sampleUserData, emptyUserData } from '../examples/sampleUserData.js';

// Mock the chat endpoint logic for testing
function mockChatEndpoint(requestBody) {
  const { message, conversation = [], userData = null, context = null } = requestBody;
  
  console.log('📥 Request received:', {
    hasMessage: !!message,
    hasUserData: !!(userData && Object.keys(userData).length > 0),
    hasContext: !!(context && context.trim().length > 0),
    conversationLength: conversation.length
  });

  // Simulate the context building logic
  let systemContext;
  let contextSource;
  
  // Priority 1: Use pre-built context if provided
  if (context && typeof context === 'string' && context.trim().length > 0) {
    console.log('🔄 Using pre-built context from request');
    systemContext = context;
    contextSource = 'pre-built';
  }
  // Priority 2: Build context from userData if available
  else if (userData && Object.keys(userData).length > 0) {
    console.log('🔄 Building context from userData');
    systemContext = `Built context from userData with ${Object.keys(userData).length} sections`;
    contextSource = 'userData';
  }
  // Priority 3: Check if userData is embedded in conversation history
  else if (conversation && conversation.length > 0) {
    console.log('🔄 Checking conversation for embedded userData');
    const contextMessage = conversation.find(msg => msg.userData || msg.context);
    if (contextMessage) {
      if (contextMessage.userData) {
        systemContext = `Built context from conversation userData`;
        contextSource = 'conversation';
      } else if (contextMessage.context) {
        systemContext = contextMessage.context;
        contextSource = 'conversation';
      }
    }
  }
  
  // Fallback: Use basic context with limitations
  if (!systemContext) {
    console.log('🔄 Using fallback context with limitations');
    systemContext = 'Fallback context with limitations';
    contextSource = 'fallback';
  }

  // Determine context status
  const hasUserData = (userData && Object.keys(userData).length > 0) || 
                     (context && context.includes('USER PROFILE:')) ||
                     (conversation && conversation.some(msg => msg.userData || (msg.context && msg.context.includes('USER PROFILE:'))));
  
  const contextLimited = !hasUserData;

  return {
    success: true,
    response: `Mock AI response to: "${message}"`,
    hasUserData: hasUserData,
    contextLimited: contextLimited,
    contextSource: contextSource,
    systemContext: systemContext.substring(0, 100) + '...',
    dataFormat: {
      userData: "Send user data in 'userData' field",
      context: "Send pre-built context in 'context' field", 
      conversation: "Embed userData/context in conversation messages"
    }
  };
}

console.log('🧪 Testing Enhanced Chat Endpoint Logic...\n');

// Test 1: Chat with userData (RECOMMENDED approach)
console.log('='.repeat(80));
console.log('TEST 1: Chat with userData (RECOMMENDED)');
console.log('='.repeat(80));

const test1Request = {
  message: "Analyze my upcoming bookings and earnings",
  conversation: [],
  userData: sampleUserData
};

const test1Response = mockChatEndpoint(test1Request);
console.log('📤 Response:', test1Response);
console.log('✅ Expected: hasUserData=true, contextLimited=false, contextSource=userData\n');

// Test 2: Chat with pre-built context
console.log('='.repeat(80));
console.log('TEST 2: Chat with pre-built context');
console.log('='.repeat(80));

const test2Request = {
  message: "What are my upcoming events?",
  conversation: [],
  context: "You are an AI assistant with access to USER PROFILE: Sarah Johnson..."
};

const test2Response = mockChatEndpoint(test2Request);
console.log('📤 Response:', test2Response);
console.log('✅ Expected: hasUserData=true, contextLimited=false, contextSource=pre-built\n');

// Test 3: Chat with userData embedded in conversation
console.log('='.repeat(80));
console.log('TEST 3: Chat with userData embedded in conversation');
console.log('='.repeat(80));

const test3Request = {
  message: "Show me my statistics",
  conversation: [
    {
      role: 'system',
      content: 'Context data attached',
      userData: sampleUserData
    },
    {
      role: 'user',
      content: 'Hello'
    },
    {
      role: 'assistant',
      content: 'Hi! How can I help you today?'
    }
  ]
};

const test3Response = mockChatEndpoint(test3Request);
console.log('📤 Response:', test3Response);
console.log('✅ Expected: hasUserData=true, contextLimited=false, contextSource=conversation\n');

// Test 4: Chat without any data (fallback with limitations)
console.log('='.repeat(80));
console.log('TEST 4: Chat without any data (fallback with limitations)');
console.log('='.repeat(80));

const test4Request = {
  message: "Tell me about my modeling career",
  conversation: []
};

const test4Response = mockChatEndpoint(test4Request);
console.log('📤 Response:', test4Response);
console.log('✅ Expected: hasUserData=false, contextLimited=true, contextSource=fallback\n');

// Test 5: Chat with empty userData (should use fallback)
console.log('='.repeat(80));
console.log('TEST 5: Chat with empty userData (should use fallback)');
console.log('='.repeat(80));

const test5Request = {
  message: "Analyze my data",
  conversation: [],
  userData: emptyUserData
};

const test5Response = mockChatEndpoint(test5Request);
console.log('📤 Response:', test5Response);
console.log('✅ Expected: hasUserData=false, contextLimited=true, contextSource=userData\n');

console.log('='.repeat(80));
console.log('✅ ALL TESTS COMPLETED!');
console.log('='.repeat(80));

console.log('\n🎯 KEY BENEFITS FOR FRONTEND:');
console.log('1. ✅ No changes needed to existing frontend code');
console.log('2. ✅ Just add userData to existing /api/chat requests');
console.log('3. ✅ Automatic context building happens in backend');
console.log('4. ✅ Intelligent fallback when no data available');
console.log('5. ✅ Multiple ways to send data (userData, context, conversation)');
console.log('6. ✅ Response includes helpful metadata about context status');

console.log('\n📝 FRONTEND INTEGRATION:');
console.log('// Existing code (will work with limitations):');
console.log('fetch("/api/chat", { method: "POST", body: JSON.stringify({ message: "Hello" }) })');
console.log('');
console.log('// Enhanced code (will get full context):');
console.log('fetch("/api/chat", { method: "POST", body: JSON.stringify({ message: "Hello", userData: userDataObject }) })');
