# FHEVM Automation Scripts

This directory contains TypeScript scripts for automating FHEVM example creation and documentation generation.

## Scripts Overview

### 1. create-fhevm-example.ts

Creates standalone FHEVM example repositories containing a single contract and its tests.

**Usage:**
```bash
npx ts-node scripts/create-fhevm-example.ts <name> <category> [--description="..."]
```

**Examples:**
```bash
# Create a simple counter example
npx ts-node scripts/create-fhevm-example.ts fhe-counter basic --description="Simple encrypted counter"

# Create a voting example
npx ts-node scripts/create-fhevm-example.ts voting access-control --description="Private voting mechanism"
```

**Output:**
```
examples/
├── fhe-counter/              # Standalone repository
│   ├── contracts/
│   ├── test/
│   ├── scripts/
│   ├── hardhat.config.ts
│   ├── package.json
│   └── README.md
└── voting/
    ├── contracts/
    ├── test/
    ├── scripts/
    ├── hardhat.config.ts
    ├── package.json
    └── README.md
```

**What it does:**
1. Clones base-template directory structure
2. Copies specified contract and test files
3. Updates package.json with example name and description
4. Generates a README with setup instructions
5. Creates ready-to-run Hardhat project

**Benefits:**
- Each example is a complete, standalone project
- Can be cloned, developed, and shared independently
- Self-contained dependencies via package.json
- Includes all necessary configuration files

### 2. create-fhevm-category.ts

Creates FHEVM example repositories containing multiple contracts from a category.

**Usage:**
```bash
npx ts-node scripts/create-fhevm-category.ts <category> <output-path>
```

**Available Categories:**
- `basic` - Basic FHE operations
- `encryption` - Encryption examples
- `decryption` - Decryption examples
- `access-control` - Access control patterns
- `advanced` - Advanced patterns (voting, auction, etc.)
- `all` - All examples combined

**Examples:**
```bash
# Create basic examples collection
npx ts-node scripts/create-fhevm-category.ts basic ./my-basic-examples

# Create access control examples
npx ts-node scripts/create-fhevm-category.ts access-control ./my-access-control

# Create all examples
npx ts-node scripts/create-fhevm-category.ts all ./all-examples
```

**Output:**
```
my-basic-examples/
├── contracts/
│   ├── FHECounter.sol
│   └── (other contracts in category)
├── test/
│   ├── FHECounter.test.ts
│   └── (other tests in category)
├── scripts/
├── hardhat.config.ts
├── package.json
└── README.md
```

**What it does:**
1. Creates base template structure
2. Copies all contracts from specified category
3. Copies all corresponding tests
4. Generates unified package.json
5. Creates comprehensive README with all examples listed

**Benefits:**
- Learn multiple related concepts in one project
- Understand progression from basic to advanced
- Unified development environment
- All examples compile and test together

### 3. generate-docs.ts

Generates GitBook-compatible documentation from Solidity and TypeScript code.

**Usage:**
```bash
npx ts-node scripts/generate-docs.ts [example-name | --all]
```

**Examples:**
```bash
# Generate docs for specific example
npx ts-node scripts/generate-docs.ts fhe-counter

# Generate docs for all examples
npx ts-node scripts/generate-docs.ts --all

# Generate with custom output directory
npx ts-node scripts/generate-docs.ts fhe-counter --output=custom-docs
```

**Output Structure:**
```
docs/
├── SUMMARY.md              # GitBook index
├── basic/
│   ├── fhe-counter.md
│   └── (other examples)
├── advanced/
│   ├── voting.md
│   └── (other examples)
└── (more categories)
```

**Features:**
- Extracts contract code and comments
- Extracts test code and documentation
- Organizes by category
- Generates GitBook-compatible SUMMARY.md
- Includes code examples with syntax highlighting

**Documentation Annotations:**

Use `@chapter` tags in comments to organize documentation:

```solidity
/**
 * @chapter: basic-operations
 * FHE Counter
 *
 * This contract demonstrates basic FHE counter operations.
 */
contract FHECounter {
  // ...
}
```

```typescript
/**
 * @chapter: testing
 * FHE Counter Tests
 *
 * Tests for the FHE counter contract.
 */
describe("FHECounter", function () {
  // ...
});
```

## Usage with npm Scripts

### From Project Root

```bash
# Create single example
npm run create:example -- fhe-counter basic

# Create category
npm run create:category -- basic ./examples/basic

# Generate documentation
npm run generate:docs

# Create all predefined categories
npm run examples:create-all

# Watch for changes and regenerate docs
npm run docs:watch
```

### Predefined npm Scripts

```bash
# Create specific categories
npm run create:basic-examples
npm run create:encryption-examples
npm run create:decryption-examples
npm run create:access-control-examples
npm run create:advanced-examples
npm run create:all-examples

# Documentation
npm run docs
npm run docs:watch

# Help
npm run help:categories
```

## Workflow Examples

### Creating a New Example

1. Write your contract in `contracts/`
2. Write tests in `test/`
3. Add `@chapter` tags to comments
4. Create standalone example:
   ```bash
   npm run create:example -- my-example <category>
   ```
5. Navigate to generated example:
   ```bash
   cd examples/my-example
   npm install
   npm run test
   ```

### Creating a Category Collection

1. Organize related contracts by category
2. Create category-specific directories:
   ```
   examples/
   ├── encryption/
   │   ├── Encrypt.sol
   │   └── Encrypt.test.ts
   └── decryption/
       ├── Decrypt.sol
       └── Decrypt.test.ts
   ```
3. Update CATEGORY_EXAMPLES in create-fhevm-category.ts
4. Generate category project:
   ```bash
   npm run create:category -- encryption ./my-encryption-examples
   ```

### Generating Documentation

1. Ensure all contracts and tests have `@chapter` tags
2. Generate documentation:
   ```bash
   npm run generate:docs
   ```
3. Convert to GitBook:
   ```bash
   npx gitbook init docs
   npx gitbook serve docs
   ```

## Configuration

### Base Template Location

Scripts expect base-template at:
```
project-root/
├── base-template/
│   ├── contracts/
│   ├── test/
│   ├── scripts/
│   ├── hardhat.config.ts
│   ├── package.json
│   └── README.md
└── scripts/
    └── (this file)
```

### Output Directories

By default:
- Examples created in: `examples/<name>`
- Categories created in: `examples-output/<category>`
- Documentation generated to: `docs/`

These can be customized via command-line arguments.

## Environment Setup

### Prerequisites
- Node.js v18.0.0 or higher
- npm v8.0.0 or higher
- TypeScript v5.0.0 or higher

### Installation
```bash
npm install
```

### Running Scripts

```bash
# Using ts-node directly
npx ts-node scripts/create-fhevm-example.ts <args>

# Using npm scripts
npm run create:example -- <args>

# Using npm scripts with categories
npm run create:category -- <category> <output>
```

## Troubleshooting

### Script not found
```bash
# Ensure you're in project root
cd /path/to/ConfidentialAuction

# Verify scripts exist
ls scripts/
```

### Template not found error
```bash
# Verify base-template exists
ls base-template/

# Check base-template has required files
ls base-template/hardhat.config.ts
ls base-template/package.json
```

### Module not found errors
```bash
# Ensure dependencies installed
npm install

# Clear cache
npm run clean
```

### Compilation errors
```bash
# Verify Solidity version compatibility
grep "pragma solidity" contracts/*.sol
grep "solidityVersion" hardhat.config.ts
```

## Advanced Usage

### Custom Example Categories

Edit `create-fhevm-category.ts` to add new categories:

```typescript
const CATEGORY_EXAMPLES: CategoryConfig = {
  "my-category": [
    {
      contractName: "MyContract",
      contractPath: "examples/my-category/MyContract.sol",
      testPath: "test/MyContract.test.ts",
      description: "My custom example",
    },
  ],
};
```

Then use:
```bash
npm run create:category -- my-category ./my-category-output
```

### Custom Documentation Generation

Modify `generate-docs.ts` to customize documentation output format, structure, or content.

### Batch Operations

Create shell script for batch example generation:

```bash
#!/bin/bash
for category in basic encryption decryption access-control advanced; do
  npm run create:category -- $category ./batch-output/$category
done
```

## Maintenance

### When Dependencies Change

1. Update base-template `package.json`
2. Regenerate all examples:
   ```bash
   npm run create:all-examples
   ```
3. Test all examples:
   ```bash
   for example in examples-output/*/; do
     cd "$example" && npm install && npm run test && cd ../..
   done
   ```

### Adding New Examples

1. Create contract: `examples/<category>/<Name>.sol`
2. Create test: `test/<Name>.test.ts`
3. Update `CATEGORY_EXAMPLES` in scripts
4. Run category generation to test

### Documentation Updates

When updating contract documentation:
1. Update JSDoc comments with `@chapter` tags
2. Regenerate docs:
   ```bash
   npm run docs
   ```
3. Commit changes

## Resources

- [Hardhat Documentation](https://hardhat.org/)
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [GitBook Documentation](https://docs.gitbook.com/)

---

Generated for FHEVM Example Hub - Zama Bounty Track December 2025
