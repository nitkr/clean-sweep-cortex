# CleanSweep Cortex CLI Reference

Command-line interface tools and commands for running scans, managing sessions, and controlling the remediation engine.

## Running the CLI

```bash
# From the opencode package
cd packages/opencode
bun run dev

# Or use the built binary
./bin/cortex
```

## Global Commands

### Help

```bash
cortex --help
```

Displays all available commands and options.

### Version

```bash
cortex --version
```

Shows the current CleanSweep Cortex version.

## Sweep Session Commands

### Start New Session

```bash
cortex session new --target <target>
```

Creates a new sweep session for the specified target.

**Options**:

- `--target <path|url>` - Local path or remote URL
- `--name <name>` - Optional session name

**Example**:

```bash
cortex session new --target /home/user/wordpress
cortex session new --target https://example.com --name "production-scan"
```

### List Sessions

```bash
cortex session list
```

Shows all sweep sessions with their status.

### Resume Session

```bash
cortex session resume <session-id>
```

Resumes a previous sweep session.

### Delete Session

```bash
cortex session delete <session-id>
```

Deletes a sweep session and its history.

## Scan Commands

### Full Scan

```bash
cortex scan --target <target>
```

Runs a complete malware scan.

**Options**:

- `--target <path>` - Target WordPress installation
- `--mode <mode>` - Scan mode: `quick`, `full`, `deep`
- `--dry-run` - Run without making changes (default)

**Example**:

```bash
cortex scan --target ./test-lab --mode full
cortex scan --target /var/www/html --mode deep --dry-run
```

### Quick Scan

```bash
cortex scan quick --target <target>
```

Runs a targeted quick scan for common malware locations.

### Verify Scan

```bash
cortex scan verify --target <target>
```

Post-cleanup verification scan.

## Remediation Commands

### Run Clean Sweep

```bash
cortex clean --plan <plan-file>
```

Executes a remediation plan using Clean Sweep CLI.

**Options**:

- `--plan <file>` - Path to remediation plan JSON
- `--dry-run` - Preview actions without executing
- `--force` - Skip confirmation prompts

### Dry Run

```bash
cortex clean --dry-run
```

Preview all cleanup actions without executing them.

## Connection Commands

### Connect to Site

```bash
cortex connect <connection-type>
```

Establishes connection to a WordPress site.

**Connection Types**:

- `local <path>` - Local WordPress installation
- `ssh <host>` - Remote site via SSH

**Example**:

```bash
cortex connect local ./test-lab
cortex connect ssh user@pixeljunkyard.store
```

### Disconnect

```bash
cortex disconnect
```

Closes the current site connection.

### Connection Status

```bash
cortex status
```

Shows current connection status and target info.

## Agent Commands

### List Agents

```bash
cortex agents list
```

Displays all available agents and their status.

### Invoke Agent

```bash
cortex agent invoke <agent-name>
```

Manually invokes a specific agent.

**Agent Names**:

- `vanguard`, `tactician`, `purger`, `sentinel`
- Sub-agents: `filephantom`, `dbghost`, `userspecter`, `cronwraith`, etc.

### Agent Status

```bash
cortex agent status <agent-name>
```

Shows detailed status of a specific agent.

## File Browser Commands

### List Files

```bash
cortex files list <path>
```

Lists files in the specified directory.

**Options**:

- `--path <path>` - Directory path
- `--filter <pattern>` - File filter (e.g., `*.php`)
- `--recursive` - Include subdirectories

### Read File

```bash
cortex files read <path>
```

Reads file contents with syntax highlighting.

### Analyze File

```bash
cortex files analyze <path>
```

Runs deep analysis on a suspicious file.

## Backup Commands

### Create Backup

```bash
cortex backup create --target <target>
```

Creates a backup before cleanup operations.

### List Backups

```bash
cortex backup list --target <target>
```

Shows available backups for the target.

### Restore Backup

```bash
cortex backup restore <backup-id>
```

Restores a previous backup.

## Report Commands

### Generate Report

```bash
cortex report generate <session-id>
```

Generates a sweep session report.

**Options**:

- `--format <format>` - Output format: `text`, `json`, `html`
- `--output <file>` - Output file path

**Example**:

```bash
cortex report generate abc123 --format html --output report.html
```

### Export Report

```bash
cortex report export <session-id> --format <format>
```

Exports the complete session report.

## Configuration Commands

### Show Config

```bash
cortex config show
```

Displays current configuration.

### Set Config

```bash
cortex config set <key> <value>
```

Sets a configuration value.

**Example**:

```bash
cortex config set default-target ./test-lab
cortex config set scan-mode deep
```

## Environment Variables

| Variable          | Description         | Default         |
| ----------------- | ------------------- | --------------- |
| `TEST_LAB_PATH`   | Local test lab path | `./test-lab`    |
| `REMOTE_SITE_URL` | Default remote site | -               |
| `SSH_HOST`        | Default SSH host    | -               |
| `SSH_USER`        | Default SSH user    | -               |
| `SSH_KEY_PATH`    | SSH key path        | `~/.ssh/id_rsa` |

## @cortex Tool Commands

Inside the interactive terminal, agents can use these tools:

| Tool                          | Description                  |
| ----------------------------- | ---------------------------- |
| `@cortex scan`                | Run full malware scan        |
| `@cortex backup`              | Create backup before cleanup |
| `@cortex list-files <path>`   | List files in path           |
| `@cortex read-file <path>`    | Read file contents           |
| `@cortex analyze-file <path>` | Analyze suspicious file      |
| `@cortex run-clean-sweep`     | Execute Clean Sweep CLI      |
| `@cortex status`              | Show current session status  |
| `@cortex connect <target>`    | Connect to site              |

## Exit Codes

| Code | Description         |
| ---- | ------------------- |
| 0    | Success             |
| 1    | General error       |
| 2    | Connection error    |
| 3    | Scan failed         |
| 4    | Cleanup failed      |
| 5    | Verification failed |
| 6    | Configuration error |
