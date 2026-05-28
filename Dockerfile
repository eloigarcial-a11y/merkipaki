FROM node:18-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --build-from-source=sqlite3

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
