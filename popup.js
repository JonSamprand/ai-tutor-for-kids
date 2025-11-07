// Load saved settings when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  const settings = await chrome.storage.local.get([
    'apiKey',
    'apiProvider',
    'systemPrompt',
    'voiceEnabled',
    'voiceSelect',
    'tutorMode'
  ]);

  // Populate fields with saved values
  if (settings.apiKey) {
    document.getElementById('apiKey').value = settings.apiKey;
  }

  if (settings.apiProvider) {
    document.getElementById('apiProvider').value = settings.apiProvider;
  }

  if (settings.voiceSelect) {
    document.getElementById('voiceSelect').value = settings.voiceSelect;
  } else {
    // Default to nova (bright, energetic)
    document.getElementById('voiceSelect').value = 'nova';
  }

  if (settings.tutorMode) {
    document.getElementById('tutorMode').value = settings.tutorMode;
  } else {
    // Default to turn-based mode (Vision-based)
    document.getElementById('tutorMode').value = 'turnbased';
  }

  if (settings.systemPrompt) {
    document.getElementById('systemPrompt').value = settings.systemPrompt;
  }

  if (settings.voiceEnabled !== undefined) {
    document.getElementById('voiceEnabled').checked = settings.voiceEnabled;
  }
});

// Save settings
document.getElementById('saveBtn').addEventListener('click', async () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  const apiProvider = document.getElementById('apiProvider').value;
  const voiceSelect = document.getElementById('voiceSelect').value;
  const tutorMode = document.getElementById('tutorMode').value;
  const systemPrompt = document.getElementById('systemPrompt').value.trim();
  const voiceEnabled = document.getElementById('voiceEnabled').checked;

  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }

  if (!systemPrompt) {
    showStatus('Please enter a system prompt', 'error');
    return;
  }

  // Save to chrome.storage.local
  await chrome.storage.local.set({
    apiKey,
    apiProvider,
    voiceSelect,
    tutorMode,
    systemPrompt,
    voiceEnabled
  });

  showStatus('✨ Settings saved! Reload the page to see the changes!', 'success');
});

// Clear conversation memory
document.getElementById('clearMemoryBtn').addEventListener('click', async () => {
  await chrome.storage.local.remove('conversationHistory');
  showStatus('🎉 Memory cleared! Ready for a fresh start!', 'success');
});

// Show status message
function showStatus(message, type) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = 'status-message status-' + type;
  statusEl.style.display = 'block';

  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 3000);
}

