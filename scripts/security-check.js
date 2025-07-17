#!/usr/bin/env node

/**
 * Security Script - Generate secure secrets and validate configuration
 *
 * This script helps generate secure JWT secrets and validates that no
 * hardcoded secrets are present in the codebase.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Generate a secure JWT secret
function generateJWTSecret() {
  return crypto.randomBytes(64).toString("hex");
}

// Generate a secure bcrypt salt
function generateBcryptSalt() {
  // Return a secure salt rounds value between 12-14
  return 12;
}

// Check for hardcoded secrets in files
function checkForHardcodedSecrets(directory) {
  const issues = [];
  const suspiciousPatterns = [
    // More specific patterns to avoid false positives
    /password\s*[:=]\s*["'][^"']{8,}["']/gi,
    /secret\s*[:=]\s*["'][^"']{16,}["']/gi,
    /key\s*[:=]\s*["'][^"']{16,}["']/gi,
    /token\s*[:=]\s*["'][a-zA-Z0-9+/]{20,}["']/gi,
    // Exclude common words and variables
    /(?<!errorMessage\s*=\s*)["'][a-zA-Z0-9+/]{32,}["'](?!\s*;?\s*\/\/|\/\*)/gi,
  ];

  function scanFile(filePath) {
    if (filePath.includes("node_modules") || filePath.includes(".git")) {
      return;
    }

    const content = fs.readFileSync(filePath, "utf8");

    suspiciousPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          // Filter out common false positives
          const falsePositives = [
            /errorMessage\s*=\s*["']/i,
            /message:\s*["']/i,
            /code:\s*["']/i,
            /console\./i,
            /log\s*\(/i,
            /error\s*\(/i,
            /throw\s+new/i,
          ];

          const isFalsePositive = falsePositives.some((fp) =>
            content
              .substring(
                content.indexOf(match) - 50,
                content.indexOf(match) + 50
              )
              .match(fp)
          );

          if (!isFalsePositive) {
            issues.push(
              `Potential hardcoded secret in ${filePath}: ${match.substring(
                0,
                50
              )}...`
            );
          }
        });
      }
    });
  }

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (
        stat.isFile() &&
        (item.endsWith(".ts") || item.endsWith(".js"))
      ) {
        scanFile(fullPath);
      }
    });
  }

  scanDirectory(directory);
  return issues;
}

// Validate environment configuration
function validateEnvironment() {
  console.log("🔍 Validating environment configuration...\n");

  const requiredVars = [
    "JWT_SECRET",
    "USER_DB_URI",
    "ORDENES_DB_URI",
    "ROLES_DB_URI",
    "PRODUCTOS_DB_URI",
  ];

  const recommendations = [
    "JWT_EXPIRES_IN",
    "BCRYPT_SALT_ROUNDS",
    "NODE_ENV",
    "PORT",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);
  const missingRecommended = recommendations.filter(
    (varName) => !process.env[varName]
  );

  if (missing.length > 0) {
    console.log("❌ Missing required environment variables:");
    missing.forEach((varName) => console.log(`   - ${varName}`));
    console.log("");
  }

  if (missingRecommended.length > 0) {
    console.log("⚠️  Missing recommended environment variables:");
    missingRecommended.forEach((varName) => console.log(`   - ${varName}`));
    console.log("");
  }

  if (missing.length === 0 && missingRecommended.length === 0) {
    console.log("✅ All environment variables are properly configured!\n");
  }
}

// Main execution
function main() {
  console.log("🔐 Security Configuration Validator\n");
  console.log("=====================================\n");

  // Generate new secrets
  console.log("🔑 Generated secure secrets:");
  console.log(`JWT_SECRET=${generateJWTSecret()}`);
  console.log(`BCRYPT_SALT_ROUNDS=${generateBcryptSalt()}`);
  console.log("");
  console.log("💡 Copy the JWT_SECRET to your .env file\n");

  // Validate environment
  validateEnvironment();

  // Check for hardcoded secrets
  console.log("🕵️  Scanning for hardcoded secrets...");
  const srcPath = path.join(process.cwd(), "src");

  if (fs.existsSync(srcPath)) {
    const issues = checkForHardcodedSecrets(srcPath);

    if (issues.length > 0) {
      console.log("❌ Found potential security issues:");
      issues.forEach((issue) => console.log(`   ${issue}`));
    } else {
      console.log("✅ No hardcoded secrets found in source code");
    }
  } else {
    console.log("⚠️  Source directory not found, skipping scan");
  }

  console.log("\n🛡️  Security scan complete!");
  console.log("\n📋 Security Checklist:");
  console.log("   □ Set JWT_SECRET in .env file");
  console.log("   □ Add .env to .gitignore");
  console.log("   □ Use HTTPS in production");
  console.log("   □ Implement rate limiting");
  console.log("   □ Regular security updates");
}

// Run if called directly
main();

export {
  generateJWTSecret,
  generateBcryptSalt,
  checkForHardcodedSecrets,
  validateEnvironment,
};
