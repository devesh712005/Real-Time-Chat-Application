# Use lightweight Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy rest of the code
COPY . .


# Start the app
CMD ["node", "index.js"]