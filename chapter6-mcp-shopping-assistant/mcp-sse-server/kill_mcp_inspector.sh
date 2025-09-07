#!/bin/bash
ps -ef | grep "mcp-inspector" | grep -v grep | awk '{print $2}' | xargs kill -9

lsof -t -i :6277 | xargs kill -9
lsof -t -i :6274 | xargs kill -9