FROM node:22.17-slim

WORKDIR /app
COPY smart-expense-tracker/package.json ./
COPY smart-expense-tracker/package-lock.json ./
RUN npm install
COPY smart-expense-tracker/ ./
EXPOSE 5173
CMD ["npm", "run", "dev"]
