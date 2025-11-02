# Use the official Nginx image
FROM nginx:alpine

# Copy static website files to Nginx web directory
COPY . /usr/share/nginx/html

# Expose port 80 for HTTP traffic
EXPOSE 80

# Nginx starts automatically by default