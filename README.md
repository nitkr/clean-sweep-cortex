# CleanSweep Cortex

<p align="center">
  <pre>
<span style="color:#00d9ff"> ██████╗██╗     ███████╗ █████╗ ███╗   ██╗    ███████╗██╗    ██╗███████╗███████╗██████╗ </span>
<span style="color:#00d9ff">██╔════╝██║     ██╔════╝██╔══██╗████╗  ██║    ██╔════╝██║    ██║██╔════╝██╔════╝██╔══██╗</span>
<span style="color:#00d9ff">██║     ██║     █████╗  ███████║██╔██╗ ██║    ███████╗██║ █╗ ██║█████╗  █████╗  ██████╔╝</span>
<span style="color:#00d9ff">██║     ██║     ██╔══╝  ██╔══██║██║╚██╗██║    ╚════██║██║███╗██║██╔══╝  ██╔══╝  ██╔═══╝ </span>
<span style="color:#00d9ff">╚██████╗███████╗███████╗██║  ██║██║ ╚████║    ███████║╚███╔███╔╝███████╗███████╗██║     </span>
<span style="color:#00d9ff"> ╚═════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝    ╚══════╝ ╚══╝╚══╝ ╚══════╝╚══════╝╚═╝     </span>

<span style="color:#9d7cd8"> ██████╗ ██████╗ ██████╗ ████████╗███████╗██╗ ██╗</span>
<span style="color:#9d7cd8">██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝</span>
<span style="color:#9d7cd8">██║ ██║ ██║██████╔╝ ██║ █████╗ ╚███╔╝ </span>
<span style="color:#9d7cd8">██║ ██║ ██║██╔══██╗ ██║ ██╔══╝ ██╔██╗ </span>
<span style="color:#9d7cd8">╚██████╗╚██████╔╝██║ ██║ ██║ ███████╗██╔╝ ██╗</span>
<span style="color:#9d7cd8"> ╚═════╝ ╚═════╝ ╚═╝ ╚═╝ ╚═╝ ╚══════╝╚═╝ ╚═╝</span>

</pre>
</p>

<p align="center">
  <strong>AI-Powered Malware Agent for WordPress</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-beta-orange" alt="Status">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/AI-Agent-blue" alt="AI Agent">
</p>

CleanSweep Cortex is an autonomous, hierarchical AI agent system built on OpenCode for intelligently detecting, analyzing, planning, cleaning, and verifying malware on WordPress sites.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/nitkr/clean-sweep-cortex.git
cd clean-sweep-cortex

# Install dependencies
bun install

# Build the project
bun run build

# Run the application
bun run dev
```

## Features

- **Hierarchical AI Agent System**: 4 main agents (Vanguard, Tactician, Purger, Sentinel) with 16 specialized sub-agents
- **Modular Architecture**: Swappable remediation backends via the `RemediationBackend` adapter layer
- **False Positive Reduction**: Multi-stage verification with evidence-based reasoning
- **WordPress Integration**: Seamless connection to local test labs or remote WordPress installations
- **Sweep Sessions**: Organized cleanup operations with complete history tracking

## Documentation

Detailed documentation is available in the [docs](./docs/) folder:

- [Getting Started](./docs/getting-started.md) - Prerequisites, installation, and first scan
- [Architecture](./docs/architecture.md) - System architecture overview
- [Agents](./docs/agents.md) - Agent hierarchy documentation
- [CLI Reference](./docs/cli.md) - CLI tools and commands

## Project Structure

```
cleansweep-cortex/
├── packages/           # OpenCode monorepo packages
├── agents/             # Cortex agent definitions
│   ├── vanguard/       # Investigation & Discovery
│   ├── tactician/      # Analysis & Planning
│   ├── purger/         # Execution & Remediation
│   └── sentinel/       # Verification & Hardening
└── docs/               # Documentation
```

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **UI Framework**: Solid.js
- **AI Integration**: OpenCode agent system with custom Cortex tools

## Links

- **Repository**: https://github.com/nitkr/clean-sweep-cortex
- **Clean Sweep CLI**: https://github.com/nitkr/clean-sweep-cli

- **Remote Site**: https://pixeljunkyard.store/my-proj-two/
