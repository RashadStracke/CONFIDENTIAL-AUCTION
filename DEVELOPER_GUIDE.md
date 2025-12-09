# Developer Guide - Confidential Auction

Complete guide for setting up, developing, testing, and deploying the Confidential Auction smart contracts.

## Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version
- **Git LFS** (optional): For large files

### Knowledge Requirements
- Solidity smart contract development
- Hardhat framework basics
- Ethereum/EVM concepts
- Fully Homomorphic Encryption (FHE) concepts

## Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd confidential-auction
```

### 2. Install Dependencies
```bash
npm install
```

This installs:
- **Hardhat**: Smart contract development framework
- **@fhevm/solidity**: FHE contract library
- **@openzeppelin/contracts**: Standard contract utilities
- **TypeScript**: Type safety for scripts
- **Ethers.js**: Blockchain interaction
- **Mocha/Chai**: Testing framework

### 3. Verify Installation
```bash
npx hardhat --version
npm run compile
```

## Project Structure

```
confidential-auction/
│
├── contracts/                    # Smart contracts
│   ├── ConfidentialAuction.sol              # Main contract
│   ├── ConfidentialAuctionSimple.sol        # Simplified variant
│   ├── ConfidentialAuctionMinimal.sol       # Minimal variant
│   ├── ConfidentialAuctionCompatible.sol    # Alternative approach
│   ├── ConfidentialAuctionFHE.sol           # FHE-focused variant
│   ├── ConfidentialAuctionReal.sol          # Production variant
│   └── SimpleAuction.sol                    # Non-FHE reference
│
├── scripts/                      # Deployment and utility scripts
│   └── deploy.ts                 # Main deployment script
│
├── test/                         # Test suites (to be created)
│   └── auction.test.ts           # Main test file
│
├── typechain-types/              # Generated TypeScript types
│
├── hardhat.config.ts             # Hardhat configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # NPM dependencies
├── package-lock.json             # Dependency lock file
│
├── README.md                     # User documentation
├── SUBMISSION_OVERVIEW.md        # Competition context
├── TECHNICAL_ARCHITECTURE.md     # Architecture deep dive
├── DEVELOPER_GUIDE.md            # This file
├── CONTRACT_DOCUMENTATION.md     # Contract reference
│
├── index.html                    # Frontend (web interface)
├── vercel.json                   # Vercel deployment config
├── fhe-deployment-ready.json     # FHE deployment config
│
└── artifacts/                    # Compiled contracts
```

## Development Workflow

### 1. Smart Contract Development

#### Create New Contract
```bash
# Create new contract file
touch contracts/YourContract.sol
```

#### Contract Template
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";

contract YourContract {
    // State variables
    euint64 private encryptedValue;

    // Events
    event ValueUpdated(uint256 timestamp);

    // Functions
    function updateValue(externalEuint64 input, bytes calldata proof) public {
        euint64 decrypted = FHE.fromExternal(input, proof);
        encryptedValue = decrypted;
        emit ValueUpdated(block.timestamp);
    }
}
```

#### Compile Contracts
```bash
npm run compile
```

**Output**:
- `artifacts/`: Compiled bytecode and ABI
- `typechain-types/`: TypeScript type definitions

#### View Compilation Errors
```bash
npx hardhat compile --force  # Force recompilation
```

### 2. Testing

#### Test File Structure
```typescript
// test/auction.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ConfidentialAuction", function () {
  let auction: any;
  let owner: any;
  let bidder1: any;

  beforeEach(async function () {
    // Deploy contract
    const AuctionFactory = await ethers.getContractFactory("ConfidentialAuction");
    auction = await AuctionFactory.deploy();
    [owner, bidder1] = await ethers.getSigners();
  });

  it("Should create auction", async function () {
    await auction.createAuction(
      "Test Auction",
      "Test Description",
      "Test Category",
      ethers.parseEther("1.0")
    );

    const auctions = await auction.getActiveAuctions();
    expect(auctions.length).to.equal(1);
  });
});
```

#### Run Tests
```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/auction.test.ts

# Run with gas reporting
REPORT_GAS=true npm run test

# Run with coverage
npx hardhat coverage
```

#### Test Coverage Example
```bash
$ npm run test

  ConfidentialAuction
    ✓ Should create auction (150ms)
    ✓ Should place bid (200ms)
    ✓ Should prevent duplicate bids (100ms)
    ✓ Should end auction and settle (300ms)
    ✓ Should reject invalid auctions (80ms)

  5 passing (830ms)
```

### 3. Local Development

#### Start Hardhat Network
```bash
npx hardhat node
```

This starts a local Ethereum network at `http://localhost:8545` with:
- 20 pre-funded accounts
- Instant block production
- Full contract debugging support

#### Deploy to Local Network
```bash
# In new terminal
npx hardhat run scripts/deploy.ts --network localhost
```

#### Interact with Deployed Contract
```typescript
// scripts/interact.ts
import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x...";  // From deployment
  const contract = await ethers.getContractAt(
    "ConfidentialAuction",
    contractAddress
  );

  // Call contract methods
  const auctions = await contract.getActiveAuctions();
  console.log("Active auctions:", auctions.length);
}

main().catch(console.error);
```

### 4. Debugging

#### Enable Verbose Logging
```bash
npx hardhat test --verbose
```

#### Hardhat Console
```bash
npx hardhat console
```

**Interactive session**:
```javascript
> const Contract = await ethers.getContractFactory("ConfidentialAuction");
> const contract = await Contract.deploy();
> const auctions = await contract.getActiveAuctions();
> console.log(auctions)
```

#### Event Monitoring
```typescript
// Listen to events
contract.on("AuctionCreated", (auctionId, title, ...) => {
  console.log(`Auction ${auctionId} created: ${title}`);
});
```

## Deployment

### 1. Sepolia Testnet Deployment

#### Setup Environment Variables
```bash
# Create .env file
touch .env
```

**Contents**:
```
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETHERSCAN_API_KEY=your_etherscan_key
```

⚠️ **Security Warning**: Never commit `.env` to version control

#### Deploy Script
```bash
# Compile first
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia
```

#### Deployment Output
```
Deploying ConfidentialAuction...
Contract deployed to: 0x...
Transaction hash: 0x...
Wait for confirmations...
```

### 2. Mainnet Deployment (Production)

#### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Security audit completed
- [ ] Gas optimization verified
- [ ] Deployment script tested on testnet
- [ ] Emergency procedures documented

#### Deployment Command
```bash
NETWORK=mainnet npm run deploy
```

### 3. Verification

#### Verify on Etherscan
```bash
npm run verify -- --network sepolia DEPLOYED_ADDRESS "constructor arguments"
```

#### Example:
```bash
npx hardhat verify --network sepolia \
  0x750BAE1816251Ec0421339bb8A98F7Da225cB3CF
```

#### View on Explorer
- **Sepolia**: https://sepolia.etherscan.io/address/0x...
- **Mainnet**: https://etherscan.io/address/0x...

## Working with FHE

### Understanding FHE Types

#### Encrypted Integer Types
```solidity
euint8    // Encrypted 8-bit unsigned integer
euint16   // Encrypted 16-bit unsigned integer
euint32   // Encrypted 32-bit unsigned integer
euint64   // Encrypted 64-bit unsigned integer
```

#### Encrypted Boolean
```solidity
ebool     // Encrypted boolean (true/false)
```

#### Convert Plaintext to Encrypted
```typescript
// From external source
const encryptedBid = FHE.fromExternal(input, proof);

// Direct conversion
const encryptedValue = FHE.asEuint64(1000);
```

#### Perform Operations
```solidity
// Arithmetic
result = a.add(b);
result = a.sub(b);

// Comparison
isGreater = a.gt(b);
isEqual = a.eq(b);

// Conditional
result = FHE.select(condition, valueIfTrue, valueIfFalse);
```

### FHE-Specific Debugging

#### Print Encrypted Values (Requires Decryption)
```typescript
// Note: Requires access to encryption keys
const decrypted = FHE.decrypt(encryptedValue);
console.log("Decrypted value:", decrypted);
```

#### Verify Encrypted Operations
```typescript
// Test encrypted comparison
const a = FHE.asEuint64(100);
const b = FHE.asEuint64(50);
const result = a.gt(b);  // Should be encrypted true
```

## Configuration

### Hardhat Config (`hardhat.config.ts`)

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!]
    }
  }
};

export default config;
```

### TypeScript Config (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["scripts/**/*", "test/**/*"],
  "exclude": ["node_modules"]
}
```

## Common Tasks

### Add New Contract Variant
```bash
# Create contract
touch contracts/NewVariant.sol

# Edit contract file with new logic
nano contracts/NewVariant.sol

# Compile
npm run compile

# Add tests
touch test/new-variant.test.ts

# Run tests
npm run test
```

### Update Dependencies
```bash
# Check for updates
npm outdated

# Update specific package
npm update @fhevm/solidity

# Update all packages
npm update
```

### Generate TypeChain Types
```bash
npm run typechain
```

Creates TypeScript types in `typechain-types/` for type-safe contract interaction.

### View Gas Usage
```bash
REPORT_GAS=true npm run test
```

Output includes gas per function call.

### Clean Build Artifacts
```bash
npm run clean
```

Removes:
- `artifacts/`
- `typechain-types/`
- Cache files

## Troubleshooting

### Common Issues

#### 1. "Cannot find module '@fhevm/solidity'"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 2. "Compilation errors with FHE types"
```bash
# Clear hardhat cache
npx hardhat clean

# Recompile
npm run compile
```

#### 3. "Network error: could not detect network"
Check `.env` file and RPC URL configuration:
```bash
curl https://sepolia.infura.io/v3/YOUR_PROJECT_ID \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

#### 4. "Transaction failed: insufficient funds"
```bash
# Get testnet ETH from faucet
# Sepolia: https://sepolia-faucet.pk910.de/
```

#### 5. "Test timeout exceeded"
Increase timeout in Hardhat config:
```typescript
mocha: {
  timeout: 40000  // 40 seconds
}
```

## Performance Optimization

### Contract Optimization
```typescript
// In hardhat.config.ts
solidity: {
  version: "0.8.24",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
```

### Gas Reduction
1. **Batch operations**: Multiple bids in single transaction
2. **Storage packing**: Use smaller types (uint64 vs uint256)
3. **Function optimization**: Minimize state reads/writes
4. **Loop elimination**: Avoid loops in state-modifying functions

## Security Best Practices

1. **Private Keys**: Never hardcode private keys
2. **Environment Variables**: Use `.env` file (add to `.gitignore`)
3. **Code Review**: Have changes reviewed before deployment
4. **Testing**: Achieve >80% code coverage
5. **Auditing**: Use formal verification for critical contracts
6. **Reentrancy**: Be careful with `call()` and external calls

## Additional Resources

### Documentation
- [Hardhat Documentation](https://hardhat.org/docs)
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)

### Tools
- [Remix IDE](https://remix.ethereum.org/) - Web-based editor
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/) - Secure implementations
- [Etherscan](https://etherscan.io/) - Blockchain explorer
- [Hardhat Plugins](https://hardhat.org/plugins) - Extended functionality

### Community
- [Zama Community Forum](https://www.zama.ai/community)
- [Ethereum Stack Exchange](https://ethereum.stackexchange.com/)
- [Hardhat GitHub Issues](https://github.com/NomicFoundation/hardhat/issues)

## Support

For issues, questions, or contributions:
1. Check existing documentation
2. Search GitHub issues
3. Ask in community forums
4. Create detailed bug reports

---

**Last Updated**: December 2025
**Maintained By**: Development Team
