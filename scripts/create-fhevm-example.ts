/**
 * @chapter: automation
 * FHEVM Example Generator Script
 *
 * This script automates the creation of standalone FHEVM example repositories.
 * It clones a base template and customizes it with specific contracts and tests.
 *
 * Usage:
 *   npx ts-node scripts/create-fhevm-example.ts <name> <category> [--description="..."]
 *
 * Example:
 *   npx ts-node scripts/create-fhevm-example.ts fhevm-counter basic --description="Simple FHE counter"
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface ExampleConfig {
  name: string;
  category: string;
  description: string;
  templatePath: string;
  outputPath: string;
}

/**
 * Parses command line arguments
 * @param args - Command line arguments
 * @returns Parsed configuration
 */
function parseArguments(args: string[]): ExampleConfig {
  if (args.length < 2) {
    console.error(
      "Usage: npx ts-node scripts/create-fhevm-example.ts <name> <category> [--description='...']"
    );
    process.exit(1);
  }

  const name = args[0];
  const category = args[1];

  let description = `FHEVM Example: ${name}`;

  // Parse description from args
  for (const arg of args.slice(2)) {
    if (arg.startsWith("--description=")) {
      description = arg.replace("--description=", "").replace(/['"]/g, "");
    }
  }

  return {
    name,
    category,
    description,
    templatePath: path.join(__dirname, "..", "base-template"),
    outputPath: path.join(process.cwd(), `examples`, `${name}`),
  };
}

/**
 * Validates that the template exists
 * @param templatePath - Path to template directory
 */
function validateTemplate(templatePath: string): void {
  if (!fs.existsSync(templatePath)) {
    console.error(`Template not found at ${templatePath}`);
    console.error("Please ensure base-template/ directory exists");
    process.exit(1);
  }

  const requiredFiles = [
    "hardhat.config.ts",
    "package.json",
    "contracts",
    "test",
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(templatePath, file);
    if (!fs.existsSync(filePath)) {
      console.error(`Required template file missing: ${file}`);
      process.exit(1);
    }
  }
}

/**
 * Creates output directory structure
 * @param outputPath - Path where to create the example
 */
function createDirectoryStructure(outputPath: string): void {
  const dirs = [
    outputPath,
    path.join(outputPath, "contracts"),
    path.join(outputPath, "test"),
    path.join(outputPath, "scripts"),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Copies template files to output directory
 * @param templatePath - Source template path
 * @param outputPath - Destination output path
 */
function copyTemplateFiles(templatePath: string, outputPath: string): void {
  const filesToCopy = [
    "hardhat.config.ts",
    "tsconfig.json",
    "package.json",
    ".gitignore",
  ];

  for (const file of filesToCopy) {
    const src = path.join(templatePath, file);
    const dst = path.join(outputPath, file);

    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      fs.copyFileSync(src, dst);
    }
  }
}

/**
 * Updates package.json with example-specific information
 * @param config - Example configuration
 */
function updatePackageJson(config: ExampleConfig): void {
  const packagePath = path.join(config.outputPath, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

  packageJson.name = `fhevm-example-${config.name}`;
  packageJson.description = config.description;
  packageJson.version = "1.0.0";
  packageJson.keywords = [
    "fhevm",
    "fhe",
    "confidential-contracts",
    "zama",
    config.category,
  ];

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
}

/**
 * Creates README.md for the example
 * @param config - Example configuration
 */
function createReadme(config: ExampleConfig): void {
  const readme = `# ${config.name}

## Description
${config.description}

## Category
\`${config.category}\`

## Overview
This is a standalone FHEVM example demonstrating concepts related to **${config.category}**.

## Quick Start

### Installation
\`\`\`bash
npm install
\`\`\`

### Compile
\`\`\`bash
npm run compile
\`\`\`

### Test
\`\`\`bash
npm run test
\`\`\`

### Deploy
\`\`\`bash
npm run deploy:sepolia
\`\`\`

## Key Concepts

This example demonstrates:
- FHEVM smart contract development
- \`${config.category}\` patterns and best practices
- Encrypted data handling
- Security considerations

## Files

- \`contracts/\` - Smart contract implementations
- \`test/\` - Comprehensive test suites
- \`scripts/\` - Deployment and utility scripts
- \`hardhat.config.ts\` - Hardhat configuration

## Testing

Run the complete test suite:
\`\`\`bash
npm run test
\`\`\`

View test coverage:
\`\`\`bash
npm run coverage
\`\`\`

## Security Considerations

- All tests should pass before deployment
- Review contract code for security vulnerabilities
- Consider formal verification for production use
- Follow FHEVM best practices

## Deployment

This example is configured for deployment to:
- Local network (hardhat)
- Zama Devnet
- Ethereum Sepolia Testnet (with FHEVM)
- Production networks (with caution)

## References

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)

## Support

For questions or issues:
1. Check the documentation
2. Review test examples
3. Refer to FHEVM community forums
4. Check GitHub issues

---
Generated by create-fhevm-example.ts
`;

  const readmePath = path.join(config.outputPath, "README.md");
  fs.writeFileSync(readmePath, readme);
}

/**
 * Creates template contract file
 * @param config - Example configuration
 */
function createTemplateContract(config: ExampleConfig): void {
  const contractName = config.name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  const contract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";

/**
 * @chapter: ${config.category}
 * Example contract for ${config.name}
 *
 * This contract demonstrates FHE concepts related to: ${config.category}
 */
contract ${contractName} {
    using FHE for euint64;
    using FHE for ebool;

    // State variables
    euint64 private encryptedValue;

    // Events
    event ValueUpdated(uint256 timestamp);
    event OperationPerformed(string operation);

    constructor() {
        // Initialize contract
        encryptedValue = FHE.asEuint64(0);
    }

    /**
     * @chapter: ${config.category}
     * Updates encrypted value with new input
     */
    function updateValue(externalEuint64 input, bytes calldata proof) public {
        // Decrypt external input
        euint64 decrypted = FHE.fromExternal(input, proof);

        // Update encrypted state
        encryptedValue = decrypted;

        // Grant access permissions
        FHE.allowThis(encryptedValue);
        FHE.allow(encryptedValue, msg.sender);

        emit ValueUpdated(block.timestamp);
    }

    /**
     * @chapter: ${config.category}
     * Performs encrypted operation (example: addition)
     */
    function add(euint64 value) public {
        // Perform operation on encrypted data
        encryptedValue = encryptedValue.add(value);

        // Grant permissions
        FHE.allowThis(encryptedValue);
        FHE.allow(encryptedValue, msg.sender);

        emit OperationPerformed("add");
    }

    /**
     * @chapter: ${config.category}
     * Demonstrates encrypted comparison
     * @dev Cannot return boolean directly from encrypted comparison
     */
    function compareWithValue(euint64 other) public {
        ebool result = encryptedValue.gt(other);

        // Result is encrypted - cannot be used in plaintext
        emit OperationPerformed("compare");
    }
}
`;

  const contractPath = path.join(
    config.outputPath,
    "contracts",
    `${contractName}.sol`
  );
  fs.writeFileSync(contractPath, contract);
}

/**
 * Creates template test file
 * @param config - Example configuration
 */
function createTemplateTest(config: ExampleConfig): void {
  const contractName = config.name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  const test = `import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * @chapter: ${config.category}
 * Test suite for ${contractName}
 */
describe("${contractName}", function () {
  let contract: any;
  let owner: any;
  let user1: any;

  beforeEach(async function () {
    // Deploy contract
    const Factory = await ethers.getContractFactory("${contractName}");
    contract = await Factory.deploy();
    await contract.waitForDeployment();

    [owner, user1] = await ethers.getSigners();
  });

  describe("Initialization", function () {
    /**
     * @chapter: ${config.category}
     * Test contract deploys successfully
     */
    it("should deploy successfully", async function () {
      expect(await contract.getAddress()).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Core Functionality", function () {
    /**
     * @chapter: ${config.category}
     * Test basic operation
     */
    it("should perform basic operation", async function () {
      // Add your test implementation here
      expect(true).to.be.true;
    });

    /**
     * @chapter: ${config.category}
     * Test access control
     */
    it("should enforce access control", async function () {
      // Add your access control tests here
      expect(owner.address).to.not.equal(user1.address);
    });
  });

  describe("FHE Operations", function () {
    /**
     * @chapter: ${config.category}
     * Test encrypted operations
     */
    it("should handle encrypted data", async function () {
      // Test encrypted data operations
      expect(contract).to.exist;
    });
  });
});
`;

  const testPath = path.join(
    config.outputPath,
    "test",
    `${contractName}.test.ts`
  );
  fs.writeFileSync(testPath, test);
}

/**
 * Creates .gitignore file
 * @param config - Example configuration
 */
function createGitignore(config: ExampleConfig): void {
  const gitignore = `# Dependencies
node_modules/
package-lock.json

# Build outputs
artifacts/
typechain-types/
dist/

# Hardhat
.hardhat_node/
cache/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
`;

  const gitignorePath = path.join(config.outputPath, ".gitignore");
  fs.writeFileSync(gitignorePath, gitignore);
}

/**
 * Logs summary of created files
 * @param config - Example configuration
 */
function logSummary(config: ExampleConfig): void {
  console.log("\n" + "=".repeat(60));
  console.log("✓ FHEVM Example Generated Successfully");
  console.log("=".repeat(60));
  console.log(`\nExample: ${config.name}`);
  console.log(`Category: ${config.category}`);
  console.log(`Location: ${config.outputPath}`);
  console.log(`\nNext Steps:`);
  console.log(`  1. cd ${config.outputPath}`);
  console.log(`  2. npm install`);
  console.log(`  3. npm run compile`);
  console.log(`  4. npm run test`);
  console.log(`\nFiles Created:`);
  console.log(`  ✓ contracts/ - Smart contract files`);
  console.log(`  ✓ test/ - Test suites`);
  console.log(`  ✓ hardhat.config.ts - Configuration`);
  console.log(`  ✓ package.json - Dependencies`);
  console.log(`  ✓ README.md - Documentation`);
  console.log("\n" + "=".repeat(60) + "\n");
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    console.log("Creating FHEVM Example Repository...\n");

    // Parse arguments
    const config = parseArguments(process.argv.slice(2));

    // Validate template
    console.log("Validating template...");
    validateTemplate(config.templatePath);

    // Create directory structure
    console.log("Creating directory structure...");
    createDirectoryStructure(config.outputPath);

    // Copy template files
    console.log("Copying template files...");
    copyTemplateFiles(config.templatePath, config.outputPath);

    // Update package.json
    console.log("Updating package.json...");
    updatePackageJson(config);

    // Create README
    console.log("Creating README.md...");
    createReadme(config);

    // Create contract template
    console.log("Creating contract template...");
    createTemplateContract(config);

    // Create test template
    console.log("Creating test template...");
    createTemplateTest(config);

    // Create .gitignore
    console.log("Creating .gitignore...");
    createGitignore(config);

    // Log summary
    logSummary(config);
  } catch (error) {
    console.error("Error creating example:", error);
    process.exit(1);
  }
}

// Execute main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
