lsof -i tcp:6277 | awk 'NR > 1 {print $2}'| xargs kill -9
lsof -i tcp:6274 | awk 'NR > 1 {print $2}'| xargs kill -9