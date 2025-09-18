# ModelDay Backend

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Start server**
   ```bash
   npm start
   ```

Server: `http://localhost:3000`

## API Endpoints

- **POST** `/api/chat` - AI chat
- **POST** `/api/ocr` - Document analysis
- **GET** `/health` - Status check

## Usage

```javascript
// Chat
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Hello",
    userData: {}
  })
})

// OCR
fetch('/api/ocr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Client: Samsung\nRate: 500 EUR"
  })
})
```