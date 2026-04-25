# 🚀 Real-Time Chat Application (Microservices Architecture)

A scalable **real-time chat application** built using **microservices architecture**, supporting instant messaging, AI-based moderation, OTP authentication, and event-driven communication.

---

## 🌐 Project Live

🔗 https://safe-x.xyz

---

## 📌 Project Overview

This project demonstrates a **production-ready system design** using modern backend technologies like:

* WebSockets for real-time messaging
* Microservices architecture
* Event-driven communication using RabbitMQ
* AI-powered moderation system
* Dockerized deployment with CI/CD

---

## 🧠 Key Features

* 🔐 JWT-based Authentication & OTP Verification
* 💬 Real-time Messaging using Socket.IO
* ⚡ Event-driven architecture with RabbitMQ
* 🧠 AI Moderation Service (Spam / Toxic / Fraud detection)
* 🚫 Rate limiting using Redis
* ☁️ Image upload via Cloudinary
* 📦 Fully Dockerized microservices
* 🚀 CI/CD pipeline using GitHub Actions
* 🌐 Deployed on AWS EC2 with Nginx

---

## 🏗️ Project Architecture

🔗 Architecture Diagram: https://app.eraser.io/workspace/GTtRHZbcKISWpFT8B3zG

The system follows a **microservices + event-driven architecture**:

### 🔹 Components

#### 1. Frontend

* Built with **Next.js (React)**
* Communicates via:

  * REST APIs (HTTPS)
  * WebSockets (Socket.IO)

---

#### 2. API Gateway / Reverse Proxy

* **Nginx**
* Routes traffic to services:

  * `/api/user` → User Service
  * `/api/chat` → Chat Service
  * `/api/mail` → Mail Service
  * `/api/moderation` → Moderation Service
  * `/socket.io` → Chat Service (WebSocket)

---

### 🔹 Backend Microservices

#### 👤 User Service

* Handles authentication (JWT)
* Manages user profiles
* Consumes OTP events from RabbitMQ
* Uses Redis for rate limiting

---

#### 💬 Chat Service

* Handles real-time messaging (Socket.IO)
* Stores messages in MongoDB
* Sends messages to Moderation Service before saving
* Emits events to connected users

---

#### 📧 Mail Service

* Produces OTP messages to RabbitMQ
* Sends emails asynchronously

---

#### 🧠 Moderation Service

* Detects:

  * Spam
  * Toxic messages
  * Fraud links
* Returns:

  * `ALLOW`, `BLOCK`, `FLAG`

---

### 🔹 Message Queue

#### 🐇 RabbitMQ

* Producer → Mail Service
* Consumer → User Service
* Enables async OTP processing

---

### 🔹 Database & Storage

* 🗄️ MongoDB → Users, Chats, Messages
* ⚡ Redis → Rate limiting, caching, OTP storage
* ☁️ Cloudinary → Image storage

---

### 🔹 Infrastructure

* 🐳 Docker & Docker Compose
* ☁️ AWS EC2 Deployment
* 🌐 Nginx Reverse Proxy

---

### 🔹 CI/CD Pipeline

* GitHub Actions:

  * Build Docker images
  * Run tests
  * Deploy to EC2

---

## 🔄 Data Flow (Message Lifecycle)

1. User sends message
2. Chat Service receives message via WebSocket
3. Message sent to Moderation Service
4. If `ALLOW` → stored in MongoDB
5. Message broadcast to receiver in real-time
6. Redis updates session/cache if needed

---

## 🧪 Testing Ideas

* Spam messages (fraud links)
* Rapid requests (rate limiting)
* Multi-user real-time chat
* Offline → Online sync

---

## 📈 Future Improvements

* Push notifications
* Group chats
* Read receipts
* End-to-end encryption
* Kubernetes deployment

---

## 👨‍💻 Author

**Devesh Singh Chauhan**


