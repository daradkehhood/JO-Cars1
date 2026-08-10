# AI Agents Setup & Orchestration Guide

## Installed Agents Summary

| Agent | Version | Type | Command | Use Case |
|-------|---------|------|---------|----------|
| **OpenHands Agent Canvas** | 1.12.0 | Web GUI + CLI | `agent-canvas` | Full-stack coding agent with GUI |
| **Cline** | 3.0.52 | CLI | `cline` | Terminal AI coding agent |
| **Goose** | 1.45.0 | CLI | `goose session` | Multi-tool AI agent with extensions |
| **mini-swe-agent** | 2.4.6 | Python CLI | `mini-swe-agent` | GitHub issue solver |
| **Roo Code** | ⚠️ Archived | VS Code Extension | N/A | Replaced by Cline/ZooCode |

---

## Quick Start Commands

### 1. OpenHands Agent Canvas (Web UI)
```powershell
# Start the web interface on localhost:8000
agent-canvas

# Or on a custom port
agent-canvas --port 3000
```
- Opens browser at `http://localhost:8000`
- Configure your LLM API key in Settings > LLM
- Best for: Complex multi-file projects, interactive coding sessions

### 2. Cline CLI (Terminal Agent)
```powershell
# Start an interactive coding session
cline

# Works in any project directory
cd your-project
cline
```
- Best for: Quick terminal-based coding tasks
- Supports: Claude, GPT, Gemini, Ollama, any OpenAI-compatible API

### 3. Goose (Multi-Tool Agent)
```powershell
# Start a session (configure LLM first)
goose session

# Configure provider
goose configure
```
- Best for: Tasks requiring multiple tool integrations
- Supports extensions for databases, APIs, infrastructure

### 4. mini-swe-agent (GitHub Issue Solver)
```powershell
# Solve a GitHub issue
mini-swe-agent solve --repo owner/repo --issue 42

# Interactive mode
mini-swe-agent
```
- Best for: Automated GitHub issue resolution
- Requires: OpenAI API key

---

## Unified Orchestration Strategy

### Workflow: Multi-Agent Pipeline

```
Task Input
    │
    ├──[Planning Phase]──→ OpenHands Agent Canvas (GUI)
    │                      - Visual codebase exploration
    │                      - Architecture planning
    │                      - Multi-file refactoring preview
    │
    ├──[Execution Phase]──→ Cline CLI (Terminal)
    │                       - Rapid code generation
    │                       - File edits and bash commands
    │                       - Direct terminal integration
    │
    ├──[Specialized Tasks]──→ Goose (Extensions)
    │                        - Database queries
    │                        - API integrations
    │                        - Infrastructure management
    │
    └──[Issue Resolution]──→ mini-swe-agent
                             - Automated bug fixes
                             - GitHub issue automation
                             - Pull request generation
```

### Role Assignment Matrix

| Task Type | Primary Agent | Secondary Agent |
|-----------|---------------|-----------------|
| New Feature Development | OpenHands Canvas | Cline |
| Bug Fixing | Cline | mini-swe-agent |
| Code Refactoring | OpenHands Canvas | Cline |
| Architecture Planning | OpenHands Canvas | Goose |
| API Integration | Goose | Cline |
| GitHub Issue Automation | mini-swe-agent | Cline |
| Database Work | Goose | Cline |
| Quick Scripts | Cline | Goose |
| Large Codebase Analysis | OpenHands Canvas | Goose |

---

## Configuration

### Shared LLM Configuration

Create a shared `.env` file for API keys:

```bash
# ~/.ai-agents/.env
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_gemini_key
```

### OpenHands Configuration
```bash
# Settings are stored in ~/.openhands
# Configure via the web UI at localhost:8000
```

### Cline Configuration
```bash
# Configure on first run or via CLI
cline configure
```

### Goose Configuration
```bash
# Interactive configuration
goose configure

# Or set environment variables
export OPENAI_API_KEY=your_key
```

### mini-swe-agent Configuration
```bash
# Set API key
export OPENAI_API_KEY=your_key

# Or create .env file in mini-swe-agent config dir
# Located at: ~/.local/mini-swe-agent/.env
```

---

## Usage Tips

### 1. Start with OpenHands for Planning
Use the visual GUI to explore your codebase, plan architecture, and preview changes before executing.

### 2. Use Cline for Rapid Execution
Once you have a plan, use Cline in the terminal for fast code generation and edits.

### 3. Leverage Goose for Complex Integrations
When you need database access, API calls, or infrastructure work, Goose's extensions shine.

### 4. Automate Issues with mini-swe-agent
For repetitive bug fixes or well-defined issues, let mini-swe-agent handle them automatically.

### 5. Combine Agents for Large Projects
- Plan in OpenHands → Execute in Cline → Integrate with Goose → Automate with mini-swe-agent

---

## Troubleshooting

### OpenHands won't start
```powershell
# Check if port is in use
netstat -ano | findstr :8000

# Try different port
agent-canvas --port 3000
```

### Cline command not found
```powershell
# Refresh PATH
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
```

### Goose configure requires interactive terminal
```powershell
# Run in a proper terminal (cmd.exe or PowerShell)
goose configure
```

### mini-swe-agent console error
```powershell
# This is expected when not running in a real console
# Use it from a proper terminal or within a project context
cd your-repo
mini-swe-agent
```

---

## Updating Agents

```powershell
# Update OpenHands
& "C:\Program Files\nodejs\npm.cmd" install -g @openhands/agent-canvas@latest

# Update Cline
& "C:\Program Files\nodejs\npm.cmd" install -g cline@latest

# Update Goose
goose update

# Update mini-swe-agent
pip install --upgrade mini-swe-agent
```
