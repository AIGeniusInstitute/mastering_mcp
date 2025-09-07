package com.example.mcpdemo;

import org.junit.jupiter.api.Test;

import io.modelcontextprotocol.client.transport.HttpClientSseClientTransport;  

public class ClientSse {

    @Test  
    void runClientSseTest() { 
        var transport = HttpClientSseClientTransport.builder("http://localhost:8080").build();
        new SampleClient(transport).run();
    }

}