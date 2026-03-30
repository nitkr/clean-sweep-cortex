# CleanSweep Cortex Architecture

CleanSweep Cortex is built on a modular, scalable architecture that separates concerns and allows for flexible remediation backend integration.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI Layer                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Chat Interface│  │ Sweep Sessions│  │ Dynamic File Browser │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                     Agent System                                 │
│  ┌─────────┐  ┌───────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │ Vanguard│→ │ Tactician │→ │ Purger  │→ │    Sentinel     │ │
│  │(4 agents)│  │ (4 agents)│  │(4 agents)│  │   (4 agents)    │ │
│  └─────────┘  └───────────┘  └─────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                  @cortex Tool Calling System                     │
│  scan │ backup │ list-files │ read-file │ analyze-file │ etc. │
├─────────────────────────────────────────────────────────────────┤
│               RemediationBackend Adapter Layer                   │
│  ┌─────────────────┐  ┌───────────────────────────────────────┐│
│  │ Abstract Interface│  │ Concrete Adapters                    ││
│  │ (scan, plan,     │  │ - SSHAdapter + CleanSweepCLIAdapter  ││
│  │  clean, verify)   │  │ - Future: API, PHP Bridge, etc.      ││
│  └─────────────────┘  └───────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                    Target Systems                                │
│     Local WordPress (test-lab/)      │    Remote Sites (SSH)   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. UI Layer

Built on OpenCode's Solid.js interface with Cortex-specific customizations:

- **Splash Screen**: CleanSweep Cortex branding with animated logo
- **Chat Interface**: Agent interaction and command input
- **Sweep Sessions Panel**: Organized cleanup operations with history
- **Dynamic File Browser**: Real-time file navigation from connected WordPress sites
- **Agent Invocation Panel**: Direct access to all main agents

### 2. Agent System

The hierarchical multi-agent system consists of exactly **4 main agents**, each with **4 sub-agents**:

| Main Agent    | Purpose                   | Sub-Agents                                                      |
| ------------- | ------------------------- | --------------------------------------------------------------- |
| **Vanguard**  | Investigation & Discovery | FilePhantom, DbGhost, UserSpecter, CronWraith                   |
| **Tactician** | Analysis & Planning       | RiskOracle, ActionArchitect, ResourceWarden, BackupPhantom      |
| **Purger**    | Execution & Remediation   | CoreEraser, PluginScrubber, DbPurifier, FileIncinerator         |
| **Sentinel**  | Verification & Hardening  | IntegrityVerifier, LockdownEnforcer, MonitorWatcher, ReportSage |

### 3. RemediationBackend Adapter Layer

The abstract `RemediationBackend` interface defines standard operations:

```typescript
interface RemediationBackend {
  scan(target: WordPressSite): Promise<ScanResult[]>
  plan(findings: ScanResult[]): Promise<RemediationPlan>
  clean(plan: RemediationPlan, options: CleanOptions): Promise<CleanResult>
  verify(target: WordPressSite): Promise<VerificationResult>
  backup(target: WordPressSite): Promise<BackupId>
}
```

This allows any remediation tool to be plugged in without changing agent code.

### 4. @cortex Tool Calling System

Agents invoke specialized tools directly:

| Tool                      | Function                                    |
| ------------------------- | ------------------------------------------- |
| `@cortex scan`            | Execute full malware scan                   |
| `@cortex backup`          | Create backup before cleanup                |
| `@cortex list-files`      | Browse WordPress files                      |
| `@cortex read-file`       | Read file contents with syntax highlighting |
| `@cortex analyze-file`    | Deep analysis of suspicious files           |
| `@cortex run-clean-sweep` | Execute Clean Sweep CLI                     |
| `@cortex status`          | Current session status                      |

## Data Flow

```
1. User initiates sweep session
       ↓
2. Vanguard agents discover threats
   - FilePhantom scans files
   - DbGhost checks database
   - UserSpecter validates users
   - CronWraith hunts cron jobs
       ↓
3. Tactician creates remediation plan
   - RiskOracle scores each threat
   - ActionArchitect sequences actions
   - ResourceWarden checks impact
   - BackupPhantom ensures backup
       ↓
4. User confirms plan (especially <95% confidence items)
       ↓
5. Purger executes cleanup
   - CoreEraser repairs WordPress core
   - PluginScrubber handles plugins
   - DbPurifier cleans database
   - FileIncinerator removes malicious files
       ↓
6. Sentinel verifies and hardens
   - IntegrityVerifier confirms cleanup
   - LockdownEnforcer applies security
   - MonitorWatcher sets up monitoring
   - ReportSage generates report
```

## False Positive Reduction

The system implements multiple layers to minimize false positives:

1. **Multi-stage verification**: Files flagged by scans are re-verified using `@cortex read-file` and `@cortex analyze-file`
2. **Evidence-based reasoning**: Agents must cite concrete code snippets and context
3. **Risk scoring**: Tactician assigns 0-100% confidence; only >85% items proceed automatically
4. **Human confirmation gate**: Items <95% confidence require explicit user approval
5. **Cortex Critic review**: Self-review agent runs after every scan/plan step

## Theme & Branding

Custom Cortex theme using Anomaly colors:

```json
{
  "primary": "#00d9ff", // Cyan - Security/Trust
  "secondary": "#9d7cd8", // Purple - AI/Cortex
  "accent": "#7fd88f", // Green - Clean/Safe
  "error": "#e06c75", // Red
  "warning": "#f5a742" // Orange
}
```

Theme file: `packages/opencode/src/cli/cmd/tui/context/theme/cortex.json`

## Modular Design Principles

The architecture follows strict modularity rules:

1. **Loose coupling**: Agents communicate through defined interfaces, not direct dependencies
2. **Single responsibility**: Each sub-agent has one specific task
3. **Swappable backends**: RemediationBackend allows easy integration of new tools
4. **Preserved OpenCode structure**: Monorepo layout maintained for future feature re-addition

## Future Extensibility

The modular design allows for:

- **New adapters**: REST API adapter, PHP bridge adapter, SSH tunnel adapter
- **Additional agents**: New sub-agents can be added to any main agent
- **Enhanced tools**: More @cortex tools without modifying core architecture
- **Multi-site management**: Batch operations across multiple WordPress installations
