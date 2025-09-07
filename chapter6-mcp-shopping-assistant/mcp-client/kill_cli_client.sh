#!/bin/bash
ps -ef | grep "cli-client.ts" | grep -v grep | awk '{print $2}' | xargs kill -9
