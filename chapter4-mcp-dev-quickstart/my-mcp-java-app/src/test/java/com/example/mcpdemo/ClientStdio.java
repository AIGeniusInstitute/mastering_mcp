package com.example.mcpdemo;

import java.io.File;

import org.junit.jupiter.api.Test;

import io.modelcontextprotocol.client.transport.ServerParameters;
import io.modelcontextprotocol.client.transport.StdioClientTransport;

public class ClientStdio {

    @Test
    void runClientStdioTest() {

        System.out.println(new File(".").getAbsolutePath());

        var stdioParams = ServerParameters.builder("java")
                .args("-Dspring.ai.mcp.server.stdio=true", "-Dspring.main.web-application-type=none",
                        "-Dlogging.pattern.console=", "-jar",
                        "target/my-mcp-java-app-0.0.1-SNAPSHOT.jar")
                .build();

        var transport = new StdioClientTransport(stdioParams);

        new SampleClient(transport).run();
    }
}
