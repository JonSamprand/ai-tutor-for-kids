// AI Tutor Content Script - Unified (Turn-based + Realtime)

let isTutorActive = false;
let isRecording = false;
let isSpeaking = false;
let audioContext = null;
let mediaStream = null;
let audioQueue = [];
let isPlaying = false;
let pageContent = '';
let conversationMessages = [];
let currentMode = 'turnbased'; // 'turnbased' or 'realtime'
let recognition = null;
let currentAudio = null; // Track current playing audio
let audioCleanupTimeout = null; // Timeout for cleanup

// Initialize when page loads
function init() {
  // Only show tutor button in the main frame (not in iframes)
  if (window.self === window.top) {
    createTutorButton();
    createTutorPanel();
  }
}

// Handle extension context invalidation gracefully
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'realtimeEvent') {
      handleRealtimeEvent(request.event);
    }
  } catch (error) {
    // Silently handle extension context errors (happens on reload)
    if (!error.message.includes('Extension context invalidated')) {
      console.error('Message handler error:', error);
    }
  }
  return true;
});

// Create floating tutor button
function createTutorButton() {
  if (document.getElementById('ai-tutor-button')) return;

  const button = document.createElement('div');
  button.id = 'ai-tutor-button';
  button.className = 'ai-tutor-floating-btn';
  button.innerHTML = '🎓';
  button.title = 'Start AI Tutor';
  button.addEventListener('click', toggleTutorMode);
  document.body.appendChild(button);
}

// Create tutor interface panel
function createTutorPanel() {
  if (document.getElementById('ai-tutor-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'ai-tutor-panel';
  panel.className = 'ai-tutor-panel hidden';
  panel.innerHTML = `
    <div class="ai-tutor-header">
      <h3>🎓 AI Tutor</h3>
      <button id="ai-tutor-close" class="ai-tutor-close-btn">✕</button>
    </div>
    <div class="ai-tutor-status" id="ai-tutor-status">
      Initializing...
    </div>
    <div class="ai-tutor-conversation" id="ai-tutor-conversation">
    </div>
    <div class="ai-tutor-controls">
      <button id="ai-tutor-talk" class="ai-tutor-talk-btn">
        🎤 Press & Hold to Talk
      </button>
      <button id="ai-tutor-stop" class="ai-tutor-stop-btn">
        ⏹️ End Session
      </button>
    </div>
    <div class="ai-tutor-info">
      <small>💡 Hold the button OR press SPACEBAR to talk!</small>
    </div>
  `;

  document.body.appendChild(panel);

  // Event listeners
  document.getElementById('ai-tutor-close').addEventListener('click', toggleTutorMode);
  
  const talkBtn = document.getElementById('ai-tutor-talk');
  
  // Mouse events
  talkBtn.addEventListener('mousedown', startTalking);
  talkBtn.addEventListener('mouseup', stopTalking);
  talkBtn.addEventListener('mouseleave', (e) => {
    if (isRecording) stopTalking(e);
  });
  
  // Touch events for mobile
  talkBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startTalking(e);
  });
  talkBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopTalking(e);
  });
  
  document.getElementById('ai-tutor-stop').addEventListener('click', toggleTutorMode);
  
  // Note: Keyboard listeners are added when tutor is activated (see toggleTutorMode)
}

// Keyboard event handlers
function handleKeyDown(event) {
  // Only respond to spacebar when tutor is active
  if (!isTutorActive) return;
  
  if (event.code === 'Space' || event.keyCode === 32) {
    // Prevent page scroll
    event.preventDefault();
    
    // Start talking if not already recording
    if (!isRecording && !isSpeaking) {
      startTalking(event);
    }
  }
}

function handleKeyUp(event) {
  // Only respond to spacebar when tutor is active
  if (!isTutorActive) return;
  
  if (event.code === 'Space' || event.keyCode === 32) {
    // Prevent page scroll
    event.preventDefault();
    
    // Stop talking if currently recording
    if (isRecording) {
      stopTalking(event);
    }
  }
}

// Toggle tutor mode
async function toggleTutorMode() {
  isTutorActive = !isTutorActive;

  const button = document.getElementById('ai-tutor-button');
  const panel = document.getElementById('ai-tutor-panel');

  if (isTutorActive) {
    const settings = await chrome.storage.local.get([
      'apiKey', 
      'systemPrompt', 
      'apiProvider', 
      'voiceSelect', 
      'tutorMode'
    ]);
    
    if (!settings.apiKey) {
      alert('🔑 API Key Required\n\nPlease click the extension icon in your toolbar to configure your OpenAI API key.\n\nNeed help? Check the tutorial video in the extension settings!');
      isTutorActive = false;
      return;
    }

    // Determine mode: 'turnbased' (default) or 'realtime'
    currentMode = settings.tutorMode || 'turnbased';

    if (currentMode === 'realtime' && settings.apiProvider !== 'openai') {
      alert('⚠️ Realtime Mode Unavailable\n\nRealtime mode only works with OpenAI.\n\nPlease select "OpenAI" as your provider in the extension settings, or switch to Turn-based mode.');
      isTutorActive = false;
      return;
    }

    button.style.display = 'none';
    panel.classList.remove('hidden');

    // Update UI based on mode
    const headerTitle = document.querySelector('.ai-tutor-header h3');
    headerTitle.textContent = currentMode === 'realtime' ? '🎓 AI Tutor (Realtime)' : '🎓 AI Tutor';

    // Add keyboard listeners when tutor is active
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    await scrapePageContent();
    
    if (currentMode === 'turnbased') {
      await startTurnBasedSession(settings);
    } else {
      await startRealtimeSession(settings);
    }
  } else {
    button.style.display = 'flex';
    panel.classList.add('hidden');
    
    if (currentMode === 'realtime') {
      await stopRealtimeSession();
    }
    
    // CRITICAL: Stop all audio immediately
    stopAllAudio();
    
    // Clean up microphone
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
    
    // Clean up speech recognition
    if (recognition) {
      recognition.abort();
      recognition = null;
    }
    
    // Remove keyboard listeners when tutor is closed
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    
    // Reset state
    isSpeaking = false;
    isRecording = false;
    conversationMessages = [];
  }
}

// Scrape page content - optimized for FLVS iframes
async function scrapePageContent() {
  updateTutorStatus('📚 Getting ready to help you...');

  // Wait for dynamic content to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  let structuredContent = {
    title: document.title,
    url: window.location.href,
    headings: [],
    allText: ''
  };

  // FLVS-SPECIFIC: Look for the lesson iframe
  const iframes = document.querySelectorAll('iframe');
  let iframeContent = '';
  let iframeTitle = '';
  
  console.log(`🔍 Found ${iframes.length} iframes on page`);
  
  // Find the FLVS lesson iframe
  let lessonIframe = null;
  for (let i = 0; i < iframes.length; i++) {
    const iframe = iframes[i];
    console.log(`Iframe ${i}: src="${iframe.src}"`);
    
    if (iframe.src && (iframe.src.includes('webdav') || iframe.src.includes('learn.flvs.net')) && 
        !iframe.src.includes('frame-toolbar') && 
        (iframe.src.endsWith('.htm') || iframe.src.endsWith('.html'))) {
      console.log(`   ✅ Found FLVS lesson iframe!`);
      lessonIframe = iframe;
      break;
    }
  }
  
  // Extract iframe content if found
  if (lessonIframe) {
    console.log('⏳ Waiting for lesson iframe to load...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const iframeDoc = lessonIframe.contentDocument || lessonIframe.contentWindow?.document;
      
      if (iframeDoc && iframeDoc.body) {
        console.log(`✅ Accessed lesson iframe content!`);
        
        iframeTitle = iframeDoc.title || '';
        const iframeHeadings = iframeDoc.querySelectorAll('h1, h2, h3, h4');
        structuredContent.headings = Array.from(iframeHeadings)
          .map(h => h.textContent.trim())
          .filter(text => text.length > 2 && text.length < 200)
          .slice(0, 10);
        
        iframeContent = iframeDoc.body.innerText || iframeDoc.body.textContent || '';
        console.log(`   Content length: ${iframeContent.length} chars`);
        console.log(`   First 200 chars: "${iframeContent.substring(0, 200)}"`);
      }
    } catch (e) {
      console.error(`   ❌ Error accessing iframe:`, e);
    }
  }

  // Fallback to main document if no iframe content
  let content = iframeContent;
  
  if (!content || content.length < 100) {
    console.log('No iframe content, scraping main page');
    
    const mainHeadings = document.querySelectorAll('h1, h2, h3, h4');
    structuredContent.headings = Array.from(mainHeadings)
      .map(h => h.textContent.trim())
      .filter(text => text.length > 2 && text.length < 200)
      .slice(0, 10);
    
    const contentSelectors = ['article', 'main', '[role="main"]', '.content', '#content'];
    let mainElement = null;
    
    for (const selector of contentSelectors) {
      mainElement = document.querySelector(selector);
      if (mainElement && mainElement.textContent.trim().length > 100) {
        content = mainElement.innerText || mainElement.textContent || '';
        break;
      }
    }

    if (!content || content.length < 100) {
      content = document.body.innerText || document.body.textContent || '';
    }
  }

  // Clean up text
  content = content.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim();

  // Use iframe title if better
  const finalTitle = (iframeTitle && iframeTitle.length > 5 && !iframeTitle.includes('FLVS')) 
    ? iframeTitle 
    : structuredContent.title;

  // Capture quick screenshot (we'll capture fresh ones for each response anyway)
  let screenshotData = null;
  
  try {
    updateTutorStatus('📸 Looking at your screen...');
    screenshotData = await chrome.runtime.sendMessage({ action: 'captureScreenshot' });
    console.log('📸 Initial screenshot captured');
  } catch (e) {
    console.warn('⚠️ Could not capture screenshot:', e);
  }

  // Store page content (fresh screenshots will be captured for each response)
  pageContent = {
    title: finalTitle,
    url: structuredContent.url,
    headings: structuredContent.headings,
    textContent: content.substring(0, 5000), // Reduced for faster processing
    screenshot: screenshotData,
    hasScreenshot: !!screenshotData
  };

  console.log('=== SCRAPED CONTENT ===');
  console.log(`Title: "${finalTitle}"`);
  console.log(`Headings: ${structuredContent.headings.join(', ')}`);
  console.log(`Text: ${content.length} chars`);
  console.log(`Screenshot: ${screenshotData ? 'YES ✅' : 'NO ❌'}`);
  console.log('First 200 chars:', content.substring(0, 200));
  console.log('=======================');
  
  if (screenshotData) {
    addMessageToUI('System', `✨ I'm ready to help you learn! I can see what's on your screen!`);
  } else if (content.length < 100) {
    addMessageToUI('System', `🤔 Hmm, I'm having trouble seeing the page. Can you try refreshing?`);
  } else {
    addMessageToUI('System', `📖 Ready to learn "${finalTitle}"! Let's do this!`);
  }
}

// ============================================================================
// Turn-based mode (Vision + STT + TTS)
// ============================================================================
async function startTurnBasedSession(settings) {
  try {
    // Stop any existing audio from previous sessions
    stopAllAudio();
    
    updateTutorStatus('✅ Ready! Press & hold to talk.');
    
    // Initialize Web Speech API for STT
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Recognized:', transcript);
        handleUserSpeech(transcript, settings);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          updateTutorStatus('No speech detected. Try again!');
        } else {
          updateTutorStatus('Error: ' + event.error);
        }
        isRecording = false;
        updateTalkButtonState();
      };
      
      recognition.onend = () => {
        isRecording = false;
        updateTalkButtonState();
      };
    }
    
    // Initialize conversation with AI-generated greeting based on Vision
    conversationMessages = [];
    
    // Use Vision API to generate an intelligent, context-aware greeting
    updateTutorStatus('👀 Let me see what you\'re learning...');
    
    let greeting = '';
    
    if (pageContent.hasScreenshot && pageContent.screenshot) {
      try {
        // Ask AI to generate a friendly greeting based on what it sees
        const greetingPrompt = buildSystemPrompt(settings.systemPrompt) + 
          '\n\nThis is your FIRST message to the student. Look at their screen and give them a warm, friendly greeting that:\n' +
          '1. Acknowledges what lesson/topic you can see\n' +
          '2. Asks if they\'ve started or need help getting started\n' +
          '3. Is encouraging and supportive\n' +
          '4. Is 2-3 sentences max\n' +
          '5. READS THE SCREEN CAREFULLY - don\'t mention "LTI Pass-through" or generic terms, mention the ACTUAL lesson content you see!\n\n' +
          'Keep it short, warm, and proactive!';
        
        const response = await chrome.runtime.sendMessage({
          action: 'chatWithVision',
          apiKey: settings.apiKey,
          messages: [{ role: 'user', content: greetingPrompt }],
          screenshot: pageContent.screenshot,
          provider: settings.apiProvider || 'openai'
        });
        
        greeting = response.text;
      } catch (error) {
        console.error('Error generating AI greeting:', error);
        // Fallback to generic greeting
        greeting = `Hi! 👋 I'm here to help you learn! Have you started looking at this lesson yet, or would you like me to help you get started? 📚`;
      }
    } else {
      // No screenshot - use generic greeting
      greeting = `Hi! 👋 I'm here to help you learn! Have you started looking at this lesson yet, or would you like me to help you get started? 📚`;
    }
    
    addMessageToUI('AI', greeting);
    conversationMessages.push({ role: 'assistant', content: greeting });
    
    // Speak the greeting
    await speakText(greeting, settings);
    
  } catch (error) {
    console.error('Error starting turn-based session:', error);
    updateTutorStatus('Error: ' + error.message);
    addMessageToUI('Error', error.message);
  }
}

async function handleUserSpeech(transcript, settings) {
  try {
    updateTutorStatus('👀 Let me see what you\'re looking at...');
    addMessageToUI('You', transcript);
    
    // IMPORTANT: Capture FRESH screenshot before each response
    // This ensures AI sees exactly what the child is looking at NOW
    // (especially important for FLVS iframes that change content)
    let freshScreenshot = null;
    try {
      freshScreenshot = await chrome.runtime.sendMessage({ action: 'captureScreenshot' });
      console.log('📸 Fresh screenshot captured for this response');
    } catch (e) {
      console.warn('⚠️ Could not capture fresh screenshot, using cached');
      freshScreenshot = pageContent.screenshot;
    }
    
    updateTutorStatus('🤔 Thinking about your question...');
    
    // Add user message to conversation with FRESH screenshot
    conversationMessages.push({ 
      role: 'user', 
      content: transcript,
      screenshot: freshScreenshot // Use fresh screenshot for context
    });
    
    // Get AI response using Vision API with fresh screenshot
    const systemPrompt = buildSystemPrompt(settings.systemPrompt);
    const response = await chrome.runtime.sendMessage({
      action: 'visionChat',
      apiKey: settings.apiKey,
      messages: conversationMessages,
      screenshot: freshScreenshot, // Send fresh screenshot
      systemPrompt: systemPrompt
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    const aiResponse = response.response;
    addMessageToUI('AI', aiResponse);
    conversationMessages.push({ role: 'assistant', content: aiResponse });
    
    // Speak the response
    await speakText(aiResponse, settings);
    
    updateTutorStatus('🎉 Ready for your next question!');
    
  } catch (error) {
    console.error('Error handling user speech:', error);
    updateTutorStatus('😅 Oops! Let\'s try that again!');
    addMessageToUI('Error', 'Oops! Something went wrong. Can you ask your question again?');
  }
}

async function callVisionAPI(apiKey, userMessage) {
  const response = await chrome.runtime.sendMessage({
    action: 'visionChat',
    apiKey: apiKey,
    messages: [
      { role: 'user', content: userMessage, screenshot: pageContent.screenshot }
    ],
    screenshot: pageContent.screenshot,
    systemPrompt: userMessage.includes('STRICT RULES') ? userMessage : ''
  });
  
  return response;
}

async function speakText(text, settings) {
  try {
    // Stop any currently playing audio first
    stopAllAudio();
    
    isSpeaking = true;
    updateTutorStatus('🗣️ Listen carefully...');
    
    // Try OpenAI TTS first
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'synthesizeSpeech',
        apiKey: settings.apiKey,
        text: text,
        voice: settings.voiceSelect || 'nova'
      });
      
      if (response && response.audioData) {
        // Play the audio
        await playMP3Audio(response.audioData);
        isSpeaking = false;
        updateTutorStatus('🎉 Ready for your next question!');
        return;
      }
    } catch (ttsError) {
      console.warn('⚠️ OpenAI TTS failed, using browser speech:', ttsError.message);
    }
    
    // Fallback to browser TTS if OpenAI fails
    console.log('🔊 Using browser text-to-speech as fallback');
    await speakWithBrowserTTS(text);
    
    isSpeaking = false;
    updateTutorStatus('🎉 Ready for your next question!');
    
  } catch (error) {
    console.error('Error speaking:', error);
    isSpeaking = false;
    updateTutorStatus('🎉 Ready for your next question!');
    // Don't show error to user - just continue
  }
}

// Fallback browser TTS
function speakWithBrowserTTS(text) {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Browser TTS not supported');
      resolve(); // Just continue without speech
      return;
    }
    
    // Stop any existing speech first
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; // Slightly faster
    utterance.pitch = 1.1; // Slightly higher pitch
    
    // Try to find a good voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Samantha') || // macOS female
      v.name.includes('Google US English') || // Chrome female
      v.name.includes('Microsoft Zira') // Windows female
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onend = resolve;
    utterance.onerror = (e) => {
      console.warn('Browser TTS error:', e);
      resolve(); // Continue anyway
    };
    
    speechSynthesis.speak(utterance);
  });
}

async function playMP3Audio(base64Audio) {
  return new Promise((resolve, reject) => {
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    
    const audio = new Audio('data:audio/mp3;base64,' + base64Audio);
    currentAudio = audio; // Track this audio
    
    audio.onended = () => {
      currentAudio = null;
      resolve();
    };
    
    audio.onerror = (e) => {
      currentAudio = null;
      reject(e);
    };
    
    audio.play().catch(e => {
      currentAudio = null;
      reject(e);
    });
  });
}

// Stop all audio playback
function stopAllAudio() {
  console.log('🛑 Stopping all audio...');
  
  // Stop MP3 audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  
  // Stop browser TTS
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
  
  // Stop any WebAudio playback
  if (audioContext) {
    try {
      audioContext.close().catch(() => {});
      audioContext = null;
    } catch (e) {
      console.warn('Error closing audio context:', e);
    }
  }
  
  // Clear audio queue
  audioQueue = [];
  isPlaying = false;
  isSpeaking = false;
  
  console.log('✅ All audio stopped');
}

function buildSystemPrompt(basePrompt) {
  let prompt = basePrompt + '\n\n';
  
  prompt += `===== CURRENT SCREEN =====\n\n`;
  prompt += `Lesson: ${pageContent.title}\n`;
  
  if (pageContent.headings && pageContent.headings.length > 0) {
    prompt += `Topics: ${pageContent.headings.join(', ')}\n\n`;
  }
  
  prompt += `[You can see what the student is looking at RIGHT NOW in the screenshot]\n\n`;
  
  prompt += `Context:\n${pageContent.textContent}\n\n`;
  prompt += `===== END =====\n\n`;
  
  prompt += `🎓 CRITICAL TUTORING RULES:

⚠️ ACCURACY FIRST - NO HALLUCINATIONS:
1. READ the screenshot CAREFULLY and EXACTLY
2. If there are numbers, copy them EXACTLY as shown
3. If there is text, quote it EXACTLY - don't paraphrase
4. NEVER make up or change any numbers, names, or details
5. If you're unsure what something says, say "I'm not sure I can read that clearly"

📚 BALANCED TUTORING APPROACH:
BE PROACTIVE & GUIDING:
- Don't just wait for questions - help them move forward
- "Let's look at the next part" or "Ready to try the example?"
- Notice where they are and guide to the next step
- Show enthusiasm for their progress

BE PATIENT & SUPPORTIVE:
- Never rush them through content
- "Take your time with this" or "It's okay to think about it"
- Check understanding before moving on
- Let them work through problems at their pace

TEACHING STYLE:
- Keep responses SHORT (2-3 sentences max)
- Reference EXACT text/numbers from the screen
- Ask questions that make them think, not just tell answers
- Break complex ideas into small, manageable pieces
- Celebrate when they understand something!
- If they're stuck, give hints, not full answers

VERIFICATION:
- Before answering, verify you read the numbers correctly
- If it's a math problem, state the EXACT problem first
- Then guide them to solve it step by step (don't solve it for them!)

CONVERSATION FLOW:
- Balance between guiding forward and ensuring understanding
- "Do you understand this part?" before moving to next
- Encourage questions at any time
- Make learning feel like a journey, not a race

The student may have navigated to different parts of the lesson, so ALWAYS base your answer on the current screenshot!`;
  
  return prompt;
}

// ============================================================================
// Realtime mode (hands-free WebSocket)
// ============================================================================
async function startRealtimeSession(settings) {
  try {
    updateTutorStatus('Connecting to AI...');

    // Initialize audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 24000
    });

    // Request microphone access
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 24000,
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    // Connect to Realtime API via background
    const response = await chrome.runtime.sendMessage({
      action: 'startRealtimeSession',
      apiKey: settings.apiKey,
      systemPrompt: settings.systemPrompt,
      voiceSelect: settings.voiceSelect || 'shimmer',
      pageContent: pageContent
    }).catch(error => {
      // Handle extension context errors gracefully
      if (error.message && error.message.includes('Extension context invalidated')) {
        return { error: 'Extension was reloaded. Please refresh the page and try again.' };
      }
      return { error: error.message };
    });

    if (response && response.error) {
      throw new Error(response.error);
    }

    updateTutorStatus('✅ Connected! Press & hold to talk.');
    addMessageToUI('System', 'Realtime session started. Press & hold the mic to speak!');

    // Setup audio capture
    await setupAudioCapture();

  } catch (error) {
    // Only log actual errors, not connection issues
    if (!error.message.includes('Extension context')) {
      console.error('Error starting realtime session:', error);
    }
    updateTutorStatus('Error: ' + error.message);
    addMessageToUI('Error', error.message);
  }
}

async function stopRealtimeSession() {
  try {
    await chrome.runtime.sendMessage({ action: 'stopRealtimeSession' }).catch(() => {
      // Silently handle if extension context is invalidated
    });
  } catch (error) {
    // Ignore errors on cleanup
  }
}

// Setup audio capture for Realtime mode
async function setupAudioCapture() {
  try {
    const source = audioContext.createMediaStreamSource(mediaStream);
    
    // Note: ScriptProcessorNode is deprecated but still widely supported
    // Using it for compatibility. Future: migrate to AudioWorkletNode
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (event) => {
      if (!isRecording || currentMode !== 'realtime') return;

      const inputData = event.inputBuffer.getChannelData(0);
      const pcm16 = floatTo16BitPCM(inputData);
      const base64Audio = arrayBufferToBase64(pcm16);

      // Send audio with error handling
      try {
        chrome.runtime.sendMessage({
          action: 'sendRealtimeAudio',
          audioData: base64Audio
        }).catch(() => {
          // Silently handle disconnection errors
        });
      } catch (e) {
        // Extension context may be invalidated
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);

  } catch (error) {
    console.error('Error setting up audio capture:', error);
  }
}

// Realtime event handler (already set up in init function above)

function handleRealtimeEvent(event) {
  console.log('Realtime event:', event.type);
  
  if (event.type === 'response.audio.delta') {
    playAudioChunk(event.delta);
  } else if (event.type === 'response.audio_transcript.delta') {
    updateTranscriptStreaming(event.delta);
  } else if (event.type === 'conversation.item.input_audio_transcription.completed') {
    addMessageToUI('You', event.transcript);
  }
}

// ============================================================================
// UI and button handlers
// ============================================================================
function startTalking(event) {
  if (isSpeaking) return; // Don't interrupt AI speaking
  
  isRecording = true;
  updateTalkButtonState();
  updateTutorStatus('🎤 I\'m listening! Ask your question...');
  
  if (currentMode === 'turnbased') {
    // Use Web Speech API
    if (recognition) {
      recognition.start();
    }
  }
  // For realtime mode, audio capture is always running
}

function stopTalking(event) {
  if (!isRecording) return;
  
  isRecording = false;
  updateTalkButtonState();
  updateTutorStatus('⏳ Got it! Let me think about that...');
  
  if (currentMode === 'turnbased') {
    // Stop Web Speech API
    if (recognition) {
      recognition.stop();
    }
  }
}

function updateTalkButtonState() {
  const talkBtn = document.getElementById('ai-tutor-talk');
  if (!talkBtn) return;
  
  if (isRecording) {
    talkBtn.classList.add('active');
    talkBtn.innerHTML = '🔴 Listening... (Release when done!)';
  } else {
    talkBtn.classList.remove('active');
    talkBtn.innerHTML = '🎤 Press SPACEBAR or Hold Button!';
  }
}

function updateTutorStatus(message) {
  const statusEl = document.getElementById('ai-tutor-status');
  if (statusEl) {
    // Add fade animation
    statusEl.style.animation = 'none';
    setTimeout(() => {
      statusEl.textContent = message;
      statusEl.style.animation = 'fadeIn 0.3s ease-smooth';
    }, 10);
  }
}

function addMessageToUI(role, content) {
  const conversationEl = document.getElementById('ai-tutor-conversation');
  if (!conversationEl) return;

  const messageEl = document.createElement('div');
  messageEl.className = `ai-tutor-message ai-tutor-message-${role.toLowerCase()}`;
  
  const roleLabel = document.createElement('div');
  roleLabel.className = 'ai-tutor-message-role';
  
  // Child-friendly role names with emojis!
  const roleMappings = {
    'You': '👦 You',
    'AI': '🤖 Your Tutor',
    'System': '✨ System',
    'Error': '⚠️ Oops'
  };
  roleLabel.textContent = roleMappings[role] || role;
  
  const contentEl = document.createElement('div');
  contentEl.className = 'ai-tutor-message-content';
  contentEl.textContent = content;
  
  messageEl.appendChild(roleLabel);
  messageEl.appendChild(contentEl);
  conversationEl.appendChild(messageEl);
  
  // Smooth scroll with animation
  conversationEl.scrollTo({
    top: conversationEl.scrollHeight,
    behavior: 'smooth'
  });
  
  // Add celebration animation for encouraging messages
  if (content.includes('Great') || content.includes('Awesome') || content.includes('Good')) {
    contentEl.classList.add('celebrate');
  }
}

let currentTranscriptEl = null;

function updateTranscriptStreaming(delta) {
  if (!currentTranscriptEl) {
    currentTranscriptEl = document.createElement('div');
    currentTranscriptEl.className = 'ai-tutor-message ai-tutor-message-ai';
    
    const roleLabel = document.createElement('div');
    roleLabel.className = 'ai-tutor-message-role';
    roleLabel.textContent = 'AI';
    
    const contentEl = document.createElement('div');
    contentEl.className = 'ai-tutor-message-content';
    
    currentTranscriptEl.appendChild(roleLabel);
    currentTranscriptEl.appendChild(contentEl);
    
    const conversationEl = document.getElementById('ai-tutor-conversation');
    if (conversationEl) {
      conversationEl.appendChild(currentTranscriptEl);
    }
  }
  
  const contentEl = currentTranscriptEl.querySelector('.ai-tutor-message-content');
  if (contentEl) {
    contentEl.textContent += delta;
    
    const conversationEl = document.getElementById('ai-tutor-conversation');
    if (conversationEl) {
      conversationEl.scrollTop = conversationEl.scrollHeight;
    }
  }
}

// ============================================================================
// Audio utilities
// ============================================================================
function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  
  return buffer;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function playAudioChunk(base64Audio) {
  try {
    if (!audioContext) return;
    
    const arrayBuffer = base64ToArrayBuffer(base64Audio);
    const audioBuffer = await pcm16ToAudioBuffer(arrayBuffer);
    
    audioQueue.push(audioBuffer);
    
    if (!isPlaying) {
      playNextInQueue();
    }
  } catch (error) {
    console.error('Error playing audio:', error);
  }
}

async function pcm16ToAudioBuffer(arrayBuffer) {
  if (!audioContext) {
    throw new Error('Audio context is not initialized');
  }
  
  const dataView = new DataView(arrayBuffer);
  const float32Array = new Float32Array(arrayBuffer.byteLength / 2);
  
  for (let i = 0; i < float32Array.length; i++) {
    const int16 = dataView.getInt16(i * 2, true);
    float32Array[i] = int16 / (int16 < 0 ? 0x8000 : 0x7FFF);
  }
  
  const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
  audioBuffer.getChannelData(0).set(float32Array);
  
  return audioBuffer;
}

function playNextInQueue() {
  if (audioQueue.length === 0) {
    isPlaying = false;
    currentTranscriptEl = null;
    return;
  }
  
  isPlaying = true;
  const audioBuffer = audioQueue.shift();
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.onended = () => playNextInQueue();
  source.start();
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
