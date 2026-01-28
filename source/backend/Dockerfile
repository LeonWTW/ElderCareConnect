FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the backend
COPY . .

EXPOSE 3001

CMD ["npm", "start"]