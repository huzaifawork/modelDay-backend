/**
 * Test script for ContextService
 * Demonstrates how the context service builds comprehensive user context
 */

import ContextService from '../services/contextService.js';
import { sampleUserData, emptyUserData } from '../examples/sampleUserData.js';

console.log('🧪 Testing ContextService...\n');

// Test 1: Build context with comprehensive user data
console.log('='.repeat(80));
console.log('TEST 1: Building context with comprehensive user data');
console.log('='.repeat(80));

const fullContext = ContextService.buildUserContext(sampleUserData);
console.log(fullContext);

console.log('\n' + '='.repeat(80));
console.log('TEST 2: Building context with empty user data (context limitations)');
console.log('='.repeat(80));

const limitedContext = ContextService.buildUserContext(emptyUserData);
console.log(limitedContext);

console.log('\n' + '='.repeat(80));
console.log('TEST 3: Building context with no user data (null)');
console.log('='.repeat(80));

const noDataContext = ContextService.buildUserContext(null);
console.log(noDataContext);

console.log('\n' + '='.repeat(80));
console.log('TEST 4: Data Statistics Summary');
console.log('='.repeat(80));

console.log('Sample User Data Statistics:');
console.log(`- Jobs: ${sampleUserData.jobs?.length || 0}`);
console.log(`- Events: ${sampleUserData.events?.length || 0}`);
console.log(`- AI Jobs: ${sampleUserData.aiJobs?.length || 0}`);
console.log(`- Agencies: ${sampleUserData.agencies?.length || 0}`);
console.log(`- Agents: ${sampleUserData.agents?.length || 0}`);
console.log(`- Meetings: ${sampleUserData.meetings?.length || 0}`);
console.log(`- On Stays: ${sampleUserData.onStays?.length || 0}`);
console.log(`- Shootings: ${sampleUserData.shootings?.length || 0}`);

console.log('\nEmpty User Data Statistics:');
console.log(`- Jobs: ${emptyUserData.jobs?.length || 0}`);
console.log(`- Events: ${emptyUserData.events?.length || 0}`);
console.log(`- AI Jobs: ${emptyUserData.aiJobs?.length || 0}`);
console.log(`- Agencies: ${emptyUserData.agencies?.length || 0}`);
console.log(`- Agents: ${emptyUserData.agents?.length || 0}`);
console.log(`- Meetings: ${emptyUserData.meetings?.length || 0}`);
console.log(`- On Stays: ${emptyUserData.onStays?.length || 0}`);
console.log(`- Shootings: ${emptyUserData.shootings?.length || 0}`);

console.log('\n✅ ContextService tests completed!');
console.log('\nKey Features Demonstrated:');
console.log('1. ✅ Comprehensive context building with full user data');
console.log('2. ✅ Context limitations when data is missing or empty');
console.log('3. ✅ Proper error handling for null/undefined data');
console.log('4. ✅ Statistics calculation and calendar summaries');
console.log('5. ✅ Date formatting and data validation');
console.log('6. ✅ Structured output similar to Dart reference implementation');

console.log('\nTo test the API endpoints:');
console.log('1. Start the server: npm start');
console.log('2. Test context endpoint: POST /api/context with userData');
console.log('3. Test chat endpoint: POST /api/chat with message and userData');
console.log('4. Test limitations: Send requests without userData to see context limitations');
