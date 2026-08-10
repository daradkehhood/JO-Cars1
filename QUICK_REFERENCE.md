# Quick Reference Card - AI Agents

## 🚀 Launch Commands

| Agent | Command | What it does |
|-------|---------|--------------|
| OpenHands | `agent-canvas` | Web UI at localhost:8000 |
| Cline | `cline` | Terminal coding agent |
| Goose | `goose session` | Multi-tool agent session |
| mini-swe-agent | `mini-swe-agent` | GitHub issue solver |

## 🎯 When to Use What

```
Need visual code exploration?  → OpenHands Canvas
Need quick terminal edits?     → Cline
Need database/API tools?       → Goose
Need to fix GitHub issues?     → mini-swe-agent
```

## 🔄 Combined Workflow

1. **Plan** → OpenHands Canvas (visual)
2. **Execute** → Cline (fast terminal)
3. **Integrate** → Goose (extensions)
4. **Automate** → mini-swe-agent (GitHub)

## ⚙️ Configuration

All agents need an LLM API key. Set in your environment:

```powershell
# PowerShell
$env:ANTHROPIC_API_KEY = "your-key"
$env:OPENAI_API_KEY = "your-key"
```

Or configure each agent individually:
- OpenHands: Settings in web UI
- Cline: `cline configure`
- Goose: `goose configure`
- mini-swe-agent: Set OPENAI_API_KEY env var
