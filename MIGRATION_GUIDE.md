## FHEVM Migration Guide

Guide for migrating existing Solidity contracts to FHEVM encrypted versions.

## Table of Contents

- [Migration Overview](#migration-overview)
- [Type Conversions](#type-conversions)
- [Function Changes](#function-changes)
- [Storage Modifications](#storage-modifications)
- [Testing Strategy](#testing-strategy)
- [Migration Examples](#migration-examples)
- [Common Patterns](#common-patterns)
- [Validation Checklist](#validation-checklist)

---

## Migration Overview

### What Gets Encrypted

**Should Encrypt:**
- User balances
- Account data (income, age, credit score)
- Transaction amounts
- Voting preferences
- Bid amounts
- Personal information
- Financial details

**Don't Need to Encrypt:**
- Contract addresses
- Timestamps
- Public counts
- Fixed parameters
- User IDs (often)

### Migration Steps

1. **Identify sensitive data** - What needs encryption
2. **Convert types** - `uint` → `euint`
3. **Update functions** - Add input proofs
4. **Modify operations** - Use FHE functions
5. **Handle permissions** - Grant `allowThis()` and `allow()`
6. **Test thoroughly** - Verify behavior
7. **Deploy carefully** - Follow deployment guide

---

## Type Conversions

### Basic Type Mapping

```solidity
// PLAINTEXT SOLIDITY         =>  FHEVM EQUIVALENT

// Unsigned integers
uint8                          =>  euint8
uint16                         =>  euint16
uint32                         =>  euint32
uint64                         =>  euint64
uint128/uint256                =>  euint64 (highest supported)

// Boolean
bool                           =>  ebool

// Address
address (when encrypted)       =>  eaddress

// NOT ENCRYPTED (stay plaintext)
address (public)               =>  address
uint (for IDs/counters)        =>  uint
bool (for visibility)          =>  bool
```

### Type Conversion Examples

```solidity
// ❌ BEFORE: Plaintext balance
uint32 balance = 1000;

// ✅ AFTER: Encrypted balance
euint32 balance;

function initializeBalance() internal {
    balance = FHE.asEuint32(1000);
}

// Or from external encrypted input
function setBalance(externalEuint32 encryptedValue, bytes calldata proof) external {
    balance = FHE.fromExternal(encryptedValue, proof);
}
```

---

## Function Changes

### Input Changes

**Before:**
```solidity
function deposit(uint32 amount) external {
    balance += amount;
}
```

**After:**
```solidity
function deposit(externalEuint32 encryptedAmount, bytes calldata proof) external {
    // Validate and convert external encrypted value
    euint32 amount = FHE.fromExternal(encryptedAmount, proof);

    // Use encrypted arithmetic
    balance = FHE.add(balance, amount);

    // Grant permissions to result
    FHE.allowThis(balance);
    FHE.allow(balance, msg.sender);
}
```

### Output Changes

**Before:**
```solidity
function getBalance() public view returns (uint32) {
    return balance;
}
```

**After:**
```solidity
function getBalance() public view returns (euint32) {
    return balance;  // Return encrypted handle
}

// User can decrypt with permission:
function requestBalanceDecryption() external returns (string) {
    // Request oracle to decrypt balance
    // Return request ID for tracking
}
```

### Conditional Logic Changes

**Before:**
```solidity
function processIfEligible(uint32 amount) external {
    if (age >= 18) {
        balance += amount;
    }
}
```

**After:**
```solidity
function processIfEligible(
    externalEuint32 encryptedAmount,
    bytes calldata proof
) external {
    euint32 amount = FHE.fromExternal(encryptedAmount, proof);

    // Can't use if() with encrypted values
    // Must use FHE.select() instead

    euint32 minAge = FHE.asEuint32(18);
    ebool isAdult = FHE.gte(age, minAge);

    // Select whether to update
    euint32 updateAmount = FHE.select(isAdult, amount, FHE.asEuint32(0));
    balance = FHE.add(balance, updateAmount);

    FHE.allowThis(balance);
}
```

---

## Storage Modifications

### Single Value Migration

**Before:**
```solidity
contract BankAccount {
    mapping(address => uint64) public balances;

    function deposit(uint64 amount) external {
        balances[msg.sender] += amount;
    }
}
```

**After:**
```solidity
contract BankAccount {
    mapping(address => euint64) public balances;

    function deposit(externalEuint64 amount, bytes calldata proof) external {
        euint64 encryptedAmount = FHE.fromExternal(amount, proof);

        // Get current balance (encrypted)
        euint64 currentBalance = balances[msg.sender];

        // Add amount
        euint64 newBalance = FHE.add(currentBalance, encryptedAmount);

        // Store and set permissions
        balances[msg.sender] = newBalance;
        FHE.allowThis(newBalance);
        FHE.allow(newBalance, msg.sender);
    }
}
```

### Struct Migration

**Before:**
```solidity
struct UserProfile {
    uint32 age;
    uint64 income;
    uint32 creditScore;
}

mapping(address => UserProfile) profiles;
```

**After:**
```solidity
struct UserProfile {
    euint32 age;
    euint64 income;
    euint32 creditScore;
}

mapping(address => UserProfile) profiles;

function setProfile(
    externalEuint32 age,
    externalEuint64 income,
    externalEuint32 creditScore,
    bytes calldata proof  // Single proof for all values
) external {
    euint32 encAge = FHE.fromExternal(age, proof);
    euint64 encIncome = FHE.fromExternal(income, proof);
    euint32 encScore = FHE.fromExternal(creditScore, proof);

    profiles[msg.sender] = UserProfile(encAge, encIncome, encScore);

    // Grant permissions for all fields
    FHE.allowThis(encAge);
    FHE.allowThis(encIncome);
    FHE.allowThis(encScore);
}
```

### Array Migration

**Before:**
```solidity
contract Voting {
    uint8[] public votes;  // 0 for NO, 1 for YES

    function vote(uint8 choice) external {
        votes.push(choice);
    }
}
```

**After:**
```solidity
contract Voting {
    euint8[] public votes;  // Encrypted choices

    function vote(externalEuint8 choice, bytes calldata proof) external {
        euint8 encChoice = FHE.fromExternal(choice, proof);
        votes.push(encChoice);
        FHE.allowThis(encChoice);
    }

    function countVotes() external returns (euint32) {
        euint32 yesCount = FHE.asEuint32(0);

        for (uint i = 0; i < votes.length; i++) {
            // Add 1 if vote is 1, 0 if vote is 0
            ebool isYes = FHE.eq(votes[i], FHE.asEuint8(1));
            euint32 vote = FHE.select(isYes, FHE.asEuint32(1), FHE.asEuint32(0));
            yesCount = FHE.add(yesCount, vote);
        }

        FHE.allowThis(yesCount);
        return yesCount;
    }
}
```

---

## Testing Strategy

### Unit Tests Setup

```typescript
// test/Migration.test.ts
import { ethers } from "hardhat";
import { expect } from "chai";

describe("Encrypted Version", function () {
  let contract: any;
  let owner: any;
  let fhevm: any;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    // Initialize FHEVM
    // fhevm = await initializeFhevm();

    // Deploy contract
    const Factory = await ethers.getContractFactory("ContractName");
    contract = await Factory.deploy();
  });

  it("should work with encrypted inputs", async function () {
    // Test with encrypted values
    // Note: Actual implementation requires fhevmjs
    const tx = contract.someFunction;
    expect(tx).to.be.a("function");
  });
});
```

### Comparison Testing

```typescript
describe("Behavior Equivalence", function () {
  let plainContract: any;
  let encryptedContract: any;

  it("should produce equivalent results", async function () {
    // Test scenario with plaintext contract
    await plainContract.deposit(100);
    const plainBalance = await plainContract.getBalance();

    // Test same scenario with encrypted contract
    // (with decrypted result)
    await encryptedContract.deposit(encryptedAmount, proof);
    const encryptedBalance = await encryptedContract.getDecryptedBalance();

    expect(encryptedBalance).to.equal(plainBalance);
  });
});
```

### Security Testing

```typescript
describe("Encryption Security", function () {
  it("should not leak values through operations", async function () {
    // Two different amounts should have same gas cost
    const tx1 = await contract.deposit(100, proof1);
    const receipt1 = await tx1.wait();

    const tx2 = await contract.deposit(999999, proof2);
    const receipt2 = await tx2.wait();

    // Gas costs should be similar (within 20%)
    const ratio = Math.abs(receipt1.gasUsed - receipt2.gasUsed) /
                  Math.max(receipt1.gasUsed, receipt2.gasUsed);
    expect(ratio).to.be.lessThan(0.2);
  });

  it("should prevent unauthorized decryption", async function () {
    // User1 can decrypt their own value
    await encryptedContract.connect(user1).requestDecryption();

    // User2 cannot decrypt User1's value
    await expect(
      encryptedContract.connect(user2).requestDecryption(user1Address)
    ).to.be.reverted;
  });
});
```

---

## Migration Examples

### Example 1: Simple Counter

**Plaintext Version:**
```solidity
contract Counter {
    uint32 public count = 0;

    function increment(uint32 amount) external {
        count += amount;
    }

    function getCount() external view returns (uint32) {
        return count;
    }
}
```

**Encrypted Version:**
```solidity
import "fhevm/lib/FHE.sol";

contract EncryptedCounter is ZamaEthereumConfig {
    using FHE for *;

    euint32 public count;

    constructor() {
        count = FHE.asEuint32(0);
        FHE.allowThis(count);
    }

    function increment(externalEuint32 amount, bytes calldata proof) external {
        euint32 amountDecrypted = FHE.fromExternal(amount, proof);

        count = FHE.add(count, amountDecrypted);

        FHE.allowThis(count);
        FHE.allow(count, msg.sender);
    }

    function getCountHandle() external view returns (euint32) {
        return count;
    }

    function requestCountDecryption() external returns (bytes32) {
        // Request oracle to decrypt
        // Returns request ID
    }
}
```

### Example 2: Token Transfer

**Plaintext Version:**
```solidity
contract SimpleToken {
    mapping(address => uint64) balances;

    function transfer(address to, uint64 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }

    function getBalance(address user) external view returns (uint64) {
        return balances[user];
    }
}
```

**Encrypted Version:**
```solidity
contract EncryptedToken is ZamaEthereumConfig {
    using FHE for *;

    mapping(address => euint64) balances;

    function transfer(
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata proof
    ) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, proof);

        euint64 senderBalance = balances[msg.sender];

        // Check balance: sender balance >= amount
        ebool hasSufficientBalance = FHE.gte(senderBalance, amount);

        // Encrypt the amount to subtract (0 if insufficient)
        euint64 amountToSubtract = FHE.select(
            hasSufficientBalance,
            amount,
            FHE.asEuint64(0)
        );

        // Update balances
        balances[msg.sender] = FHE.sub(senderBalance, amountToSubtract);
        balances[to] = FHE.add(balances[to], amountToSubtract);

        // Grant permissions
        FHE.allowThis(balances[msg.sender]);
        FHE.allowThis(balances[to]);
        FHE.allow(balances[msg.sender], msg.sender);
        FHE.allow(balances[to], to);
    }
}
```

---

## Common Patterns

### Pattern 1: Conditional Logic

**Plaintext:**
```solidity
if (balance >= minimumRequired) {
    processTransaction();
}
```

**Encrypted:**
```solidity
ebool canProcess = FHE.gte(balance, minimumRequired);

// Use FHE.select() or struct to handle conditional logic
euint32 result = FHE.select(canProcess, successValue, failureValue);
```

### Pattern 2: Multi-Step Calculations

**Plaintext:**
```solidity
uint256 fee = amount * feePercent / 100;
uint256 total = amount + fee;
```

**Encrypted:**
```solidity
euint64 fee = FHE.div(
    FHE.mul(amount, FHE.asEuint64(feePercent)),
    FHE.asEuint64(100)
);
euint64 total = FHE.add(amount, fee);

FHE.allowThis(fee);
FHE.allowThis(total);
```

### Pattern 3: Range Checking

**Plaintext:**
```solidity
if (age >= 18 && age <= 65) {
    allowTransaction();
}
```

**Encrypted:**
```solidity
ebool isAdult = FHE.gte(age, FHE.asEuint32(18));
ebool belowRetirement = FHE.lte(age, FHE.asEuint32(65));
ebool inRange = FHE.and(isAdult, belowRetirement);

euint32 result = FHE.select(inRange, allowCode, denyCode);
```

---

## Validation Checklist

### Pre-Migration

- [ ] Identified all sensitive data to encrypt
- [ ] Determined which types to use (euint8/16/32/64)
- [ ] Planned storage changes
- [ ] Reviewed function signatures
- [ ] Updated test strategy

### During Migration

- [ ] Converted types correctly
- [ ] Added input proof parameters
- [ ] Updated arithmetic operations to FHE
- [ ] Added permission grants
- [ ] Removed plaintext comparisons
- [ ] Implemented FHE.select() for conditionals
- [ ] Maintained function behavior
- [ ] Updated documentation

### Testing

- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Security tests passing
- [ ] Gas costs acceptable
- [ ] Behavior equivalent to plaintext version
- [ ] Permission handling correct
- [ ] No information leakage through gas

### Post-Migration

- [ ] Code reviewed
- [ ] Deployed to testnet
- [ ] Verified on block explorer
- [ ] Monitored for issues
- [ ] Updated user documentation
- [ ] Ready for mainnet deployment

---

## Gradual Migration Strategy

### Phase 1: Hybrid Approach

Keep some data plaintext, encrypt sensitive parts:

```solidity
struct UserData {
    uint32 userId;          // Plaintext (public)
    uint256 timestamp;      // Plaintext (public)
    euint64 balance;        // Encrypted (sensitive)
    euint8 creditRating;    // Encrypted (sensitive)
}
```

### Phase 2: Increase Coverage

Gradually encrypt more data as experience grows.

### Phase 3: Full Migration

Complete migration once confident.

---

## Resources

- [ANTI_PATTERNS_GUIDE.md](./ANTI_PATTERNS_GUIDE.md) - Common mistakes
- [HANDLES_GUIDE.md](./HANDLES_GUIDE.md) - Understanding handles
- [INPUT_PROOF_GUIDE.md](./INPUT_PROOF_GUIDE.md) - Proof validation
- [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) - Client-side

---

**Migration Checklist Summary:**
1. Identify sensitive data
2. Convert types
3. Update functions
4. Add permissions
5. Test thoroughly
6. Deploy safely
7. Monitor and maintain

**Key Principle:** Start small, test thoroughly, scale gradually.
