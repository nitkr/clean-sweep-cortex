import { Tool } from "./tool"
import z from "zod"
import { Session } from "../session"
import { PartID } from "../session/schema"
import { MessageV2 } from "../session/message-v2"
import { Config } from "../config/config"

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

      const action = params.action === "broadcast" ? "broadcast" : `message to ${params.recipient}`
      return {
        title: `Team ${params.action}`,
        metadata: {},
        output: `Message ${action}: ${params.content}`,
      }
    },
  }
})
