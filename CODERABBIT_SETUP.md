# 🐰 Setting Up CodeRabbit for AI Code Review

CodeRabbit provides AI-powered code reviews for your pull requests. Perfect for open source projects!

## 🎯 What CodeRabbit Does

- ✅ Reviews every pull request automatically
- ✅ Finds bugs and security issues
- ✅ Suggests improvements and best practices
- ✅ Summarizes changes in plain English
- ✅ Learns your codebase over time
- ✅ **Free for open source projects!**

## 📦 Setup Steps (5 minutes)

### 1. Install CodeRabbit GitHub App

1. Go to: https://github.com/apps/coderabbitai
2. Click **"Install"**
3. Choose **"Only select repositories"**
4. Select: `ai-tutor-for-kids`
5. Click **"Install & Authorize"**

### 2. Configure CodeRabbit (Optional)

Create a file `.coderabbit.yaml` in your repository root:

```yaml
# CodeRabbit Configuration for AI Tutor for Kids

language: "en-US"

reviews:
  # High-level summary of changes
  high_level_summary: true
  
  # Detailed review of each file
  review_status: true
  
  # Poem summarizing the PR (fun!)
  poem: true
  
  # Areas to focus on
  path_filters:
    - "!*.md"  # Skip markdown files
    - "!*.txt" # Skip text files
  
  # Review depth
  auto_review:
    enabled: true
    drafts: false  # Don't review draft PRs
    
  # Focus areas for this project
  focus:
    - "Security vulnerabilities"
    - "Chrome extension best practices"
    - "Privacy and data handling"
    - "Code quality and maintainability"
    - "Error handling"

# Tone and style
tone_instructions: |
  Be encouraging and educational. This is an educational project for kids,
  so reviews should be constructive and explain why suggestions matter.

# Language preferences
early_access: false
```

### 3. Test It Out

**Create a test PR:**
1. Make a small change to any file
2. Create a new branch: `git checkout -b test-coderabbit`
3. Commit and push: `git push origin test-coderabbit`
4. Open a PR on GitHub
5. CodeRabbit will automatically review it! 🎉

## 🎨 What You'll See

When you open a PR, CodeRabbit will:

1. **Post a summary comment** with:
   - High-level overview
   - Files changed
   - Key changes
   - A fun poem! 🎵

2. **Leave inline comments** with:
   - Suggestions for improvement
   - Bug warnings
   - Security concerns
   - Best practice tips

3. **Update as you make changes**:
   - Resolves comments when fixed
   - Re-reviews after new commits

## 🤖 Interacting with CodeRabbit

You can talk to CodeRabbit in PR comments:

```markdown
@coderabbitai help
@coderabbitai review this file again
@coderabbitai explain this suggestion
@coderabbitai is this secure?
```

## 🎯 Benefits for Your Project

### For You:
- ✅ Catch bugs before they're merged
- ✅ Learn best practices
- ✅ Security vulnerability detection
- ✅ Consistent code quality

### For Contributors:
- ✅ Immediate feedback on PRs
- ✅ Educational explanations
- ✅ Faster review cycles
- ✅ Clear improvement suggestions

## 📊 Example Review Comments

CodeRabbit might say things like:

> **Security:** This console.log statement could leak sensitive data. Consider removing it or adding a check.

> **Best Practice:** Consider using `const` instead of `let` here since this variable is never reassigned.

> **Bug Risk:** This async function doesn't handle errors. Consider adding try-catch.

> **Performance:** This loop could be optimized using `Array.map()` for better readability.

## 🔧 Customization Options

### Focus on Specific Issues:

Edit `.coderabbit.yaml` to focus on what matters:

```yaml
reviews:
  ignore_patterns:
    - "test-*.js"
    - "*.md"
  
  focus:
    - "Security"
    - "Privacy"
    - "Performance"
```

### Change Review Depth:

```yaml
reviews:
  auto_review:
    complexity_threshold: 15  # Only review complex functions
    path_filters:
      - "!docs/**"  # Skip documentation
```

## 📚 Resources

- **CodeRabbit Docs:** https://docs.coderabbit.ai
- **GitHub App:** https://github.com/apps/coderabbitai
- **Support:** support@coderabbit.ai

## 🎓 Why This Matters for Your Project

Since your extension:
- Handles API keys (security critical!)
- Works with children's data (privacy critical!)
- Is open source (code quality matters!)

Having AI review every PR ensures:
- Security vulnerabilities are caught early
- Privacy best practices are followed
- Code quality stays high
- Contributors get immediate feedback

## 🚀 Alternative: GitHub Copilot for Business

If you later want even more features:
- **GitHub Copilot for Business** includes code review
- **GitHub Advanced Security** has Copilot Autofix
- **Cost:** $21/user/month
- **Benefits:** Native integration with GitHub

But for open source, **CodeRabbit is perfect and free!**

---

**Ready to install? Go to:** https://github.com/apps/coderabbitai

Your contributors will love getting instant, helpful feedback! 🎉

