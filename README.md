# Proyecto SaaS con GCP y GKE - Generador SQL
Este proyecto implementa un sistema SaaS que permite generar scripts SQL a partir de descripciones en lenguaje natural. Utiliza tecnologías modernas como inteligencia artificial, contenedores y computación en la nube para ofrecer una solución escalable, accesible y eficiente.Ademas, implementa una arquitectura SaaS utilizando Google Cloud Platform (GCP) y Google Kubernetes Engine (GKE) para el despliegue de una aplicación React y un servidor Flask. A continuación, se detallan los pasos para configurar, implementar y gestionar este proyecto.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:
- [**Google Cloud Platform SDK**](https://cloud.google.com/sdk?hl=es)
- [**Kubernetes**](https://kubernetes.io/releases/download/)
- [**Kubectl**](https://kubernetes.io/docs/tasks/tools/)
- [**Docker**](https://www.docker.com/products/docker-desktop/)
- [**GCP Plugin GKE**](https://cloud.google.com/kubernetes-engine?hl=es_419)
  
  ```gcloud components install gke-gcloud-auth-plugin```
> **Nota**: Asegúrate de que estas herramientas estén en el **PATH** del sistema para un funcionamiento adecuado.

---
## Configuracion inicial
Autenticación con GCP:
```
  gcloud auth login
  gcloud config set project sonic-solstice-438802-c8
```
Habilitación servicios necesarios:
```
gcloud services enable container.googleapis.com containerregistry.googleapis.com
```

## Crear proyecto en Google Cloud Platform
Primeramente se debe crear y configurar el proyecto en [Google Cloud Platform](https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://console.cloud.google.com/%3Fhl%3Des&ved=2ahUKEwiw9culrvOJAxXzG9AFHQQABPUQjBB6BAgREAE&usg=AOvVaw32wCy6el4RVbIZO1m5wyNI)

## Crear archivos Dockerfile
Para cada componente del proyecto se debe crear un archivo `Dockerfile`
- **React App**

```
# Usar una imagen de Node como base
FROM node:20.12 AS build

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de la aplicación
COPY package*.json ./
COPY . .

# Instalar dependencias y compilar el proyecto
RUN npm install
RUN npm run build

# Usar una imagen de Nginx para servir la aplicación
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

- **Flask App**
```
# Usar una imagen de Python como base
FROM python:3.12

# Crear directorio de trabajo
WORKDIR /server

# Copiar archivos de la aplicación
COPY . .

# Instalar dependencias
RUN pip install -r requirements.txt

# Exponer el puerto 5000
EXPOSE 5000

RUN pip install gunicorn

# Ejecutar el servidor Flask con Gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

Los `Dockerfile` contienen todos los comandos necesarios para crear las imágenes de Docker

## Crear y enviar imágenes de Docker a Container Registry
React App:

```
docker build -t gcr.io/id-proyecto-gcp/react-app:latest ./app/app_sass
docker push gcr.io/id-proyecto-gcp/react-app:latest
```

Flask App:

```
docker build -t gcr.io/id-proyecto-gcp/flask-app:latest ./server
docker push gcr.io/id-proyecto-gcp/flask-app:latest
```

## Crear Clúster en GKE
Para la creación del clúster, se realiza mediante el siguiente comando:

```gcloud container clusters create tu-cluster --num-nodes=3 --zone=us-central1-a```

Obtener las credenciales del clúster:

```gcloud container clusters get-credentials [nombre_cluster]```


## Creación de despliegues en GKE
Se configuran los despliegues utilizando los archivos de manifiesto `YAML`, este describe como se despliegan las aplicaciones:

- **React App Deployment**

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: react-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: react-app
  template:
    metadata:
      labels:
        app: react-app
    spec:
      containers:
        - name: react-app
          image: gcr.io/id-proyecto/react-app:latest-3
          ports:
            - containerPort: 80
```

- **React App Service**

```
apiVersion: v1
kind: Service
metadata:
  name: react-app-service
spec:
  type: LoadBalancer
  selector:
    app: react-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
```

- **Flask Deployment**

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flask-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: flask-app
  template:
    metadata:
      labels:
        app: flask-app
    spec:
      containers:
        - name: flask-app
          image: gcr.io/id-pryecto/flask-app:latest-3
          ports:
            - containerPort: 5000
          env:
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: openai-api-key
                  key: OPENAI_API_KEY
```

- **Flask Service**

```
apiVersion: v1
kind: Service
metadata:
  name: flask-app-service
spec:
  type: LoadBalancer 
  selector:
    app: flask-app 
  ports:
    - protocol: TCP
      port: 80  
      targetPort: 5000 
```

Para ejecutar los despliegues, se realizan mediante los siguientes comandos:

```
kubectl apply -f app-deployment.yaml
kubectl apply -f app-service.yaml
kubectl apply -f flask-deployment.yaml
kubectl apply -f flask-service.yaml
```

## Verificar los servicios en ejecución
Listar los servicios expuestos:

```kubectl get services```

## Configurar despliegues automáticos
Configura una archivo `deploy.yml` para implementar CI/CD en GKE. Por ejemplo

```
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

```

## Monitoreo
Habilita Cloud Monitoring para supervisar el rendimiento del clúster y las aplicaciones.

## Escalabilidad
Configura escalado automático:

```kubectl autoscale deployment react-app --cpu-percent=50 --min=1 --max=5```

### Comandos utiles
- **Acceder a Google Cloud Console:**

  ```gcloud auth login```

- **Seleccionar y configurar proyecto de GCP:**

  ```gcloud config set project [id-proyecto-gcp]```
  ```gcloud config set compute/zone us-central1-a```

- **Listar clústeres:**

  ```gcloud container clusters list```

- **Obtener credenciales del clúster:**

  ```gcloud container clusters get-credentials autopilot-cluster-1 --region us-central1 --project id-proyecto-gcp```

- **Ver imagenes en GCR:**

  ```gcloud container images list --repository=gcr.io/id-proyecto-gcp```

- **Eliminar una imagen de GCR:**

  ```gcloud container images delete gcr.io/id-proyecto-gcp/flask-app:latest --quiet```

- **Verificar el estados de los pods:**

  ```kubectl get pods```

- **Verificar el estado del clúster:**

  ```kubectl cluster-info```

## Notas Finales
- Manten actualizados los componentes
- Usa una estructura clara: 

```
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
```
