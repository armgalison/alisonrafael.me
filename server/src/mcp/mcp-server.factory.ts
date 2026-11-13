import { Injectable, NotFoundException } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod/v4';
import { ChatService } from '../chat/chat.service.js';
import { PAGE_VIEW_RETENTION_DAYS } from '../page-views/page-views.constants.js';
import { PageViewsService } from '../page-views/page-views.service.js';

const CHAT_CONVERSATIONS_PAGE_SIZE = 25;

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

function json(data: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function notFound(message: string): CallToolResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

// Builds the Admin MCP's server: four read-only tools over the Access Log
// and Chat Conversations, mapped 1:1 onto the services the Admin Panel uses.
// A fresh instance per request — the transport is stateless (ADR 0021).
@Injectable()
export class McpServerFactory {
  constructor(
    private readonly pageViews: PageViewsService,
    private readonly chat: ChatService,
  ) {}

  create(): McpServer {
    const server = new McpServer(
      { name: 'alisonrafael-admin', title: 'alisonrafael.me Admin MCP', version: '1.0.0' },
      {
        instructions:
          'Read-only access to alisonrafael.me: the Access Log (Page Views of the resume and Blog from the ' +
          `last ${PAGE_VIEW_RETENTION_DAYS} days, with full Visitor IPs and their country/network) and the ` +
          'Chat Conversations Visitors had with the resume\'s assistant. To check whether a company visited, ' +
          'filter by network (the IP\'s organization). Times are UTC.',
      },
    );

    server.registerTool(
      'get_access_log_summary',
      {
        title: 'Access Log summary',
        description:
          'Totals, Page Views per day, top pages, top external referrers and top networks for the last 7 or 30 days.',
        inputSchema: { days: z.union([z.literal(7), z.literal(30)]).default(7) },
        annotations: READ_ONLY,
      },
      async ({ days }) => json(await this.pageViews.summary(days)),
    );

    server.registerTool(
      'list_page_views',
      {
        title: 'List Page Views',
        description:
          'Individual Page Views, newest first, with time, host, path, referrer, user agent, IP, country and network. ' +
          'Filters combine. Never de-duplicated: a refresh is another Page View.',
        inputSchema: {
          days: z.number().int().min(1).max(PAGE_VIEW_RETENTION_DAYS).default(7).describe('Look back this many days.'),
          host: z.string().max(255).optional().describe('Exact host, e.g. alisonrafael.me or blog.alisonrafael.me.'),
          path: z.string().max(512).optional().describe('Path prefix, e.g. / or /my-post.'),
          ip: z.string().max(45).optional().describe('Exact Visitor IP.'),
          network: z
            .string()
            .max(255)
            .optional()
            .describe('Case-insensitive substring of the IP\'s network/organization, e.g. "google".'),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(200).default(50),
        },
        annotations: READ_ONLY,
      },
      async (args) => json(await this.pageViews.list(args)),
    );

    server.registerTool(
      'list_chat_conversations',
      {
        title: 'List Chat Conversations',
        description:
          'Chat Conversations (chat sessions with at least one message), most recent activity first: id, first and ' +
          `last message time, message count, a preview of the first question, and the Visitor's IP, country and ` +
          `network. ${CHAT_CONVERSATIONS_PAGE_SIZE} per page. Use get_chat_conversation for the full transcript.`,
        inputSchema: {
          days: z.number().int().min(1).max(3650).optional().describe('Only conversations with a message in the last N days.'),
          network: z.string().max(255).optional().describe('Case-insensitive substring of the Visitor\'s network.'),
          page: z.number().int().min(1).default(1),
        },
        annotations: READ_ONLY,
      },
      async ({ days, network, page }) => {
        const { items, total } = await this.chat.listSessionsForAdmin(page, CHAT_CONVERSATIONS_PAGE_SIZE, {
          days,
          network,
        });
        return json({ items, total, page, pageSize: CHAT_CONVERSATIONS_PAGE_SIZE });
      },
    );

    server.registerTool(
      'get_chat_conversation',
      {
        title: 'Get a Chat Conversation',
        description: 'One Chat Conversation\'s full transcript, with the Visitor\'s IP, user agent, country and network.',
        inputSchema: { id: z.uuid().describe('The id from list_chat_conversations.') },
        annotations: READ_ONLY,
      },
      async ({ id }) => {
        try {
          const conversation = await this.chat.getSessionWithMessages(id);
          // An empty Chat Session is not a Chat Conversation.
          if (conversation.messages.length === 0) return notFound('Conversation not found.');
          return json(conversation);
        } catch (err) {
          if (err instanceof NotFoundException) return notFound('Conversation not found.');
          throw err;
        }
      },
    );

    return server;
  }
}
