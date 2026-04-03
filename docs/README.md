# CleanSweep Cortex Documentation

<p align="center">
  <img src="https://img.shields.io/badge/status-beta-orange" alt="Status">
</p>

Welcome to the CleanSweep Cortex documentation. This section provides detailed guides and references for using the AI-powered malware agent system.

## Documentation Index

### Getting Started

- **[Getting Started](./getting-started.md)** - Complete setup guide including prerequisites, installation, configuration, and running your first malware scan.

### Architecture

- **[Architecture](./architecture.md)** - System architecture overview, including the modular `RemediationBackend` adapter layer, data flow, and component interactions.

### Agents

- **[Agents](./agents.md)** - Detailed documentation of the 4 main agents and their 16 sub-agents, including responsibilities and capabilities.

### CLI Reference

- **[CLI Reference](./cli.md)** - Command-line interface tools and commands for running scans, managing sessions, and controlling the remediation engine.

## Overview

CleanSweep Cortex is built on a collaborative multi-agent system designed specifically for WordPress malware remediation:

1. **Vanguard** - Investigation & Discovery
2. **Tactician** - Analysis & Strategic Planning
3. **Purger** - Safe Execution & Remediation
4. **Sentinel** - Verification, Hardening & Reporting

The system uses a flat collaborative model (Grok 4.2 style) with Cortex as lead orchestrator and Cortex Critic as always-on reviewer. The team consists of 19 specialized sub-agents including 3 new collaborative agents: StealthPhantom (stealth-vector hunter), ForensicOracle (impact analyst), and LogOracle (infection vector tracer).

## Key Concepts

### Sweep Sessions

Each cleanup operation is organized as a **Sweep Session**, maintaining its own history, agent states, and results for complete auditability.

### RemediationBackend Adapter

The system uses an abstract interface that allows different remediation tools to be plugged in. V1 uses the CleanSweep CLI adapter, but future versions can support SSH connections, REST APIs, or other tools.

### False Positive Reduction

The system guarantees accurate ruling-out of false positives through multi-stage verification, evidence-based reasoning, and risk scoring. Only items with >85% confidence proceed to Purger, and items <95% require human confirmation. Cortex Critic provides always-on review throughout the process.

### Collaborative Agent Team

The system employs team broadcast and team_message primitives for flat collaboration. Post-cleanup re-scan triggers team-wide verification. Team messages display in the TUI Thinking section.

## Getting Help

For issues or questions, please refer to:

- [Getting Started](./getting-started.md) for setup problems
- [Architecture](./architecture.md) for design questions
- [Agents](./agents.md) for capability questions
