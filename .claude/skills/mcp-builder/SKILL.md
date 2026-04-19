# MCP Builder — Model Context Protocol Server Development

---

name: mcp-builder
description: Complete guide for building custom MCP (Model Context Protocol) servers. Covers protocol architecture, TypeScript server implementation, tool/resource/prompt definitions, testing, debugging, publishing, and practical examples for database queries, API wrappers, file processing, and notifications.
triggers:

- mcp
- model context protocol
- mcp server
- build mcp
- create mcp
- custom mcp
- mcp tool
- mcp resource
- mcp prompt
- mcp integration

---

## 1. MCP Protocol Overview

### 1.1 What is MCP (Model Context Protocol)

```
MCP is an open protocol that enables AI assistants (like Claude) to interact
with external systems through a standardized interface.

It defines three primitives:
  TOOLS      → Functions the AI can call (read/write operations)
  RESOURCES  → Data the AI can read (files, configs, database records)
  PROMPTS    → Pre-defined prompt templates for common workflows

ANALOGY:
  Tools     = API endpoints the AI can call
  Resources = Files/data the AI can read
  Prompts   = Shortcuts for common AI workflows
```

### 1.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOST (Claude Code)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Client 1 │  │ Client 2 │  │ Client 3 │  │ Client N │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │              │             │
└───────┼──────────────┼──────────────┼──────────────┼─────────────┘
        │              │              │              │
    ┌───▼───┐    ┌─────▼──┐    ┌─────▼──┐    ┌─────▼──┐
    │Server1│    │Server 2│    │Server 3│    │Server N│
    │(local)│    │(local) │    │(remote)│    │(remote)│
    │ stdio │    │ stdio  │    │HTTP/SSE│    │HTTP/SSE│
    └───────┘    └────────┘    └────────┘    └────────┘

HOST:     The application running the AI (e.g., Claude Code CLI)
CLIENT:   One-to-one connection manager (one per server)
SERVER:   Your MCP server (provides tools, resources, prompts)
TRANSPORT:
  - stdio: Local process (stdin/stdout). Best for CLI tools.
  - HTTP/SSE: Remote server (HTTP + Server-Sent Events). Best for web services.
```

### 1.3 Message Format (JSON-RPC 2.0)

```json
// Request (client → server)
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "query_database",
    "arguments": {
      "sql": "SELECT * FROM users LIMIT 10"
    }
  }
}

// Response (server → client)
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 10 users: ..."
      }
    ]
  }
}

// Notification (no id — no response expected)
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "uri": "db://users/123"
  }
}
```

### 1.4 Server Lifecycle

```
1. INITIALIZE
   Client sends:  initialize (with client capabilities)
   Server returns: server capabilities (tools, resources, prompts)

2. LIST
   Client can call:
     tools/list      → Get available tools
     resources/list  → Get available resources
     prompts/list    → Get available prompts

3. USE
   Client calls:
     tools/call           → Execute a tool
     resources/read       → Read a resource
     prompts/get          → Get a prompt template
     resources/subscribe  → Subscribe to resource changes

4. SHUTDOWN
   Client sends close signal → server cleans up and exits
```

---

## 2. Server Implementation — TypeScript

### 2.1 Installation

```bash
# Core SDK
npm install @modelcontextprotocol/sdk

# For HTTP/SSE transport (if building a remote server)
npm install express

# Development
npm install -D typescript @types/node tsx
```

### 2.2 Basic Server Setup (stdio Transport)

```typescript
// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Create server instance
const server = new Server(
  {
    name: "my-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {}, // Enable tools
      resources: {}, // Enable resources
      prompts: {}, // Enable prompts
    },
  },
);

// ──────────────────────────────────────
// TOOLS
// ──────────────────────────────────────

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "hello_world",
        description: "Returns a greeting message",
        inputSchema: {
          type: "object" as const,
          properties: {
            name: {
              type: "string",
              description: "The name to greet",
            },
          },
          required: ["name"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "hello_world": {
      const userName = args?.name as string;
      return {
        content: [
          {
            type: "text" as const,
            text: `Hello, ${userName}! Welcome to MCP.`,
          },
        ],
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// ──────────────────────────────────────
// START SERVER
// ──────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server running on stdio"); // stderr for logs (stdout is for protocol)
}

main().catch(console.error);
```

### 2.3 HTTP/SSE Server Setup

```typescript
// src/http-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const app = express();
const server = new Server(
  { name: "my-mcp-http-server", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

// ... register handlers same as stdio ...

// SSE endpoint
app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

// Message endpoint (client sends requests here)
app.post("/message", async (req, res) => {
  // SSEServerTransport handles this internally
});

app.listen(3001, () => {
  console.log("MCP HTTP server on port 3001");
});
```

---

## 3. Tool Definitions

### 3.1 Tool Schema

```typescript
// Tools are defined with JSON Schema for input validation

const tool = {
  name: "create_record",
  description:
    "Creates a new record in the database. Returns the created record with its ID.",
  inputSchema: {
    type: "object" as const,
    properties: {
      table: {
        type: "string",
        description: "The database table name",
        enum: ["users", "posts", "comments"], // Restrict to valid tables
      },
      data: {
        type: "object",
        description: "The record data as key-value pairs",
        additionalProperties: true,
      },
    },
    required: ["table", "data"],
  },
};
```

### 3.2 Parameter Validation

```typescript
import { z } from "zod";

// Define Zod schemas for validation
const QuerySchema = z.object({
  sql: z.string().min(1).max(10000),
  params: z
    .array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "query_database") {
    // Validate inputs
    const parsed = QuerySchema.safeParse(args);
    if (!parsed.success) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Validation error: ${parsed.error.message}`,
          },
        ],
        isError: true,
      };
    }

    const { sql, params, limit } = parsed.data;

    // SECURITY: Prevent destructive queries
    const forbidden = ["DROP", "DELETE", "TRUNCATE", "ALTER", "UPDATE"];
    const upperSql = sql.toUpperCase().trim();
    if (forbidden.some((word) => upperSql.startsWith(word))) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Forbidden: ${forbidden.join(", ")} queries are not allowed.`,
          },
        ],
        isError: true,
      };
    }

    // Execute query...
    const results = await db.query(sql, params);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(results.rows.slice(0, limit), null, 2),
        },
      ],
    };
  }
});
```

### 3.3 Return Types

```typescript
// TEXT content
return {
  content: [
    {
      type: "text",
      text: "Operation completed successfully.",
    },
  ],
};

// IMAGE content (base64)
return {
  content: [
    {
      type: "image",
      data: base64EncodedImage, // base64 string
      mimeType: "image/png",
    },
  ],
};

// MULTIPLE content items
return {
  content: [
    { type: "text", text: "Here is the chart:" },
    { type: "image", data: chartBase64, mimeType: "image/png" },
    { type: "text", text: "Generated from 1000 data points." },
  ],
};

// EMBEDDED RESOURCE (reference to a resource URI)
return {
  content: [
    {
      type: "resource",
      resource: {
        uri: "db://users/123",
        mimeType: "application/json",
        text: JSON.stringify(userData),
      },
    },
  ],
};

// ERROR response
return {
  content: [
    {
      type: "text",
      text: "Error: Database connection failed.",
    },
  ],
  isError: true,
};
```

### 3.4 Error Handling Patterns

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "query_database":
        return await handleQueryDatabase(args);
      case "send_notification":
        return await handleSendNotification(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    // Log to stderr (not stdout — stdout is for protocol messages)
    console.error(`Tool ${name} error:`, error);

    if (error instanceof McpError) {
      throw error; // Re-throw MCP errors
    }

    // Wrap unexpected errors
    return {
      content: [
        {
          type: "text" as const,
          text: `Error executing ${name}: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
});
```

---

## 4. Resource Patterns

### 4.1 Static Resources

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "config://app/settings",
        name: "Application Settings",
        description: "Current application configuration",
        mimeType: "application/json",
      },
      {
        uri: "file://docs/api-reference",
        name: "API Reference",
        description: "API documentation for all endpoints",
        mimeType: "text/markdown",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case "config://app/settings": {
      const settings = await loadSettings();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(settings, null, 2),
          },
        ],
      };
    }
    case "file://docs/api-reference": {
      const docs = await fs.readFile("./docs/api-reference.md", "utf-8");
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: docs,
          },
        ],
      };
    }
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});
```

### 4.2 Dynamic Resources

```typescript
// Resources from database queries or API calls

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  // Dynamically list available resources
  const tables = await db.query(
    "SELECT table_name FROM information_schema.tables",
  );

  return {
    resources: tables.rows.map((table) => ({
      uri: `db://tables/${table.table_name}/schema`,
      name: `${table.table_name} schema`,
      description: `Database schema for ${table.table_name} table`,
      mimeType: "application/json",
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const match = uri.match(/^db:\/\/tables\/(\w+)\/schema$/);

  if (match) {
    const tableName = match[1];
    const columns = await db.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = $1`,
      [tableName],
    );

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(columns.rows, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});
```

### 4.3 Resource Templates with URI Patterns

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [],
    resourceTemplates: [
      {
        uriTemplate: "db://users/{userId}",
        name: "User Profile",
        description: "Get a user profile by ID",
        mimeType: "application/json",
      },
      {
        uriTemplate: "api://endpoints/{path}",
        name: "API Response",
        description: "Fetch data from an API endpoint",
        mimeType: "application/json",
      },
    ],
  };
});

// Handle reads for templated URIs
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  // Match user profile template
  const userMatch = uri.match(/^db:\/\/users\/(\d+)$/);
  if (userMatch) {
    const userId = userMatch[1];
    const user = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(user.rows[0], null, 2),
        },
      ],
    };
  }

  throw new Error(`Cannot read resource: ${uri}`);
});
```

### 4.4 Subscriptions and Notifications

```typescript
// Server can notify client when a resource changes

const server = new Server(
  { name: "my-server", version: "1.0.0" },
  {
    capabilities: {
      resources: {
        subscribe: true, // Enable subscriptions
      },
    },
  },
);

// Track subscriptions
const subscriptions = new Set<string>();

server.setRequestHandler(SubscribeRequestSchema, async (request) => {
  subscriptions.add(request.params.uri);
  return {};
});

server.setRequestHandler(UnsubscribeRequestSchema, async (request) => {
  subscriptions.delete(request.params.uri);
  return {};
});

// When data changes, notify subscribers
async function onDataChange(uri: string) {
  if (subscriptions.has(uri)) {
    await server.notification({
      method: "notifications/resources/updated",
      params: { uri },
    });
  }
}
```

---

## 5. Prompt Patterns

### 5.1 Prompt Templates

```typescript
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "analyze_data",
        description: "Analyze a dataset and provide insights",
        arguments: [
          {
            name: "dataset",
            description: "Name of the dataset to analyze",
            required: true,
          },
          {
            name: "focus",
            description: "What aspect to focus on (trends, anomalies, summary)",
            required: false,
          },
        ],
      },
      {
        name: "generate_report",
        description: "Generate a formatted report from data",
        arguments: [
          {
            name: "type",
            description: "Report type: daily, weekly, monthly",
            required: true,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "analyze_data") {
    const dataset = args?.dataset as string;
    const focus = (args?.focus as string) || "summary";

    // Fetch actual data to include in the prompt
    const data = await fetchDataset(dataset);

    return {
      description: `Analyze the ${dataset} dataset`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please analyze the following ${dataset} dataset with a focus on ${focus}.

Dataset (${data.length} records):
${JSON.stringify(data.slice(0, 50), null, 2)}
${data.length > 50 ? `\n... and ${data.length - 50} more records` : ""}

Please provide:
1. Key findings
2. Notable patterns or anomalies
3. Recommendations based on the data`,
          },
        },
      ],
    };
  }

  if (name === "generate_report") {
    const type = args?.type as string;
    return {
      description: `Generate a ${type} report`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Generate a ${type} report. Include:
- Executive summary
- Key metrics and KPIs
- Trends and changes
- Action items
- Data visualizations (describe in text)

Format the report in Markdown.`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});
```

---

## 6. Complete TypeScript Server Template

```typescript
#!/usr/bin/env node

// src/index.ts — Full MCP Server Template
// This is a complete, production-ready MCP server skeleton.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

// ──────────────────────────────────────
// CONFIGURATION
// ──────────────────────────────────────

const SERVER_NAME = "trueomni-mcp";
const SERVER_VERSION = "1.0.0";

// ──────────────────────────────────────
// SERVER SETUP
// ──────────────────────────────────────

const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  },
);

// ──────────────────────────────────────
// TOOLS
// ──────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_status",
      description: "Get the current status of the application",
      inputSchema: {
        type: "object" as const,
        properties: {
          component: {
            type: "string",
            description: "Component to check: api, database, cache",
            enum: ["api", "database", "cache", "all"],
          },
        },
        required: ["component"],
      },
    },
    {
      name: "search_content",
      description: "Search content across the CMS",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: "Search query string",
          },
          collection: {
            type: "string",
            description: "CMS collection to search in",
            enum: ["pages", "posts", "case-studies"],
          },
          limit: {
            type: "number",
            description: "Maximum results to return (default: 10)",
          },
        },
        required: ["query"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_status": {
        const component = (args?.component as string) || "all";
        // Implementation here
        const status = {
          api: "healthy",
          database: "healthy",
          cache: "healthy",
          uptime: "99.9%",
          lastChecked: new Date().toISOString(),
        };
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                component === "all"
                  ? status
                  : { [component]: status[component as keyof typeof status] },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "search_content": {
        const query = args?.query as string;
        const collection = args?.collection as string | undefined;
        const limit = (args?.limit as number) || 10;

        // Implementation: search your CMS/database
        const results = await searchCMS(query, collection, limit);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error in tool ${name}:`, error);
    if (error instanceof McpError) throw error;
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
});

// ──────────────────────────────────────
// RESOURCES
// ──────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "config://trueomni/env",
      name: "Environment Config",
      description: "Current environment configuration (sanitized)",
      mimeType: "application/json",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "config://trueomni/env") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              NODE_ENV: process.env.NODE_ENV || "development",
              SITE_URL:
                process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
              CMS_ENABLED: !!process.env.DATABASE_URI,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
});

// ──────────────────────────────────────
// PROMPTS
// ──────────────────────────────────────

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "create_page",
      description: "Guided workflow to create a new CMS page with blocks",
      arguments: [
        { name: "pageName", description: "Name of the page", required: true },
        {
          name: "template",
          description: "Template: landing, blog, product",
          required: false,
        },
      ],
    },
  ],
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "create_page") {
    const pageName = args?.pageName as string;
    const template = (args?.template as string) || "landing";

    return {
      description: `Create a new ${template} page: ${pageName}`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Create a new ${template} page called "${pageName}".

Steps:
1. Create the Payload CMS page entry with appropriate blocks
2. Create the Next.js page component at the correct route
3. Configure SEO metadata
4. Add to navigation if appropriate

Template "${template}" typically includes these blocks:
${template === "landing" ? "- Hero, Features, Testimonials, CTA, FAQ" : ""}
${template === "blog" ? "- RichText (main content), Author, Related Posts" : ""}
${template === "product" ? "- Hero, Features, Pricing, Comparison, CTA" : ""}`,
          },
        },
      ],
    };
  }

  throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
});

// ──────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────

async function searchCMS(
  query: string,
  collection?: string,
  limit: number = 10,
): Promise<unknown[]> {
  // Replace with actual CMS/database search
  console.error(
    `Searching CMS: query="${query}", collection="${collection}", limit=${limit}`,
  );
  return [
    {
      id: "1",
      title: `Result for "${query}"`,
      collection: collection || "pages",
    },
  ];
}

// ──────────────────────────────────────
// GRACEFUL SHUTDOWN
// ──────────────────────────────────────

process.on("SIGINT", async () => {
  console.error("Shutting down MCP server...");
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("Shutting down MCP server...");
  await server.close();
  process.exit(0);
});

// ──────────────────────────────────────
// START
// ──────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

---

## 7. Testing MCPs

### 7.1 MCP Inspector Tool

```bash
# Install and run the MCP Inspector (official testing tool)
npx @modelcontextprotocol/inspector

# Or specify your server directly:
npx @modelcontextprotocol/inspector node dist/index.js

# The Inspector provides a web UI to:
# - List tools, resources, prompts
# - Call tools with custom arguments
# - Read resources
# - See raw JSON-RPC messages
# - Debug connection issues
```

### 7.2 Manual Testing with stdio

```bash
# You can test by piping JSON-RPC messages to your server

# 1. Build your server
npm run build

# 2. Send an initialize request
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node dist/index.js

# 3. List tools
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node dist/index.js

# 4. Call a tool
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"hello_world","arguments":{"name":"Test"}}}' | node dist/index.js
```

### 7.3 Unit Testing Patterns

```typescript
// src/__tests__/server.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../server.js"; // Export your server creation

describe("MCP Server", () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const server = createServer();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);

    client = new Client(
      { name: "test-client", version: "1.0" },
      { capabilities: {} },
    );
    await client.connect(clientTransport);

    cleanup = async () => {
      await client.close();
      await server.close();
    };
  });

  afterAll(async () => {
    await cleanup();
  });

  it("lists tools", async () => {
    const result = await client.listTools();
    expect(result.tools).toHaveLength(2);
    expect(result.tools[0].name).toBe("get_status");
  });

  it("calls get_status tool", async () => {
    const result = await client.callTool({
      name: "get_status",
      arguments: { component: "all" },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { type: string; text: string }).text;
    const status = JSON.parse(text);
    expect(status.api).toBe("healthy");
  });

  it("returns error for unknown tool", async () => {
    await expect(
      client.callTool({ name: "nonexistent", arguments: {} }),
    ).rejects.toThrow();
  });

  it("lists resources", async () => {
    const result = await client.listResources();
    expect(result.resources.length).toBeGreaterThan(0);
  });

  it("reads a resource", async () => {
    const result = await client.readResource({
      uri: "config://trueomni/env",
    });
    expect(result.contents[0].mimeType).toBe("application/json");
  });
});
```

### 7.4 Integration Testing

```typescript
// Test the full flow: initialize → list → call → verify

import { spawn } from "child_process";

async function integrationTest() {
  const serverProcess = spawn("node", ["dist/index.js"], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Send initialize
  const initRequest =
    JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test", version: "1.0" },
      },
    }) + "\n";

  serverProcess.stdin.write(initRequest);

  // Read response
  const response = await new Promise<string>((resolve) => {
    serverProcess.stdout.once("data", (data) => resolve(data.toString()));
  });

  console.log("Initialize response:", response);

  // Cleanup
  serverProcess.kill();
}
```

---

## 8. Debugging

### 8.1 Logging Strategies

```typescript
// CRITICAL: Always log to stderr, never stdout
// stdout is reserved for JSON-RPC protocol messages

// Bad:
console.log("Debug info"); // ← breaks protocol!

// Good:
console.error("Debug info"); // ← goes to stderr, safe

// Structured logging
function log(
  level: "debug" | "info" | "warn" | "error",
  message: string,
  data?: unknown,
) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data ? { data } : {}),
  };
  console.error(JSON.stringify(entry));
}

// Usage:
log("info", "Tool called", { tool: "query_database", args: sanitizedArgs });
log("error", "Database connection failed", { error: err.message });
```

### 8.2 Common Errors and Fixes

```
ERROR: "Server disconnected unexpectedly"
CAUSE: Server wrote to stdout (console.log) breaking the JSON-RPC stream
FIX:   Replace all console.log() with console.error()

ERROR: "Tool not found"
CAUSE: Tool name in CallTool doesn't match name in ListTools
FIX:   Ensure exact string match between list and handler

ERROR: "Invalid JSON"
CAUSE: Server output contains non-JSON text on stdout
FIX:   Only JSON-RPC messages should go to stdout

ERROR: "Timeout waiting for server"
CAUSE: Server didn't respond to initialize within timeout
FIX:   Check that server.connect() is called and transport is correct

ERROR: "Cannot find module"
CAUSE: ES modules issue — missing .js extension in imports
FIX:   Add .js to all local imports: import { x } from './utils.js'

ERROR: "Permission denied" when running npx
CAUSE: The bin field in package.json needs shebang line
FIX:   Add #!/usr/bin/env node to the top of your entry file
```

### 8.3 Connection Troubleshooting

```bash
# 1. Verify server starts without errors
node dist/index.js 2>&1 | head -5

# 2. Check Claude Code can find the server
cat ~/.claude/settings.json | grep -A 5 "my-server"

# 3. Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js

# 4. Check for port conflicts (HTTP/SSE servers)
lsof -i :3001

# 5. Verify environment variables are set
echo $MY_API_KEY  # Should not be empty
```

---

## 9. Publishing

### 9.1 npm Package Setup

```json
// package.json
{
  "name": "@trueomni/mcp-server",
  "version": "1.0.0",
  "description": "MCP server for TrueOmni CMS operations",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "trueomni-mcp": "dist/index.js"
  },
  "files": ["dist/"],
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest run",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "tsx": "^4.0.0",
    "vitest": "^2.0.0"
  },
  "engines": {
    "node": ">=18"
  },
  "keywords": ["mcp", "model-context-protocol", "claude", "ai-tools"]
}
```

### 9.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 9.3 Publishing to npm

```bash
# 1. Build
npm run build

# 2. Test locally
npx @modelcontextprotocol/inspector node dist/index.js

# 3. Publish
npm publish --access public

# 4. Users can then use it:
# In settings.json:
# "command": "npx", "args": ["-y", "@trueomni/mcp-server"]
```

---

## 10. Claude Code Integration

### 10.1 settings.json Configuration

```json
// Project-local: .claude/settings.json
// OR Global: ~/.claude/settings.json

{
  "mcpServers": {
    "trueomni-cms": {
      "command": "node",
      "args": ["/path/to/trueomni-website/mcp-servers/cms/dist/index.js"],
      "env": {
        "DATABASE_URI": "postgresql://...",
        "PAYLOAD_SECRET": "..."
      }
    },
    "trueomni-analytics": {
      "command": "npx",
      "args": ["-y", "@trueomni/mcp-analytics"],
      "env": {
        "ANALYTICS_API_KEY": "..."
      }
    },
    "trueomni-deploy": {
      "command": "node",
      "args": ["./mcp-servers/deploy/dist/index.js"],
      "env": {
        "VERCEL_TOKEN": "..."
      }
    }
  }
}
```

### 10.2 Environment Variables

```
Environment variables can be set in the MCP config:

"env": {
  "DATABASE_URI": "postgresql://user:pass@host:5432/db",
  "API_KEY": "${API_KEY}"     ← References shell environment variable
}

SECURITY RULES:
- NEVER commit actual secrets to settings.json
- Use ${ENV_VAR} syntax to reference shell environment
- Or use .env files loaded by the server itself
- Mark sensitive env vars in documentation
```

### 10.3 Project-Local vs Global MCPs

```
PROJECT-LOCAL (.claude/settings.json):
  ✅ Specific to this project
  ✅ Committed to git (if no secrets)
  ✅ Other team members get same MCPs
  ❌ Not available in other projects

GLOBAL (~/.claude/settings.json):
  ✅ Available in all projects
  ✅ Good for generic tools (GitHub, search, etc.)
  ❌ Not project-specific
  ❌ Not shared with team

RECOMMENDATION:
  - Project-specific MCPs (CMS, deploy) → project-local
  - Generic MCPs (GitHub, search, memory) → global
```

---

## 11. Practical Examples

### 11.1 Database Query MCP (PostgreSQL)

```typescript
// mcp-servers/database/src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URI,
});

const server = new Server(
  { name: "database-mcp", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } },
);

// TOOLS
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "query",
      description: "Execute a read-only SQL query against the database",
      inputSchema: {
        type: "object" as const,
        properties: {
          sql: { type: "string", description: "SQL query (SELECT only)" },
          limit: { type: "number", description: "Max rows (default 100)" },
        },
        required: ["sql"],
      },
    },
    {
      name: "list_tables",
      description: "List all tables in the database",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "describe_table",
      description: "Get column information for a table",
      inputSchema: {
        type: "object" as const,
        properties: {
          table: { type: "string", description: "Table name" },
        },
        required: ["table"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "query": {
      const sql = (args?.sql as string).trim();
      const limit = (args?.limit as number) || 100;

      // SECURITY: Only allow SELECT queries
      if (!sql.toUpperCase().startsWith("SELECT")) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: Only SELECT queries are allowed.",
            },
          ],
          isError: true,
        };
      }

      const result = await pool.query(`${sql} LIMIT $1`, [limit]);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                rowCount: result.rowCount,
                columns: result.fields.map((f) => f.name),
                rows: result.rows,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "list_tables": {
      const result = await pool.query(`
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result.rows, null, 2) },
        ],
      };
    }

    case "describe_table": {
      const table = args?.table as string;
      const result = await pool.query(
        `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `,
        [table],
      );
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result.rows, null, 2) },
        ],
      };
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }
});

// RESOURCES: expose table schemas
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  `);
  return {
    resources: tables.rows.map((t) => ({
      uri: `db://schema/${t.table_name}`,
      name: `${t.table_name} schema`,
      mimeType: "application/json",
    })),
  };
});

// Cleanup
process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

const transport = new StdioServerTransport();
server.connect(transport);
```

### 11.2 REST API Wrapper MCP

```typescript
// mcp-servers/api-wrapper/src/index.ts
// Wraps any REST API as MCP tools

const API_BASE = process.env.API_BASE_URL || "https://api.example.com";
const API_KEY = process.env.API_KEY;

const server = new Server(
  { name: "api-wrapper-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "api_get",
      description: "Make a GET request to the API",
      inputSchema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "API path (e.g., /users)" },
          params: {
            type: "object",
            description: "Query parameters",
            additionalProperties: { type: "string" },
          },
        },
        required: ["path"],
      },
    },
    {
      name: "api_post",
      description: "Make a POST request to the API",
      inputSchema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "API path" },
          body: { type: "object", description: "Request body" },
        },
        required: ["path", "body"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
  };

  switch (name) {
    case "api_get": {
      const path = args?.path as string;
      const params = args?.params as Record<string, string> | undefined;
      const url = new URL(path, API_BASE);
      if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      }

      const response = await fetch(url.toString(), { headers });
      const data = await response.json();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ status: response.status, data }, null, 2),
          },
        ],
        isError: !response.ok,
      };
    }

    case "api_post": {
      const path = args?.path as string;
      const body = args?.body;

      const response = await fetch(new URL(path, API_BASE).toString(), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await response.json();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ status: response.status, data }, null, 2),
          },
        ],
        isError: !response.ok,
      };
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
server.connect(transport);
```

### 11.3 Notification MCP (Slack/Email)

```typescript
// mcp-servers/notifications/src/index.ts

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const server = new Server(
  { name: "notifications-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "send_slack",
      description: "Send a message to a Slack channel via webhook",
      inputSchema: {
        type: "object" as const,
        properties: {
          message: {
            type: "string",
            description: "Message text (supports Markdown)",
          },
          channel: {
            type: "string",
            description: "Channel override (optional)",
          },
          urgency: {
            type: "string",
            enum: ["low", "normal", "high"],
            description: "Message urgency level",
          },
        },
        required: ["message"],
      },
    },
    {
      name: "send_email",
      description: "Send an email via Resend",
      inputSchema: {
        type: "object" as const,
        properties: {
          to: { type: "string", description: "Recipient email" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body (HTML supported)" },
        },
        required: ["to", "subject", "body"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "send_slack": {
      if (!SLACK_WEBHOOK) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: SLACK_WEBHOOK_URL not configured",
            },
          ],
          isError: true,
        };
      }

      const message = args?.message as string;
      const urgency = (args?.urgency as string) || "normal";

      const emoji = {
        low: ":information_source:",
        normal: ":bell:",
        high: ":rotating_light:",
      };

      const response = await fetch(SLACK_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${emoji[urgency as keyof typeof emoji]} ${message}`,
        }),
      });

      return {
        content: [
          {
            type: "text" as const,
            text: response.ok
              ? "Slack message sent successfully."
              : `Slack error: ${response.status}`,
          },
        ],
        isError: !response.ok,
      };
    }

    case "send_email": {
      if (!RESEND_API_KEY) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: RESEND_API_KEY not configured",
            },
          ],
          isError: true,
        };
      }

      const to = args?.to as string;
      const subject = args?.subject as string;
      const body = args?.body as string;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "TrueOmni <noreply@trueomni.com>",
          to: [to],
          subject,
          html: body,
        }),
      });

      const result = await response.json();

      return {
        content: [
          {
            type: "text" as const,
            text: response.ok
              ? `Email sent to ${to}. ID: ${result.id}`
              : `Email error: ${JSON.stringify(result)}`,
          },
        ],
        isError: !response.ok,
      };
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
server.connect(transport);
```

### 11.4 File Processing MCP

```typescript
// mcp-servers/file-processor/src/index.ts
import * as fs from "fs/promises";
import * as path from "path";

const ALLOWED_DIR = process.env.ALLOWED_DIR || process.cwd();

const server = new Server(
  { name: "file-processor-mcp", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "read_file",
      description: "Read the contents of a file",
      inputSchema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "Relative file path" },
          encoding: {
            type: "string",
            description: "Encoding (default: utf-8)",
          },
        },
        required: ["path"],
      },
    },
    {
      name: "list_directory",
      description: "List files in a directory",
      inputSchema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "Relative directory path" },
          pattern: {
            type: "string",
            description: "Glob pattern filter (e.g., *.ts)",
          },
        },
        required: ["path"],
      },
    },
    {
      name: "file_stats",
      description: "Get file metadata (size, dates, permissions)",
      inputSchema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "Relative file path" },
        },
        required: ["path"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // SECURITY: Resolve and validate path is within ALLOWED_DIR
  function safePath(relativePath: string): string {
    const resolved = path.resolve(ALLOWED_DIR, relativePath);
    if (!resolved.startsWith(path.resolve(ALLOWED_DIR))) {
      throw new Error("Path traversal attempt blocked");
    }
    return resolved;
  }

  switch (name) {
    case "read_file": {
      const filePath = safePath(args?.path as string);
      const encoding = (args?.encoding as BufferEncoding) || "utf-8";
      const content = await fs.readFile(filePath, encoding);
      return {
        content: [{ type: "text" as const, text: content }],
      };
    }

    case "list_directory": {
      const dirPath = safePath(args?.path as string);
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const listing = entries.map((e) => ({
        name: e.name,
        type: e.isDirectory() ? "directory" : "file",
      }));
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(listing, null, 2) },
        ],
      };
    }

    case "file_stats": {
      const filePath = safePath(args?.path as string);
      const stats = await fs.stat(filePath);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                size: stats.size,
                sizeHuman: `${(stats.size / 1024).toFixed(1)} KB`,
                created: stats.birthtime.toISOString(),
                modified: stats.mtime.toISOString(),
                isDirectory: stats.isDirectory(),
                permissions: stats.mode.toString(8),
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
server.connect(transport);
```

---

## 12. Best Practices

### 12.1 Security Considerations

```
INPUT VALIDATION:
  ✅ Always validate tool arguments with Zod or JSON Schema
  ✅ Sanitize SQL queries — only allow SELECT for read-only MCPs
  ✅ Validate file paths against an allowed directory (prevent path traversal)
  ✅ Rate limit API calls to prevent abuse
  ✅ Never expose raw error messages with stack traces to the client

SECRETS:
  ✅ Use environment variables for API keys and credentials
  ✅ Never hardcode secrets in the server code
  ✅ Use ${ENV_VAR} references in settings.json
  ✅ Never log secrets (even to stderr)

PERMISSIONS:
  ✅ Follow principle of least privilege
  ✅ Read-only tools should never modify data
  ✅ Destructive operations should require explicit confirmation
  ✅ Document which operations are destructive in tool descriptions
```

### 12.2 Rate Limiting

```typescript
// Simple in-memory rate limiter
class RateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private windowMs: number;

  constructor(maxCalls: number = 60, windowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  check(): boolean {
    const now = Date.now();
    this.calls = this.calls.filter((t) => now - t < this.windowMs);
    if (this.calls.length >= this.maxCalls) return false;
    this.calls.push(now);
    return true;
  }
}

const limiter = new RateLimiter(100, 60000); // 100 calls per minute

// In tool handler:
if (!limiter.check()) {
  return {
    content: [
      { type: "text", text: "Rate limit exceeded. Try again in a minute." },
    ],
    isError: true,
  };
}
```

### 12.3 Error Recovery

```typescript
// Implement retry logic for transient failures
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.error(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw new Error("Unreachable");
}

// Usage in tool handler:
const result = await withRetry(() => fetch(url));
```

### 12.4 Graceful Shutdown

```typescript
// Always clean up resources on shutdown
const cleanupHandlers: (() => Promise<void>)[] = [];

function onCleanup(handler: () => Promise<void>) {
  cleanupHandlers.push(handler);
}

async function shutdown(signal: string) {
  console.error(`Received ${signal}, shutting down...`);
  for (const handler of cleanupHandlers) {
    try {
      await handler();
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Register cleanup handlers
onCleanup(async () => {
  await pool.end(); // Close database connections
  console.error("Database pool closed");
});

onCleanup(async () => {
  await server.close(); // Close MCP server
  console.error("MCP server closed");
});
```

### 12.5 Versioning

```
VERSIONING STRATEGY:

1. Server version: Follow semver (major.minor.patch)
   - Major: Breaking changes to tool schemas
   - Minor: New tools added, backward compatible
   - Patch: Bug fixes, no schema changes

2. Protocol version: Track the MCP protocol version you support
   - Currently: "2024-11-05"
   - The SDK handles protocol negotiation automatically

3. Tool versioning: If a tool's schema changes:
   - Non-breaking (new optional param): keep same tool name
   - Breaking (required param change): create new tool (v2) and deprecate old

4. Document changes in CHANGELOG.md
```

---

## 13. MCP Development Checklist

```
BEFORE BUILDING:
  □ Define what tools/resources/prompts you need
  □ Decide: stdio (local) or HTTP/SSE (remote)?
  □ Identify required environment variables
  □ Plan error handling strategy

DURING BUILDING:
  □ Use @modelcontextprotocol/sdk (don't implement protocol from scratch)
  □ Log to stderr only (never stdout)
  □ Validate all inputs (Zod recommended)
  □ Handle errors gracefully (return isError: true, don't crash)
  □ Add descriptive tool descriptions (Claude reads these)
  □ Use JSON Schema for inputSchema (Claude reads these too)

TESTING:
  □ Test with MCP Inspector
  □ Write unit tests with InMemoryTransport
  □ Test error cases (invalid inputs, network failures)
  □ Test graceful shutdown

PUBLISHING:
  □ Add shebang (#!/usr/bin/env node) to entry file
  □ Set "bin" field in package.json
  □ Include only dist/ in npm package ("files" field)
  □ Write clear README with setup instructions
  □ Document all environment variables

INTEGRATION:
  □ Add to .claude/settings.json (project) or ~/.claude/settings.json (global)
  □ Test within Claude Code session
  □ Document which tools are available and what they do
```

This skill provides everything needed to build, test, publish, and integrate custom MCP servers for the TrueOmni project and beyond.
