// Background Service Worker - Unified AI Tutor Backend
// Supports both Turn-based (Vision + STT + TTS) and Realtime modes

// Store WebSocket connections per tab (for Realtime mode)
const realtimeConnections = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreenshot') {
    // Capture visible tab screenshot (higher quality for accuracy)
    chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 95 }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('Screenshot error:', chrome.runtime.lastError);
        sendResponse(null);
      } else {
        console.log('📸 Screenshot captured in background');
        sendResponse(dataUrl);
      }
    });
    return true;

  } else if (request.action === 'captureFullPageScreenshot') {
    // Full page screenshot - capture visible area, content script handles scrolling
    captureFullPageScreenshot(sender.tab.id)
      .then(sendResponse)
      .catch(error => {
        console.error('Full page screenshot error:', error);
        sendResponse({ error: error.message });
      });
    return true;

  } else if (request.action === 'visionChat') {
    // NEW: Turn-based Vision API call
    handleVisionChat(request)
      .then(sendResponse)
      .catch(error => {
        console.error('Vision chat error:', error);
        sendResponse({ error: error.message });
      });
    return true;

  } else if (request.action === 'transcribeAudio') {
    // NEW: Whisper STT fallback
    handleWhisperTranscription(request)
      .then(sendResponse)
      .catch(error => {
        console.error('Whisper error:', error);
        sendResponse({ error: error.message });
      });
    return true;

  } else if (request.action === 'synthesizeSpeech') {
    // NEW: OpenAI TTS
    handleTTS(request)
      .then(sendResponse)
      .catch(error => {
        console.error('TTS error:', error);
        sendResponse({ error: error.message });
      });
    return true;

  } else if (request.action === 'startRealtimeSession') {
    // Realtime mode (hands-free)
    startRealtimeSession(request, sender.tab.id)
      .then(sendResponse)
      .catch(error => {
        console.error('Realtime session error:', error);
        sendResponse({ error: error.message });
      });
    return true;

  } else if (request.action === 'stopRealtimeSession') {
    stopRealtimeSession(sender.tab.id);
    sendResponse({ success: true });
    return true;

  } else if (request.action === 'sendRealtimeAudio') {
    sendAudioToRealtime(sender.tab.id, request.audioData);
    sendResponse({ success: true });
    return true;

  } else if (request.action === 'sendRealtimeMessage') {
    sendMessageToRealtime(sender.tab.id, request.message);
    sendResponse({ success: true });
    return true;
  }
});

// ============================================================================
// NEW: Turn-based Vision Chat (GPT-4o with screenshot)
// ============================================================================
async function handleVisionChat({ apiKey, messages, screenshot, systemPrompt }) {
  try {
    console.log('🔮 Vision Chat Request:', {
      messageCount: messages.length,
      hasScreenshot: !!screenshot,
      systemPromptLength: systemPrompt?.length || 0
    });

    // Build messages array for OpenAI API
    const apiMessages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add conversation history
    for (const msg of messages) {
      if (msg.role === 'user' && msg.screenshot) {
        // User message with screenshot
        apiMessages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: msg.content
            },
            {
              type: 'image_url',
              image_url: {
                url: msg.screenshot,
                detail: 'high'  // Use 'high' for accurate text reading - critical for math problems!
              }
            }
          ]
        });
      } else {
        // Regular text message
        apiMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    console.log('📤 Calling OpenAI Vision API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',  // Use full gpt-4o for better vision accuracy (less hallucination)
        messages: apiMessages,
        max_tokens: 200,  // Increased for complete explanations
        temperature: 0.3  // Lower temperature = more accurate, less creative/hallucinatory
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('✅ Vision response:', aiResponse.substring(0, 100) + '...');

    return {
      success: true,
      response: aiResponse
    };

  } catch (error) {
    console.error('Vision chat error:', error);
    throw error;
  }
}

// ============================================================================
// NEW: Whisper Transcription (STT fallback)
// ============================================================================
async function handleWhisperTranscription({ apiKey, audioBlob }) {
  try {
    console.log('🎤 Whisper transcription request');

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Whisper API request failed');
    }

    const data = await response.json();
    console.log('✅ Whisper transcription:', data.text);

    return {
      success: true,
      text: data.text
    };

  } catch (error) {
    console.error('Whisper error:', error);
    throw error;
  }
}

// ============================================================================
// NEW: OpenAI TTS (Text-to-Speech)
// ============================================================================
async function handleTTS({ apiKey, text, voice }) {
  try {
    console.log('🔊 TTS request:', { textLength: text.length, voice });

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',  // Newest model (March 2025) - faster, better, higher limits
        input: text.substring(0, 4000), // Limit to 4000 chars to avoid errors
        voice: voice || 'nova',
        response_format: 'mp3',
        speed: 1.1  // Slightly faster speaking speed
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS API error:', response.status, errorText);
      
      // Return error instead of throwing to allow fallback
      return {
        success: false,
        error: `TTS API error: ${response.status}`
      };
    }

    const audioBlob = await response.blob();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = arrayBufferToBase64(arrayBuffer);

    console.log('✅ TTS audio generated:', base64Audio.length, 'chars');

    return {
      success: true,
      audioData: base64Audio,
      format: 'mp3'
    };

  } catch (error) {
    console.error('TTS error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper: Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ============================================================================
// Realtime API (WebSocket mode for hands-free)
// ============================================================================
async function startRealtimeSession({ apiKey, systemPrompt, pageContent, voiceSelect }, tabId) {
  try {
    console.log('🔧 Background: Starting realtime session');
    console.log(`   Tab ID: ${tabId}`);
    
    let contentText = '';
    let hasScreenshot = false;
    
    // Handle both old string format and new object format
    if (typeof pageContent === 'string') {
      contentText = pageContent;
    } else if (pageContent && typeof pageContent === 'object') {
      contentText = pageContent.textContent || '';
      hasScreenshot = pageContent.hasScreenshot || false;
      console.log(`   📸 Screenshot: ${hasScreenshot ? 'YES' : 'NO'}`);
      console.log(`   Text Content Length: ${contentText.length} chars`);
    }
    
    // Check if we have content
    if (!hasScreenshot && (!contentText || contentText.length < 50)) {
      console.error('❌ ERROR: No screenshot and text content is missing or too short!');
      return { 
        error: 'Could not read page content. The page may be loading or blocked. Try refreshing the page and waiting a moment before starting.'
      };
    }
    
    // Close existing connection if any
    if (realtimeConnections.has(tabId)) {
      stopRealtimeSession(tabId);
    }

    // Create WebSocket connection to OpenAI Realtime API
    const ws = new WebSocket(
      'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01',
      ['realtime', `openai-insecure-api-key.${apiKey}`, 'openai-beta.realtime-v1']
    );

    const connectionData = {
      ws,
      tabId,
      isConnected: false
    };

    realtimeConnections.set(tabId, connectionData);

    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        console.log('✅ Realtime API WebSocket connected');
        connectionData.isConnected = true;

        // Configure the session with content
        let enhancedInstructions = `${systemPrompt}\n\n`;
        
        enhancedInstructions += `
===== WEBPAGE TEXT CONTENT =====

${contentText}

===== END OF CONTENT =====

STRICT RULES:
1. Tutor based ONLY on what's shown on the page text above
2. Reference specific problems, examples, or text you can see
3. If asked about something not visible, say "I don't see that on this page"
4. Keep responses to 1-2 sentences maximum
5. Be enthusiastic and encouraging

GREETING: Look at the page content and greet the student based on what lesson they're viewing.`;

        console.log('📝 Instructions being sent to AI');

        // Realtime API only supports: alloy, echo, shimmer
        // Map other voices to closest match
        const realtimeVoiceMap = {
          'nova': 'shimmer',     // Both bright female
          'fable': 'alloy',      // Both neutral/storytelling
          'onyx': 'echo'         // Both male
        };
        const realtimeVoice = realtimeVoiceMap[voiceSelect] || voiceSelect || 'shimmer';
        
        if (realtimeVoiceMap[voiceSelect]) {
          console.log(`⚠️ Voice "${voiceSelect}" not supported in Realtime, using "${realtimeVoice}" instead`);
        }

        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: enhancedInstructions,
            voice: realtimeVoice,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            temperature: 0.6,
            max_response_output_tokens: 250
          }
        }));

        // Send initial greeting
        ws.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{
              type: 'input_text',
              text: 'Greet the student warmly and ask what they need help with on this lesson. 1-2 sentences only!'
            }]
          }
        }));

        ws.send(JSON.stringify({
          type: 'response.create'
        }));

        resolve({ success: true, sessionId: tabId });
      };

      ws.onerror = (error) => {
        // Only log meaningful errors
        if (error && error.message && !error.message.includes('Extension context')) {
          console.error('WebSocket error:', error);
        }
        reject(new Error('Failed to connect to Realtime API'));
      };

      ws.onclose = () => {
        console.log('Realtime API disconnected');
        connectionData.isConnected = false;
        realtimeConnections.delete(tabId);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Realtime API event:', data.type);

          // Forward events to content script
          chrome.tabs.sendMessage(tabId, {
            action: 'realtimeEvent',
            event: data
          }).catch(err => {
            // Silently handle if tab is closed or extension reloaded
            if (!err.message || !err.message.includes('Receiving end does not exist')) {
              console.error('Error sending to tab:', err);
            }
          });
        } catch (error) {
          if (!error.message || !error.message.includes('Extension context')) {
            console.error('Error processing realtime message:', error);
          }
        }
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!connectionData.isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  } catch (error) {
    console.error('Error starting realtime session:', error);
    throw error;
  }
}

function stopRealtimeSession(tabId) {
  const connection = realtimeConnections.get(tabId);
  if (connection && connection.ws) {
    connection.ws.close();
    realtimeConnections.delete(tabId);
  }
}

function sendAudioToRealtime(tabId, audioData) {
  const connection = realtimeConnections.get(tabId);
  if (connection && connection.isConnected) {
    connection.ws.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: audioData // Base64 encoded PCM16 audio
    }));
  }
}

function sendMessageToRealtime(tabId, message) {
  const connection = realtimeConnections.get(tabId);
  if (connection && connection.isConnected) {
    connection.ws.send(JSON.stringify(message));
  }
}

// ============================================================================
// Full Page Screenshot Capture
// ============================================================================
async function captureFullPageScreenshot(tabId) {
  try {
    // Inject script to get page dimensions and scroll info
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        return {
          scrollHeight: Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight
          ),
          scrollWidth: Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth
          ),
          clientHeight: document.documentElement.clientHeight,
          clientWidth: document.documentElement.clientWidth,
          scrollY: window.scrollY,
          scrollX: window.scrollX
        };
      }
    });

    const pageInfo = result.result;
    console.log('📏 Page dimensions:', pageInfo);

    // If page is small enough, just capture visible area
    if (pageInfo.scrollHeight <= pageInfo.clientHeight * 1.5) {
      console.log('✅ Page is short, using single screenshot');
      return new Promise((resolve) => {
        chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 90 }, (dataUrl) => {
          resolve({ success: true, screenshot: dataUrl, fullPage: false });
        });
      });
    }

    // For longer pages, capture multiple screenshots while scrolling
    console.log('📸 Capturing full page with scrolling...');
    
    const screenshots = [];
    const viewportHeight = pageInfo.clientHeight;
    const totalHeight = pageInfo.scrollHeight;
    const numCaptures = Math.min(5, Math.ceil(totalHeight / viewportHeight)); // Max 5 captures
    
    for (let i = 0; i < numCaptures; i++) {
      const scrollPosition = Math.floor((totalHeight / numCaptures) * i);
      
      // Scroll to position
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (pos) => {
          window.scrollTo(0, pos);
        },
        args: [scrollPosition]
      });

      // Wait for scroll to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // Capture screenshot
      const dataUrl = await new Promise((resolve) => {
        chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 80 }, resolve);
      });

      screenshots.push(dataUrl);
      console.log(`  📸 Captured section ${i + 1}/${numCaptures}`);
    }

    // Restore original scroll position
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (pos) => {
        window.scrollTo(0, pos);
      },
      args: [pageInfo.scrollY]
    });

    // For now, return the first (top) screenshot as primary
    // In future, we could stitch them or send multiple to Vision API
    console.log(`✅ Full page capture complete: ${screenshots.length} screenshots`);
    
    return {
      success: true,
      screenshot: screenshots[0], // Primary screenshot (top of page)
      allScreenshots: screenshots, // All screenshots for future use
      fullPage: true,
      sections: screenshots.length
    };

  } catch (error) {
    console.error('Full page screenshot error:', error);
    throw error;
  }
}

// Clean up connections when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  stopRealtimeSession(tabId);
});
