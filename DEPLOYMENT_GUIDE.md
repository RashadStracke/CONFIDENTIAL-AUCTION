# FHEVM Deployment Complete Guide

Comprehensive guide for deploying FHEVM contracts to various networks.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Testnet Deployment](#testnet-deployment)
- [Production Deployment](#production-deployment)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- Node.js v18.0.0+
- npm v8.0.0+
- Hardhat v2.24.3+
- Git

### Required Accounts
- Wallet with private key
- Testnet ETH for gas fees
- (Optional) Etherscan API key for verification

### Required Knowledge
- Basic Solidity understanding
- Command line operations
- Environment variable management

## Environment Setup

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd ConfidentialAuction

# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

### Step 2: Configure Environment Variables

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```.env
# Private key (WITHOUT 0x prefix)
PRIVATE_KEY=your_private_key_here_without_0x

# RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ZAMA_RPC_URL=https://devnet.zama.ai

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key

# Gas settings
REPORT_GAS=false
```

**⚠️ Security Warning:**
- NEVER commit `.env` to git
- NEVER share your private key
- Use separate keys for testing and production
- Keep `.env` in `.gitignore`

### Step 3: Verify Configuration

```bash
# Check that Hardhat can access environment
npx hardhat vars list

# Test compilation
npm run compile

# Run tests
npm run test
```

## Local Development

### Option 1: Hardhat Network (Default)

```bash
# Start Hardhat node (Terminal 1)
npx hardhat node

# Deploy to local network (Terminal 2)
npm run deploy
```

**Network Details:**
- URL: `http://127.0.0.1:8545`
- Chain ID: 31337
- No FHEVM support (use mocks for testing)
- Instant mining
- Free ETH for testing

### Option 2: Local FHEVM Node

**Requirements:**
- Docker installed
- 8GB+ RAM
- FHEVM Docker image

```bash
# Pull FHEVM node image
docker pull ghcr.io/zama-ai/fhevm-node:latest

# Run FHEVM node
docker run -d \
  --name fhevm-node \
  -p 8545:8545 \
  ghcr.io/zama-ai/fhevm-node:latest

# Check node status
curl http://localhost:8545 \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Deploy to local FHEVM
npx hardhat run scripts/deploy.ts --network localhost
```

## Testnet Deployment

### Zama Devnet (Recommended for FHEVM)

**Step 1: Get Testnet Tokens**
```bash
# Visit Zama faucet
# https://faucet.zama.ai

# Or use CLI
curl -X POST https://faucet.zama.ai/request \
  -H "Content-Type: application/json" \
  -d '{"address":"YOUR_ADDRESS"}'
```

**Step 2: Configure Network**
```typescript
// hardhat.config.ts
export default {
  networks: {
    zama: {
      url: process.env.ZAMA_RPC_URL || "https://devnet.zama.ai",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: 8009,
      gasPrice: 1000000000, // 1 gwei
    },
  },
};
```

**Step 3: Deploy**
```bash
# Compile contracts
npm run compile

# Deploy to Zama devnet
npx hardhat run scripts/deploy.ts --network zama

# Verify deployment
npx hardhat verify --network zama DEPLOYED_CONTRACT_ADDRESS
```

### Ethereum Sepolia

**Step 1: Get Sepolia ETH**
- Visit https://sepoliafaucet.com/
- Or https://faucet.sepolia.dev/
- Request testnet ETH to your address

**Step 2: Configure**
```typescript
// hardhat.config.ts
export default {
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      gasPrice: 20000000000, // 20 gwei
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    },
  },
};
```

**Step 3: Deploy**
```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Or with custom script
npx hardhat run scripts/deploy.ts --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

**Note:** Sepolia doesn't support full FHEVM operations. Use for testing contract logic only.

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing (`npm run test`)
- [ ] Code coverage >80% (`npm run coverage`)
- [ ] Security audit completed
- [ ] No hardcoded values or secrets
- [ ] Gas optimization done
- [ ] Documentation complete
- [ ] Emergency procedures documented
- [ ] Backup deployment key secured

### Deployment Script

Create `scripts/deploy-production.ts`:
```typescript
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting Production Deployment\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.1")) {
    throw new Error("Insufficient balance for deployment");
  }

  // Get network
  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (chainId: ${network.chainId})\n`);

  // Deploy contract
  console.log("Deploying ConfidentialAuction...");
  const ConfidentialAuction = await ethers.getContractFactory(
    "ConfidentialAuction"
  );

  const contract = await ConfidentialAuction.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✅ Contract deployed to: ${contractAddress}\n`);

  // Save deployment info
  const deployment = {
    network: network.name,
    chainId: Number(network.chainId),
    contractAddress,
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    gasUsed: "N/A", // Update with actual gas used
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `${network.name}-${Date.now()}.json`
  );

  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log(`📝 Deployment info saved to: ${deploymentFile}\n`);

  // Verification instructions
  console.log("📋 To verify contract:");
  console.log(
    `npx hardhat verify --network ${network.name} ${contractAddress}\n`
  );

  console.log("✅ Deployment Complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
```

### Execute Production Deployment

```bash
# Final checks
npm run compile
npm run test
npm run coverage

# Deploy to production
npx hardhat run scripts/deploy-production.ts --network mainnet

# Save deployment address
echo "CONTRACT_ADDRESS=0x..." >> .env.production
```

### Gas Estimation

```bash
# Estimate deployment gas
npx hardhat run scripts/estimate-gas.ts

# Check current gas prices
curl https://api.etherscan.io/api \
  ?module=gastracker \
  &action=gasoracle \
  &apikey=YOUR_ETHERSCAN_API_KEY
```

## Post-Deployment

### Step 1: Verify Contract

#### On Etherscan (Ethereum networks)
```bash
# Automatic verification
npx hardhat verify --network sepolia DEPLOYED_ADDRESS

# With constructor arguments
npx hardhat verify --network sepolia DEPLOYED_ADDRESS "arg1" "arg2"

# Manual verification
# 1. Go to https://sepolia.etherscan.io/verifyContract
# 2. Enter contract address
# 3. Select compiler version
# 4. Upload flattened source code
# 5. Submit
```

#### On Block Explorer (Other networks)
```bash
# Flatten source code
npx hardhat flatten contracts/ConfidentialAuction.sol > flattened.sol

# Upload to block explorer
# Follow network-specific instructions
```

### Step 2: Initialize Contract

```typescript
// scripts/initialize.ts
import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const contract = await ethers.getContractAt(
    "ConfidentialAuction",
    contractAddress
  );

  // Perform initialization
  // Example: Set admin, configure parameters, etc.

  console.log("Contract initialized");
}

main();
```

### Step 3: Test Deployed Contract

```bash
# Run integration tests against deployed contract
DEPLOYED_ADDRESS=0x... npm run test:integration

# Manual smoke test
npx hardhat console --network sepolia
> const contract = await ethers.getContractAt("ConfidentialAuction", "0x...")
> await contract.someFunction()
```

### Step 4: Set Up Monitoring

**Contract Events Monitoring:**
```typescript
// scripts/monitor.ts
import { ethers } from "hardhat";

async function monitor() {
  const contract = await ethers.getContractAt(
    "ConfidentialAuction",
    process.env.CONTRACT_ADDRESS
  );

  // Listen for events
  contract.on("AuctionCreated", (auctionId, creator, event) => {
    console.log(`New auction created: ${auctionId} by ${creator}`);
  });

  contract.on("BidPlaced", (auctionId, bidder, event) => {
    console.log(`New bid placed on auction ${auctionId} by ${bidder}`);
  });

  console.log("Monitoring contract events...");
}

monitor();
```

### Step 5: Documentation

```markdown
# Deployment Documentation

## Contract Details
- Network: Sepolia
- Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
- Block: 5234567
- Deployer: 0x...
- Timestamp: 2025-12-17T10:30:00Z

## Verification
- Etherscan: Verified ✅
- Source Code: Published ✅

## Configuration
- Admin: 0x...
- Fee: 2.5%
- Min Auction Duration: 1 hour

## Access Control
- Owner: 0x...
- Admins: [0x..., 0x...]

## Emergency Contacts
- Developer: developer@example.com
- Security: security@example.com
```

## Troubleshooting

### Issue: "Insufficient funds"

**Cause:** Not enough ETH for gas fees

**Solution:**
```bash
# Check balance
npx hardhat run scripts/check-balance.ts --network sepolia

# Get testnet tokens
# Visit faucet for your network

# Adjust gas price
# Edit hardhat.config.ts gasPrice parameter
```

### Issue: "Nonce too high"

**Cause:** Pending transactions or network issues

**Solution:**
```bash
# Reset account nonce
npx hardhat run scripts/reset-nonce.ts --network sepolia

# Or manually in Metamask:
# Settings > Advanced > Clear activity tab data
```

### Issue: "Contract creation code too large"

**Cause:** Contract exceeds 24KB size limit

**Solution:**
```solidity
// Enable optimizer in hardhat.config.ts
solidity: {
  version: "0.8.24",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,  // Adjust runs
    },
  },
}

// Split contract into libraries
library Math {
  function calculate() internal { }
}

contract Main {
  using Math for *;
}
```

### Issue: "Transaction underpriced"

**Cause:** Gas price too low

**Solution:**
```typescript
// Increase gas price
await contract.deploy({
  gasPrice: ethers.parseUnits("50", "gwei")
});

// Or use EIP-1559
await contract.deploy({
  maxFeePerGas: ethers.parseUnits("100", "gwei"),
  maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
});
```

### Issue: "Verification failed"

**Cause:** Compiler settings mismatch or constructor arguments

**Solution:**
```bash
# Check exact compiler version
# Must match deployment exactly

# Include all constructor arguments
npx hardhat verify --network sepolia \
  DEPLOYED_ADDRESS \
  --constructor-args arguments.js

# arguments.js:
module.exports = [
  "arg1",
  123,
  "0x..."
];
```

## Best Practices

### Security

1. **Use hardware wallet** for production deployments
2. **Test on testnet first** - always
3. **Audit before mainnet** - professional security audit
4. **Time-lock critical functions** - add delay for changes
5. **Implement pause mechanism** - emergency stop
6. **Monitor contract activity** - set up alerts
7. **Have upgrade plan** - proxy pattern or migration plan

### Gas Optimization

1. **Enable optimizer** with appropriate runs setting
2. **Use events** instead of storage where possible
3. **Batch operations** to save gas
4. **Pack structs** efficiently
5. **Use immutable** for constants
6. **Minimize storage** operations

### Deployment Checklist

- [ ] Code reviewed by team
- [ ] All tests passing
- [ ] Security audit complete (for production)
- [ ] Deployment script tested on testnet
- [ ] Gas estimation completed
- [ ] Sufficient balance in deployment account
- [ ] Backup of deployment keys
- [ ] Monitoring setup ready
- [ ] Documentation prepared
- [ ] Verification plan ready
- [ ] Rollback plan documented
- [ ] Team notified of deployment time

## Emergency Procedures

### Contract Pause

```solidity
// Implement pause mechanism
contract Emergency {
  bool public paused;
  address public owner;

  modifier whenNotPaused() {
    require(!paused, "Contract paused");
    _;
  }

  function pause() external {
    require(msg.sender == owner, "Not owner");
    paused = true;
  }

  function unpause() external {
    require(msg.sender == owner, "Not owner");
    paused = false;
  }
}
```

### Fund Recovery

```solidity
// Emergency fund recovery
function emergencyWithdraw() external {
  require(msg.sender == owner, "Not owner");
  require(paused, "Must be paused");

  payable(owner).transfer(address(this).balance);
}
```

## Resources

- [Hardhat Documentation](https://hardhat.org/getting-started/)
- [FHEVM Deployment Guide](https://docs.zama.ai/fhevm/getting-started/deploy)
- [Etherscan Verification](https://docs.etherscan.io/tutorials/verifying-contracts-programmatically)
- [Gas Optimization Tips](https://docs.soliditylang.org/en/latest/internals/optimiser.html)

---

**Need Help?**
- GitHub Issues: Report deployment problems
- Discord: Ask in #deployment channel
- Documentation: Check network-specific guides
