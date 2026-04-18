<div align="center">

# 🛍️ Fullstack E‑Shop

**A production-oriented e‑commerce application built with Next.js & Spring Boot**

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![Java](https://img.shields.io/badge/Java-25-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)

![CI](https://github.com/GiannisF12/nextjs-springboot-eshop/actions/workflows/docker-image.yml/badge.svg)

</div>

---

## 📖 Overview

A complete, decoupled e‑commerce platform featuring a **Next.js 16** storefront, a **Spring Boot 4** REST API, and **PostgreSQL** persistence managed with **Flyway** migrations. The project demonstrates end‑to‑end ownership of a real product: authentication, product management, cart, checkout, orders, and an admin panel — all containerised with Docker Compose.

> Built as a portfolio piece to showcase full‑stack engineering across modern Java and TypeScript ecosystems.

---

## ✨ Highlights

- 🔐 **Authentication & Authorisation** — register, login, profile update, password change, role‑based access (USER / ADMIN) with Spring Security
- 🛒 **Shopping flow** — browse products, view details, cart, checkout, order history
- 👕 **Product variants** — per‑size stock tracking for clothing and shoes
- 🗂️ **Category management** — nested catalog with full CRUD
- 🧑‍💼 **Admin panel** — manage products, categories, orders, and stock
- 🖼️ **Image uploads** — dedicated image controller with file storage
- 🗃️ **Versioned schema** — Flyway migrations for reproducible databases and seed data
- 🐳 **One‑command startup** — `docker compose up` spins up frontend, backend, and PostgreSQL
- ♻️ **Clean architecture** — controller / service / repository separation on the backend, App Router + Zustand stores on the frontend
- 🤖 **Continuous Integration** — GitHub Actions runs backend tests (against a real Postgres service), frontend lint + build, and Docker image builds on every push

---

## 🧱 Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Zustand, Lucide icons |
| **Backend** | Spring Boot 4.0, Java 25, Spring Security, Spring Data JPA, Spring Validation, Lombok |
| **Database** | PostgreSQL + Flyway migrations |
| **Infrastructure** | Docker, Docker Compose, multi‑service networking |
| **Tooling** | Maven, ESLint, TypeScript strict mode |

---

## 🏗️ Architecture

```
┌──────────────────────┐       REST / JSON        ┌──────────────────────┐
│   Next.js Frontend   │ ───────────────────────▶ │  Spring Boot Backend │
│   (App Router, SSR)  │ ◀─────────────────────── │  (Controllers/JPA)   │
└──────────────────────┘                           └──────────┬───────────┘
                                                              │
                                                              ▼
                                                    ┌──────────────────┐
                                                    │   PostgreSQL     │
                                                    │  (Flyway schema) │
                                                    └──────────────────┘
```

**Why decoupled?**
- Frontend and backend scale and deploy independently
- The same API can serve a mobile client or third‑party integration
- Clear separation of concerns: presentation vs. business logic vs. persistence

---

## 📂 Project Structure

```
nextjs-springboot-eshop/
├── backend/                         # Spring Boot API
│   ├── src/main/java/com/giannis/eshop/
│   │   ├── controller/              # Auth, Product, Category, Order, Admin, Image
│   │   ├── service/                 # Business logic
│   │   ├── repository/              # Spring Data JPA
│   │   ├── entity/                  # JPA entities
│   │   └── config/                  # Security & app config
│   └── src/main/resources/db/migration/  # Flyway migrations
├── frontend/                        # Next.js app
│   └── src/app/
│       ├── products/                # Listing & detail
│       ├── cart/ checkout/          # Shopping flow
│       ├── account/ orders/         # Customer area
│       └── admin/                   # Admin dashboard
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose *(recommended — one command, zero setup)*
- Or locally: Node.js 20+, Java 25, PostgreSQL 16+

### 🐳 With Docker (recommended)

```bash
git clone https://github.com/GiannisF12/nextjs-springboot-eshop.git
cd nextjs-springboot-eshop
docker compose up --build
```

- Frontend → http://localhost:3000
- Backend API → http://localhost:8080

### 💻 Running locally

**Backend**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

Configuration is externalised via environment variables, keeping secrets out of the codebase.

| Variable | Purpose |
| --- | --- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Database credentials |
| `SPRING_DATASOURCE_URL` | JDBC connection string |
| `NEXT_PUBLIC_API_URL` | Backend base URL consumed by the frontend |

See `docker-compose.yml` for the full list.

---

## 🗺️ Roadmap

- [ ] Payment provider integration (Stripe)
- [ ] Product search & filtering
- [ ] Wishlist / saved items
- [ ] Email notifications for orders
- [x] ~~CI pipeline (GitHub Actions)~~ ✅
- [ ] CD pipeline — automated deployment on merge to main
- [ ] Observability: structured logging + metrics

---

## 👤 About the Author

Built by **Giannis Foras** — entry‑level full‑stack developer focused on modern Java and TypeScript.

- 💼 Open to junior / entry‑level full‑stack roles
- 📧 giannis.foras@gmail.com
- 🔗 [GitHub](https://github.com/GiannisF12)

> *Thanks for taking the time to read through this project. Feedback is always welcome.*
