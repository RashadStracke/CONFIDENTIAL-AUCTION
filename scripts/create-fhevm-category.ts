/**
 * @chapter: automation
 * FHEVM Category Generator Script
 *
 * This script creates standalone FHEVM repositories containing multiple examples
 * from a specific category (e.g., all basic examples, all access control examples).
 *
 * Usage:
 *   npx ts-node scripts/create-fhevm-category.ts <category> <output-path>
 *
 * Example:
 *   npx ts-node scripts/create-fhevm-category.ts basic ./my-basic-examples
 *
 * Available Categories:
 *   - basic: Basic FHE operations (counter, arithmetic, etc.)
 *   - encryption: Encryption examples
 *   - decryption: Decryption examples
 *   - access-control: Access control patterns
 *   - advanced: Advanced patterns (auction, voting, etc.)
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface CategoryExample {
  contractName: string;
  contractPath: string;
  testPath: string;
  description: string;
}

interface CategoryConfig {
  [category: string]: CategoryExample[];
}

/**
 * Define all example categories and their contracts
 */
const CATEGORY_EXAMPLES: CategoryConfig = {
  basic: [
    {
      contractName: "FHECounter",
      contractPath: "examples/basic/FHECounter.sol",
      testPath: "examples/basic/FHECounter.test.ts",
      description: "Simple encrypted counter demonstrating basic FHE operations",
    },
    {
      contractName: "FHEArithmetic",
      contractPath: "examples/basic/FHEArithmetic.sol",
      testPath: "test/FHEArithmetic.test.ts",
      description: "All FHE arithmetic operations (add, sub, mul, div, rem)",
    },
    {
      contractName: "FHEComparison",
      contractPath: "examples/basic/FHEComparison.sol",
      testPath: "test/FHEComparison.test.ts",
      description: "All FHE comparison operations (eq, ne, gt, gte, lt, lte)",
    },
  ],
  encryption: [
    {
      contractName: "EncryptSingleValue",
      contractPath: "examples/encryption/EncryptSingleValue.sol",
      testPath: "test/EncryptSingleValue.test.ts",
      description: "Demonstrates how to handle encrypted input values",
    },
    {
      contractName: "EncryptMultipleValues",
      contractPath: "examples/encryption/EncryptMultipleValues.sol",
      testPath: "test/EncryptMultipleValues.test.ts",
      description: "Batch encryption of multiple values in single transaction",
    },
  ],
  decryption: [
    {
      contractName: "UserDecryptSingleValue",
      contractPath: "examples/decryption/UserDecryptSingleValue.sol",
      testPath: "test/UserDecryptSingleValue.test.ts",
      description: "Shows user-controlled decryption patterns",
    },
    {
      contractName: "PublicDecryption",
      contractPath: "examples/decryption/PublicDecryption.sol",
      testPath: "test/PublicDecryption.test.ts",
      description: "Public decryption for on-chain result revealing",
    },
  ],
  "access-control": [
    {
      contractName: "AccessControlExample",
      contractPath: "examples/access-control/AccessControlExample.sol",
      testPath: "test/AccessControlExample.test.ts",
      description: "Demonstrates FHE access control patterns",
    },
  ],
  advanced: [
    {
      contractName: "PrivateVoting",
      contractPath: "examples/advanced/PrivateVoting.sol",
      testPath: "test/PrivateVoting.test.ts",
      description: "Advanced voting system with homomorphic tallying",
    },
    {
      contractName: "ConfidentialAuction",
      contractPath: "contracts/ConfidentialAuction.sol",
      testPath: "test/ConfidentialAuction.test.ts",
      description: "Blind auction with encrypted bids",
    },
  ],
  all: [
    {
      contractName: "FHECounter",
      contractPath: "examples/basic/FHECounter.sol",
      testPath: "examples/basic/FHECounter.test.ts",
      description: "Simple encrypted counter",
    },
    {
      contractName: "FHEArithmetic",
      contractPath: "examples/basic/FHEArithmetic.sol",
      testPath: "test/FHEArithmetic.test.ts",
      description: "FHE arithmetic operations",
    },
    {
      contractName: "FHEComparison",
      contractPath: "examples/basic/FHEComparison.sol",
      testPath: "test/FHEComparison.test.ts",
      description: "FHE comparison operations",
    },
    {
      contractName: "EncryptSingleValue",
      contractPath: "examples/encryption/EncryptSingleValue.sol",
      testPath: "test/EncryptSingleValue.test.ts",
      description: "Encryption patterns",
    },
    {
      contractName: "EncryptMultipleValues",
      contractPath: "examples/encryption/EncryptMultipleValues.sol",
      testPath: "test/EncryptMultipleValues.test.ts",
      description: "Batch encryption patterns",
    },
    {
      contractName: "UserDecryptSingleValue",
      contractPath: "examples/decryption/UserDecryptSingleValue.sol",
      testPath: "test/UserDecryptSingleValue.test.ts",
      description: "User decryption patterns",
    },
    {
      contractName: "PublicDecryption",
      contractPath: "examples/decryption/PublicDecryption.sol",
      testPath: "test/PublicDecryption.test.ts",
      description: "Public decryption patterns",
    },
    {
      contractName: "AccessControlExample",
      contractPath: "examples/access-control/AccessControlExample.sol",
      testPath: "test/AccessControlExample.test.ts",
      description: "Access control patterns",
    },
    {
      contractName: "PrivateVoting",
      contractPath: "examples/advanced/PrivateVoting.sol",
      testPath: "test/PrivateVoting.test.ts",
      description: "Advanced voting system",
    },
    {
      contractName: "ConfidentialAuction",
      contractPath: "contracts/ConfidentialAuction.sol",
      testPath: "test/ConfidentialAuction.test.ts",
      description: "Blind auction implementation",
    },
  ],
};

/**
 * Parse command line arguments
 */
function parseArguments(args: string[]): {
  category: string;
  outputPath: string;
} {
  if (args.length < 2) {
    console.error(
      "Usage: npx ts-node scripts/create-fhevm-category.ts <category> <output-path>"
    );
    console.error(
      "\nAvailable categories:",
      Object.keys(CATEGORY_EXAMPLES).join(", ")
    );
    process.exit(1);
  }

  const category = args[0].toLowerCase();
  const outputPath = args[1];

  if (!CATEGORY_EXAMPLES[category]) {
    console.error(`Unknown category: ${category}`);
    console.error(
      "Available categories:",
      Object.keys(CATEGORY_EXAMPLES).join(", ")
    );
    process.exit(1);
  }

  return { category, outputPath };
}

/**
 * Validate base template exists
 */
function validateTemplate(templatePath: string): void {
  if (!fs.existsSync(templatePath)) {
    console.error(`Template not found at ${templatePath}`);
    process.exit(1);
  }
}

/**
 * Create output directory structure
 */
function createDirectoryStructure(outputPath: string): void {
  const dirs = [
    outputPath,
    path.join(outputPath, "contracts"),
    path.join(outputPath, "test"),
    path.join(outputPath, "scripts"),
    path.join(outputPath, "docs"),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Copy file recursively
 */
function copyFile(src: string, dest: string): void {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

/**
 * Copy entire directory
 */
function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  for (const file of files) {
    if (file === "node_modules" || file === ".git") continue;

    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

/**
 * Update package.json for category project
 */
function updatePackageJson(
  outputPath: string,
  category: string,
  examples: CategoryExample[]
): void {
  const packageJsonPath = path.join(outputPath, "package.json");

  let packageJson = {
    name: `fhevm-${category}-examples`,
    version: "1.0.0",
    description: `FHEVM ${category} examples demonstrating FHE concepts`,
    main: "index.js",
    scripts: {
      compile: "hardhat compile",
      test: "hardhat test",
      deploy: "hardhat run scripts/deploy.ts",
      "deploy:sepolia": "cross-env NETWORK=sepolia hardhat run scripts/deploy.ts --network sepolia",
      verify: "hardhat verify",
      clean: "hardhat clean",
      typechain: "hardhat typechain",
      coverage: "hardhat coverage",
    },
    keywords: ["fhevm", "fhe", "zama", "confidential", "examples", category],
    author: "",
    license: "BSD-3-Clause-Clear",
    dependencies: {
      "@fhevm/solidity": "^0.7.0",
      "@openzeppelin/contracts": "^5.1.0",
    },
    devDependencies: {
      "@nomicfoundation/hardhat-toolbox": "^5.0.0",
      "@nomicfoundation/hardhat-verify": "^2.0.0",
      "@typechain/ethers-v6": "^0.5.0",
      "@typechain/hardhat": "^9.0.0",
      "@types/chai": "^4.3.0",
      "@types/mocha": "^10.0.0",
      "@types/node": "^20.0.0",
      chai: "^4.3.0",
      "cross-env": "^7.0.3",
      dotenv: "^16.0.0",
      ethers: "^6.8.0",
      hardhat: "^2.24.3",
      "hardhat-gas-reporter": "^1.0.9",
      "solidity-coverage": "^0.8.0",
      "ts-node": "^10.9.0",
      typechain: "^8.3.0",
      typescript: "^5.0.0",
    },
  };

  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n"
  );
}

/**
 * Generate README for category project
 */
function generateReadme(
  outputPath: string,
  category: string,
  examples: CategoryExample[]
): void {
  const readmePath = path.join(outputPath, "README.md");

  let content = `# FHEVM ${category.charAt(0).toUpperCase() + category.slice(1)} Examples

This repository contains multiple FHEVM example contracts demonstrating ${category} concepts.

## Included Examples\n\n`;

  for (const example of examples) {
    content += `### ${example.contractName}\n`;
    content += `**File:** \`contracts/${example.contractName}.sol\`\n`;
    content += `**Test:** \`test/${example.contractName}.test.ts\`\n`;
    content += `**Description:** ${example.description}\n\n`;
  }

  content += `## Quick Start

### Installation
\`\`\`bash
npm install
\`\`\`

### Compilation
\`\`\`bash
npm run compile
\`\`\`

### Testing
\`\`\`bash
npm run test
\`\`\`

### Deployment
\`\`\`bash
npm run deploy
\`\`\`

## Development Workflow

1. Review example contracts in \`contracts/\`
2. Study tests in \`test/\`
3. Modify contracts for your use case
4. Add tests for new functionality
5. Run tests to verify

## Key Files

- **contracts/** - Smart contracts for each example
- **test/** - Test suites for all contracts
- **hardhat.config.ts** - Hardhat configuration
- **package.json** - Dependencies and scripts

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org)
- [Solidity Documentation](https://docs.soliditylang.org)

## License

BSD-3-Clause-Clear License
`;

  fs.writeFileSync(readmePath, content);
}

/**
 * Copy example contracts and tests
 */
function copyExamples(
  outputPath: string,
  category: string,
  examples: CategoryExample[]
): void {
  const baseDir = path.dirname(__dirname); // Project root

  for (const example of examples) {
    const contractSrc = path.join(baseDir, example.contractPath);
    const contractDest = path.join(outputPath, "contracts", `${example.contractName}.sol`);

    if (fs.existsSync(contractSrc)) {
      copyFile(contractSrc, contractDest);
      console.log(`✓ Copied ${example.contractName}.sol`);
    } else {
      console.warn(`⚠ Contract not found: ${contractSrc}`);
    }

    // Create template test if not exists
    const testDest = path.join(outputPath, "test", `${example.contractName}.test.ts`);
    if (!fs.existsSync(testDest)) {
      createTestTemplate(testDest, example.contractName);
    }
  }
}

/**
 * Create test template for contract
 */
function createTestTemplate(testPath: string, contractName: string): void {
  const testContent = `/**
 * @chapter: testing
 * ${contractName} Tests
 *
 * This test file demonstrates testing patterns for FHEVM contracts.
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import type { ${contractName} } from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("${contractName}", function () {
  let contract: ${contractName};
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const ContractFactory = await ethers.getContractFactory(
      "${contractName}"
    );
    contract = await ContractFactory.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const address = await contract.getAddress();
      expect(address).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Core Functionality", function () {
    // Add your tests here
    // See base project README for testing patterns and examples
  });
});
`;

  const testDir = path.dirname(testPath);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  fs.writeFileSync(testPath, testContent);
  console.log(`✓ Created test template: ${contractName}.test.ts`);
}

/**
 * Copy base template files
 */
function copyTemplateFiles(outputPath: string): void {
  const baseDir = path.dirname(__dirname); // Project root
  const templateDir = path.join(baseDir, "base-template");

  const filesToCopy = [
    "hardhat.config.ts",
    "tsconfig.json",
    ".gitignore",
    ".env.example",
  ];

  for (const file of filesToCopy) {
    const src = path.join(templateDir, file);
    const dest = path.join(outputPath, file);

    if (fs.existsSync(src)) {
      copyFile(src, dest);
      console.log(`✓ Copied ${file}`);
    }
  }

  // Copy scripts directory
  const scriptsSrc = path.join(templateDir, "scripts");
  const scriptsDest = path.join(outputPath, "scripts");
  if (fs.existsSync(scriptsSrc)) {
    copyDirectory(scriptsSrc, scriptsDest);
    console.log("✓ Copied scripts directory");
  }
}

/**
 * Main function
 */
async function main() {
  const { category, outputPath } = parseArguments(process.argv.slice(2));
  const examples = CATEGORY_EXAMPLES[category];
  const templatePath = path.join(path.dirname(__dirname), "base-template");

  console.log(`\nGenerating FHEVM ${category} Examples`);
  console.log(`Output: ${outputPath}\n`);

  // Validate and create structure
  validateTemplate(templatePath);
  createDirectoryStructure(outputPath);

  // Copy template files
  copyTemplateFiles(outputPath);

  // Update package.json
  updatePackageJson(outputPath, category, examples);
  console.log("✓ Updated package.json");

  // Copy examples
  copyExamples(outputPath, category, examples);

  // Generate documentation
  generateReadme(outputPath, category, examples);
  console.log("✓ Generated README.md");

  console.log("\n✅ Category project created successfully!\n");
  console.log("Next steps:");
  console.log(`  cd ${outputPath}`);
  console.log("  npm install");
  console.log("  npm run compile");
  console.log("  npm run test");
}

// Execute
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
