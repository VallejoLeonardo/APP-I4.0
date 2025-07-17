# Security CI/CD Configuration

## GitHub Actions Example

```yaml
name: Security Checks

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: Proyecto/package-lock.json

      - name: Install dependencies
        run: |
          cd Proyecto
          npm ci

      - name: Run security audit
        run: |
          cd Proyecto
          npm audit --audit-level moderate

      - name: Check for hardcoded secrets
        run: |
          cd Proyecto
          npm run security:check

      - name: Validate dependencies
        run: |
          cd Proyecto
          npm run security:deps

      - name: Build project
        run: |
          cd Proyecto
          npm run build
```

## Pre-commit Hook Configuration

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "🔐 Running security checks..."

cd Proyecto

# Check for hardcoded secrets
npm run security:check
if [ $? -ne 0 ]; then
    echo "❌ Security check failed"
    exit 1
fi

# Validate dependencies
npm run security:deps
if [ $? -ne 0 ]; then
    echo "❌ Dependency check failed"
    exit 1
fi

echo "✅ Security checks passed"
```

## Environment Variables for Production

```bash
# Required environment variables
JWT_SECRET=<generate-with-crypto>
USER_DB_URI=mongodb://...
ORDENES_DB_URI=mongodb://...
ROLES_DB_URI=mongodb://...
PRODUCTOS_DB_URI=mongodb://...

# Optional but recommended
NODE_ENV=production
PORT=3000
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12
```
