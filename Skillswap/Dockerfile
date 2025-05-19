FROM node:22.15

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Expose Expo development ports
EXPOSE 8081 19000 19001 19002

# Start Expo using the modern CLI
CMD ["npx", "expo", "start", "--lan"]
