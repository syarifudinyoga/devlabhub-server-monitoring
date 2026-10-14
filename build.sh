#!/bin/bash
cd /home/devlabhub/devlabhub-monitor/frontend
export PATH=/home/devlabhub/go/bin:$PATH
npx vite build --outDir /tmp/dist
echo "BUILD EXIT: $?"
