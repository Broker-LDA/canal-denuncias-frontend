# Estágio de build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia package.json e package-lock.json
COPY frontend/package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código do frontend
COPY frontend/. .

# Constrói a aplicação para produção
# O Vite automaticamente pega VITE_API_URL do ambiente durante o build
RUN npm run build

# Estágio de produção (servir arquivos estáticos com Nginx)
FROM nginx:alpine

# Copia os arquivos estáticos construídos do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta 80 (padrão para HTTP)
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]