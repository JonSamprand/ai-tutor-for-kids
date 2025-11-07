# 📦 Installation Guide

Follow these step-by-step instructions to install and set up the AI Tutor Chrome Extension.

## Step 1: Get an API Key

You'll need an API key from one of these providers:

### Option A: OpenAI (Recommended)

1. Go to [https://platform.openai.com/signup](https://platform.openai.com/signup)
2. Create an account or sign in
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (starts with `sk-...`)
6. **Important**: Add payment method and set usage limits in [Billing Settings](https://platform.openai.com/account/billing)

**Cost**: ~$0.01-$0.05 per tutoring session with GPT-4o-mini

### Option B: Anthropic Claude

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key
6. Set up billing and usage limits

**Cost**: ~$0.01-$0.03 per tutoring session with Claude Haiku

## Step 2: Generate Extension Icons

1. Open `icon-generator.html` in your web browser (double-click the file)
2. Icons will automatically generate
3. Right-click each icon and select "Save image as..."
4. Save them in the `icons/` folder with these exact names:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

**Quick Alternative**: You can also download pre-made icons from [favicon.io](https://favicon.io/emoji-favicons/graduation-cap/)

## Step 3: Install Extension in Chrome

1. Open Google Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle switch in top-right corner)
4. Click "Load unpacked" button
5. Navigate to and select the `FLVS Tutor` folder
6. The extension should now appear in your extensions list!

### Verify Installation

- You should see the extension icon in your Chrome toolbar
- Click it to open the settings popup
- If you don't see it, click the puzzle piece icon (🧩) and pin the AI Tutor extension

## Step 4: Configure Settings

1. **Click the extension icon** in your Chrome toolbar
2. **Select AI Provider**: Choose OpenAI or Anthropic
3. **Enter API Key**: Paste your API key
4. **Review System Prompt**: The default is great for elementary students, but customize if needed
5. **Voice Settings**: Leave "Voice Enabled" checked
6. **Click "💾 Save Settings"**

You should see a success message!

## Step 5: Test It Out!

1. **Navigate to any educational webpage**:
   - [Khan Academy](https://www.khanacademy.org/)
   - [FLVS lessons](https://www.flvs.net/)
   - [Wikipedia](https://www.wikipedia.org/)
   - Any text-based educational content

2. **Look for the floating 🎓 button** in the bottom-right corner

3. **Click the button** to activate Tutor Mode

4. **Allow microphone access** when prompted by your browser

5. **Start learning!**
   - The AI will read the page and greet your child
   - Click the 🎤 microphone button to speak
   - Have a conversation!

## 🎉 You're All Set!

The AI Tutor is now ready to help your child learn from any webpage.

## ⚙️ Browser Permissions

When you first use the extension, Chrome will ask for permissions:

- ✅ **Microphone**: Required for speech input
- ✅ **Active Tab**: To read page content
- ✅ **Storage**: To save settings and conversation history

These permissions are safe and only used locally on your computer.

## 🔄 Updating the Extension

If you make changes to the extension files:

1. Go to `chrome://extensions/`
2. Find the AI Tutor extension
3. Click the refresh/reload icon (🔄)
4. Your changes are now active!

## 🐛 Troubleshooting Installation

### Extension doesn't appear

- Make sure "Developer mode" is enabled
- Try reloading the extension
- Check that all files are in the correct folder

### Icons missing error

- Make sure you've created all three icon files
- Check that they're named exactly: `icon16.png`, `icon48.png`, `icon128.png`
- Verify they're in the `icons/` folder

### Popup doesn't open

- Right-click the extension icon
- Select "Inspect popup" to see any errors
- Make sure `popup.html` and `popup.js` are present

### "Speech recognition not supported"

- This extension requires Chrome or Edge
- Update your browser to the latest version
- Safari and Firefox are not supported

## 📞 Need Help?

Check the main [README.md](README.md) for:
- Detailed usage instructions
- Troubleshooting tips
- Customization options
- FAQ section

---

**Happy Learning! 🎓✨**

