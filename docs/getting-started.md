# Getting Started with CleanSweep Cortex

This guide walks you through setting up CleanSweep Cortex and running your first malware scan.

## Prerequisites

- **Bun** v1.0 or later
- **Git**
- **Node.js** v18+ (for some dependencies)
- **WordPress installation** (local test-lab/ or remote site)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/nitkr/clean-sweep-cortex.git
cd clean-sweep-cortex
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Build the Project

```bash
bun run build
```

## Configuration

### Environment Setup

Create a `.env` file in the project root with your configuration:

```env
# Local test lab path (default for development)
TEST_LAB_PATH=/home/venturer/myprojects/cleansweep-cortex/test-lab

# Remote site (optional - for production scanning)
REMOTE_SITE_URL=https://pixeljunkyard.store/my-proj-two/

# SSH configuration for remote sites (if needed)
SSH_HOST=your-server.com
SSH_USER=your-user
SSH_KEY_PATH=~/.ssh/id_rsa
```

### Theme Configuration

The application uses a custom Cortex theme with the following color palette:

| Color  | Hex       | Purpose                  |
| ------ | --------- | ------------------------ |
| Cyan   | `#00d9ff` | Primary - Security/Trust |
| Purple | `#9d7cd8` | Secondary - AI/Cortex    |
| Green  | `#7fd88f` | Accent - Clean/Safe      |

Theme files are located at:

```
packages/opencode/src/cli/cmd/tui/context/theme/cortex.json
```

## Running the Application

### Development Mode

```bash
cd packages/opencode
bun run dev
```

### Production Build

```bash
bun run build
```

## Running Your First Scan

### Local Test Lab Scan

1. Start the application:

   ```bash
   bun run dev
   ```

2. The system automatically connects to the local test-lab WordPress installation.

3. Initiate a sweep session by typing:

   ```
   @cortex scan
   ```

4. The agents will:
   - **Vanguard** agents investigate and discover malware
   - **Tactician** analyzes and creates a remediation plan
   - **Purger** executes safe removal (dry-run by default)
   - **Sentinel** verifies cleanup and generates reports

### Remote Site Scan

1. Configure SSH access to your remote WordPress site in the `.env` file.

2. Connect to the remote site:

   ```
   @cortex connect remote
   ```

3. Run the scan:
   ```
   @cortex scan
   ```

## Available Cortex Tools

| Tool                      | Description                  |
| ------------------------- | ---------------------------- |
| `@cortex scan`            | Run full malware scan        |
| `@cortex backup`          | Create backup before cleanup |
| `@cortex list-files`      | List WordPress files         |
| `@cortex read-file`       | Read file contents           |
| `@cortex analyze-file`    | Analyze suspicious file      |
| `@cortex run-clean-sweep` | Execute Clean Sweep CLI      |
| `@cortex status`          | Show current session status  |

## Sweep Session Workflow

1. **Start Session**: Create a new sweep session for the target site
2. **Discovery**: Vanguard agents scan for suspicious files, DB entries, users, and cron jobs
3. **Analysis**: Tactician assesses risk and creates remediation plan
4. **Confirmation**: User reviews and confirms the plan
5. **Execution**: Purger agents execute cleanup (safe/dry-run mode first)
6. **Verification**: Sentinel agents verify cleanup success
7. **Report**: Generate summary report of all actions taken

## Default Behavior

- Agents start in **safe/dry-run mode** unless explicitly confirmed for destructive actions
- All actions are logged with explanations
- Human confirmation required for items <95% confidence
- False positives are ruled out through multi-stage verification

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
bun run clean
bun run build
```

### TypeCheck Errors

```bash
cd packages/opencode
bun run typecheck
```

### Connection Issues

For remote sites, verify SSH configuration:

```bash
ssh -i ~/.ssh/id_rsa user@server.com
```

## Next Steps

- Read the [Architecture](./architecture.md) to understand the system design
- Explore the [Agents](./agents.md) documentation for detailed agent capabilities
- Check the [CLI Reference](./cli.md) for command-line options
