# Privacy Policy for AI Tutor for Kids

**Last Updated:** November 6, 2024  
**Extension Name:** AI Tutor for Kids  
**Developer:** Sam Prand

## Overview

AI Tutor for Kids is a browser extension that helps children learn by turning any webpage into an interactive AI tutor. This privacy policy explains what data we collect, how it's used, and where it goes.

## Our Privacy Commitment

**We do NOT collect, store, or transmit any of your personal data to our servers.** This extension operates entirely in your browser and communicates only with your chosen AI provider (OpenAI or Anthropic) using your personal API key.

## What Data is Processed

When you use AI Tutor for Kids, the following data is processed:

### 1. **Webpage Content**
- The text content of educational webpages you're viewing
- Screenshots of the visible webpage (when using Vision features)
- **Where it goes:** Sent directly to your chosen AI provider (OpenAI or Anthropic)
- **Storage:** NOT stored by us - only processed in real-time

### 2. **Voice Input**
- Your child's spoken questions and responses
- **How it's processed:** 
  - For OpenAI: Processed by your browser's built-in speech recognition (Web Speech API) OR sent to OpenAI's Whisper API
  - For Anthropic: Processed by your browser's built-in speech recognition only
- **Storage:** NOT stored by us

### 3. **API Keys and Settings**
- Your OpenAI or Anthropic API key
- Your custom system prompt (tutoring instructions)
- Voice and mode preferences
- **Where stored:** Locally in your browser using Chrome's secure storage API
- **Who has access:** Only you - we never see or transmit your API keys

### 4. **Conversation History**
- The conversation between your child and the AI tutor
- **Where stored:** Temporarily in your browser's memory during the session
- **Persistence:** Cleared when you close the tutor or clear memory
- **Who has access:** Only you and your AI provider

## Data We Do NOT Collect

- ❌ No analytics or tracking
- ❌ No usage statistics
- ❌ No personal identifying information
- ❌ No account creation or login required
- ❌ No data transmitted to our servers (we don't have servers!)
- ❌ No cookies or similar tracking technologies
- ❌ No data shared with third parties (except your chosen AI provider)

## Third-Party Services

This extension connects directly to third-party AI services that you choose and configure:

### OpenAI
- **Purpose:** AI responses, speech-to-text, text-to-speech, vision analysis
- **Data sent:** Webpage content, screenshots, voice input, conversation context
- **Privacy Policy:** https://openai.com/privacy
- **How to control:** You control what pages you activate the tutor on

### Anthropic
- **Purpose:** AI responses (text only)
- **Data sent:** Webpage text content, conversation context
- **Privacy Policy:** https://www.anthropic.com/privacy
- **How to control:** You control what pages you activate the tutor on

**Important:** These services process data according to their own privacy policies. We recommend reviewing them.

## Children's Privacy (COPPA Compliance)

This extension is designed for use by children under parental supervision, but we do not knowingly collect any personal information from children:

- ✅ All data processing happens locally in the browser or through the parent's API account
- ✅ No data is sent to us or stored on our servers
- ✅ Parents control all settings and API usage
- ✅ Parents can monitor all conversations
- ✅ No accounts, profiles, or persistent data collection

## Your Control

You have complete control over your data:

1. **What pages to use it on:** You activate the tutor only on pages you choose
2. **What AI provider to use:** You select OpenAI or Anthropic
3. **API usage:** You control and monitor your API costs through your provider's dashboard
4. **Clear data:** Use the "Start Fresh" button to clear conversation history
5. **Uninstall:** Removing the extension deletes all locally stored data

## Permissions Explained

This extension requests the following Chrome permissions:

- **`storage`** - To save your settings and API key locally
- **`activeTab`** - To read educational content from the webpage you're viewing
- **`scripting`** - To inject the tutor interface into webpages
- **`tabs`** - To capture screenshots for Vision AI features
- **`<all_urls>`** - To work on any educational website (FLVS, Khan Academy, Wikipedia, etc.)

## Security

Your API keys are stored securely using Chrome's built-in `chrome.storage.local` API, which:
- Encrypts data on disk
- Is isolated per-extension
- Cannot be accessed by other extensions or websites
- Is cleared when you uninstall the extension

**Important:** Never share your API keys with others. Keep them confidential.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be posted here with an updated "Last Updated" date.

## Data Retention

- **API Keys & Settings:** Stored locally until you uninstall the extension
- **Conversation History:** Cleared when you close the tutor panel or click "Start Fresh"
- **Screenshots:** Never stored - only sent in real-time to AI provider

## Your Rights

Since we don't collect or store your data, there's nothing for us to access, modify, or delete. You have full control over all data through your browser and your AI provider.

## International Users

This extension works worldwide. Data transmission occurs directly between your browser and your chosen AI provider (OpenAI or Anthropic), subject to their data handling practices.

## Contact Us

If you have questions about this privacy policy or data practices:

- **GitHub Issues:** https://github.com/JonSamprand/ai-tutor-for-kids/issues
- **Email:** [Your support email if you want to add one]

## Transparency

This extension is open source. You can review the complete source code at:
https://github.com/JonSamprand/ai-tutor-for-kids

---

**Summary:** We built this extension to help kids learn, not to collect data. Everything stays in your browser or goes directly to the AI provider you choose using your personal API key. We never see, store, or transmit your data.

