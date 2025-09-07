package com.example.mcpdemo.server.tools;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class CalculatorService {


    Logger log = LoggerFactory.getLogger(this.getClass());


    @Tool(name = "calculator", description = "基础计算器，支持加减乘除运算")
    public String calculator(String operation, double a, double b) {

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
        } catch (Exception e) {
            log.error("Error in calculator tool", e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", e.getMessage());
            return String.valueOf(errorResult);
        }

        return String.valueOf(result);

    }

}