// Safe OCR test - runs on backend only, no API key exposure
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

async function testOCR() {
  console.log('🧪 Testing OCR API safely...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ No OpenAI API key found');
    return;
  }
  
  console.log('✅ OpenAI API key found');
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const testText = `
Client: SAMSUNG
Contact: Adrien Gras | IMM BELGIUM
Agent: Sarah Johnson

Job Details:
Title: Samsung Galaxy Book 5
Media: All electronic, digital, All print, Online
Usage Period: 1 year
Release Country: Global
Exclusivity: Non-exclusive
Shooting Schedule: 2nd week of May 2025
Shooting Location: TBC
Budget: 6000 euros gross

Payment Terms:
Day Rate: 500 EUR
Usage Rate: 5500 EUR
Total: 6000 EUR
Payment: Net 30 days
Currency: EUR

Agent Contact Information:
Sarah Johnson
Model Agent
+48 794 939 555
sarah@uncovermodels.com

Uncover Models
Raclawicka 99/03
Warsaw, Poland
  `;

  try {
    console.log('🤖 Calling OpenAI API...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract structured data from modeling documents. Return JSON with fields: clientName, location, date, dayRate, usageRate, currency, bookingAgent, contactPerson, notes, jobTitle, media, usagePeriod, budget, paymentTerms, phoneNumber, email, address, company.`
        },
        {
          role: 'user',
          content: `Extract data from: ${testText}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    console.log('✅ OCR Test Results:');
    console.log('📊 Extracted Fields:');
    Object.entries(result).forEach(([key, value]) => {
      if (value) {
        console.log(`  ✅ ${key}: ${value}`);
      }
    });
    
    console.log(`\n📈 Total fields extracted: ${Object.keys(result).filter(k => result[k]).length}`);
    console.log('🎯 Test completed successfully!');
    
  } catch (error) {
    console.log('❌ OCR Test failed:', error.message);
  }
}

testOCR();
