# 🏗️ Architecture Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CHROME BROWSER                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    WEBPAGE (Any Site)                     │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │           CONTENT SCRIPT (content.js)              │ │ │
│  │  │                                                     │ │ │
│  │  │  • Page Content Scraper                           │ │ │
│  │  │  • Floating UI Button                             │ │ │
│  │  │  • Tutor Panel                                    │ │ │
│  │  │  • Speech Recognition Handler                     │ │ │
│  │  │  • Speech Synthesis Handler                       │ │ │
│  │  │  • Conversation Manager                           │ │ │
│  │  └──────────────┬──────────────────────────────────┬──┘ │ │
│  │                 │                                  │    │ │
│  └─────────────────┼──────────────────────────────────┼────┘ │
│                    │                                  │      │
│         ┌──────────▼──────────┐           ┌──────────▼─────┐│
│         │   BACKGROUND.JS     │           │   POPUP.HTML   ││
│         │  (Service Worker)   │           │   POPUP.JS     ││
│         │                     │           │                ││
│         │  • API Router       │           │  • Settings UI ││
│         │  • OpenAI Handler   │◄──────────┤  • API Config  ││
│         │  • Anthropic Handler│           │  • Prompt Edit ││
│         │  • Error Handler    │           │  • Memory Mgmt ││
│         └──────────┬──────────┘           └────────────────┘│
│                    │                                         │
│         ┌──────────▼──────────┐                             │
│         │   CHROME.STORAGE    │                             │
│         │   (Local Storage)   │                             │
│         │                     │                             │
│         │  • API Keys         │                             │
│         │  • System Prompts   │                             │
│         │  • Conversation     │                             │
│         │  • Settings         │                             │
│         └─────────────────────┘                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────▼──────────┐
        │    EXTERNAL APIS   │
        │                    │
        │  • OpenAI API      │
        │  • Anthropic API   │
        └────────────────────┘
```

## Data Flow Diagram

```
USER INTERACTION FLOW:
══════════════════════

1. User clicks 🎓 button
         │
         ▼
2. Content Script scrapes page text
         │
         ▼
3. Send to Background Worker
         │
         ▼
4. Background calls AI API
   (OpenAI or Anthropic)
         │
         ▼
5. AI responds with text
         │
         ▼
6. Background sends to Content Script
         │
         ▼
7. Content Script displays message
         │
         ▼
8. Content Script speaks via TTS
         │
         ▼
9. User clicks 🎤 microphone
         │
         ▼
10. Speech Recognition captures audio
         │
         ▼
11. Convert speech to text
         │
         ▼
12. Send user message to AI
         │
         └──> REPEAT from step 3
```

## Component Breakdown

### 1. Manifest.json
**Purpose**: Extension configuration and permissions

```
Role: Entry point
Defines:
  - Extension metadata
  - Required permissions
  - Content scripts to inject
  - Background service worker
  - Browser action (popup)
  - Icon references
```

### 2. Content Script (content.js)
**Purpose**: Main tutor functionality injected into every webpage

**Responsibilities**:
- Create floating UI elements
- Scrape page content intelligently
- Manage speech recognition
- Handle speech synthesis
- Display conversation history
- Send/receive messages to background
- Manage UI state

**Key Functions**:
```javascript
createTutorButton()      // Creates floating 🎓 button
createTutorPanel()       // Creates tutor UI panel
scrapePageContent()      // Extracts text from page
startTutoringSession()   // Initiates conversation
getAIResponse()          // Gets AI reply via background
handleUserResponse()     // Processes user speech
speakText()              // Text-to-speech output
startListening()         // Activates microphone
```

### 3. Background Service Worker (background.js)
**Purpose**: Handle API calls and message routing

**Responsibilities**:
- Listen for messages from content script
- Route API calls to correct provider
- Format requests for OpenAI/Anthropic
- Parse API responses
- Handle errors and retry logic
- Maintain API communication

**Key Functions**:
```javascript
handleAICall()           // Routes to correct provider
callOpenAI()             // OpenAI API integration
callAnthropic()          // Anthropic API integration
```

### 4. Popup UI (popup.html + popup.js)
**Purpose**: Parent configuration interface

**Responsibilities**:
- Display settings form
- Save/load configuration
- Validate API keys
- Manage system prompts
- Clear conversation memory
- Provide user feedback

**Settings Managed**:
- API Provider selection
- API Key storage
- System Prompt customization
- Voice enable/disable
- Memory management

### 5. Styles (styles.css)
**Purpose**: Visual design and animations

**Styling for**:
- Floating tutor button
- Tutor panel interface
- Conversation messages
- Control buttons
- Animations and transitions
- Responsive design

## Communication Patterns

### Content ↔ Background Communication

```javascript
// Content Script sends message
chrome.runtime.sendMessage({
  action: 'callAI',
  provider: 'openai',
  apiKey: 'sk-...',
  messages: [...]
}, (response) => {
  // Handle response
});

// Background Worker receives and responds
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'callAI') {
    handleAICall(request).then(sendResponse);
    return true; // Keep channel open for async
  }
});
```

### Storage Pattern

```javascript
// Save settings
await chrome.storage.local.set({
  apiKey: 'value',
  systemPrompt: 'value',
  voiceEnabled: true
});

// Load settings
const settings = await chrome.storage.local.get([
  'apiKey',
  'systemPrompt',
  'voiceEnabled'
]);
```

## API Integration

### OpenAI Format

```javascript
POST https://api.openai.com/v1/chat/completions
Headers:
  Authorization: Bearer sk-...
  Content-Type: application/json

Body:
{
  "model": "gpt-4o-mini",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "temperature": 0.7,
  "max_tokens": 200
}
```

### Anthropic Format

```javascript
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: sk-ant-...
  anthropic-version: 2023-06-01
  Content-Type: application/json

Body:
{
  "model": "claude-3-haiku-20240307",
  "max_tokens": 200,
  "system": "...",
  "messages": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

## State Management

### Conversation State
```javascript
conversationHistory = [
  { role: 'user', content: '...' },
  { role: 'assistant', content: '...' },
  // ... continues
]

// Stored in chrome.storage.local
// Persists across page refreshes
// Cleared manually or on reset
```

### UI State
```javascript
isTutorActive    // Is tutor mode on?
isListening      // Is mic active?
recognition      // SpeechRecognition instance
pageContent      // Scraped page text
```

## Web APIs Used

### Speech Recognition
```javascript
const SpeechRecognition = window.SpeechRecognition || 
                          window.webkitSpeechRecognition;
recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';
```

### Speech Synthesis
```javascript
const utterance = new SpeechSynthesisUtterance(text);
utterance.rate = 0.9;
utterance.pitch = 1.1;
window.speechSynthesis.speak(utterance);
```

## Security Considerations

### API Key Storage
- Keys stored in `chrome.storage.local` (encrypted by Chrome)
- Never exposed in page context
- Only accessible to extension
- User can clear anytime

### Content Scraping
- Only visible text extracted
- No forms or sensitive data
- Respects page structure
- Limited to 3000 characters

### API Communication
- All calls over HTTPS
- Direct to provider (no proxy)
- No data retention by extension
- User controls all data

## Performance Optimizations

### Content Scraping
- Targets main content areas first
- Avoids headers/footers/navigation
- Limits text length (3000 chars)
- Cleans whitespace

### API Calls
- Max 200 tokens per response
- Reduces latency and cost
- Appropriate for children's attention span

### Memory Management
- Conversation history capped
- Stored locally (not in RAM)
- Can be cleared anytime
- No memory leaks

### UI Rendering
- CSS animations (GPU accelerated)
- Minimal DOM manipulation
- Event delegation where possible

## Error Handling

### API Errors
```javascript
try {
  const response = await fetch(API_URL, {...});
  if (!response.ok) {
    throw new Error('API request failed');
  }
} catch (error) {
  // Show user-friendly message
  updateTutorStatus('Error: ' + error.message);
}
```

### Speech Recognition Errors
```javascript
recognition.onerror = (event) => {
  console.error('Speech error:', event.error);
  updateTutorStatus('Error listening. Click to try again.');
  isListening = false;
};
```

### Graceful Degradation
- Works without icons (Chrome shows default)
- Continues without voice (text-only mode)
- Fallback for missing page content
- Clear error messages to user

## Browser Compatibility

### Required APIs
- ✅ Chrome Extension API (Manifest V3)
- ✅ Web Speech API (SpeechRecognition)
- ✅ Speech Synthesis API
- ✅ Chrome Storage API
- ✅ Fetch API

### Browser Support Matrix
| Browser  | Version | Status |
|----------|---------|--------|
| Chrome   | 90+     | ✅ Full |
| Edge     | 90+     | ✅ Full |
| Brave    | 90+     | ✅ Full |
| Opera    | 76+     | ✅ Full |
| Safari   | Any     | ❌ No Web Speech API |
| Firefox  | Any     | ❌ Different extension API |

## Testing Strategy

### Unit Testing Points
- Content scraping accuracy
- API request formatting
- Message parsing
- State management
- Error handling

### Integration Testing
- End-to-end conversation flow
- API call → response cycle
- Storage → retrieval
- Speech → text → speech

### Manual Testing
- Various webpage types
- Different content lengths
- API provider switching
- Error scenarios
- UI responsiveness

## Deployment Checklist

- ✅ All files present
- ✅ Icons generated (3 sizes)
- ✅ manifest.json valid
- ✅ API integrations working
- ✅ Storage permissions correct
- ✅ Speech APIs functional
- ✅ Error handling complete
- ✅ Documentation provided
- ✅ Test page included

---

**Architecture Status**: ✅ Complete and Production Ready

