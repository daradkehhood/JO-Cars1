# ============================================
#  AI Agents - Complete Setup Guide
#  NVIDIA API Configuration
# ============================================

## 🔑 API Configuration

```
Provider: NVIDIA
Model: openai/gpt-oss-120b
Base URL: https://integrate.api.nvidia.com/v1
API Key: nvapi-0Rpxo...5t4uzG
```

---

## 🚀 Quick Launch Commands

### 1. OpenHands Agent Canvas (Web GUI)
```powershell
agent-canvas
```
**Access:** http://localhost:8000
**Best for:** Visual code exploration, multi-file projects, architecture planning

### 2. Cline CLI (Terminal)
```powershell
cline
```
**Best for:** Quick terminal coding, file edits, bash commands

### 3. Goose Session (Multi-Tool)
```powershell
goose session
```
**Best for:** Database queries, API integrations, extensions

### 4. mini-swe-agent (GitHub Issues)
```powershell
mini-swe-agent
```
**Best for:** Automated bug fixes, GitHub issue resolution

### 5. Launch All Agents
```powershell
.\start-agents.ps1
```

---

## 📁 Configuration Files

| Agent | Config Location |
|-------|-----------------|
| OpenHands | `~/.openhands/settings.json` |
| Goose | `~/.config/goose/config.toml` |
| mini-swe-agent | `~/.local/mini-swe-agent/.env` |
| Cline | Configured on first run |

---

## 🎯 Agent Capabilities Matrix

| Agent | Code Gen | File Edit | Bash | Web UI | Extensions | GitHub |
|-------|----------|-----------|------|--------|------------|--------|
| OpenHands | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cline | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Goose | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| mini-swe-agent | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## 🔄 Recommended Workflow

```
┌─────────────────────────────────────────────────────────┐
│                    Task Planning                         │
│            (Use OpenHands Canvas for visual)            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   Code Execution                         │
│           (Use Cline for rapid terminal edits)          │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  Integration Work                        │
│        (Use Goose for databases, APIs, tools)           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│               GitHub Issue Automation                    │
│        (Use mini-swe-agent for automated fixes)         │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Environment Variables (Set System-Wide)

```powershell
# View current settings
[System.Environment]::GetEnvironmentVariable("OPENAI_API_KEY", "User")
[System.Environment]::GetEnvironmentVariable("OPENAI_API_BASE", "User")
[System.Environment]::GetEnvironmentVariable("OPENAI_MODEL", "User")

# Update if needed
[System.Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "your-key", "User")
[System.Environment]::SetEnvironmentVariable("OPENAI_API_BASE", "https://integrate.api.nvidia.com/v1", "User")
[System.Environment]::SetEnvironmentVariable("OPENAI_MODEL", "openai/gpt-oss-120b", "User")
```

---

## 📊 Usage Tips

### OpenHands Canvas
- Open http://localhost:8000
- Go to Settings > LLM
- Verify NVIDIA API is configured
- Open your project folder
- Start chatting with the agent

### Cline
- Navigate to your project: `cd your-project`
- Run: `cline`
- Approve or auto-approve actions
- Watch it code in real-time

### Goose
- Run: `goose session`
- The agent has access to extensions
- Can query databases, call APIs, manage infrastructure

### mini-swe-agent
- Navigate to a git repo
- Run: `mini-swe-agent`
- Point it to a GitHub issue
- It will create a fix automatically

---

## ⚡ All agents are now configured with:
- **Model:** openai/gpt-oss-120b
- **Provider:** NVIDIA API
- **Temperature:** 1
- **Max Tokens:** 4096
