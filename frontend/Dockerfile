# Lightweight Alpine Nginx Storefront
FROM nginx:alpine

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static frontend assets
COPY index.html styles.css app.js /usr/share/nginx/html/

# Expose standard HTTP port
EXPOSE 80

# Healthcheck probe for orchestrators
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
