#!/bin/bash
# Deploy Texas Hold'em to GitHub Pages

cd /home/catchysun/.openclaw/workspace/texas-holdem-poker

echo "📦 Deploying to GitHub Pages..."

# Add all changes
git add .

# Commit
git commit -m "Mobile optimization - complete UI redesign"

# Force push to override diverging history
git push -f origin main

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Visit: https://nicoolpy3.github.io/texas-holdem-poker/"
else
    echo "❌ Deployment failed. Please push manually."
fi
