# Proyecto SaaS con Google Cloud Platform y Google Kubernetes Engine

Este proyecto implementa un sistema SaaS utilizando **Google Cloud Platform (GCP)** y **Google Kubernetes Engine (GKE)** para desplegar aplicaciones **React** (frontend) y **Flask** (backend). Incluye instrucciones para la creación de imágenes Docker, configuración de un clúster en GKE, despliegue de servicios y configuración de despliegues automáticos con **GitHub Actions**.

---

## Requisitos previos

### Instalaciones necesarias
Asegúrate de tener instalados los siguientes componentes y que estén configurados en el **PATH** del sistema:
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- Docker
- Kubernetes (kubectl)

### Configuración inicial
1. **Autenticación con GCP**:
   ```bash
   gcloud auth login
   gcloud config set project sonic-solstice-438802-c8

    Habilitar servicios necesarios:

    gcloud services enable container.googleapis.com containerregistry.googleapis.com

Pasos para la implementación
1. Crear archivos Dockerfile

Crea un archivo Dockerfile para cada componente del proyecto. Ejemplos:
Dockerfile para React (frontend):

# Usar imagen base de Node.js
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Crear una imagen ligera para servir la app
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

Dockerfile para Flask (backend):

FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]

2. Construir y subir las imágenes Docker

Ejecuta los siguientes comandos para construir y subir las imágenes a Google Container Registry (GCR):
React (frontend):

docker build -t gcr.io/sonic-solstice-438802-c8/react-app:latest ./app/app_sass
docker push gcr.io/sonic-solstice-438802-c8/react-app:latest

Flask (backend):

docker build -t gcr.io/sonic-solstice-438802-c8/flask-app:latest ./server
docker push gcr.io/sonic-solstice-438802-c8/flask-app:latest

3. Crear un clúster en GKE

Crea un clúster con 3 nodos en la región us-central1-a:

gcloud container clusters create tu-cluster --num-nodes=3 --zone=us-central1-a

Obtén las credenciales del clúster para interactuar con Kubernetes:

gcloud container clusters get-credentials tu-cluster --zone=us-central1-a

4. Configurar y desplegar los servicios en GKE

Crea una carpeta k8s/ para almacenar los archivos .yaml de Kubernetes. Ejemplo de configuración:
app-deployment.yaml (React):

apiVersion: apps/v1
kind: Deployment
metadata:
  name: react-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: react
  template:
    metadata:
      labels:
        app: react
    spec:
      containers:
      - name: react-container
        image: gcr.io/sonic-solstice-438802-c8/react-app:latest
        ports:
        - containerPort: 80

app-service.yaml:

apiVersion: v1
kind: Service
metadata:
  name: react-service
spec:
  type: LoadBalancer
  selector:
    app: react
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80

Aplica los despliegues con los siguientes comandos:

kubectl apply -f app-deployment.yaml
kubectl apply -f app-service.yaml
kubectl apply -f flask-deployment.yaml
kubectl apply -f flask-service.yaml

5. Verificar servicios en ejecución

Lista los servicios expuestos:

kubectl get services

6. Configurar despliegues automáticos con GitHub Actions

Crea un archivo .github/workflows/deploy.yml para configurar CI/CD. Ejemplo básico:

name: Deploy to GKE

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Set up Google Cloud SDK
      uses: google-github-actions/setup-gcloud@v1
      with:
        project_id: sonic-solstice-438802-c8
        service_account_key: ${{ secrets.GCP_SA_KEY }}

    - name: Authenticate to GKE
      run: gcloud container clusters get-credentials tu-cluster --zone us-central1-a

    - name: Deploy to Kubernetes
      run: |
        kubectl apply -f k8s/app-deployment.yaml
        kubectl apply -f k8s/app-service.yaml

GKE - Recomendaciones adicionales
Configuración de seguridad

    Configura roles y permisos con IAM para limitar acceso.
    Usa Secrets en Kubernetes para gestionar claves API sensibles:

    kubectl create secret generic openai-api-key --from-literal=OPENAI_API_KEY='tu_clave'

Monitoreo

Habilita Cloud Monitoring para supervisar el rendimiento del clúster y las aplicaciones.
Escalabilidad

Configura escalado automático:

kubectl autoscale deployment react-app --cpu-percent=50 --min=1 --max=5

Comandos útiles

    Listar clústeres:

gcloud container clusters list

Ver imágenes en GCR:

gcloud container images list --repository=gcr.io/sonic-solstice-438802-c8

Eliminar una imagen de GCR:

    gcloud container images delete gcr.io/sonic-solstice-438802-c8/flask-app:latest --quiet

Estructura del proyecto

Proyecto_SaaS/
├── app/
│   ├── app_sass/
│   │   ├── Dockerfile
│   │   └── ...
├── server/
│   ├── Dockerfile
│   └── ...
├── k8s/
│   ├── app-deployment.yaml
│   ├── app-service.yaml
│   └── ...

Notas finales

    Mantén actualizados los componentes con:

    gcloud components update

    Sigue buenas prácticas para la organización del proyecto y la gestión de permisos en GCP.

¡Listo para implementar! 🚀


Este archivo está diseñado para ser claro y detallado, listo para usarse en tu repositorio.