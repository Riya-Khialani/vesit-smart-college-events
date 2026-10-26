# Kubernetes (Minikube) Deployment & Viva Demo Guide
**Course:** Advanced Cloud Computing (ACC Devops)  
**Group:** Group 11 • Class D17A (VESIT)  
**Project:** Containerized College Event Management System with CI/CD  

---

## 1. Prerequisites
- **Minikube** installed and running
- **kubectl** configured to point to minikube

```bash
# 1. Start Minikube cluster
minikube start --driver=docker

# 2. Enable Ingress and Metrics Server (for HPA)
minikube addons enable metrics-server
```

---

## 2. Deploy All Components to Kubernetes

Run the manifests in order:

```bash
# Step 1: Create Secrets, ConfigMaps, and Persistent Storage
kubectl apply -f k8s/mysql-secret.yaml
kubectl apply -f k8s/mysql-configmap.yaml
kubectl apply -f k8s/mysql-pvc.yaml

# Step 2: Deploy MySQL Database
kubectl apply -f k8s/mysql-deployment.yaml

# Step 3: Deploy Backend Microservice (3 Replicas)
kubectl apply -f k8s/backend-deployment.yaml

# Step 4: Deploy Frontend (2 Replicas)
kubectl apply -f k8s/frontend-deployment.yaml

# Step 5: Enable Horizontal Pod Autoscaler (HPA)
kubectl apply -f k8s/hpa.yaml
```

---

## 3. Verify Cluster Status & Pods

```bash
# View all running pods
kubectl get pods -o wide

# Expected Output:
# NAME                                  READY   STATUS    RESTARTS   AGE
# backend-deployment-xxxxx-1            1/1     Running   0          45s
# backend-deployment-xxxxx-2            1/1     Running   0          45s
# backend-deployment-xxxxx-3            1/1     Running   0          45s
# frontend-deployment-yyyyy-1           1/1     Running   0          30s
# frontend-deployment-yyyyy-2           1/1     Running   0          30s
# mysql-deployment-zzzzz-1              1/1     Running   0          1m

# View all services
kubectl get services
```

---

## 4. How to Access the Application

```bash
# Option A: Get Minikube Service URL directly
minikube service frontend-service --url

# Option B: Port forward
kubectl port-forward service/frontend-service 3000:80
# Open browser at: http://localhost:3000
```

---

## 5. Live Viva Demonstrations for the Teacher

### Demo 1: Self-Healing Demonstration (Automatic Recovery)
**Teacher Question:** *"What happens if a backend container or pod crashes?"*
1. Run:
   ```bash
   kubectl get pods
   ```
2. Manually kill one backend pod:
   ```bash
   kubectl delete pod <backend-pod-name>
   ```
3. Immediately run `kubectl get pods`.
4. Show the teacher: **Kubernetes immediately detected the failure and scheduled a new replacement pod to maintain the desired count (3 replicas)!**

---

### Demo 2: Horizontal Scaling Demonstration
**Teacher Question:** *"How do you handle sudden spikes in event registrations?"*
1. Scale up backend replicas dynamically:
   ```bash
   kubectl scale deployment backend-deployment --replicas=5
   ```
2. Verify:
   ```bash
   kubectl get pods
   ```
3. Show the teacher that 5 backend instances are now serving traffic through the ClusterIP load-balanced service!
