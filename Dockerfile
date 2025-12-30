# Use the official Node.js 18 image as the base
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Playwright browsers
RUN npx playwright install --with-deps

# Copy the rest of the application code
COPY . .

# Expose port 3000 for the web server
EXPOSE 3000

# Default command to run the web server
CMD ["node", "index.js"]