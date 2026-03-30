# CleanSweep Cortex CLI Reference

Command-line interface tools and commands for running scans, managing sessions, and controlling the remediation engine.

## Running the CLI

```bash
# From the opencode package
cd packages/opencode
bun run dev

# Or use the built binary
./bin/opencode
```

## Global Commands

### Help

```bash
opencode --help
```

Displays all available commands and options.

### Version

```bash
opencode --version
```

Shows the current CleanSweep Cortex version.

## Sweep Session Commands

### Start New Session

```bash
opencode session new --target <target>
```

Creates a new sweep session for the specified target.

**Options**:

- `--target <path|url>` - Local path or remote URL
- `--name <name>` - Optional session name

**Example**:

```bash
opencode session new --target /home/user/wordpress
opencode session new --target https://example.com --name "production-scan"
```

### List Sessions

```bash
opencode session list
```

Shows all sweep sessions with their status.

### Resume Session

```bash
opencode session resume <session-id>
```

Resumes a previous sweep session.

### Delete Session

```bash
opencode session delete <session-id>
```

Deletes a sweep session and its history.

## Scan Commands

### Full Scan

```bash
opencode scan --target <target>
```

Runs a complete malware scan.

**Options**:

- `--target <path>` - Target WordPress installation
- `--mode <mode>` - Scan mode: `quick`, `full`, `deep`
- `--dry-run` - Run without making changes (default)

**Example**:

```bash
opencode scan --target ./test-lab --mode full
opencode scan --target /var/www/html --mode deep --dry-run
```

### Quick Scan

```bash
opencode scan quick --target <target>
```

Runs a targeted quick scan for common malware locations.

### Verify Scan

```bash
opencode scan verify --target <target>
```

Post-cleanup verification scan.

## Remediation Commands

### Run Clean Sweep

```bash
opencode clean --plan <plan-file>
```

Executes a remediation plan using Clean Sweep CLI.

**Options**:

- `--plan <file>` - Path to remediation plan JSON
- `--dry-run` - Preview actions without executing
- `--force` - Skip confirmation prompts

### Dry Run

```bash
opencode clean --dry-run
```

Preview all cleanup actions without executing them.

## Connection Commands

### Connect to Site

```bash
opencode connect <connection-type>
```

Establishes connection to a WordPress site.

**Connection Types**:

- `local <path>` - Local WordPress installation
- `ssh <host>` - Remote site via SSH

**Example**:

```bash
opencode connect local ./test-lab
opencode connect ssh user@pixeljunkyard.store
```

### Disconnect

```bash
opencode disconnect
```

Closes the current site connection.

### Connection Status

```bash
opencode status
```

Shows current connection status and target info.

## Agent Commands

### List Agents

```bash
opencode agents list
```

Displays all available agents and their status.

### Invoke Agent

```bash
opencode agent invoke <agent-name>
```

Manually invokes a specific agent.

**Agent Names**:

- `vanguard`, `tactician`, `purger`, `sentinel`
- Sub-agents: `filephantom`, `dbghost`, `userspecter`, `cronwraith`, etc.

### Agent Status

```bash
opencode agent status <agent-name>
```

Shows detailed status of a specific agent.

## File Browser Commands

### List Files

```bash
opencode files list <path>
```

Lists files in the specified directory.

**Options**:

- `--path <path>` - Directory path
- `--filter <pattern>` - File filter (e.g., `*.php`)
- `--recursive` - Include subdirectories

### Read File

```bash
opencode files read <path>
```

Reads file contents with syntax highlighting.

### Analyze File

```bash
opencode files analyze <path>
```

Runs deep analysis on a suspicious file.

## Backup Commands

### Create Backup

```bash
opencode backup create --target <target>
```

Creates a backup before cleanup operations.

### List Backups

```bash
opencode backup list --target <target>
```

Shows available backups for the target.

### Restore Backup

```bash
opencode backup restore <backup-id>
```

Restores a previous backup.

## Report Commands

### Generate Report

```bash
opencode report generate <session-id>
```

Generates a sweep session report.

**Options**:

- `--format <format>` - Output format: `text`, `json`, `html`
- `--output <file>` - Output file path

**Example**:

```bash
opencode report generate abc123 --format html --output report.html
```

### Export Report

```bash
opencode report export <session-id> --format <format>
```

Exports the complete session report.

## Configuration Commands

### Show Config

```bash
opencode config show
```

Displays current configuration.

### Set Config

```bash
opencode config set <key> <value>
```

Sets a configuration value.

**Example**:

```bash
opencode config set default-target ./test-lab
opencode config set scan-mode deep
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
