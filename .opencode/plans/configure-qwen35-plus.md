# Plan: Configure Qwen3.5 Plus as Default Global Model

## Overview
Update the global OpenCode configuration to use Qwen3.5 Plus from OpenCode Go as the default model.

## Changes Required

### File: `/home/rooc/.config/opencode/opencode.json`

**Current Configuration:**
```json
{
	"$schema": "https://opencode.ai/config.json",
	"model": "Kimi K2.5",
	"default_agent": "plan"
}
```

**New Configuration:**
```json
{
	"$schema": "https://opencode.ai/config.json",
	"model": "opencode-go/qwen3.5-plus",
	"default_agent": "plan"
}
```

## What This Enables

### Model: Qwen3.5 Plus (via OpenCode Go)
- **Cost**: $10/month (OpenCode Go subscription)
- **Usage Limits**:
  - 10,200 requests per 5 hours
  - 25,200 requests per week
  - 50,500 requests per month
- **Best For**: General coding tasks with high volume needs
- **Endpoint**: `https://opencode.ai/zen/go/v1/chat/completions`
- **AI SDK Package**: `@ai-sdk/alibaba`

## Prerequisites Verified
✅ OpenCode Go subscription active
✅ API keys configured via `/connect`

## Verification Steps After Implementation

1. Restart OpenCode or reload configuration
2. Run `/models` command to confirm Qwen3.5 Plus is available
3. Start a new session to verify the model is being used

## Rollback
If needed, revert to previous model by changing back to `"model": "Kimi K2.5"`

## Notes
- The `opencode-go/` prefix is required for Go models
- Configuration takes effect immediately after file save
- No restart required for most OpenCode interfaces
