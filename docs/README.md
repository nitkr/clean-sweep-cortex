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

CleanSweep Cortex is built on a hierarchical multi-agent system designed specifically for WordPress malware remediation:

1. **Vanguard** - Investigation & Discovery
2. **Tactician** - Analysis & Strategic Planning
3. **Purger** - Safe Execution & Remediation
4. **Sentinel** - Verification, Hardening & Reporting

Each main agent contains 4 specialized sub-agents, creating a 4x4 hierarchical structure that ensures thorough coverage of all malware detection and removal scenarios.

## Key Concepts

### Sweep Sessions

Each cleanup operation is organized as a **Sweep Session**, maintaining its own history, agent states, and results for complete auditability.

### RemediationBackend Adapter

The system uses an abstract interface that allows different remediation tools to be plugged in. V1 uses the CleanSweep CLI adapter, but future versions can support SSH connections, REST APIs, or other tools.

### False Positive Reduction

The system guarantees accurate ruling-out of false positives through multi-stage verification, evidence-based reasoning, and risk scoring. Only items with >85% confidence proceed to Purger, and items <95% require human confirmation.

## Getting Help

For issues or questions, please refer to:

- [Getting Started](./getting-started.md) for setup problems
- [Architecture](./architecture.md) for design questions
- [Agents](./agents.md) for capability questions
