#!/bin/bash
#
# Run the JUnit test for ClientStdio
#
mvn test -Dtest=com.example.mcpdemo.ClientStdio#runClientStdioTest

#
# Run the JUnit test for ClientSse
#
mvn test -Dtest=com.example.mcpdemo.ClientSse#runClientSseTest