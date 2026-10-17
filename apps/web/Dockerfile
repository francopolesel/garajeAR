FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN npm install --workspaces --include-workspace-root
RUN npm run build -w packages/shared
RUN npm run build -w apps/web

FROM nginx:alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
