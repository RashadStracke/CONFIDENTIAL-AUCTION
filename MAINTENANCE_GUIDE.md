# Maintenance Guide

This guide provides instructions for maintaining and updating the FHEVM Example Hub project.

## Overview

The FHEVM Example Hub consists of:
- **Base Template**: Hardhat project template for FHEVM development
- **Example Contracts**: Solidity smart contracts demonstrating FHE concepts
- **Tests**: Comprehensive test suites for all examples
- **Automation Scripts**: TypeScript tools for generating repositories and documentation
- **Documentation**: Guides and API references

## Version Management

### Current Version
- FHEVM Solidity Library: `^0.7.0`
- Hardhat: `^2.24.3`
- Solidity: `^0.8.24`
- Node.js: v18.0.0+

### Dependency Updates

When updating dependencies, follow this procedure:

#### 1. Update Base Template

```bash
cd base-template
npm update
npm install @fhevm/solidity@latest
npm run compile
npm run test
```

#### 2. Verify Compatibility

```bash
# Check that example contracts still compile
npm run compile

# Run all tests
npm run test

# Generate coverage report
npm run coverage
```

#### 3. Update Main Project

```bash
# In project root
npm install @fhevm/solidity@latest

# Verify main contracts
npm run compile
npm run test
```

#### 4. Regenerate Examples

```bash
# Regenerate all example repositories with new versions
npm run examples:create-all

# Test generated examples
cd examples-output/all
npm install
npm run compile
npm run test
cd ../..
```

#### 5. Update Documentation

```bash
# Regenerate documentation
npm run docs

# Update version in relevant docs
# - README.md
# - DEVELOPER_GUIDE.md
# - TECHNICAL_ARCHITECTURE.md
```

## Adding New Examples

### Step 1: Create Contract

Create new example contract in appropriate category:

```solidity
// examples/<category>/<ContractName>.sol
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Contract Title
 * @notice Description of what this contract demonstrates
 * @dev Implementation details and FHE patterns used
 */
contract ContractName is ZamaEthereumConfig {
  // Implementation
}
```

### Step 2: Write Comprehensive Tests

Create test file with @chapter annotations:

```typescript
// test/ContractName.test.ts
/**
 * @chapter: category
 * Contract Name Tests
 *
 * Description of test coverage
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import type { ContractName } from "../typechain-types";

describe("ContractName", function () {
  // Tests
});
```

### Step 3: Update Automation Scripts

Update `scripts/create-fhevm-category.ts`:

```typescript
const CATEGORY_EXAMPLES: CategoryConfig = {
  "category": [
    // ... existing examples
    {
      contractName: "ContractName",
      contractPath: "examples/category/ContractName.sol",
      testPath: "test/ContractName.test.ts",
      description: "Brief description of the example",
    },
  ],
};
```

### Step 4: Verify Everything Works

```bash
# Compile new contract
npm run compile

# Run tests
npm run test

# Create example repository
npm run create:example -- my-contract category

# Test generated example
cd examples/my-contract
npm install
npm run compile
npm run test
cd ../..
```

### Step 5: Generate Documentation

```bash
# Generate docs for new example
npm run docs

# Verify documentation renders correctly
# Check docs/category/contract-name.md
```

## Code Quality Standards

### Solidity Contracts

All contracts must:
- ✅ Have complete JSDoc comments
- ✅ Include `@chapter` tags for organization
- ✅ Show both correct and incorrect patterns
- ✅ Include comprehensive comments explaining FHE concepts
- ✅ Handle encrypted values correctly (FHE.allow + FHE.allowThis)
- ✅ Demonstrate best practices
- ✅ Avoid hardcoded values where possible
- ✅ Include event logging for important state changes

Example:
```solidity
/**
 * @title Example Contract
 * @notice Brief description of purpose
 * @dev Detailed explanation of implementation and FHE patterns
 *
 * Key concepts demonstrated:
 * - Encrypted state management
 * - Homomorphic operations
 * - Access control patterns
 */
contract ExampleContract {
  /**
   * @notice Function description
   * @param param1 Parameter description
   * @return Description of return value
   * @dev Important implementation notes
   */
  function functionName(type param1) external returns (type) {
    // Implementation
  }
}
```

### TypeScript/JavaScript

All scripts and tests must:
- ✅ Have clear JSDoc comments
- ✅ Include error handling
- ✅ Use TypeScript for type safety
- ✅ Follow consistent naming conventions
- ✅ Include @chapter tags for organization
- ✅ Log meaningful progress messages
- ✅ Handle edge cases

Example:
```typescript
/**
 * @chapter: automation
 * Script description
 *
 * What this script does and when to use it.
 *
 * Usage:
 *   npx ts-node scripts/script-name.ts <args>
 */

interface Config {
  // Configuration interface
}

/**
 * Description of function
 * @param args Arguments
 * @returns Result
 */
function functionName(args: string[]): Config {
  // Implementation
}
```

### Documentation

All documentation files must:
- ✅ Use clear, technical language
- ✅ Include code examples
- ✅ Explain both how and why
- ✅ Show common mistakes
- ✅ Provide learning resources
- ✅ Be up-to-date with latest code
- ✅ Include table of contents for long documents

## Testing Procedures

### Unit Testing

```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/ContractName.test.ts

# Run with verbose output
npx hardhat test --verbose
```

### Coverage Analysis

```bash
# Generate coverage report
npm run coverage

# View coverage report
open coverage/index.html  # macOS
# OR
xdg-open coverage/index.html  # Linux
# OR
start coverage/index.html  # Windows
```

### Integration Testing

```bash
# Test generated example repositories
npm run examples:create-all

# Test each category
for dir in examples-output/*/; do
  echo "Testing $dir"
  cd "$dir"
  npm install
  npm run compile
  npm run test
  cd ../..
done
```

## Release Process

### Before Release

1. **Update Version**
   ```bash
   # In package.json
   "version": "X.Y.Z"
   ```

2. **Run Full Test Suite**
   ```bash
   npm run compile
   npm run test
   npm run coverage
   ```

3. **Verify All Scripts Work**
   ```bash
   npm run create:example -- test-example basic
   npm run create:category -- basic test-category
   npm run docs
   ```

4. **Update Documentation**
   - Update version numbers
   - Update dependency versions
   - Update changelog
   - Review all README files

5. **Clean Up**
   ```bash
   npm run clean
   rm -rf examples/test-*
   rm -rf examples-output/*
   ```

### Release Checklist

- [ ] All tests passing
- [ ] Coverage meets standards (>80%)
- [ ] Documentation generated and verified
- [ ] Examples created and tested
- [ ] Scripts tested and working
- [ ] Version updated
- [ ] CHANGELOG.md updated
- [ ] LICENSE file included
- [ ] No hardcoded secrets or keys
- [ ] No temporary files included

### Post-Release

1. Publish to repository
2. Create release notes
3. Update project documentation
4. Announce update to community

## Troubleshooting

### Common Issues

#### Compilation Errors

```bash
# Verify Solidity version compatibility
grep -r "pragma solidity" contracts/

# Check hardhat config
grep solidityVersion hardhat.config.ts

# Clear cache and recompile
npm run clean
npm run compile
```

#### Test Failures

```bash
# Run tests with verbose output
npm run test -- --verbose

# Check TypeScript compilation
npx tsc --noEmit

# Verify test file syntax
npx hardhat compile
```

#### Script Errors

```bash
# Check Node.js version
node --version  # Should be v18+

# Verify TypeScript installed
npx tsc --version

# Check script syntax
npx ts-node scripts/script-name.ts --help
```

#### Template Issues

```bash
# Verify base-template exists
ls -la base-template/

# Check template has required files
ls base-template/hardhat.config.ts
ls base-template/package.json
ls -la base-template/contracts/
ls -la base-template/test/
```

## Performance Optimization

### Compilation Speed

```bash
# Enable parallel compilation
# In hardhat.config.ts:
solidity: {
  version: "0.8.24",
  settings: {
    viaIR: true,
    optimizer: { enabled: true, runs: 800 }
  }
}
```

### Test Execution

```bash
# Run tests in parallel
npx hardhat test --parallel

# Run specific test suite
npx hardhat test --grep "pattern"

# Skip gas reporting for faster tests
REPORT_GAS=false npm run test
```

### Documentation Generation

```bash
# Generate docs in parallel
npm run docs  # Auto-parallelized

# Generate specific category
npm run docs -- basic
```

## Monitoring & Analytics

### Track Example Usage

Monitor which examples are most downloaded:
- Track GitHub clone statistics
- Monitor npm package downloads (if published)
- Collect user feedback through GitHub issues

### Update Frequency

- **Dependencies**: Check monthly
- **Documentation**: Update with each release
- **Examples**: Add 1-2 new examples per quarter
- **Tests**: Maintain 80%+ coverage always

## Community Maintenance

### Handling Issues

1. Review GitHub issues regularly
2. Reproduce issues locally
3. Update examples if there are common questions
4. Document solutions in guides

### Accepting Contributions

1. Review pull requests for:
   - Code quality standards
   - Test coverage
   - Documentation completeness
   - No breaking changes

2. Testing contributions:
   ```bash
   git checkout feature-branch
   npm install
   npm run compile
   npm run test
   npm run examples:create-all
   ```

3. Merge when approved and tests pass

## Documentation Maintenance

### Keep Documentation Current

- [ ] Update README with new features
- [ ] Update DEVELOPER_GUIDE with new patterns
- [ ] Update TECHNICAL_ARCHITECTURE if design changes
- [ ] Update EXAMPLES.md with new examples
- [ ] Generate docs after each update

### Archive Old Documentation

- Create VERSION.md files for older versions
- Maintain history for reference
- Document breaking changes clearly

## Security Considerations

### Code Review Checklist

- [ ] No private keys or secrets in code
- [ ] No hardcoded contract addresses
- [ ] All user inputs validated
- [ ] Proper access control checks
- [ ] FHE.allow() and FHE.allowThis() used correctly
- [ ] No deprecated FHEVM patterns

### Dependency Auditing

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Review updates before applying
npm outdated
```

## Backup & Recovery

### Data Protection

- Maintain git history with all commits
- Tag releases for easy recovery
- Document breaking changes clearly

### Recovery Procedure

If critical issue found:

1. Create hotfix branch from latest release tag
2. Fix issue
3. Run full test suite
4. Tag as patch release
5. Merge to main

```bash
git checkout tags/v1.0.0
git checkout -b hotfix/critical-fix
# ... make fixes
npm run test
git tag v1.0.1
git checkout main
git merge hotfix/critical-fix
```

## Reference

### Key Files

- `package.json` - Dependencies and scripts
- `hardhat.config.ts` - Hardhat configuration
- `base-template/` - Template for new examples
- `examples/` - All example contracts
- `test/` - All test files
- `scripts/` - Automation tools
- `docs/` - Generated documentation

### Contact & Support

- GitHub Issues: Report bugs and feature requests
- Discussions: Community questions and answers
- Discord: Real-time community support
- Email: Direct contact for security issues

### External Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org)
- [Solidity Documentation](https://docs.soliditylang.org)
- [Zama Community](https://www.zama.ai/community)

---

Last Updated: December 2025
Maintained by: FHEVM Example Hub Contributors
