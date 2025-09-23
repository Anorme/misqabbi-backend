# Contributing to Misqabbi Store

Thanks for your interest in contributing to **Misqabbi Store**! We appreciate your time and effort—whether you're fixing bugs, improving docs, or building new features.

---

## 🚀 Getting Started

1. **Report Issues**  
   Use [GitHub Issues](https://github.com/anorme/misqabbi-backend/issues) to report bugs, suggest enhancements, or ask questions.

2. **Fork the Repository**  
   Clone your fork and create a new branch:

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Your Changes**  
   Code, test, document as needed. For work related to authentication or middleware, refer to [Migration Issue #3](https://github.com/anorme/misqabbi-backend/issues/3) for current implementation notes.

4. **Commit with a Meaningful Message**  
   Follow our commit message convention (see below).

5. **Push and Submit a Pull Request (PR)**  
   Push to your branch and open a PR with a clear summary of your changes.

---

### Branch Naming Conventions

When creating a new branch, name it in a way that clearly indicates the purpose of the changes. This helps us quickly identify the intent of the PR and makes it easier to review and merge changes.

Use the following format: `<type>/<scope>`

#### Examples

- `feature/search`: Adding search functionality to the store
- `feature/authentication`: Implementing authentication using JWT
- `fix/auth`: Fixing a bug in the authentication flow
- `docs/token`: Updating documentation for the token endpoint
- `refactor/products`: Refactoring the products endpoint for better performance

#### Types

- `feature`: New feature development
- `fix`: Bug fix
- `chore`: Maintenance, tooling, config updates
- `docs`: Documentation only
- `style`: Code formatting (e.g., Prettier), no logic change
- `refactor`: Code change with no behavior change
- `test`: Adding or updating tests
- `perf`: Performance improvements

#### Scopes

- `auth`: Authentication related changes
- `middleware`: Middleware related changes
- `cart`: Cart related changes
- `products`: Products related changes
- `token`: Token endpoint related changes

By following these conventions, we can keep our branch names consistent and descriptive, making it easier for everyone to understand the purpose of the PR.

---

## 🧠 Commit Message Guidelines

We use conventional commits to keep our Git history readable and consistent. Follow this format:

```
<type>(<scope>): <short summary>

<body (optional)>
```

### Common Commit Types

- feat – New feature
- fix – Bug fix
- chore – Maintenance, tooling, config updates
- docs – Documentation only
- style – Code formatting (e.g., Prettier), no logic change
- refactor – Code change with no behavior change
- test – Adding or updating tests
- perf – Performance improvements

### Scope

Optional but helpful. Examples: `auth`, `middleware`, `checkout-ui`, `cart`, `products`, etc.

### Examples

```
feat(auth): implement JWT-based login flow
fix(cart): prevent crash on empty product list
style(layout): adjust footer spacing on mobile
docs(readme): update project setup instructions
```

---

## 📏 Code Style & Standards

- Use JavaScript/TypeScript best practices
- Format code using Prettier (config included)
- Write clean, modular, maintainable code
- Use descriptive variable and function names

---

## 🧪 Testing

- Ensure all tests pass before submitting a PR
- Add tests for any new functionality when applicable

---

## 🤝 Code Reviews

- Keep pull requests focused and concise
- Address feedback promptly
- Be respectful and constructive in discussions

---
