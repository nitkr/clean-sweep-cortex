import { Tool } from "./tool"
import z from "zod"
import { Session } from "../session"
import { PartID, MessageID, SessionID } from "../session/schema"
import { MessageV2 } from "../session/message-v2"
import { Config } from "../config/config"
import { SyncEvent } from "@/sync"
import { Agent } from "../agent/agent"
import { SessionPrompt } from "../session/prompt"
import { defer } from "@/util/defer"

export const TeamTool = Tool.define("team", async () => {
  return {
    description:
      "Send messages to the team chatroom. Use team_broadcast to send a message to all agents, or team_message to send a private message to a specific agent.",
    parameters: z.object({
      action: z.enum(["broadcast", "message"]).describe("The team communication action to perform"),
      content: z.string().describe("The message content to send"),
      confidence: z.number().min(0).max(100).optional().describe("Confidence level 0-100"),
      recipient: z.string().optional().describe("The recipient agent name (required for team_message action)"),
    }),
    async execute(params, ctx) {
      const config = await Config.get()

      if (!config.experimental?.enable_team_chatroom) {
        return {
          title: "Team Chatroom Disabled",
          metadata: {},
          output:
            "Team chatroom is not enabled. Enable it via Settings to use team collaboration features. Note: Historical messages are not stored when disabled.",
        }
      }

      if (params.action === "message" && !params.recipient) {
        throw new Error("recipient is required for team_message action")
      }

      const partID = PartID.ascending()
      const now = Date.now()

      const teamMessage = {
        id: partID,
        agent: ctx.agent,
        content: params.content,
        confidence: params.confidence,
        timestamp: now,
        broadcast: params.action === "broadcast",
        recipient: params.action === "message" ? params.recipient : undefined,
        sessionID: ctx.sessionID,
      }

      SyncEvent.run(SyncEvent.TeamMessageAdded, { teamMessage } as any)

      const teamPart: MessageV2.TeamMessagePart = {
        id: partID,
        sessionID: ctx.sessionID,
        messageID: ctx.messageID,
        type: "team-message",
        agent: ctx.agent,
        content: params.content,
        confidence: params.confidence,
        timestamp: now,
        broadcast: params.action === "broadcast",
        recipient: params.action === "message" ? params.recipient : undefined,
      }

      await Session.updatePart(teamPart)

      const spawnSubagent = async (recipient: string) => {
        const agent = await Agent.get(recipient)
        if (!agent) return undefined
        const session = await Session.create({
          parentID: ctx.sessionID,
          title: `team message to ${recipient}`,
        })
        const messageID = MessageID.ascending()
        try {
          const result = await SessionPrompt.prompt({
            messageID,
            sessionID: session.id,
            model: agent.model,
            agent: agent.name,
            parts: [{ type: "text", text: params.content }],
          })
          const text = result.parts.findLast((x) => x.type === "text")?.text ?? ""
          return { recipient, text, sessionID: session.id }
        } catch (err) {
          const error = err instanceof Error ? err.message : "Unknown error"
          return { recipient, text: `Error: ${error}`, sessionID: session.id }
        }
      }

      let responses: { recipient: string; text: string; sessionID: SessionID }[] = []

      if (params.action === "message" && params.recipient) {
        const response = await spawnSubagent(params.recipient)
        if (response) {
          responses = [response]
          const responsePart: MessageV2.TeamMessagePart = {
            id: PartID.ascending(),
            sessionID: ctx.sessionID,
            messageID: ctx.messageID,
            type: "team-message",
            agent: response.recipient,
            content: response.text,
            confidence: undefined,
            timestamp: Date.now(),
            broadcast: false,
            recipient: ctx.agent,
          }
          await Session.updatePart(responsePart)
          SyncEvent.run(SyncEvent.TeamMessageAdded, {
            teamMessage: {
              id: PartID.ascending(),
              agent: response.recipient,
              content: response.text,
              timestamp: Date.now(),
              broadcast: false,
              recipient: ctx.agent,
              sessionID: response.sessionID,
            },
          } as any)
        }
      } else if (params.action === "broadcast") {
        const agents = await Agent.list()
        const subagents = agents.filter((a) => a.mode !== "primary")
        const results = await Promise.all(subagents.map((agent) => spawnSubagent(agent.name)))
        responses = results.flatMap((r) => (r ? [r] : []))
        for (const response of responses) {
          const responsePart: MessageV2.TeamMessagePart = {
            id: PartID.ascending(),
            sessionID: ctx.sessionID,
            messageID: ctx.messageID,
            type: "team-message",
            agent: response.recipient,
            content: response.text,
            confidence: undefined,
            timestamp: Date.now(),
            broadcast: true,
          }
          await Session.updatePart(responsePart)
          SyncEvent.run(SyncEvent.TeamMessageAdded, {
            teamMessage: {
              id: PartID.ascending(),
              agent: response.recipient,
              content: response.text,
              timestamp: Date.now(),
              broadcast: true,
              sessionID: response.sessionID,
            },
          } as any)
        }
      }

      const action = params.action === "broadcast" ? "broadcast" : `message to ${params.recipient}`
      const responseSummary =
        responses.length > 0 ? `\n\nResponses:\n${responses.map((r) => `• ${r.recipient}: ${r.text}`).join("\n")}` : ""

      return {
        title: `Team ${params.action}`,
        metadata: {},
        output: `Message ${action}: ${params.content}${responseSummary}`,
      }
    },
  }
})
