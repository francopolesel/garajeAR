FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN npm install --workspaces --include-workspace-root
RUN npm run build -w packages/shared
RUN npm run build -w apps/api
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY apps/api/package.json ./apps/api/package.json
RUN mkdir -p /app/uploads
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
