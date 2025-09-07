lsof -i tcp:8501 | grep LISTEN | awk '{print $2}' | xargs kill -9
lsof -i tcp:8000 | grep LISTEN | awk '{print $2}' | xargs kill -9
lsof -i tcp:8002 | grep LISTEN | awk '{print $2}' | xargs kill -9
lsof -i tcp:8003 | grep LISTEN | awk '{print $2}' | xargs kill -9
