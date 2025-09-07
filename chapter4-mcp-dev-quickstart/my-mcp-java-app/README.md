我需要查看Java SDK的文档来重写"Java/Kotlin SDK"部分的内容。让我获取这些文档的内容。根据获取的Java SDK文档，我将重写"Java/Kotlin SDK"部分的内容，提供从0到1的完整指南和可运行的源代码。

### 3.3.3 Java/Kotlin SDK

Java和Kotlin SDK为MCP应用开发提供了强类型、高性能的实现，特别适合企业级应用开发。本节将从零开始，一步步指导您完成Java/Kotlin MCP开发环境的搭建、服务端和客户端的实现。

#### 3.3.3.1 开发环境准备

首先，我们需要准备基本的开发环境：

1. **安装JDK**：确保安装了JDK 11或更高版本
2. **选择构建工具**：Maven或Gradle
3. **选择IDE**：推荐使用IntelliJ IDEA或Eclipse

#### 3.3.3.2 创建项目

我们将创建一个基于Spring Boot的MCP应用，包含服务端和客户端组件。

##### 使用Maven创建项目

创建一个基本的Maven项目结构，并编辑`pom.xml`文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.8</version>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>mcp-java-demo</artifactId>
    <version>1.0.0</version>

    <properties>
        <java.version>11</java.version>
        <mcp.version>0.7.0</mcp.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>io.modelcontextprotocol.sdk</groupId>
                <artifactId>mcp-bom</artifactId>
                <version>${mcp.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <!-- Spring Boot -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- MCP Core -->
        <dependency>
            <groupId>io.modelcontextprotocol.sdk</groupId>
            <artifactId>mcp</artifactId>
        </dependency>

        <!-- MCP Spring WebMVC Transport -->
        <dependency>
            <groupId>io.modelcontextprotocol.sdk</groupId>
            <artifactId>mcp-spring-webmvc</artifactId>
        </dependency>

        <!-- Lombok for reducing boilerplate code -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>io.modelcontextprotocol.sdk</groupId>
            <artifactId>mcp-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

##### 使用Gradle创建项目

如果您更喜欢使用Gradle，可以创建以下`build.gradle`文件：

```groovy
plugins {
    id 'org.springframework.boot' version '2.7.8'
    id 'io.spring.dependency-management' version '1.0.15.RELEASE'
    id 'java'
}

group = 'com.example'
version = '1.0.0'
sourceCompatibility = '11'

repositories {
    mavenCentral()
}

ext {
    mcpVersion = '0.7.0'
}

dependencyManagement {
    imports {
        mavenBom "io.modelcontextprotocol.sdk:mcp-bom:${mcpVersion}"
    }
}

dependencies {
    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-web'
    
    // MCP Core
    implementation 'io.modelcontextprotocol.sdk:mcp'
    
    // MCP Spring WebMVC Transport
    implementation 'io.modelcontextprotocol.sdk:mcp-spring-webmvc'
    
    // Lombok
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    
    // Testing
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'io.modelcontextprotocol.sdk:mcp-test'
}

test {
    useJUnitPlatform()
}
```

#### 3.3.3.3 项目结构

创建以下项目结构：

```
mcp-java-demo/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── mcpdemo/
│   │   │               ├── McpDemoApplication.java
│   │   │               ├── config/
│   │   │               │   └── McpConfig.java
│   │   │               ├── server/
│   │   │               │   ├── McpServerConfig.java
│   │   │               │   └── tools/
│   │   │               │       ├── CalculatorTool.java
│   │   │               │       └── TextAnalyzerTool.java
│   │   │               └── client/
│   │   │                   └── McpClientDemo.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── mcpdemo/
│                       └── McpDemoApplicationTests.java
├── pom.xml
└── README.md
```

#### 3.3.3.4 配置应用程序

创建`application.properties`文件：

```properties
# 服务器配置
server.port=8080

# MCP配置
mcp.server.name=JavaMcpDemo
mcp.server.version=1.0.0
mcp.server.path=/mcp
```

#### 3.3.3.5 创建主应用类

创建`McpDemoApplication.java`：

```java
package com.example.mcpdemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class McpDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(McpDemoApplication.class, args);
    }
}
```

#### 3.3.3.6 实现MCP服务器

##### 步骤1：创建MCP服务器配置

创建`McpServerConfig.java`：

```java
package com.example.mcpdemo.server;

import com.example.mcpdemo.server.tools.CalculatorService;
import com.example.mcpdemo.server.tools.TextAnalyzerTool;
import io.modelcontextprotocol.server.McpServer;
import io.modelcontextprotocol.server.McpSyncServer;
import io.modelcontextprotocol.server.ServerCapabilities;
import io.modelcontextprotocol.server.logging.LoggingLevel;
import io.modelcontextprotocol.server.logging.LoggingMessageNotification;
import io.modelcontextprotocol.server.transport.McpTransport;
import io.modelcontextprotocol.spring.webmvc.McpWebMvcTransport;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PreDestroy;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class McpServerConfig {

    private final CalculatorService calculatorTool;
    private final TextAnalyzerTool textAnalyzerTool;

    @Value("${mcp.server.name}")
    private String serverName;

    @Value("${mcp.server.version}")
    private String serverVersion;

    @Value("${mcp.server.path}")
    private String serverPath;

    private McpSyncServer mcpServer;

    @Bean
    public McpSyncServer mcpServer() {
        // 创建服务器传输层
        McpTransport transport = new McpWebMvcTransport.Builder()
                .path(serverPath)
                .build();

        // 配置服务器能力
        ServerCapabilities capabilities = ServerCapabilities.builder()
                .tools(true)       // 启用工具支持
                .resources(true)   // 启用资源支持
                .prompts(true)     // 启用提示支持
                .logging()         // 启用日志支持
                .build();

        // 创建MCP服务器
        mcpServer = McpServer.sync(transport)
                .serverInfo(serverName, serverVersion)
                .capabilities(capabilities)
                .build();

        // 注册工具
        mcpServer.addTool(calculatorTool.getToolRegistration());
        mcpServer.addTool(textAnalyzerTool.getToolRegistration());

        // 发送初始化日志
        mcpServer.loggingNotification(LoggingMessageNotification.builder()
                .level(LoggingLevel.INFO)
                .logger("McpServerConfig")
                .data("MCP Server initialized successfully")
                .build());

        log.info("MCP Server initialized with name: {}, version: {}, path: {}",
                serverName, serverVersion, serverPath);

        return mcpServer;
    }

    @PreDestroy
    public void cleanup() {
        if (mcpServer != null) {
            try {
                mcpServer.close();
                log.info("MCP Server closed successfully");
            } catch (Exception e) {
                log.error("Error closing MCP Server", e);
            }
        }
    }
}
```

##### 步骤2：实现计算器工具

创建`CalculatorTool.java`：

```java
package com.example.mcpdemo.server.tools;

import io.modelcontextprotocol.server.McpServerFeatures;
import io.modelcontextprotocol.server.tool.CallToolResult;
import io.modelcontextprotocol.server.tool.Tool;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class CalculatorTool {

    public McpServerFeatures.SyncToolRegistration getToolRegistration() {
        // 定义工具参数
        Map<String, String> parameters = Map.of(
                "operation", "string",
                "a", "number",
                "b", "number"
        );
        
        // 创建工具定义
        Tool tool = new Tool("calculator", "基础计算器，支持加减乘除运算", parameters);
        
        // 创建工具注册
        return new McpServerFeatures.SyncToolRegistration(
                tool,
                arguments -> {
                    // 获取参数
                    String operation = arguments.getString("operation");
                    double a = arguments.getNumber("a").doubleValue();
                    double b = arguments.getNumber("b").doubleValue();
                    
                    log.info("Calculator tool called with operation: {}, a: {}, b: {}", operation, a, b);
                    
                    // 执行计算
                    Map<String, Object> result = new HashMap<>();
                    
                    try {
                        switch (operation) {
                            case "add":
                                result.put("result", a + b);
                                break;
                            case "subtract":
                                result.put("result", a - b);
                                break;
                            case "multiply":
                                result.put("result", a * b);
                                break;
                            case "divide":
                                if (b == 0) {
                                    throw new IllegalArgumentException("除数不能为零");
                                }
                                result.put("result", a / b);
                                break;
                            default:
                                throw new IllegalArgumentException("不支持的操作: " + operation);
                        }
                        
                        return new CallToolResult(result, false);
                    } catch (Exception e) {
                        log.error("Error in calculator tool", e);
                        Map<String, Object> errorResult = new HashMap<>();
                        errorResult.put("error", e.getMessage());
                        return new CallToolResult(errorResult, true);
                    }
                }
        );
    }
}
```

##### 步骤3：实现文本分析工具

创建`TextAnalyzerTool.java`：

```java
package com.example.mcpdemo.server.tools;

import io.modelcontextprotocol.server.McpServerFeatures;
import io.modelcontextprotocol.server.tool.CallToolResult;
import io.modelcontextprotocol.server.tool.Tool;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Component
public class TextAnalyzerTool {

    public McpServerFeatures.SyncToolRegistration getToolRegistration() {
        // 定义工具参数
        Map<String, String> parameters = Map.of(
                "text", "string"
        );
        
        // 创建工具定义
        Tool tool = new Tool("textAnalyzer", "文本分析工具，提供基本文本统计信息", parameters);
        
        // 创建工具注册
        return new McpServerFeatures.SyncToolRegistration(
                tool,
                arguments -> {
                    // 获取参数
                    String text = arguments.getString("text");
                    
                    log.info("Text analyzer tool called with text length: {}", text.length());
                    
                    try {
                        // 执行文本分析
                        Map<String, Object> result = new HashMap<>();
                        
                        // 基本统计
                        result.put("charCount", text.length());
                        result.put("wordCount", countWords(text));
                        result.put("sentenceCount", countSentences(text));
                        result.put("paragraphCount", countParagraphs(text));
                        
                        // 词频分析（简单实现）
                        Map<String, Integer> wordFrequency = getTopWords(text, 5);
                        result.put("topWords", wordFrequency);
                        
                        return new CallToolResult(result, false);
                    } catch (Exception e) {
                        log.error("Error in text analyzer tool", e);
                        Map<String, Object> errorResult = new HashMap<>();
                        errorResult.put("error", e.getMessage());
                        return new CallToolResult(errorResult, true);
                    }
                }
        );
    }
    
    private int countWords(String text) {
        if (text == null || text.isEmpty()) {
            return 0;
        }
        return text.split("\\s+").length;
    }
    
    private int countSentences(String text) {
        if (text == null || text.isEmpty()) {
            return 0;
        }
        return text.split("[.!?]+").length;
    }
    
    private int countParagraphs(String text) {
        if (text == null || text.isEmpty()) {
            return 0;
        }
        return text.split("\n\\s*\n").length;
    }
    
    private Map<String, Integer> getTopWords(String text, int limit) {
        if (text == null || text.isEmpty()) {
            return Map.of();
        }
        
        // 分词并统计频率
        Map<String, Integer> wordCounts = Arrays.stream(text.toLowerCase().split("\\s+"))
                .map(word -> word.replaceAll("[^a-zA-Z0-9\\u4e00-\\u9fa5]", "")) // 移除标点符号
                .filter(word -> !word.isEmpty())
                .collect(Collectors.groupingBy(
                        word -> word,
                        Collectors.summingInt(word -> 1)
                ));
        
        // 获取前N个高频词
        return wordCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(limit)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }
}
```

#### 3.3.3.7 实现MCP客户端

创建`McpClientDemo.java`：

```java
package com.example.mcpdemo.client;

import io.modelcontextprotocol.client.ClientCapabilities;
import io.modelcontextprotocol.client.McpClient;
import io.modelcontextprotocol.client.McpSyncClient;
import io.modelcontextprotocol.client.tool.CallToolRequest;
import io.modelcontextprotocol.client.tool.CallToolResult;
import io.modelcontextprotocol.client.tool.ListToolsResult;
import io.modelcontextprotocol.client.transport.McpTransport;
import io.modelcontextprotocol.client.transport.sse.SseClientTransport;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.time.Duration;
import java.util.Map;

@Slf4j
@Component
public class McpClientDemo implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        // 创建客户端传输层
        McpTransport transport = new SseClientTransport(
                URI.create("http://localhost:8080/mcp").toURL()
        );
        
        // 配置客户端能力
        ClientCapabilities capabilities = ClientCapabilities.builder()
                .build();
        
        // 创建MCP客户端
        try (McpSyncClient client = McpClient.sync(transport)
                .requestTimeout(Duration.ofSeconds(10))
                .capabilities(capabilities)
                .build()) {
            
            log.info("Initializing MCP client...");
            client.initialize();
            log.info("MCP client initialized successfully");
            
            // 列出可用工具
            ListToolsResult toolsResult = client.listTools();
            log.info("Available tools: {}", toolsResult.getTools().stream()
                    .map(tool -> tool.getName() + " - " + tool.getDescription())
                    .toList());
            
            // 调用计算器工具
            log.info("Calling calculator tool...");
            CallToolResult calcResult = client.callTool(
                    new CallToolRequest("calculator", 
                            Map.of("operation", "add", "a", 5, "b", 3))
            );
            log.info("Calculator result: {}", calcResult.getResult());
            
            // 调用文本分析工具
            log.info("Calling text analyzer tool...");
            CallToolResult textResult = client.callTool(
                    new CallToolRequest("textAnalyzer", 
                            Map.of("text", "人工智能(AI)是计算机科学的一个分支，它致力于创建能够模拟人类智能的系统。" +
                                    "这些系统可以学习、推理、感知、规划和解决问题。近年来，随着深度学习和神经网络技术的发展，" +
                                    "AI取得了显著进步，在图像识别、自然语言处理、游戏和医疗诊断等领域表现出色。"))
            );
            log.info("Text analyzer result: {}", textResult.getResult());
            
            // 优雅关闭客户端
            client.closeGracefully();
            log.info("MCP client closed successfully");
        } catch (Exception e) {
            log.error("Error in MCP client", e);
        }
    }
}
```


#### 3.3.3.9 运行应用程序

完成上述代码实现后，可以通过以下步骤运行应用程序：

1. **使用Maven运行**：
```bash
mvn spring-boot:run
```

2. **使用Gradle运行**：
```bash
./gradlew bootRun
```

应用启动后，MCP服务器将在`/mcp`路径上提供服务，并且客户端将应用启动后，MCP服务器将在`/mcp`路径上提供服务，并且客户端将自动连接到服务器并执行示例操作。您可以在控制台中看到客户端与服务器的交互日志。

#### 3.3.3.10 测试MCP服务器

除了使用内置的客户端示例外，您还可以使用HTTP客户端工具（如Postman或curl）直接测试MCP服务器。以下是一些示例请求：

##### 初始化MCP会话

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "client": {
        "name": "TestClient",
        "version": "1.0.0"
      }
    },
    "id": 1
  }'
```

##### 列出可用工具

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "listTools",
    "id": 2
  }'
```

##### 调用计算器工具

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "callTool",
    "params": {
      "name": "calculator",
      "arguments": {
        "operation": "multiply",
        "a": 6,
        "b": 7
      }
    },
    "id": 3
  }'
```

#### 3.3.3.11 扩展MCP服务器功能

##### 添加资源支持

MCP不仅支持工具，还支持资源。以下是一个简单的资源实现示例：

```java
package com.example.mcpdemo.server.resources;

import io.modelcontextprotocol.server.McpServerFeatures;
import io.modelcontextprotocol.server.resource.CallResourceResult;
import io.modelcontextprotocol.server.resource.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class WeatherResource {

    public McpServerFeatures.SyncResourceRegistration getResourceRegistration() {
        // 定义资源参数
        Map<String, String> parameters = Map.of(
                "city", "string",
                "unit", "string"
        );
        
        // 创建资源定义
        Resource resource = new Resource("weather", "获取指定城市的天气信息", parameters);
        
        // 创建资源注册
        return new McpServerFeatures.SyncResourceRegistration(
                resource,
                arguments -> {
                    // 获取参数
                    String city = arguments.getString("city");
                    String unit = arguments.getString("unit", "celsius"); // 默认摄氏度
                    
                    log.info("Weather resource called for city: {}, unit: {}", city, unit);
                    
                    try {
                        // 模拟天气数据获取（实际应用中应调用天气API）
                        Map<String, Object> result = new HashMap<>();
                        result.put("city", city);
                        result.put("temperature", 23);
                        result.put("unit", unit);
                        result.put("condition", "晴天");
                        result.put("humidity", "45%");
                        result.put("timestamp", System.currentTimeMillis());
                        
                        return new CallResourceResult(result, false);
                    } catch (Exception e) {
                        log.error("Error in weather resource", e);
                        Map<String, Object> errorResult = new HashMap<>();
                        errorResult.put("error", e.getMessage());
                        return new CallResourceResult(errorResult, true);
                    }
                }
        );
    }
}
```

然后在`McpServerConfig`中注册这个资源：

```java
@Autowired
private WeatherResource weatherResource;

@Bean
public McpSyncServer mcpServer() {
    // ... 其他代码保持不变
    
    // 注册资源
    mcpServer.addResource(weatherResource.getResourceRegistration());
    
    // ... 其他代码保持不变
    return mcpServer;
}
```

##### 添加提示模板支持

MCP还支持提示模板，以下是一个简单的提示模板实现：

```java
package com.example.mcpdemo.server.prompts;

import io.modelcontextprotocol.server.McpServerFeatures;
import io.modelcontextprotocol.server.prompt.Prompt;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SummaryPrompt {

    public McpServerFeatures.PromptRegistration getPromptRegistration() {
        // 创建提示模板定义
        Prompt prompt = new Prompt("summarize", "生成文本摘要的提示模板");
        
        // 创建提示模板注册
        return new McpServerFeatures.PromptRegistration(
                prompt,
                () -> {
                    log.info("Summary prompt template requested");
                    
                    return """
                            请为以下文本生成一个简洁的摘要，不超过3句话：
                            
                            {text}
                            
                            摘要:
                            """;
                }
        );
    }
}
```

然后在`McpServerConfig`中注册这个提示模板：

```java
@Autowired
private SummaryPrompt summaryPrompt;

@Bean
public McpSyncServer mcpServer() {
    // ... 其他代码保持不变
    
    // 注册提示模板
    mcpServer.addPrompt(summaryPrompt.getPromptRegistration());
    
    // ... 其他代码保持不变
    return mcpServer;
}
```


#### 3.3.3.13 单元测试

MCP SDK提供了测试工具，可以方便地编写单元测试。以下是一个简单的测试示例：

```java
package com.example.mcpdemo;

import com.example.mcpdemo.server.tools.CalculatorService;
import com.example.mcpdemo.server.tools.CalculatorTool;
import io.modelcontextprotocol.server.McpServerFeatures;
import io.modelcontextprotocol.server.tool.CallToolResult;
import io.modelcontextprotocol.test.TestArguments;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class McpDemoApplicationTests {

    @Autowired
    private CalculatorService calculatorTool;

    @Test
    void contextLoads() {
        // 验证Spring上下文加载正常
    }

    @Test
    void testCalculatorTool() {
        // 获取工具注册
        McpServerFeatures.SyncToolRegistration registration = calculatorTool.getToolRegistration();

        // 验证工具定义
        assertEquals("calculator", registration.getTool().getName());
        assertTrue(registration.getTool().getDescription().contains("计算器"));

        // 测试加法
        CallToolResult addResult = registration.getHandler().apply(
                new TestArguments(Map.of("operation", "add", "a", 5, "b", 3))
        );
        assertFalse(addResult.isError());
        assertEquals(8.0, addResult.getResult().get("result"));

        // 测试除法
        CallToolResult divideResult = registration.getHandler().apply(
                new TestArguments(Map.of("operation", "divide", "a", 10, "b", 2))
        );
        assertFalse(divideResult.isError());
        assertEquals(5.0, divideResult.getResult().get("result"));

        // 测试除零错误
        CallToolResult divideByZeroResult = registration.getHandler().apply(
                new TestArguments(Map.of("operation", "divide", "a", 10, "b", 0))
        );
        assertTrue(divideByZeroResult.isError());
        assertNotNull(divideByZeroResult.getResult().get("error"));
    }
}
```

#### 3.3.3.14 部署与生产环境配置

对于生产环境，需要进行额外的配置和优化：

##### 应用程序属性配置

创建`application-prod.properties`文件：

```properties
# 服务器配置
server.port=8080
server.tomcat.max-threads=200
server.tomcat.min-spare-threads=20

# MCP配置
mcp.server.name=JavaMcpDemo
mcp.server.version=1.0.0
mcp.server.path=/mcp

# 日志配置
logging.level.root=WARN
logging.level.com.example.mcpdemo=INFO
logging.file.name=/var/log/mcpdemo/application.log

# 安全配置
spring.security.user.name=${ADMIN_USER}
spring.security.user.password=${ADMIN_PASSWORD}
```

##### Docker部署

创建`Dockerfile`：

```dockerfile
FROM openjdk:11-jre-slim

WORKDIR /app

COPY target/mcp-java-demo-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
```

创建`docker-compose.yml`：

```yaml
version: '3'

services:
  mcp-server:
    build: .
    ports:
      - "8080:8080"
    environment:
      - ADMIN_USER=admin
      - ADMIN_PASSWORD=secure_password
      - OPENAI_API_KEY=your_api_key
    volumes:
      - ./logs:/var/log/mcpdemo
    restart: unless-stopped
```

#### 3.3.3.15 总结

通过本节的学习，我们从零开始搭建了一个完整的Java/Kotlin MCP开发环境，实现了MCP服务器和客户端，并展示了如何扩展MCP功能、集成大语言模型以及进行测试和部署。

Java/Kotlin SDK提供了强类型、高性能的MCP实现，特别适合企业级应用开发。通过Spring Boot的集成，我们可以快速构建可靠、可扩展的MCP应用，满足各种复杂业务场景的需求。

在实际开发中，您可以根据项目需求，进一步扩展和定制MCP服务器功能，例如添加更多工具和资源、集成不同的大语言模型、实现更复杂的业务逻辑等。MCP的标准化接口使得这些扩展变得简单而灵活，为AI原生应用开发提供了坚实的基础。