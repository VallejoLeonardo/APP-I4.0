#!/usr/bin/env node

/**
 * Dependency Security Checker
 *
 * Checks for known vulnerabilities in npm dependencies
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

function checkNpmAudit() {
  console.log("🔍 Checking for dependency vulnerabilities...\n");

  try {
    // Run npm audit
    const auditResult = execSync("npm audit --audit-level moderate", {
      encoding: "utf8",
      cwd: process.cwd(),
    });

    console.log(
      "✅ No moderate or higher vulnerabilities found in dependencies"
    );
    return true;
  } catch (error) {
    if (error.stdout) {
      console.log("❌ Found dependency vulnerabilities:");
      console.log(error.stdout);
      console.log("\n💡 Run 'npm audit fix' to automatically fix issues");
      console.log("💡 Run 'npm audit fix --force' for major version upgrades");
    }
    return false;
  }
}

function checkOutdatedPackages() {
  console.log("\n🔄 Checking for outdated packages...\n");

  try {
    const outdatedResult = execSync("npm outdated", {
      encoding: "utf8",
      cwd: process.cwd(),
    });

    if (outdatedResult.trim()) {
      console.log("⚠️  Found outdated packages:");
      console.log(outdatedResult);
      console.log("💡 Run 'npm update' to update packages");
    } else {
      console.log("✅ All packages are up to date");
    }
  } catch (error) {
    // npm outdated exits with code 1 when outdated packages exist
    if (error.stdout && error.stdout.trim()) {
      console.log("⚠️  Found outdated packages:");
      console.log(error.stdout);
      console.log("💡 Run 'npm update' to update packages");
    } else {
      console.log("✅ All packages are up to date");
    }
  }
}

function checkPackageJson() {
  console.log("\n📦 Validating package.json security...\n");

  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    console.log("❌ package.json not found");
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const issues = [];

  // Check for security-related scripts
  const requiredScripts = ["security:check", "security:validate"];

  requiredScripts.forEach((script) => {
    if (!packageJson.scripts || !packageJson.scripts[script]) {
      issues.push(`Missing security script: ${script}`);
    }
  });

  // Check for security dependencies
  const securityDeps = ["helmet", "bcryptjs", "jsonwebtoken"];

  securityDeps.forEach((dep) => {
    if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
      issues.push(`Missing security dependency: ${dep}`);
    }
  });

  if (issues.length > 0) {
    console.log("⚠️  Package.json security issues:");
    issues.forEach((issue) => console.log(`   - ${issue}`));
  } else {
    console.log("✅ Package.json security configuration looks good");
  }

  return issues.length === 0;
}

function main() {
  console.log("🛡️  Dependency Security Scanner\n");
  console.log("==============================\n");

  const results = {
    audit: checkNpmAudit(),
    outdated: checkOutdatedPackages(),
    packageJson: checkPackageJson(),
  };

  console.log("\n📊 Security Scan Summary:");
  console.log(`   Vulnerabilities: ${results.audit ? "✅ None" : "❌ Found"}`);
  console.log(
    `   Package Security: ${results.packageJson ? "✅ Good" : "⚠️  Issues"}`
  );

  console.log("\n🔒 Security Recommendations:");
  console.log("   □ Run npm audit regularly");
  console.log("   □ Keep dependencies up to date");
  console.log("   □ Use npm audit fix for automatic fixes");
  console.log("   □ Review security advisories for major updates");
  console.log("   □ Consider using npm ci in production");

  if (!results.audit) {
    process.exit(1);
  }
}

main();
