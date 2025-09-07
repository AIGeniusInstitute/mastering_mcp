#!/bin/bash
ps -ef | grep "src/app.ts" | grep -v grep | awk '{print $2}' | xargs kill -9