# Usar una imagen (servidor web) ligera
FROM nginx:alpine

# Copiar tus archivos a la carpeta web del servidor
COPY index.html /usr/share/nginx/html
COPY style.css /usr/share/nginx/html
COPY app.js /usr/share/nginx/html

# Indicar que el servidor usa el puerto 80
EXPOSE 80
