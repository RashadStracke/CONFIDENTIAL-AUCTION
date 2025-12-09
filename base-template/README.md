# FHEVM Example Base Template

This is a customizable base template for creating standalone FHEVM example repositories.

## Quick Start

### Installation
```bash
npm install
```

### Compilation
```bash
npm run compile
```

### Testing
```bash
npm run test
```

### Deployment
```bash
npm run deploy:sepolia
```

## Project Structure

```
├── contracts/          # Smart contracts
├── test/              # Test suites
├── scripts/           # Deployment scripts
├── hardhat.config.ts  # Hardhat configuration
├── tsconfig.json      # TypeScript configuration
└── package.json       # Dependencies
```

## Key Files

### contracts/
Place your Solidity smart contracts here.

### test/
Write test suites using Hardhat's test runner.
- Uses Chai for assertions
- Uses Ethers.js for contract interaction
- Supports TypeScript

### scripts/
Deployment and utility scripts.
- `deploy.ts` - Main deployment script

## Configuration

### hardhat.config.ts
Configure networks, compiler settings, and plugins.

### .env
Create a `.env` file for sensitive configuration:
```
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

## Development Workflow

1. **Write Contract**
   ```solidity
   // contracts/MyContract.sol
   pragma solidity ^0.8.24;
   import "@fhevm/solidity/lib/FHE.sol";

   contract MyContract {
       // Implementation
   }
   ```

2. **Write Tests**
   ```typescript
   // test/MyContract.test.ts
   describe("MyContract", function () {
       // Tests
   });
   ```

3. **Run Tests**
   ```bash
   npm run test
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

## Important Notes

- All contract files must be in `contracts/`
- All test files must be in `test/`
- Test files should match pattern `*.test.ts` or `*.spec.ts`
- Use TypeScript for all scripts and tests

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run compile` | Compile contracts |
| `npm run test` | Run test suite |
| `npm run deploy` | Deploy to localhost |
| `npm run deploy:sepolia` | Deploy to Sepolia testnet |
| `npm run coverage` | Generate coverage report |
| `npm run clean` | Clean build artifacts |

## Debugging

### Hardhat Console
```bash
npx hardhat console
```

### Verbose Testing
```bash
npx hardhat test --verbose
```

### Gas Reporting
```bash
REPORT_GAS=true npm run test
```

## Security Checklist

- [ ] All tests passing
- [ ] Code reviewed
- [ ] No hardcoded private keys
- [ ] No sensitive data in repository
- [ ] Deployment script tested on testnet
- [ ] Contract verified on block explorer

## Resources

- [Hardhat Documentation](https://hardhat.org/)
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)

## Support

For issues or questions:
1. Check Hardhat documentation
2. Review FHEVM examples
3. Check project README.md
4. Ask in Zama community forums

---

Generated from FHEVM Base Template
