# 🧪 Testing Guide - Vision-Based AI Tutor

## Quick Start Testing (5 minutes)

### 1. Load the Extension

```bash
cd "/Users/samprand/FLVS Tutor"
```

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `/Users/samprand/FLVS Tutor` folder

### 2. Configure Settings

1. Click the 🎓 extension icon in toolbar
2. Fill in:
   - **AI Provider:** OpenAI
   - **API Key:** add your API Key
   - **Tutor Mode:** Turn-based (Vision) ⭐
   - **Voice:** Shimmer (default)
3. Click "💾 Save Settings"

### 3. Test on FLVS Page

1. Navigate to an FLVS lesson page (e.g., `learn.flvs.net/...`)
2. **Wait 3 seconds** for page to fully load
3. Click the floating 🎓 button (bottom right)
4. Wait for:
   - "Taking screenshot..."
   - "Reading the page..."
   - "✅ Ready! Press & hold to talk."
5. **Press & hold** the 🎤 button
6. Speak: "What is this lesson about?"
7. **Release** the button
8. Listen to AI response

### 4. Verify Success

✅ AI greets you mentioning the actual lesson topic  
✅ AI references specific content visible on page  
✅ AI answers your question accurately  
✅ Voice is clear (Shimmer voice)  
✅ Conversation appears in bubbles (You/AI)  

## Detailed Test Cases

### Test Case 1: Basic Greeting

**Steps:**
1. Start tutor on any lesson page
2. Wait for greeting

**Expected:**
- AI says "Hi!" or similar
- AI mentions the lesson topic/title
- Voice plays through speakers

**Pass Criteria:**
- ✅ Greeting is relevant to page content
- ✅ Voice is clear and friendly

### Test Case 2: Content Understanding

**Steps:**
1. Start tutor
2. Ask: "What's the main topic on this page?"
3. Wait for response

**Expected:**
- AI identifies correct lesson topic
- AI references specific headings/sections
- Response is 1-3 sentences

**Pass Criteria:**
- ✅ AI correctly identifies content
- ✅ No hallucinations or made-up content
- ✅ References actual visible text

### Test Case 3: FLVS Iframe Content

**Steps:**
1. Navigate to FLVS lesson with iframe (webdav URL)
2. Wait 5 seconds for iframe to load
3. Start tutor
4. Check console logs (F12)
5. Ask about lesson content

**Expected:**
- Console shows: "✅ Found FLVS lesson iframe!"
- Console shows: "✅ Accessed lesson iframe content!"
- Console shows: "Screenshot: YES ✅"
- AI understands iframe content

**Pass Criteria:**
- ✅ No "LTI Pass-through" references
- ✅ AI sees actual lesson content
- ✅ AI answers questions accurately

### Test Case 4: Multi-Turn Conversation

**Steps:**
1. Start tutor
2. Ask 3 questions in a row:
   - "What is this lesson about?"
   - "Can you explain the first example?"
   - "What should I learn from this?"
3. Observe responses

**Expected:**
- Each question gets answered
- Conversation history maintained
- Responses stay relevant to page

**Pass Criteria:**
- ✅ All 3 questions answered correctly
- ✅ AI maintains context
- ✅ No repetitive responses

### Test Case 5: Screenshot Fallback

**Steps:**
1. Navigate to page with cross-origin iframe
2. Start tutor
3. Check console for "❌ Cannot access iframe document"
4. Ask question anyway

**Expected:**
- Screenshot captured successfully
- AI uses screenshot + main page text
- AI still provides helpful responses

**Pass Criteria:**
- ✅ No fatal errors
- ✅ Screenshot captured
- ✅ AI provides reasonable answers

### Test Case 6: Voice Selection

**Steps:**
1. Open popup
2. Change voice to "Echo" (male voice)
3. Save settings
4. Reload page
5. Start tutor
6. Listen to greeting

**Expected:**
- Different voice plays (deeper, male)
- Voice is clear and natural

**Pass Criteria:**
- ✅ Voice changed correctly
- ✅ Voice quality good

### Test Case 7: Realtime Mode (Optional)

**Steps:**
1. Open popup
2. Change mode to "Hands-free (Experimental)"
3. Save settings
4. Reload page
5. Start tutor
6. Speak without holding button

**Expected:**
- Continuous listening
- AI responds to voice automatically
- May interrupt AI (barge-in)

**Pass Criteria:**
- ✅ Hands-free listening works
- ✅ Server VAD detects speech
- ✅ AI responds appropriately

## Console Debugging

Press **F12** to open DevTools, check Console for:

```
🔍 Found X iframes on page
✅ Found FLVS lesson iframe!
✅ Accessed lesson iframe content!
   Content length: XXXX chars
=== SCRAPED CONTENT ===
Title: "..."
Screenshot: YES ✅
=======================
📸 Screenshot captured in background
🔮 Vision Chat Request: ...
✅ Vision response: ...
🔊 TTS request: ...
```

## Common Issues & Fixes

### Issue: "No speech detected"

**Cause:** Button not held long enough, or mic blocked  
**Fix:**
- Hold button for full duration of speech
- Check Chrome mic permissions (chrome://settings/content/microphone)
- Speak clearly and loudly

### Issue: AI says "I don't see that on this page"

**Cause:** Content not in screenshot or text scrape  
**Fix:**
- Scroll to make content visible before starting tutor
- Wait longer for page to load (5 seconds)
- Check console for "Screenshot: YES ✅"

### Issue: "Error: API request failed"

**Cause:** Invalid API key or quota exceeded  
**Fix:**
- Verify API key in popup settings
- Check OpenAI dashboard for usage/billing
- Try re-entering API key

### Issue: No audio plays

**Cause:** Browser audio blocked or TTS failed  
**Fix:**
- Check browser audio isn't muted
- Check site permissions for audio
- Look for errors in console (F12)

### Issue: "LTI Pass-through" still appearing

**Cause:** Using Realtime mode instead of Vision mode  
**Fix:**
- Open popup
- Select "Turn-based (Vision)"
- Save and reload page

## Performance Benchmarks

**Expected Timings (Turn-based):**
- Screenshot capture: ~0.5s
- Page scraping: ~2s
- Speech recognition: ~0.5s
- Vision API call: ~1-2s
- TTS generation: ~0.5s
- Audio playback: varies by response length

**Total round-trip: 3-5 seconds**

## Next Steps After Testing

1. ✅ Verify all test cases pass
2. ✅ Adjust system prompt for better tutoring
3. ✅ Test on different FLVS lessons
4. ✅ Try different voices (shimmer, verse, echo)
5. ✅ Monitor costs in OpenAI dashboard
6. ✅ Share feedback or issues

## Reporting Issues

If you find bugs, note:
- Chrome version
- Extension version
- FLVS page URL
- Console logs (F12)
- Screenshot of error
- Steps to reproduce

---

**Happy Testing! 🎓**

