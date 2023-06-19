#!/bin/bash

# Set up Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - &&\
sudo apt-get install -y nodejs

# Install dependencies
npm ci
