# Automation Guide - FHEVM Example Generator

Complete guide for using the automated tools to create and maintain FHEVM examples.

## Overview

The automation suite provides TypeScript-based CLI tools for:
1. **Generating new example repositories** from base templates
2. **Auto-generating documentation** from code annotations
3. **Scaffolding project structure** with minimal configuration
4. **Managing multiple examples** in organized categories

## Tools Included

### 1. create-fhevm-example.ts - Repository Generator

Automatically creates standalone FHEVM example repositories with all necessary boilerplate.

#### Installation

No additional installation needed - uses existing project dependencies.

#### Usage

```bash
# Basic usage
npx ts-node scripts/create-fhevm-example.ts <name> <category>

# With description
npx ts-node scripts/create-fhevm-example.ts <name> <category> --description="Your description"
```

#### Parameters

- **name** (required): Example name (use kebab-case)
  - Example: `fhevm-counter`, `blind-auction`, `token-transfer`

- **category** (required): FHEVM concept category
  - Valid categories: `basic`, `encryption`, `access-control`, `advanced`, `anti-patterns`

- **--description** (optional): Custom description
  - Default: Auto-generated from name and category
  - Example: `--description="Demonstrates FHE arithmetic operations"`

#### Examples

```bash
# Create simple counter example
npx ts-node scripts/create-fhevm-example.ts fhevm-counter basic

# Create advanced auction example
npx ts-node scripts/create-fhevm-example.ts encrypted-auction advanced --description="Blind auction using FHE"

# Create access control example
npx ts-node scripts/create-fhevm-example.ts access-control-example access-control
```

#### What Gets Created

```
examples/
└── <name>/
    ├── contracts/
    │   ├── <ContractName>.sol          # Template contract
    │   └── ...other contracts
    ├── test/
    │   ├── <ContractName>.test.ts      # Template tests
    │   └── ...other tests
    ├── scripts/
    │   └── deploy.ts                   # Deployment script
    ├── hardhat.config.ts               # Configuration
    ├── tsconfig.json                   # TypeScript config
    ├── package.json                    # Dependencies
    ├── README.md                       # Documentation
    └── .gitignore                      # Git settings
```

#### Output Example

```
==============================================================
✓ FHEVM Example Generated Successfully
==============================================================

Example: fhevm-counter
Category: basic
Location: /path/to/examples/fhevm-counter

Next Steps:
  1. cd examples/fhevm-counter
  2. npm install
  3. npm run compile
  4. npm run test

Files Created:
  ✓ contracts/ - Smart contract files
  ✓ test/ - Test suites
  ✓ hardhat.config.ts - Configuration
  ✓ package.json - Dependencies
  ✓ README.md - Documentation

==============================================================
```

### 2. generate-docs.ts - Documentation Generator

Automatically generates comprehensive documentation from code annotations.

#### Installation

No additional installation - uses TypeScript and Node.js built-ins.

#### Usage

```bash
# Generate documentation with defaults
npx ts-node scripts/generate-docs.ts

# Custom output directory
npx ts-node scripts/generate-docs.ts --output=./documentation

# Specific source directory
npx ts-node scripts/generate-docs.ts --source=./contracts

# Custom format
npx ts-node scripts/generate-docs.ts --format=gitbook
```

#### Parameters

- **--output** (optional): Output directory
  - Default: `docs/`
  - Example: `--output=./generated-docs`

- **--format** (optional): Documentation format
  - Options: `gitbook` (default), `markdown`
  - Example: `--format=markdown`

- **--source** (optional): Source directory to scan
  - Default: `.` (current directory)
  - Example: `--source=./contracts`

#### Code Annotation Format

To document your code for auto-generation, use JSDoc-style comments with `@chapter` tags:

```typescript
/**
 * @chapter: basic-operations
 * Simple counter increment function
 *
 * @description: Demonstrates basic state modification in FHE context
 */
function increment(value: euint64): euint64 {
  return value.add(FHE.asEuint64(1));
}
```

```solidity
/**
 * @chapter: encryption
 * Encrypts and stores user value
 *
 * Demonstrates how to accept external input, convert to encrypted type,
 * and store in contract state while maintaining privacy.
 */
function setEncryptedValue(externalEuint64 input, bytes calldata proof) public {
  euint64 encrypted = FHE.fromExternal(input, proof);
  value = encrypted;
}
```

#### Chapter Categories

Supported chapters for organization:

| Chapter | Topic |
|---------|-------|
| `basic-operations` | Fundamental smart contract operations |
| `encryption` | Encryption and decryption patterns |
| `decryption` | User and public decryption |
| `access-control` | Permission management |
| `input-proof` | Input validation and proofs |
| `anti-patterns` | Common mistakes to avoid |
| `advanced-patterns` | Complex FHE use cases |
| `automation` | Scripting and tools |
| `optimization` | Performance optimization |
| `security` | Security best practices |

#### Output Structure

```
docs/
├── README.md                    # Introduction and overview
├── SUMMARY.md                   # GitBook table of contents
├── api-reference.md             # Complete API reference
└── chapters/
    ├── basic-operations/
    │   ├── README.md            # Chapter overview
    │   ├── function-name.md      # Individual items
    │   └── ...more items
    ├── encryption/
    │   ├── README.md
    │   └── ...items
    └── ...more chapters
```

#### Example: Generating Docs

```bash
# Generate documentation for current project
npx ts-node scripts/generate-docs.ts

# Output:
# ==============================================================
# ✓ Documentation Generated Successfully
# ==============================================================
#
# Output Directory: docs
#
# Chapters Generated: 5
#   - Basic Operations (8 items)
#   - Encryption (6 items)
#   - Access Control (5 items)
#   - Advanced Patterns (3 items)
#   - Anti Patterns (4 items)
#
# Files Created:
#   ✓ README.md - Introduction and overview
#   ✓ SUMMARY.md - GitBook table of contents
#   ✓ api-reference.md - Complete API reference
#   ✓ chapters/ - Chapter-based documentation
#
# Next Steps:
#   1. Review generated documentation in docs/
#   2. Publish to GitBook or similar platform
#   3. Share with development team
```

## Workflow Examples

### Creating a New FHEVM Example

**Scenario**: You want to create a new example demonstrating user decryption.

```bash
# 1. Generate new example repository
npx ts-node scripts/create-fhevm-example.ts user-decryption-example encryption \
  --description="Demonstrates user-controlled decryption of FHE values"

# 2. Navigate to new project
cd examples/user-decryption-example

# 3. Install dependencies
npm install

# 4. Implement contract
# Edit contracts/UserDecryptionExample.sol
# Add contract logic and JSDoc comments with @chapter tags

# 5. Write tests
# Edit test/UserDecryptionExample.test.ts
# Add test cases with @chapter annotations

# 6. Test locally
npm run test

# 7. Generate documentation
cd ../..
npx ts-node scripts/generate-docs.ts --source=examples/user-decryption-example

# 8. Review generated documentation
open docs/chapters/encryption/README.md
```

### Batch Creating Multiple Examples

**Scenario**: Create several examples following a consistent pattern.

```bash
#!/bin/bash
# create-examples.sh

declare -a examples=(
  "counter:basic:Simple FHE counter"
  "token:encryption:Encrypted token transfers"
  "voting:access-control:Private voting mechanism"
)

for example in "${examples[@]}"; do
  IFS=':' read -r name category desc <<< "$example"
  npx ts-node scripts/create-fhevm-example.ts "$name" "$category" --description="$desc"
  echo "Created: $name"
done

echo "All examples created!"
```

Run with:
```bash
chmod +x create-examples.sh
./create-examples.sh
```

### Updating Documentation After Changes

**Scenario**: You've modified contracts and want to regenerate documentation.

```bash
# 1. Make changes to contracts and tests
# Edit contracts/MyContract.sol
# Edit test/MyContract.test.ts
# Update JSDoc @chapter annotations

# 2. Regenerate documentation
npx ts-node scripts/generate-docs.ts --output=docs

# 3. Verify generated documentation
ls -la docs/chapters/

# 4. Commit changes
git add docs/
git commit -m "Update generated documentation"
```

## Base Template Structure

The base template used by `create-fhevm-example.ts` should have this structure:

```
base-template/
├── contracts/
│   └── (empty or template contracts)
├── test/
│   └── (empty or template tests)
├── scripts/
│   └── deploy.ts
├── hardhat.config.ts
├── tsconfig.json
├── package.json
├── .gitignore
└── README.md
```

### Creating a Custom Base Template

To create a custom base template:

```bash
# 1. Create base-template directory
mkdir -p base-template

# 2. Add required files
cp hardhat.config.ts base-template/
cp tsconfig.json base-template/
cp package.json base-template/
cp .gitignore base-template/

# 3. Create directory structure
mkdir -p base-template/{contracts,test,scripts}

# 4. Add template files (can be empty or contain defaults)

# 5. Verify structure
tree base-template/
```

## Documentation Generation Pipeline

For large projects with many examples:

```bash
#!/bin/bash
# generate-all-docs.sh

echo "Generating documentation for all examples..."

for dir in examples/*/; do
  example=$(basename "$dir")
  echo "Processing: $example"

  npx ts-node scripts/generate-docs.ts \
    --source="$dir" \
    --output="docs/$example"
done

echo "All documentation generated!"
echo "Output: docs/"
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
# .github/workflows/generate-docs.yml
name: Generate Documentation

on:
  push:
    branches: [main]
    paths:
      - 'contracts/**'
      - 'test/**'
      - 'scripts/**'

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Generate documentation
        run: npx ts-node scripts/generate-docs.ts --output=docs

      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add docs/
          git commit -m "Update generated documentation" || true
          git push
```

## Troubleshooting

### Issue: "Template not found at base-template"

**Solution**: Ensure `base-template/` directory exists in project root.

```bash
# Check template exists
ls -la base-template/

# Create if missing
mkdir -p base-template/{contracts,test,scripts}
```

### Issue: "Cannot find module '@fhevm/solidity'"

**Solution**: Install dependencies in generated example.

```bash
cd examples/your-example
npm install
```

### Issue: Documentation not generated for some files

**Solution**: Verify @chapter tags are in correct format.

```typescript
// CORRECT
/**
 * @chapter: basic-operations
 * Function description
 */

// INCORRECT (missing colon)
/**
 * @chapter basic-operations
 * Function description
 */
```

### Issue: GitBook SUMMARY.md not generating correctly

**Solution**: Check that all chapters have at least one documented item.

```bash
# List documented items
npx ts-node scripts/generate-docs.ts --source=. --output=test-docs
cat test-docs/SUMMARY.md
```

## Best Practices

1. **Naming Conventions**
   - Example names: use kebab-case (fhevm-counter, blind-auction)
   - Contracts: use PascalCase (ConfidentialAuction, TokenTransfer)
   - Chapters: use lowercase with hyphens (access-control, advanced-patterns)

2. **Documentation Quality**
   - Always include @chapter tag
   - Provide meaningful descriptions
   - Add code comments explaining FHE concepts
   - Include security notes where relevant

3. **Testing**
   - Run tests before generating documentation
   - Use descriptive test names with @chapter tags
   - Include both happy path and error cases

4. **Organization**
   - Group related examples in same category
   - Keep examples focused on single concept
   - Maintain consistent structure across examples

5. **Maintenance**
   - Update documentation with code changes
   - Keep base-template current
   - Review and update automation scripts periodically

## Advanced Usage

### Custom Documentation Templates

Modify `generate-docs.ts` to customize output format:

```typescript
// In generate-docs.ts, modify generateChapterDoc():
function generateChapterDoc(section: ChapterSection): string {
  let doc = `# ${section.title}\n\n`;
  // Add custom formatting here
  return doc;
}
```

### Integrating with External Tools

Use generated documentation with:
- **GitBook**: Push `docs/` to GitBook repository
- **MkDocs**: Copy to `docs/` folder in MkDocs project
- **Sphinx**: Convert markdown to reStructuredText
- **Jekyll**: Use with GitHub Pages

### Batch Processing Examples

```bash
# Create and test all examples
for category in basic encryption access-control advanced; do
  npx ts-node scripts/create-fhevm-example.ts \
    "example-${category}" "$category"

  cd "examples/example-${category}"
  npm install
  npm run test
  cd ../..
done

# Generate all documentation
npx ts-node scripts/generate-docs.ts
```

## Additional Resources

- DEVELOPER_GUIDE.md - General development setup
- TECHNICAL_ARCHITECTURE.md - System design
- CONTRACT_DOCUMENTATION.md - API reference
- TESTING_GUIDE.md - Testing strategies

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review script help messages: `npx ts-node scripts/create-fhevm-example.ts --help`
3. Check generated example READMEs
4. Refer to DEVELOPER_GUIDE.md

---

**Last Updated**: December 2025
**Version**: 1.0.0
