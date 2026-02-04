# MyHealth Companion - Backend Documentation

## Overview

The MyHealth Companion backend is built using **Supabase Edge Functions** (Deno runtime) and provides a complete REST API for the healthcare application. It integrates with the Heidi API, generates JWT tokens, merges session data, and provides AI-powered health explanations.

## Architecture

```
Backend (Supabase Edge Functions)
├── heidi-timeline       - Fetches and merges patient timeline data
├── heidi-documents      - Retrieves medical documents
├── heidi-profile        - Gets patient profile information
├── health-explainer     - AI-powered health information explainer
└── health-chat          - Real-time AI chat with streaming
```

## Environment Variables

Required secrets (configured via Supabase):

```bash
HEIDI_API_KEY          # Shared API key for Heidi API
HEIDI_API_URL          # Base URL for Heidi API (e.g., https://api.heidi.health)
HEIDI_JWT_SECRET       # Secret for generating JWT tokens
```

## API Endpoints

### 1. Patient Timeline
**Endpoint:** `POST /heidi-timeline`

Fetches all session data from Heidi API and merges into a unified timeline.

**Response:**
```json
{
  "success": true,
  "timeline": [
    {
      "id": "uuid",
      "type": "appointment | medication | encounter | treatment | note",
      "title": "string",
      "date": "ISO 8601 date",
      "time": "string (optional)",
      "description": "string (optional)",
      "provider": "string (optional)",
      "status": "string (optional)",
      "details": "string (optional)"
    }
  ],
  "metadata": {
    "totalEvents": "number",
    "fetchedAt": "ISO 8601 timestamp"
  }
}
```

**Heidi API Calls:**
- `/sessions/appointments`
- `/sessions/encounters`
- `/sessions/medications`
- `/sessions/treatments`
- `/sessions/notes`

---

### 2. Patient Documents
**Endpoint:** `POST /heidi-documents`

Retrieves medical documents from Heidi API with fallback to mock data.

**Response:**
```json
{
  "success": true,
  "documents": [
    {
      "id": "string",
      "title": "string",
      "type": "lab | letter | imaging | prescription | report",
      "date": "ISO 8601 date",
      "provider": "string (optional)",
      "fileSize": "string (optional)",
      "url": "string (optional)"
    }
  ],
  "metadata": {
    "totalDocuments": "number",
    "fetchedAt": "ISO 8601 timestamp"
  }
}
```

**Heidi API Call:**
- `/documents`

---

### 3. Patient Profile
**Endpoint:** `POST /heidi-profile`

Fetches patient demographic and medical information.

**Response:**
```json
{
  "success": true,
  "profile": {
    "name": "string",
    "age": "number",
    "dateOfBirth": "ISO 8601 date",
    "bloodType": "string",
    "allergies": ["string"],
    "primaryPhysician": "string",
    "email": "string",
    "phone": "string",
    "address": "string"
  },
  "metadata": {
    "fetchedAt": "ISO 8601 timestamp"
  }
}
```

**Heidi API Call:**
- `/patient/profile`

---

### 4. AI Health Explainer
**Endpoint:** `POST /health-explainer`

Provides plain-language explanations of medical information using AI.

**Request Body:**
```json
{
  "query": "string (required)",
  "context": "object (optional) - medical record context"
}
```

**Response:**
```json
{
  "success": true,
  "explanation": "string - plain language explanation",
  "query": "string - original query",
  "timestamp": "ISO 8601 timestamp"
}
```

**AI Model:** Google Gemini 2.5 Flash

**Error Codes:**
- `429` - Rate limit exceeded
- `402` - AI service payment required

---

### 5. AI Health Chat
**Endpoint:** `POST /health-chat` (Streaming)

Real-time conversational AI for health questions with streaming responses.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user | assistant",
      "content": "string"
    }
  ]
}
```

**Response:** Server-Sent Events (SSE)
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" there"}}]}
data: [DONE]
```

**AI Model:** Google Gemini 2.5 Flash

---

## JWT Token Generation

The backend generates JWT tokens for Heidi API authentication using HMAC SHA-256:

```typescript
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "apiKey": "YOUR_HEIDI_API_KEY",
  "iat": 1234567890,
  "exp": 1234571490  // 1 hour expiration
}
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "data": null or fallback data
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (missing parameters)
- `402` - Payment required (AI credits)
- `429` - Rate limit exceeded
- `500` - Internal server error

## Frontend Integration

### Using the API from React

```typescript
import { supabase } from "@/integrations/supabase/client";

// Fetch timeline
const { data, error } = await supabase.functions.invoke('heidi-timeline');
const timeline = data?.timeline || [];

// Get AI explanation
const { data, error } = await supabase.functions.invoke('health-explainer', {
  body: {
    query: "What does my blood pressure reading mean?",
    context: { /* medical record data */ }
  }
});

// Fetch documents
const { data, error } = await supabase.functions.invoke('heidi-documents');
const documents = data?.documents || [];

// Get patient profile
const { data, error } = await supabase.functions.invoke('heidi-profile');
const profile = data?.profile;
```

## Deployment

Edge Functions are deployed via the Supabase CLI.

1. Edit function code in `supabase/functions/`
2. Configure function in `supabase/config.toml`
3. Deploy changes using `supabase functions deploy`

## Security

- All functions use JWT verification by default (disabled for public endpoints via `verify_jwt = false`)
- Heidi API credentials stored as encrypted secrets
- CORS configured for frontend access
- Rate limiting applied by AI gateway

## Monitoring & Debugging

### View Logs

```bash
# Use Supabase CLI
supabase functions logs heidi-timeline
supabase functions logs health-explainer
```

### Test Endpoints

```bash
# Test locally
curl -X POST https://your-project.supabase.co/functions/v1/heidi-timeline \
  -H "Content-Type: application/json"

# With authentication
curl -X POST https://your-project.supabase.co/functions/v1/heidi-profile \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Production Checklist

- [ ] Configure all Heidi API credentials
- [ ] Test JWT token generation
- [ ] Verify timeline data merging
- [ ] Test AI explanations with real medical data
- [ ] Configure rate limits
- [ ] Set up error monitoring
- [ ] Enable function logging
- [ ] Test document retrieval
- [ ] Verify CORS settings

## Future Enhancements

- Add caching layer for timeline data
- Implement webhook support for real-time updates
- Add document upload functionality
- Expand AI capabilities with medical knowledge base
- Add analytics and usage tracking
- Implement user-specific data isolation
- Add appointment scheduling endpoints

## Support

For issues or questions:
- Check edge function logs
- Verify environment variables
- Test Heidi API connectivity
---

**Built with Supabase Edge Functions**
