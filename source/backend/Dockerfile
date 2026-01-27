FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the backend
COPY . .

EXPOSE 3001

# TODO: Review
CMD ["npm", "start", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
