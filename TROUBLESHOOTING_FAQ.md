## FHEVM Troubleshooting FAQ

Comprehensive troubleshooting guide for common FHEVM development issues.

## Table of Contents

- [Setup and Installation](#setup-and-installation)
- [Compilation Errors](#compilation-errors)
- [Deployment Issues](#deployment-issues)
- [Encryption and Proofs](#encryption-and-proofs)
- [Permission Errors](#permission-errors)
- [Testing Problems](#testing-problems)
- [Runtime Errors](#runtime-errors)
- [Performance Issues](#performance-issues)
- [Network and Connection](#network-and-connection)

---

## Setup and Installation

### Q: `Cannot find module '@fhevm/solidity'`

**Symptoms:**
```
Error: Cannot find module '@fhevm/solidity'
```

**Cause:** FHE VM dependency not installed

**Solution:**
```bash
npm install @fhevm/solidity
# or
npm install
```

**Verification:**
```bash
npm list @fhevm/solidity
```

---

### Q: `TypeError: Cannot read property 'FHE' of undefined`

**Symptoms:**
```
TypeError: Cannot read property 'FHE' of undefined
```

**Cause:** FHEVM library not imported correctly

**Solution:**
```solidity
// Add to top of contract
import "fhevm/lib/FHE.sol";
```

---

### Q: `npm ERR! peer dep missing`

**Symptoms:**
```
npm ERR! peer dep missing: hardhat@^2.0.0
```

**Cause:** Dependency version mismatch

**Solution:**
```bash
# Install legacy peer dependencies
npm install --legacy-peer-deps

# Or update to compatible versions
npm update hardhat
```

---

## Compilation Errors

### Q: `TypeError: Member "asEuint32" not found`

**Symptoms:**
```
TypeError: Member "asEuint32" not found or not visible after argument-dependent lookup in type(library FHE)
```

**Cause:** FHE library not imported or wrong Solidity version

**Solution:**
```solidity
// Ensure imports
pragma solidity ^0.8.24;
import "fhevm/lib/FHE.sol";

contract MyContract is ZamaEthereumConfig {
    using FHE for *;

    function myFunction() public {
        euint32 value = FHE.asEuint32(42);
    }
}
```

---

### Q: `Contract exceeds 24KB size limit`

**Symptoms:**
```
Error: Contract code size exceeds 24576 bytes (a limit introduced in Spurious Dragon)
```

**Cause:** Contract too large

**Solution:**
```javascript
// hardhat.config.ts
solidity: {
  version: "0.8.24",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,  // Reduce runs for smaller bytecode
    },
  },
}
```

**Alternative:**
```solidity
// Split into libraries
library Math {
  function calculate() internal { }
}

contract Main {
  using Math for *;
}
```

---

### Q: `DeclarationError: Undeclared identifier`

**Symptoms:**
```
DeclarationError: Undeclared identifier "euint32"
```

**Cause:** FHE types not recognized

**Solution:**
```solidity
// Must inherit from ZamaEthereumConfig
contract MyContract is ZamaEthereumConfig {
    using FHE for *;

    euint32 public myValue;  // Now works
}
```

---

## Deployment Issues

### Q: `Error: insufficient funds for gas * price + value`

**Symptoms:**
```
Error: insufficient funds for gas * price + value
```

**Cause:** Deployer account has insufficient balance

**Solution:**
```bash
# Check balance
npx hardhat run scripts/check-balance.ts --network sepolia

# Get testnet tokens from faucet
# Sepolia: https://sepoliafaucet.com
# Zama: https://faucet.zama.ai
```

---

### Q: `Error: nonce has already been used`

**Symptoms:**
```
Error: nonce has already been used
```

**Cause:** Transaction nonce conflict

**Solution:**
```bash
# Reset nonce in Metamask:
# Settings > Advanced > Clear activity tab data

# Or use fresh account
```

---

### Q: `Error: transaction underpriced`

**Symptoms:**
```
Error: transaction underpriced
```

**Cause:** Gas price too low

**Solution:**
```typescript
// Increase gas price in deployment
const contract = await Factory.deploy({
  gasPrice: ethers.parseUnits("50", "gwei")
});

// Or use EIP-1559
const contract = await Factory.deploy({
  maxFeePerGas: ethers.parseUnits("100", "gwei"),
  maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
});
```

---

### Q: `Error: Contract deployment failed without address`

**Symptoms:**
```
Error: Contract deployment failed without address
```

**Cause:** Deployment transaction reverted

**Solution:**
```typescript
// Check constructor doesn't revert
// Add try-catch for better error handling
try {
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  console.log("Deployed to:", await contract.getAddress());
} catch (error) {
  console.error("Deployment failed:", error);
  // Check constructor requirements
}
```

---

## Encryption and Proofs

### Q: `Error: Input proof validation failed`

**Symptoms:**
```
Error: execution reverted (reason: Input proof validation failed)
```

**Cause:** Invalid or mismatched input proof

**Solutions:**

1. **Wrong contract address in proof**:
```typescript
// ❌ WRONG
const enc = fhevm.createEncryptedInput(wrongContractAddr, user);

// ✅ CORRECT
const contractAddr = await contract.getAddress();
const enc = fhevm.createEncryptedInput(contractAddr, user);
```

2. **Wrong user address in proof**:
```typescript
// ❌ WRONG
const enc = fhevm.createEncryptedInput(contract, alice.address);
await contract.connect(bob).call(...);  // Fails: Bob != Alice

// ✅ CORRECT
const enc = fhevm.createEncryptedInput(contract, bob.address);
await contract.connect(bob).call(...);  // Works
```

3. **Reused proof**:
```typescript
// ❌ WRONG
const { handles, inputProof } = enc.encrypt();
await contract.call1(handles[0], inputProof);  // OK
await contract.call2(handles[0], inputProof);  // FAILS

// ✅ CORRECT
const enc1 = fhevm.createEncryptedInput(contract, user);
enc1.add32(100);
const proof1 = enc1.encrypt();
await contract.call1(proof1.handles[0], proof1.inputProof);

const enc2 = fhevm.createEncryptedInput(contract, user);
enc2.add32(200);
const proof2 = enc2.encrypt();
await contract.call2(proof2.handles[0], proof2.inputProof);
```

---

### Q: `Error: Failed to create encrypted input`

**Symptoms:**
```
Error: Failed to create encrypted input
```

**Cause:** FHEVM instance not initialized

**Solution:**
```typescript
// Initialize fhevm instance first
import { createFhevmInstance } from 'fhevmjs';

const fhevm = await createFhevmInstance({
  networkUrl: 'https://devnet.zama.ai',
  gatewayUrl: 'https://gateway.zama.ai',
});

// Then create encrypted inputs
const enc = fhevm.createEncryptedInput(contract, user);
```

---

### Q: `TypeError: enc.encrypt is not a function`

**Symptoms:**
```
TypeError: enc.encrypt is not a function
```

**Cause:** Created input not properly initialized

**Solution:**
```typescript
// Ensure you add values before encrypting
const enc = fhevm.createEncryptedInput(contract, user);
enc.add32(100);  // Must add at least one value
const { handles, inputProof } = enc.encrypt();  // Now works
```

---

## Permission Errors

### Q: `Error: Handle not accessible`

**Symptoms:**
```
Error: execution reverted (reason: Handle not accessible)
```

**Cause:** Missing `FHE.allowThis()` or `FHE.allow()` call

**Solution:**
```solidity
// ❌ WRONG: No permissions
euint32 result = FHE.add(a, b);
return result;  // Fails later

// ✅ CORRECT: Grant permissions
euint32 result = FHE.add(a, b);
FHE.allowThis(result);  // Contract can use
FHE.allow(result, msg.sender);  // User can decrypt
return result;
```

---

### Q: `Error: Permission denied for decryption`

**Symptoms:**
```
Error: execution reverted (reason: Permission denied for decryption)
```

**Cause:** User doesn't have decrypt permission

**Solution:**
```solidity
// When storing encrypted value, grant user permission
function setValue(externalEuint32 value, bytes calldata proof) external {
    euint32 val = FHE.fromExternal(value, proof);
    userValues[msg.sender] = val;

    // Grant permissions
    FHE.allowThis(val);
    FHE.allow(val, msg.sender);  // ← This allows user to decrypt
}
```

---

### Q: Permission not updated after operation

**Symptoms:**
Operation works once, fails on subsequent use

**Cause:** Permissions not updated for new handles

**Solution:**
```solidity
// Every operation creates new handle needing permissions
function add(externalEuint32 input, bytes calldata proof) external {
    euint32 inputVal = FHE.fromExternal(input, proof);
    euint32 oldValue = values[msg.sender];

    euint32 newValue = FHE.add(oldValue, inputVal);  // New handle!

    // Must grant permissions to NEW handle
    FHE.allowThis(newValue);
    FHE.allow(newValue, msg.sender);

    values[msg.sender] = newValue;
}
```

---

## Testing Problems

### Q: `Error: FHEVM not supported in test environment`

**Symptoms:**
```
Error: FHEVM operations not supported in hardhat network
```

**Cause:** Local Hardhat network doesn't support FHE

**Solution:**

**Option 1: Use Mocks**
```typescript
// In test file
describe("MyContract", function() {
  // Skip FHE operations in tests
  it.skip("should handle encrypted values", async function() {
    // FHE test requires fhevmjs
  });
});
```

**Option 2: Test Structure Only**
```typescript
it("should have encryption function", async function() {
  const tx = contract.setValue;
  expect(tx).to.be.a("function");
  // Test structure, not actual encryption
});
```

**Option 3: Use FHEVM Network**
```bash
# Deploy to actual FHEVM network for integration tests
npx hardhat test --network zama
```

---

### Q: `TypeError: Cannot read property 'wait' of null`

**Symptoms:**
```
TypeError: Cannot read property 'wait' of null
```

**Cause:** Transaction failed and returned null

**Solution:**
```typescript
// Add error handling
const tx = await contract.setValue(value, proof);
if (!tx) {
  throw new Error("Transaction failed");
}
const receipt = await tx.wait();
expect(receipt.status).to.equal(1);
```

---

## Runtime Errors

### Q: `Error: Invalid encrypted type`

**Symptoms:**
```
Error: execution reverted (reason: Invalid encrypted type)
```

**Cause:** Type mismatch between proof and function parameter

**Solution:**
```typescript
// ❌ WRONG: Types don't match
const enc = fhevm.createEncryptedInput(contract, user);
enc.add32(100);  // euint32
const { handles, inputProof } = enc.encrypt();

// Function expects euint64
await contract.setValue64(handles[0], inputProof);  // Fails

// ✅ CORRECT: Match types
enc.add64(100);  // euint64
const { handles, inputProof } = enc.encrypt();
await contract.setValue64(handles[0], inputProof);  // Works
```

---

### Q: `Error: Division by zero`

**Symptoms:**
```
Error: execution reverted (reason: Division by zero)
```

**Cause:** Attempting to divide by zero even in FHE

**Solution:**
```solidity
// Cannot divide by zero even with encrypted values
// Must check before dividing

// Option 1: Use select to avoid division
euint32 result = FHE.select(
    FHE.gt(divisor, FHE.asEuint32(0)),
    FHE.div(dividend, divisor),
    FHE.asEuint32(0)  // Return 0 if divisor is 0
);

// Option 2: Require minimum value
euint32 safeDiv = FHE.div(dividend, FHE.add(divisor, FHE.asEuint32(1)));
```

---

## Performance Issues

### Q: Transaction taking very long or timing out

**Symptoms:**
```
Error: Timeout waiting for transaction receipt
```

**Cause:** FHE operations are computationally expensive

**Solutions:**

1. **Increase timeout**:
```typescript
const tx = await contract.complexOperation(...);
const receipt = await tx.wait(5);  // Wait up to 5 confirmations
```

2. **Optimize operations**:
```solidity
// ❌ INEFFICIENT: Multiple separate operations
euint32 r1 = FHE.add(a, b);
euint32 r2 = FHE.mul(r1, c);
euint32 r3 = FHE.sub(r2, d);

// ✅ EFFICIENT: Batch where possible
// (Note: Still limited by FHE complexity)
```

3. **Use transient permissions**:
```solidity
// For intermediate values
FHE.allowTransient(tempValue);  // Cheaper than allowThis
```

---

### Q: Very high gas costs

**Symptoms:**
```
Gas used: 5,000,000+
```

**Cause:** FHE operations are gas-expensive

**Solutions:**

1. **Batch operations**:
```solidity
// One transaction with multiple operations is cheaper
// than multiple transactions

function batchUpdate(
    externalEuint32[] calldata values,
    bytes calldata proof
) external {
    // Process all values in one transaction
}
```

2. **Use appropriate types**:
```solidity
// ✅ Use smallest type that fits
euint8 age = FHE.asEuint8(25);  // Cheaper than euint64

// ❌ Don't waste space
euint64 age = FHE.asEuint64(25);  // More expensive
```

---

## Network and Connection

### Q: `Error: could not detect network`

**Symptoms:**
```
Error: could not detect network
```

**Cause:** RPC URL not configured or unreachable

**Solution:**
```bash
# Check .env file
cat .env | grep RPC

# Test RPC connection
curl -X POST YOUR_RPC_URL \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Update .env if needed
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ZAMA_RPC_URL=https://devnet.zama.ai
```

---

### Q: `Error: Network request failed`

**Symptoms:**
```
Error: Network request failed
```

**Cause:** Network connectivity or rate limiting

**Solution:**
```bash
# Check internet connection
ping 8.8.8.8

# Check RPC endpoint
curl -I https://devnet.zama.ai

# Use alternative RPC if rate limited
# Get from: https://chainlist.org
```

---

### Q: `Error: Invalid JSON RPC response`

**Symptoms:**
```
Error: Invalid JSON RPC response
```

**Cause:** RPC endpoint returned error

**Solution:**
```typescript
// Add retry logic
async function callWithRetry(fn: Function, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

const result = await callWithRetry(() => contract.getValue());
```

---

## General Debugging Tips

### Enable Verbose Logging

```bash
# Hardhat verbose mode
npx hardhat test --verbose

# Show stack traces
npx hardhat test --show-stack-traces

# Enable debug logs
DEBUG=* npx hardhat test
```

### Check Contract State

```typescript
// Read contract state for debugging
const value = await contract.myPublicVariable();
console.log("Current value:", value);

// Check permissions
const hasPermission = await contract.hasPermission(user);
console.log("User has permission:", hasPermission);
```

### Verify Environment

```bash
# Check node version
node --version  # Should be 18+

# Check npm version
npm --version  # Should be 8+

# Check hardhat version
npx hardhat --version  # Should be 2.24.3+

# List dependencies
npm list
```

---

## Getting Help

If you're still experiencing issues:

1. **Check Official Docs**: https://docs.zama.ai/fhevm
2. **Search Issues**: https://github.com/zama-ai/fhevm/issues
3. **Ask Community**: Discord or Forum
4. **File Bug Report**: With minimal reproducible example

**When asking for help, include:**
- Full error message
- Code snippet causing the issue
- Environment details (node version, OS, network)
- Steps to reproduce
- What you've already tried

---

## Quick Reference

### Common Error Codes

| Error | Cause | Solution |
|-------|-------|----------|
| `Input proof validation failed` | Invalid proof | Regenerate proof with correct contract and user |
| `Handle not accessible` | Missing permissions | Add `FHE.allowThis()` |
| `Permission denied` | No decrypt permission | Add `FHE.allow(user)` |
| `Division by zero` | Divide by 0 | Check divisor or use select |
| `Insufficient funds` | Low balance | Get testnet tokens |
| `Nonce too high` | Stale nonce | Reset nonce |
| `Transaction underpriced` | Gas too low | Increase gas price |

### Diagnostic Commands

```bash
# Check compilation
npx hardhat compile

# Run tests
npx hardhat test

# Check balances
npx hardhat run scripts/check-balance.ts

# Verify deployment
npx hardhat verify --network sepolia ADDRESS

# Clean and rebuild
npx hardhat clean
npm install
npx hardhat compile
```

---

**Need more help? Check the other guides:**
- [ANTI_PATTERNS_GUIDE.md](./ANTI_PATTERNS_GUIDE.md) - Common mistakes
- [INPUT_PROOF_GUIDE.md](./INPUT_PROOF_GUIDE.md) - Proof issues
- [HANDLES_GUIDE.md](./HANDLES_GUIDE.md) - Handle problems
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment issues
