# Misqabbi Store

## 🛍️ Description

This is the backend for the **Misqabbi Store**, an e-commerce platform that powers a women-owned fashion brand specializing in made-to-measure pieces designed exclusively for women.

Built with Node.js, Express, MongoDB, and Redis, this backend is designed for scalability & security

---

## ⚙️ Installation

### Prerequisites

- **Node.js** (v20 or higher)
- **Docker** and **Docker Compose**
- **MongoDB Atlas** account (or local MongoDB)

### Setup Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/anorme/misqabbi-backend.git
   ```

2. Navigate into the project directory:

   ```bash
   cd misqabbi-backend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy the `.env.template` to `.env` and fill in your values:
   ```bash
   cp env.template .env
   ```
   💡 > If you're on Windows and cp doesn't work, use Copy-Item in PowerShell.

---

## 🚀 Usage

### Development with Docker Compose

Start Redis and the backend service:

```bash
# Start all services
npm run docker:dev

# Or start in detached mode
npm run docker:dev:d

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Production

```bash
npm start
```

---

## 🤝 Contributing

We love contributions! To get started, please read our  
[Contributing Guide](CONTRIBUTING.md) for coding standards, commit conventions, and submission steps.

---

## 📄 License

This project does not currently have a license. Check back later for updates.

---
