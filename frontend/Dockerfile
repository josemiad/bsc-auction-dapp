FROM node:20-alpine
    
WORKDIR /app

# Copy package files first to cache dependency installations
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install ethers lucide-react
RUN npm install -D tailwindcss@^3.4.17 postcss autoprefixer

# Copy the rest of the application code
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Run Vite with --host 0.0.0.0 so Docker can expose it to your browser
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]