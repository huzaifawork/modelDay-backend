# ModelDay Backend - Context Service Implementation

This implementation creates a comprehensive context service for the ModelDay backend, based on the reference Dart implementation from the Flutter app. The service builds detailed user context for OpenAI interactions while implementing proper context limitations when user data is not available.

## 🎯 Key Features

### ✅ Comprehensive Context Building
- **User Profile**: Name, email, phone, display name
- **Jobs Data**: Bookings with rates, dates, locations, payment status
- **Events Data**: Castings, fittings, and other modeling events
- **AI Jobs**: AI modeling and training opportunities
- **Agencies & Agents**: Professional network and representation
- **Meetings**: Client meetings and consultations
- **Stays**: Travel accommodations and logistics
- **Shootings**: Photo and video shoot details
- **Statistics**: Financial insights, booking trends, activity patterns
- **Calendar Summary**: Upcoming events and schedule overview

### ✅ Context Limitations (Key Feature)
When user data is not provided or is empty, the service implements intelligent context limitations:

- **Clear Communication**: Explains what data is missing
- **Helpful Guidance**: Suggests general modeling advice instead
- **Transparent Limitations**: Clearly states what insights cannot be provided
- **Professional Tone**: Maintains helpful assistant behavior

## 📁 File Structure

```
ModelDay-Backend-main/
├── services/
│   └── contextService.js          # Main context service implementation
├── examples/
│   └── sampleUserData.js          # Sample data for testing
├── test/
│   └── contextTest.js             # Test script for context service
├── reference/
│   └── context_service.dart       # Original Dart reference implementation
├── server.js                      # Updated main server with context integration
└── CONTEXT_SERVICE_README.md      # This documentation
```

## 🚀 API Endpoints

### 1. Chat Endpoint with Context
```
POST /api/chat
```

**Request Body:**
```json
{
  "message": "Can you analyze my upcoming bookings?",
  "conversation": [],
  "userData": {
    "userProfile": { "name": "Sarah", "email": "sarah@email.com" },
    "jobs": [...],
    "events": [...],
    // ... other data sections
  }
}
```

**Response with Data:**
```json
{
  "success": true,
  "response": "Based on your data, you have 3 upcoming jobs worth $10,500...",
  "hasUserData": true,
  "contextLimited": false
}
```

**Response without Data:**
```json
{
  "success": true,
  "response": "I don't have access to your personal data right now, but I can help with general modeling advice...",
  "hasUserData": false,
  "contextLimited": true
}
```

### 2. Context Building Endpoint
```
POST /api/context
```

**Request Body:**
```json
{
  "userData": {
    "userProfile": {...},
    "jobs": [...],
    "events": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "context": "You are an AI assistant for a modeling professional...",
  "dataStats": {
    "jobs": 3,
    "events": 2,
    "agencies": 2
  }
}
```

## 🧪 Testing

### Run the Test Script
```bash
node test/contextTest.js
```

This will demonstrate:
1. ✅ Context building with full user data
2. ✅ Context limitations with empty data
3. ✅ Error handling with null data
4. ✅ Statistics and calendar summaries

### Manual API Testing

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Test with user data:**
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Analyze my bookings", "userData": {...}}'
   ```

3. **Test without user data:**
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Analyze my bookings"}'
   ```

## 🔄 Context Limitations Implementation

The service implements context limitations exactly as shown in the reference:

### When User Data is Available:
- Builds comprehensive context with all user information
- Provides detailed insights and analysis
- Calculates statistics and trends
- Shows upcoming calendar events

### When User Data is Missing:
- Explains the limitation clearly
- Offers general modeling industry advice
- Suggests data sync or support contact
- Maintains professional, helpful tone

## 📊 Data Structure

The service expects user data in this format:

```javascript
{
  userProfile: {
    name: string,
    email: string,
    phone?: string,
    displayName?: string
  },
  jobs: [{
    clientName: string,
    type: string,
    date: string,
    rate: number,
    currency: string,
    status: string,
    paymentStatus: string,
    location: string,
    notes?: string
  }],
  events: [{
    type: string,
    clientName: string,
    date: string,
    startTime: string,
    location: string,
    dayRate?: number,
    currency?: string
  }],
  // ... other sections
}
```

## 🎨 Key Implementation Details

### 1. Date Formatting
- Consistent date formatting across all sections
- Handles both string and Date object inputs
- Graceful fallback for invalid dates

### 2. Statistics Calculation
- Total earnings and job counts
- Upcoming vs completed job analysis
- Monthly activity trends
- Financial insights

### 3. Calendar Summary
- Combines jobs, events, and meetings
- Sorts by date chronologically
- Limits to next 10 upcoming items
- Includes location and timing details

### 4. Error Handling
- Graceful handling of missing or invalid data
- Detailed error logging for debugging
- User-friendly error messages

## 🔧 Integration Notes

The context service is designed to be:
- **Modular**: Easy to extend with new data types
- **Scalable**: Handles large datasets efficiently
- **Flexible**: Works with partial or complete data
- **Robust**: Comprehensive error handling

## 📈 Future Enhancements

Potential improvements based on the reference implementation:
1. **Data Caching**: Cache context for repeated requests
2. **Compression**: Optimize context size for large datasets
3. **Personalization**: Learn user preferences over time
4. **Analytics**: Track context usage patterns
5. **Validation**: Add schema validation for user data

## ✅ Verification

This implementation successfully replicates the Dart reference:
- ✅ Same context structure and format
- ✅ Identical data processing logic
- ✅ Matching statistics calculations
- ✅ Similar calendar summary functionality
- ✅ Equivalent context limitations behavior
- ✅ Professional tone and messaging
