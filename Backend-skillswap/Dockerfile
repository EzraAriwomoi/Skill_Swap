FROM node:22.15

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Expose backend API port
EXPOSE 3000

# Start backend in dev mode
CMD ["npm", "run", "dev"]
