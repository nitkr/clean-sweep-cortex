# CleanSweep Cortex Agents

CleanSweep Cortex uses a hierarchical multi-agent system with exactly **4 main agents**, each containing **4 specialized sub-agents**. This structure ensures thorough coverage of all malware detection and remediation scenarios.

## Agent Hierarchy Overview

```
                    ┌─────────────┐
                    │   Cortex    │
                    │   Critic    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
   │ Vanguard│───────→│Tactician│───────→│  Purger │
   └────┬────┘        └────┬────┘        └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Sentinel  │
                    └────────────┘
```

## 1. Vanguard (Investigation & Discovery)

**Purpose**: First-response agents that investigate and discover potential threats across the WordPress installation.

### FilePhantom

Scans and analyzes suspicious files and obfuscated code.

**Capabilities**:

- Recursive file system scanning
- Obfuscated code detection (base64, eval, preg_replace, etc.)
- Signature matching against known malware patterns
- File integrity verification

**Tools Used**: `@cortex list-files`, `@cortex read-file`, `@cortex analyze-file`

### DbGhost

Detects database-level anomalies and hidden malicious entries.

**Capabilities**:

- WordPress database table scanning
- Post/meta content analysis for malicious URLs
- Detection of hidden admin accounts
- Suspicious database options detection

**Tools Used**: Direct database queries via RemediationBackend

### UserSpecter

Identifies unauthorized or suspicious user accounts.

**Capabilities**:

- User enumeration and analysis
- privilege escalation detection
- Suspicious user agent detection
- Failed login pattern analysis

**Tools Used**: User list via RemediationBackend

### CronWraith

Hunts for malicious or orphaned cron jobs.

**Capabilities**:

- WordPress cron job enumeration
- Detection of scheduled malicious tasks
- Orphaned cron identification
- Suspicious schedule pattern analysis

**Tools Used**: Cron job list via RemediationBackend

---

## 2. Tactician (Analysis & Strategic Planning)

**Purpose**: Strategic analysis agents that assess threats and create remediation plans.

### RiskOracle

Assesses overall threat level and risk scoring.

**Capabilities**:

- Aggregates findings from Vanguard agents
- Assigns 0-100% confidence scores
- Categorizes threats by severity (critical/high/medium/low)
- Identifies false positive candidates

**Output**: Threat assessment matrix for each finding

### ActionArchitect

Creates safe, step-by-step remediation plans.

**Capabilities**:

- Sequences remediation steps for optimal safety
- Identifies dependencies between cleanup actions
- Ensures minimal site disruption
- Plans rollback contingencies

**Output**: Ordered remediation plan with dependencies

### ResourceWarden

Evaluates server resources and potential impact of actions.

**Capabilities**:

- Disk space assessment
- Server load estimation for operations
- Memory usage prediction
- Time/resource estimation per action

**Output**: Resource impact report for each planned action

### BackupPhantom

Ensures backups are taken before any destructive steps.

**Capabilities**:

- Pre-action backup verification
- Backup creation coordination
- Backup restoration planning
- Point-in-time recovery preparation

**Output**: Confirmed backup status before cleanup proceeds

---

## 3. Purger (Safe Execution & Remediation)

**Purpose**: Execution agents that safely remove malware and repair affected components.

### CoreEraser

Safely repairs or restores core WordPress files.

**Capabilities**:

- WordPress core file integrity check
- Safe restoration of corrupted core files
- Version-specific core replacement
- Post-restore verification

**Tools Used**: `@cortex run-clean-sweep` (core repair mode)

### PluginScrubber

Reinstalls or removes infected plugins.

**Capabilities**:

- Plugin vulnerability detection
- Safe plugin reinstallation
- Malicious plugin identification and removal
- Plugin dependency resolution

**Tools Used**: `@cortex run-clean-sweep` (plugin mode)

### DbPurifier

Cleans malicious database entries.

**Capabilities**:

- Targeted database entry removal
- SQL injection cleanup
- Malicious URL/iframe removal
- Database repair after cleanup

**Tools Used**: Direct database operations via RemediationBackend

### FileIncinerator

Removes or quarantines malicious files.

**Capabilities**:

- Safe file deletion with rollback
- File quarantine instead of delete (configurable)
- Recursive directory cleanup
- .htaccess malicious directive removal

**Tools Used**: `@cortex run-clean-sweep` (file removal mode)

---

## 4. Sentinel (Verification, Hardening & Reporting)

**Purpose**: Verification agents that confirm cleanup success and prevent future infections.

### IntegrityVerifier

Verifies that the cleanup was successful.

**Capabilities**:

- Post-cleanup file integrity check
- Database scan for remaining threats
- User account verification
- Cron job validation

**Tools Used**: `@cortex scan` (verification mode)

### LockdownEnforcer

Applies security hardening after cleanup.

**Capabilities**:

- File permission hardening
- .htaccess security rules
- wp-config.php protection
- Security header implementation

**Output**: Security hardening report

### MonitorWatcher

Sets up ongoing monitoring for re-infection.

**Capabilities**:

- File change detection setup
- New threat alerting configuration
- Scheduled rescans
- Anomaly detection baselines

**Output**: Monitoring configuration and baseline

### ReportSage

Generates clear, beautiful summary reports.

**Capabilities**:

- Executive summary generation
- Detailed technical report
- Before/after comparison
- Remediation action log

**Output**: Complete sweep session report

---

## Agent Communication

Agents communicate through a structured message passing system:

```
User → Cortex → Vanguard (discovery) → Tactician (planning)
                                           ↓
                        Purger (execution) ← User (confirmation)
                                           ↓
                              Sentinel (verification)
                                           ↓
                                    Cortex → User
```

## Confidence Thresholds

| Confidence Level | Action                                                      |
| ---------------- | ----------------------------------------------------------- |
| >95%             | Auto-proceed with cleanup                                   |
| 85-95%           | Proceed after user notification                             |
| <85%             | Flag as suspected false positive, require explicit approval |

## Cortex Critic

An additional self-review agent that runs after every scan/plan step:

- Reviews agent decisions for consistency
- Checks for missed threats
- Validates confidence scoring
- Suggests additional verification steps
