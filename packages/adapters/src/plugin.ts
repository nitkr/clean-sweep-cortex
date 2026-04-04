import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import {
  CortexListFilesTool,
  CortexReadFileTool,
  CortexAnalyzeFileTool,
  CortexSetSiteTool,
  CortexGetSiteTool,
  CortexScanTool,
  CortexBackupTool,
  CortexRunCleanSweepTool,
  CortexConnectTool,
  CortexDisconnectTool,
  CortexConnectionsTool,
  CortexAddConnectionTool,
  CortexRemoveConnectionTool,
  CortexTestConnectionTool,
} from "./cortex-tools/index"

export const CortexPlugin: Plugin = async () => {
  return {
    tool: {
      "list-files": tool({
        description: CortexListFilesTool.description,
        args: CortexListFilesTool.args,
        async execute(args, ctx) {
          return CortexListFilesTool.execute(args, ctx)
        },
      }),
      "read-file": tool({
        description: CortexReadFileTool.description,
        args: CortexReadFileTool.args,
        async execute(args, ctx) {
          return CortexReadFileTool.execute(args, ctx)
        },
      }),
      "analyze-file": tool({
        description: CortexAnalyzeFileTool.description,
        args: CortexAnalyzeFileTool.args,
        async execute(args, ctx) {
          return CortexAnalyzeFileTool.execute(args, ctx)
        },
      }),
      "set-site": tool({
        description: CortexSetSiteTool.description,
        args: CortexSetSiteTool.args,
        async execute(args, ctx) {
          return CortexSetSiteTool.execute(args, ctx)
        },
      }),
      "get-site": tool({
        description: CortexGetSiteTool.description,
        args: CortexGetSiteTool.args,
        async execute(args, ctx) {
          return CortexGetSiteTool.execute(args, ctx)
        },
      }),
      scan: tool({
        description: CortexScanTool.description,
        args: CortexScanTool.args,
        async execute(args, ctx) {
          return CortexScanTool.execute(args, ctx)
        },
      }),
      backup: tool({
        description: CortexBackupTool.description,
        args: CortexBackupTool.args,
        async execute(args, ctx) {
          return CortexBackupTool.execute(args, ctx)
        },
      }),
      "run-clean-sweep": tool({
        description: CortexRunCleanSweepTool.description,
        args: CortexRunCleanSweepTool.args,
        async execute(args, ctx) {
          return CortexRunCleanSweepTool.execute(args, ctx)
        },
      }),
      connect: tool({
        description: CortexConnectTool.description,
        args: CortexConnectTool.args,
        async execute(args, ctx) {
          return CortexConnectTool.execute(args, ctx)
        },
      }),
      disconnect: tool({
        description: CortexDisconnectTool.description,
        args: CortexDisconnectTool.args,
        async execute(args, ctx) {
          return CortexDisconnectTool.execute(args, ctx)
        },
      }),
      connections: tool({
        description: CortexConnectionsTool.description,
        args: CortexConnectionsTool.args,
        async execute(args, ctx) {
          return CortexConnectionsTool.execute(args, ctx)
        },
      }),
      "add-connection": tool({
        description: CortexAddConnectionTool.description,
        args: CortexAddConnectionTool.args,
        async execute(args, ctx) {
          return CortexAddConnectionTool.execute(args, ctx)
        },
      }),
      "remove-connection": tool({
        description: CortexRemoveConnectionTool.description,
        args: CortexRemoveConnectionTool.args,
        async execute(args, ctx) {
          return CortexRemoveConnectionTool.execute(args, ctx)
        },
      }),
      "test-connection": tool({
        description: CortexTestConnectionTool.description,
        args: CortexTestConnectionTool.args,
        async execute(args, ctx) {
          return CortexTestConnectionTool.execute(args, ctx)
        },
      }),
    },
  }
}

export default CortexPlugin
