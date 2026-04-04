import { tool } from "@opencode-ai/plugin"
import { connectionManager, type SSHConnectionConfig } from "../connection-manager"

export const CortexConnectTool = tool({
  description: "Connect to a saved SSH connection. Establishes an SSH connection to a previously saved server.",
  args: {
    name: tool.schema.string().describe("Name of the saved connection to connect to"),
  },
  async execute(args, ctx) {
    const result = await connectionManager.connect(args.name)
    if (result.success) {
      return `Connected to "${args.name}" successfully.`
    }
    return `Failed to connect: ${result.error}`
  },
})

export const CortexDisconnectTool = tool({
  description: "Disconnect from the currently active SSH connection.",
  args: {},
  async execute(args, ctx) {
    if (!connectionManager.isConnected()) {
      return "No active connection to disconnect."
    }
    const active = connectionManager.getActiveConnection()
    await connectionManager.disconnect()
    return `Disconnected from "${active?.name ?? "unknown"}".`
  },
})

export const CortexConnectionsTool = tool({
  description: "List all saved SSH connections.",
  args: {},
  async execute(args, ctx) {
    const connections = await connectionManager.listConnections()
    if (connections.length === 0) {
      return "No saved connections. Use @cortex add-connection to save one."
    }

    const activeName = connectionManager.getActiveConnection()?.name ?? null
    const lines = connections.map((c) => {
      const marker = c.name === activeName ? " (active)" : ""
      return `• ${c.name}${marker}\n  ${c.username}@${c.host}:${c.port}`
    })

    return `Saved connections:\n${lines.join("\n\n")}`
  },
})

export const CortexAddConnectionTool = tool({
  description: "Add a new SSH connection to the saved connections list.",
  args: {
    name: tool.schema.string().describe("Unique name for this connection"),
    host: tool.schema.string().describe("SSH server hostname or IP"),
    port: tool.schema.number().optional().default(22).describe("SSH port (default: 22)"),
    username: tool.schema.string().describe("SSH username"),
    password: tool.schema.string().optional().describe("SSH password (leave empty if using private key)"),
    privateKeyPath: tool.schema.string().optional().describe("Path to private key file"),
    defaultSitePath: tool.schema.string().optional().describe("Default WordPress site path on this server"),
  },
  async execute(args, ctx) {
    if (!args.password && !args.privateKeyPath) {
      return "Error: Either password or privateKeyPath must be provided."
    }

    const config: SSHConnectionConfig = {
      name: args.name,
      host: args.host,
      port: args.port,
      username: args.username,
      password: args.password,
      privateKeyPath: args.privateKeyPath,
      defaultSitePath: args.defaultSitePath,
    }

    await connectionManager.addConnection(config)
    return `Connection "${args.name}" saved successfully.`
  },
})

export const CortexRemoveConnectionTool = tool({
  description: "Remove a saved SSH connection.",
  args: {
    name: tool.schema.string().describe("Name of the connection to remove"),
  },
  async execute(args, ctx) {
    const existing = connectionManager.getConnection(args.name)
    if (!existing) {
      return `Connection "${args.name}" not found.`
    }

    await connectionManager.removeConnection(args.name)
    return `Connection "${args.name}" removed.`
  },
})

export const CortexTestConnectionTool = tool({
  description: "Test an SSH connection without saving it.",
  args: {
    name: tool.schema.string().describe("Name of the saved connection to test"),
  },
  async execute(args, ctx) {
    const result = await connectionManager.testConnection(args.name)
    if (result.success) {
      return `Connection test to "${args.name}" successful!`
    }
    return `Connection test failed: ${result.error}`
  },
})
