# FHEVM Examples Library

Comprehensive collection of FH EVM (Fully Homomorphic Encryption Virtual Machine) example contracts demonstrating privacy-preserving smart contract patterns.

## Overview

This examples library provides production-ready smart contract examples showcasing various FHEVM concepts, from basic operations to advanced patterns. Each example is fully documented with detailed comments, test cases, and best practices.

## Quick Navigation

### By Experience Level

**Beginners** → Start with `basic/` examples
**Intermediate** → Explore `encryption/` and `decryption/` patterns
**Advanced** → Dive into `access-control/` and `advanced/` implementations

### By Use Case

- **Financial Applications** → See auction examples in `advanced/`
- **Voting Systems** → Check `advanced/PrivateVoting.sol`
- **Data Privacy** → Review `encryption/` and `decryption/` examples
- **Access Management** → Study `access-control/` patterns

## Example Categories

### 1. Basic Operations (`basic/`)

Foundation FHE concepts and operations.

#### FHECounter.sol
**Purpose:** Simple encrypted counter
**Demonstrates:**
- Encrypted state management (`euint32`)
- Homomorphic addition and subtraction
- Access control with `FHE.allow()` and `FHE.allowThis()`
- Input proof validation

**Key Functions:**
- `increment()` - Add encrypted value to counter
- `decrement()` - Subtract encrypted value from counter
- `getCount()` - Retrieve encrypted counter value

**Learning Outcomes:**
- Understanding euint types
- Basic FHE operations
- Permission management
- Input validation patterns

---

#### FHEArithmetic.sol
**Purpose:** Complete arithmetic operations showcase
**Demonstrates:**
- `FHE.add()` - Homomorphic addition
- `FHE.sub()` - Homomorphic subtraction
- `FHE.mul()` - Homomorphic multiplication
- `FHE.div()` - Homomorphic division
- `FHE.rem()` - Homomorphic modulo/remainder
- Chaining multiple operations
- Mixing encrypted and plaintext values

**Key Functions:**
- `add()`, `subtract()`, `multiply()`, `divide()`, `remainder()`
- `complexOperation()` - Chains multiple operations
- `addConstant()` - Mix plaintext with encrypted
- `average()` - Calculate average of two encrypted values

**Learning Outcomes:**
- All FHE arithmetic operators
- Operation chaining patterns
- Performance considerations
- Type conversions

---

#### FHEComparison.sol
**Purpose:** Comparison and conditional logic
**Demonstrates:**
- `FHE.eq()`, `FHE.ne()` - Equality comparisons
- `FHE.gt()`, `FHE.gte()`, `FHE.lt()`, `FHE.lte()` - Relational comparisons
- `FHE.select()` - Encrypted ternary operator
- `FHE.and()`, `FHE.or()`, `FHE.not()` - Boolean logic
- `ebool` - Encrypted boolean type

**Key Functions:**
- Comparison functions for all operators
- `conditionalSelect()` - Encrypted if-then-else logic
- `getMax()`, `getMin()` - Min/max without decryption
- `isInRange()` - Range validation
- `clampToRange()` - Value clamping

**Learning Outcomes:**
- Encrypted comparisons
- Conditional logic without branching
- Boolean operations on encrypted data
- Min/max/clamp patterns

### 2. Encryption Patterns (`encryption/`)

Handling encrypted inputs and batch operations.

#### EncryptSingleValue.sol
**Purpose:** Single value encryption patterns
**Demonstrates:**
- Converting external encrypted inputs
- Zero-knowledge proof validation
- Permission management
- Common pitfalls and anti-patterns

**Key Functions:**
- `storeValue()` - Store encrypted value with validation
- `getValue()` - Retrieve encrypted value

**Best Practices:**
- ✅ Always grant both `FHE.allowThis()` and `FHE.allow()`
- ✅ Validate input proofs
- ✅ Handle permissions immediately

**Anti-Patterns Shown:**
- ❌ Missing `FHE.allowThis()` permission
- ❌ Missing `FHE.allow()` permission
- ❌ Trying to use encrypted values as plaintext

---

#### EncryptMultipleValues.sol
**Purpose:** Batch encryption and management
**Demonstrates:**
- Encrypting multiple values in single transaction
- Single input proof for multiple values
- Struct-based encrypted storage
- Selective permission granting
- Operations across multiple encrypted fields

**Key Functions:**
- `createProfile()` - Create profile with multiple encrypted fields
- `updateField()` - Update specific encrypted field
- `getProfile()` - Retrieve all encrypted values
- `calculateEligibilityScore()` - Calculate from multiple factors
- `grantAccess()` - Selective permission granting

**Use Cases:**
- User profiles with private data
- Multi-factor authentication
- Confidential scoring systems
- Batch data processing

### 3. Decryption Patterns (`decryption/`)

User-controlled and public decryption mechanisms.

#### UserDecryptSingleValue.sol
**Purpose:** User-controlled private decryption
**Demonstrates:**
- User permission-based decryption
- Decryption request patterns
- Relayer callback mechanisms
- Privacy-preserving decryption

**Key Functions:**
- `storeSecret()` - Store encrypted secret
- `getSecret()` - Get encrypted handle
- `requestDecryption()` - Request user decryption
- `revealDecryptedSecret()` - Relayer callback

**Decryption Flow:**
1. User calls `requestDecryption()`
2. Contract emits event with request details
3. Decryption relayer picks up event
4. Relayer decrypts using user's private key
5. Relayer calls callback with plaintext value

---

#### PublicDecryption.sol
**Purpose:** Public on-chain result revealing
**Demonstrates:**
- When to use public decryption
- Oracle-based decryption flow
- Async decryption handling
- Public vs. private decryption trade-offs

**Key Functions:**
- `createAuction()`, `placeBid()` - Encrypted auction
- `endAuction()` - Request public decryption
- `revealHighestBid()` - Oracle callback with plaintext

**Use Cases:**
- Auction winner reveals
- Voting result publication
- Lottery number reveals
- Public settlement calculations

**Security Considerations:**
- ✅ Only decrypt when necessary
- ✅ Authenticate oracle callbacks
- ✅ Validate decryption timing
- ✅ Minimize public information

### 4. Access Control (`access-control/`)

Permission management and access patterns.

#### AccessControlExample.sol
**Purpose:** Comprehensive access control patterns
**Demonstrates:**
- `FHE.allowThis()` - Contract permission
- `FHE.allow()` - User permission
- `FHE.allowTransient()` - Temporary permission
- Permission updates after operations
- Selective access granting

**Key Functions:**
- `setBalance()` - Store with permissions
- `transfer()` - Update permissions during transfer
- `updateSharedValue()` - Admin-only updates
- `grantSharedAccess()` - Selective permission granting
- `compareValues()` - Transient permissions

**Permission Concepts:**
- **Contract Permission** - Contract can perform FHE operations
- **User Permission** - User can decrypt value
- **Transient Permission** - Valid only within transaction
- **Permission Transfer** - Updating permissions during operations

### 5. Advanced Patterns (`advanced/`)

Complex real-world implementations.

#### PrivateVoting.sol
**Purpose:** Encrypted voting with homomorphic tallying
**Demonstrates:**
- Encrypted vote storage
- Homomorphic vote counting
- Privacy-preserving tallying
- Multi-step voting process
- Complex conditional logic on encrypted data

**Key Functions:**
- `createPoll()` - Initialize encrypted poll
- `castVote()` - Submit encrypted vote
- `closePoll()` - End voting period
- `getResults()` - Get encrypted tallies
- `grantResultsAccess()` - Allow creator to decrypt results

**Privacy Properties:**
- ✅ Individual votes never revealed
- ✅ Tallying on encrypted data
- ✅ Only final results decrypted
- ✅ Perfect vote secrecy

---

#### ConfidentialAuction.sol
**Purpose:** Blind auction with sealed bids
**Demonstrates:**
- Encrypted bid management
- Homomorphic bid comparison
- Winner determination without decryption
- Secure settlement mechanisms

**Key Functions:**
- `createAuction()` - Initialize auction
- `placeBid()` - Submit encrypted bid
- `endAuction()` - Finalize auction
- `getAuctionDetails()` - Query auction state

**Use Cases:**
- NFT auctions
- Treasury bond auctions
- Procurement auctions
- Real estate bidding

## Usage Patterns

### Testing FHEVM Contracts

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("FHEContract", function () {
  // In real FHEVM environment:
  // 1. Create encrypted input
  const encryptedInput = await fhevm.createEncryptedInput(
    contractAddress,
    userAddress
  );
  encryptedInput.add32(42);
  const { handles, inputProof } = await encryptedInput.encrypt();

  // 2. Call contract with encrypted value
  await contract.setValue(handles[0], inputProof);

  // 3. Retrieve encrypted result
  const encryptedResult = await contract.getValue();

  // 4. Decrypt to verify (via decryption oracle)
  const decrypted = await decrypt(encryptedResult, userAddress);
  expect(decrypted).to.equal(42);
});
```

### Creating Encrypted Inputs

```typescript
// Single value
const enc = await fhevm.createEncryptedInput(contractAddr, userAddr);
enc.add32(value);
const { handles, inputProof } = await enc.encrypt();

// Multiple values
const enc = await fhevm.createEncryptedInput(contractAddr, userAddr);
enc.add32(value1);
enc.add64(value2);
enc.add32(value3);
const { handles, inputProof } = await enc.encrypt();
// Use handles[0], handles[1], handles[2] with single inputProof
```

### Permission Management

```solidity
// ALWAYS grant both permissions for persistent values
euint32 value = FHE.fromExternal(input, proof);

FHE.allowThis(value);        // Contract can operate on it
FHE.allow(value, msg.sender); // User can decrypt it

// For temporary values (single transaction)
FHE.allowTransient(tempValue);
```

### Conditional Logic

```solidity
// Can't use regular if statements
// ❌ if (encryptedValue > 10) { ... }  // DOESN'T WORK!

// ✅ Use FHE.select() instead
ebool condition = FHE.gt(encryptedValue, FHE.asEuint32(10));
euint32 result = FHE.select(
  condition,
  valueIfTrue,
  valueIfFalse
);
```

## Learning Path

### Level 1: Fundamentals
1. Start with `FHECounter.sol` - Understand encrypted state
2. Study `EncryptSingleValue.sol` - Learn input handling
3. Review `UserDecryptSingleValue.sol` - Understand decryption

### Level 2: Operations
1. Explore `FHEArithmetic.sol` - Master all operations
2. Study `FHEComparison.sol` - Learn conditional logic
3. Review `EncryptMultipleValues.sol` - Handle complex data

### Level 3: Patterns
1. Study `AccessControlExample.sol` - Permission patterns
2. Review `PublicDecryption.sol` - Decryption mechanisms
3. Understand trade-offs between approaches

### Level 4: Applications
1. Analyze `PrivateVoting.sol` - Complex application
2. Study `ConfidentialAuction.sol` - Real-world use case
3. Combine patterns for your own applications

## Best Practices Summary

### Always Do ✅
- Grant both `FHE.allowThis()` and `FHE.allow()` for persistent values
- Validate input proofs with `FHE.fromExternal()`
- Use `FHE.select()` for conditional logic
- Emit events for operation tracking
- Test with real FHEVM environment
- Document why encryption is needed
- Minimize operations for gas efficiency

### Never Do ❌
- Use encrypted values in regular if statements
- Forget to grant permissions after operations
- Try to decrypt intermediate values unnecessarily
- Use plaintext directly with encrypted values (convert first)
- Expose more information than required
- Assume overflow/underflow protection
- Block execution waiting for decryption

## Performance Considerations

**Operation Costs** (Relative):
- Equality check: 1x
- Addition: 1x
- Subtraction: 1x
- Comparison: 2x
- Multiplication: 3x
- Division: 5x
- FHE.select(): 2x

**Optimization Tips:**
- Minimize multiplication and division
- Batch operations when possible
- Use `FHE.allowTransient()` for temporary values
- Cache encrypted values
- Combine conditions with `FHE.and()`/`FHE.or()`

## Security Checklist

- [ ] All encrypted values have proper permissions
- [ ] Input proofs validated for all external inputs
- [ ] Permissions updated after operations
- [ ] Minimal information publicly decrypted
- [ ] Access control enforced for sensitive operations
- [ ] No plaintext leakage through events or storage
- [ ] Decryption oracle authenticated
- [ ] User permissions granted appropriately

## Common Errors and Solutions

### Error: "Permission denied"
**Cause:** Missing `FHE.allowThis()` or `FHE.allow()`
**Solution:** Grant both permissions after creating encrypted value

### Error: "Invalid input proof"
**Cause:** Proof doesn't match encrypted value or signer
**Solution:** Ensure proof generated for correct contract and user

### Error: "Can't use euint32 in condition"
**Cause:** Trying to use encrypted value in if statement
**Solution:** Use `FHE.eq/gt/lt` to create `ebool`, then `FHE.select()`

### Error: "Type mismatch"
**Cause:** Mixing different euint sizes
**Solution:** Use `FHE.asEuint32()`, `FHE.asEuint64()` to convert

## Additional Resources

- **FHEVM Documentation**: https://docs.zama.ai/fhevm
- **Protocol Examples**: https://docs.zama.ai/fhevm/fundamentals
- **GitHub Repository**: https://github.com/zama-ai/fhevm
- **Community Forum**: https://community.zama.ai
- **Discord**: https://discord.gg/zama

## Contributing

To add new examples:
1. Create contract in appropriate category directory
2. Add comprehensive comments with `@chapter` tags
3. Write complete test suite
4. Update this README
5. Update `scripts/create-fhevm-category.ts`
6. Generate documentation

See `MAINTENANCE_GUIDE.md` for detailed procedures.

---

**Total Examples:** 10 contracts
**Lines of Code:** 3,000+
**Test Coverage:** Comprehensive patterns and anti-patterns
**Documentation:** Inline comments + this guide

Built for the Zama FHEVM Example Hub - December 2025 Bounty Program
