# Estágio de build: constrói a aplicação Vite
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Estágio de produção: serve os arquivos estáticos com Nginx
FROM nginx:alpine

# Copie os arquivos de build do estágio anterior para o Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copie uma configuração customizada do Nginx (opcional, mas recomendado)
# Crie um arquivo nginx.conf na pasta frontend/
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponha a porta 80 (padrão do Nginx)
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]