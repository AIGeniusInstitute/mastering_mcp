package com.example.mcpdemo;

import io.modelcontextprotocol.client.McpClient;
import io.modelcontextprotocol.spec.McpClientTransport;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.spec.McpSchema.ListToolsResult;

import java.util.Map;


public class SampleClient {

    private final McpClientTransport transport;

    public SampleClient(McpClientTransport transport) {
        this.transport = transport;
    }

    public void run() {

        var client = McpClient.sync(this.transport).build();

        client.initialize();

        client.ping();

        // List and demonstrate tools
        ListToolsResult toolsList = client.listTools();
        System.out.println("Available Tools = " + toolsList);
        toolsList.tools().stream().forEach(tool -> {
            System.out.println("Tool: " + tool.name() + ", description: " + tool.description() + ", schema: " + tool.inputSchema());
        });

        McpSchema.CallToolResult result = client.callTool(
                new McpSchema.CallToolRequest(
                        "calculator",
                        Map.of("operation",
                                "add",
                                "a", 5,
                                "b", 3
                        )
                ));

        System.out.println("calculator result: " + result);

        client.closeGracefully();

    }

}