# FHEVM Performance Optimization Guide

Comprehensive guide for optimizing FHEVM contract performance and gas costs.

## Table of Contents

- [Understanding FHE Costs](#understanding-fhe-costs)
- [Gas Cost Optimization](#gas-cost-optimization)
- [Operation Efficiency](#operation-efficiency)
- [Storage Optimization](#storage-optimization)
- [Proof Management](#proof-management)
- [Benchmarking](#benchmarking)
- [Best Practices](#best-practices)

---

## Understanding FHE Costs

### FHE Operation Costs

FHE operations are **significantly more expensive** than regular Solidity operations:

```
Regular Solidity:
  uint256 a = 10;
  uint256 b = 20;
  uint256 c = a + b;  // ~10 gas

FHE Operations:
  euint32 a = FHE.asEuint32(10);     // ~50,000 gas
  euint32 b = FHE.asEuint32(20);     // ~50,000 gas
  euint32 c = FHE.add(a, b);          // ~100,000 gas
  FHE.allowThis(c);                   // ~30,000 gas
```

**Key Insight:** FHE operations are ~1,000-10,000x more expensive than plaintext.

### Cost Breakdown

| Operation | Typical Gas Cost | Comparison to Regular |
|-----------|-----------------|----------------------|
| `FHE.asEuint32()` | 50,000 - 80,000 | 5,000x |
| `FHE.add()` | 100,000 - 150,000 | 10,000x |
| `FHE.mul()` | 200,000 - 300,000 | 20,000x |
| `FHE.div()` | 300,000 - 500,000 | 30,000x |
| `FHE.eq()` / `FHE.gt()` | 80,000 - 120,000 | 8,000x |
| `FHE.select()` | 150,000 - 200,000 | 15,000x |
| `FHE.allowThis()` | 20,000 - 40,000 | 2,000x |
| `FHE.allow(user)` | 30,000 - 50,000 | 3,000x |
| `FHE.fromExternal()` | 100,000 - 200,000 | 10,000x |

**Note:** Actual costs vary by network and encrypted type size.

---

## Gas Cost Optimization

### 1. Choose Appropriate Types

Use the smallest encrypted type that fits your data:

```solidity
// ❌ INEFFICIENT: Using euint64 for small values
euint64 age = FHE.asEuint64(25);  // Wastes gas

// ✅ EFFICIENT: Use smallest type
euint8 age = FHE.asEuint8(25);     // Cheaper operations

// ❌ INEFFICIENT
euint64 percentage = FHE.asEuint64(75);  // Max value is 100

// ✅ EFFICIENT
euint8 percentage = FHE.asEuint8(75);
```

**Gas Savings:** ~30-50% by using euint8 instead of euint64

### 2. Batch Operations

Process multiple values in single transaction:

```solidity
// ❌ INEFFICIENT: Multiple transactions
function updateValue1(externalEuint32 v1, bytes calldata p1) external {
    value1 = FHE.fromExternal(v1, p1);
}

function updateValue2(externalEuint32 v2, bytes calldata p2) external {
    value2 = FHE.fromExternal(v2, p2);
}

// ✅ EFFICIENT: Single transaction
function updateBatch(
    externalEuint32 v1,
    externalEuint32 v2,
    bytes calldata proof  // Single proof for both
) external {
    value1 = FHE.fromExternal(v1, proof);
    value2 = FHE.fromExternal(v2, proof);

    // Permission grants also batched
    FHE.allowThis(value1);
    FHE.allowThis(value2);
}
```

**Gas Savings:** ~40-60% by batching

### 3. Minimize Permission Operations

```solidity
// ❌ INEFFICIENT: Multiple permission grants
euint32 a = FHE.asEuint32(10);
FHE.allowThis(a);
euint32 b = FHE.asEuint32(20);
FHE.allowThis(b);
euint32 c = FHE.add(a, b);
FHE.allowThis(c);

// ✅ EFFICIENT: Use transient for intermediates
euint32 a = FHE.asEuint32(10);
FHE.allowTransient(a);  // Cheaper for temporary values
euint32 b = FHE.asEuint32(20);
FHE.allowTransient(b);
euint32 c = FHE.add(a, b);
FHE.allowThis(c);  // Only final result needs full permission
```

**Gas Savings:** ~20-30% by using transient permissions

### 4. Reduce Comparison Operations

Comparisons are expensive:

```solidity
// ❌ INEFFICIENT: Multiple comparisons
ebool isAdult = FHE.gte(age, FHE.asEuint8(18));
ebool isEligible = FHE.and(isAdult, FHE.lte(age, FHE.asEuint8(65)));

// ✅ EFFICIENT: Combine conditions when possible
// Or use range checks with select
```

### 5. Optimize Conditional Logic

```solidity
// ❌ INEFFICIENT: Complex nested selects
euint32 result = FHE.select(
    condition1,
    FHE.select(condition2, value1, value2),
    FHE.select(condition3, value3, value4)
);

// ✅ EFFICIENT: Simplify logic
// Restructure to minimize select operations
```

---

## Operation Efficiency

### Arithmetic Operations

**Cost Ranking (Cheapest to Most Expensive):**

1. Addition (`FHE.add`) - ~100k gas
2. Subtraction (`FHE.sub`) - ~100k gas
3. Multiplication (`FHE.mul`) - ~250k gas
4. Division (`FHE.div`) - ~400k gas
5. Modulo (`FHE.rem`) - ~400k gas

**Optimization Strategy:**

```solidity
// Prefer addition/subtraction over multiplication/division

// ❌ LESS EFFICIENT
euint32 result = FHE.div(FHE.mul(value, FHE.asEuint32(100)), FHE.asEuint32(3));

// ✅ MORE EFFICIENT (if mathematically equivalent)
euint32 result = FHE.mul(value, FHE.asEuint32(33));  // Approximate
```

### Comparison Operations

All comparisons have similar cost (~100k gas):

```solidity
// These have similar costs:
ebool eq = FHE.eq(a, b);    // ~100k
ebool gt = FHE.gt(a, b);    // ~100k
ebool lte = FHE.lte(a, b);  // ~100k
```

**Optimization:** Choose the simplest comparison for your logic.

### Boolean Operations

```solidity
// Efficient boolean operations
ebool result = FHE.and(condition1, condition2);  // ~80k gas
ebool result = FHE.or(condition1, condition2);   // ~80k gas
ebool result = FHE.not(condition);               // ~50k gas
```

**Tip:** Boolean operations are cheaper than arithmetic.

---

## Storage Optimization

### 1. Minimize Storage Writes

```solidity
// ❌ INEFFICIENT: Multiple storage writes
userBalance[alice] = FHE.add(userBalance[alice], amount1);
userBalance[alice] = FHE.add(userBalance[alice], amount2);

// ✅ EFFICIENT: Calculate once, store once
euint64 newBalance = FHE.add(userBalance[alice], amount1);
newBalance = FHE.add(newBalance, amount2);
userBalance[alice] = newBalance;
```

### 2. Pack Data Efficiently

```solidity
// ❌ INEFFICIENT: Multiple mappings
mapping(address => euint8) ages;
mapping(address => euint32) scores;
mapping(address => euint16) levels;

// ✅ EFFICIENT: Struct storage
struct UserData {
    euint8 age;
    euint32 score;
    euint16 level;
}
mapping(address => UserData) users;
```

### 3. Avoid Redundant Storage

```solidity
// ❌ INEFFICIENT: Storing both original and derived
euint32 balance;
euint32 balanceWithFee;  // Can be calculated

// ✅ EFFICIENT: Store only original, calculate when needed
euint32 balance;

function getBalanceWithFee() public view returns (euint32) {
    return FHE.add(balance, calculateFee(balance));
}
```

---

## Proof Management

### 1. Batch Proofs

Single proof for multiple values:

```typescript
// ✅ EFFICIENT: One proof for multiple values
const enc = fhevm.createEncryptedInput(contract, user);
enc.add32(value1);
enc.add32(value2);
enc.add32(value3);
const { handles, inputProof } = enc.encrypt();

await contract.batchUpdate(
  handles[0],
  handles[1],
  handles[2],
  inputProof  // Single proof validates all
);
```

**Gas Savings:** ~60-80% compared to individual proofs

### 2. Proof Reuse Prevention

```typescript
// ❌ WRONG: Can't reuse proofs
const { handles, inputProof } = enc.encrypt();
await contract.call1(handles[0], inputProof);  // OK
await contract.call2(handles[0], inputProof);  // FAILS

// ✅ CORRECT: Generate fresh proof each time
const enc1 = fhevm.createEncryptedInput(contract, user);
enc1.add32(value);
const proof1 = enc1.encrypt();
await contract.call1(proof1.handles[0], proof1.inputProof);

const enc2 = fhevm.createEncryptedInput(contract, user);
enc2.add32(value);
const proof2 = enc2.encrypt();
await contract.call2(proof2.handles[0], proof2.inputProof);
```

---

## Benchmarking

### Gas Profiling Setup

```javascript
// hardhat.config.ts
export default {
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: 'gas-report',
    noColors: true,
  },
};
```

### Run Benchmarks

```bash
# Enable gas reporting
REPORT_GAS=true npm run test

# View gas report
cat gas-report
```

### Benchmark Template

```typescript
// benchmark.test.ts
describe("Gas Benchmarks", function () {
  it("should measure FHE.add cost", async function () {
    const contract = await deploy();

    const { handle1, proof1 } = await encrypt(10);
    const { handle2, proof2 } = await encrypt(20);

    // Measure gas
    const tx = await contract.add(handle1, handle2, proof1);
    const receipt = await tx.wait();

    console.log(`FHE.add gas used: ${receipt.gasUsed}`);
  });

  it("should compare batch vs individual", async function () {
    // Measure individual
    let totalGas = 0;
    for (let i = 0; i < 3; i++) {
      const tx = await contract.setValue(value, proof);
      const receipt = await tx.wait();
      totalGas += receipt.gasUsed;
    }
    console.log(`Individual: ${totalGas}`);

    // Measure batch
    const batchTx = await contract.setBatch(values, proof);
    const batchReceipt = await batchTx.wait();
    console.log(`Batch: ${batchReceipt.gasUsed}`);
    console.log(`Savings: ${((1 - batchReceipt.gasUsed / totalGas) * 100).toFixed(2)}%`);
  });
});
```

### Profiling Results Example

```
┌─────────────────────┬─────────────────┬──────────────────────┐
│  Contract Method    │  Min Gas        │  Max Gas             │
├─────────────────────┼─────────────────┼──────────────────────┤
│  setValue (euint32) │  180,000        │  210,000             │
│  add                │  250,000        │  290,000             │
│  multiply           │  450,000        │  520,000             │
│  batchUpdate (x3)   │  320,000        │  380,000             │
└─────────────────────┴─────────────────┴──────────────────────┘

Savings from batching: ~65%
```

---

## Best Practices

### 1. Profile Before Optimizing

```bash
# Always measure first
REPORT_GAS=true npm run test > baseline

# Make optimizations

# Measure again
REPORT_GAS=true npm run test > optimized

# Compare
diff baseline optimized
```

### 2. Choose Right Operations

```solidity
// ✅ Use appropriate operations
// For boolean logic: FHE.select() instead of arithmetic
euint32 result = FHE.select(condition, valueA, valueB);

// For range checks: Use comparisons
ebool inRange = FHE.and(
    FHE.gte(value, min),
    FHE.lte(value, max)
);
```

### 3. Cache Encrypted Values

```solidity
// ❌ INEFFICIENT: Recalculate multiple times
function process() public {
    euint32 fee = calculateFee();  // Expensive
    euint32 total1 = FHE.add(amount1, calculateFee());
    euint32 total2 = FHE.add(amount2, calculateFee());
}

// ✅ EFFICIENT: Calculate once, reuse
function process() public {
    euint32 fee = calculateFee();  // Once
    euint32 total1 = FHE.add(amount1, fee);
    euint32 total2 = FHE.add(amount2, fee);
}
```

### 4. Optimize Permission Grants

```solidity
// ❌ INEFFICIENT: Grant all permissions always
function update(externalEuint32 value, bytes calldata proof) external {
    euint32 v = FHE.fromExternal(value, proof);
    FHE.allowThis(v);
    FHE.allow(v, msg.sender);
    FHE.allow(v, owner());  // May not be needed
    FHE.allow(v, admin);    // May not be needed
}

// ✅ EFFICIENT: Grant only necessary permissions
function update(externalEuint32 value, bytes calldata proof) external {
    euint32 v = FHE.fromExternal(value, proof);
    FHE.allowThis(v);  // Contract needs it
    FHE.allow(v, msg.sender);  // User needs it
    // Don't grant unnecessary permissions
}
```

### 5. Minimize Encrypted Storage

```solidity
// ❌ INEFFICIENT: Everything encrypted
mapping(address => euint32) userIds;  // Sequential IDs don't need encryption
mapping(address => euint64) balances;  // Needs encryption

// ✅ EFFICIENT: Encrypt only sensitive data
mapping(address => uint32) userIds;  // Plaintext
mapping(address => euint64) balances;  // Encrypted
```

---

## Performance Checklist

- [ ] Use smallest encrypted type for data
- [ ] Batch operations when possible
- [ ] Use `FHE.allowTransient()` for temporary values
- [ ] Minimize comparison operations
- [ ] Cache calculated encrypted values
- [ ] Pack struct storage efficiently
- [ ] Profile gas costs regularly
- [ ] Batch input proofs (multiple values, one proof)
- [ ] Avoid redundant storage
- [ ] Grant only necessary permissions
- [ ] Optimize conditional logic
- [ ] Prefer addition/subtraction over multiply/divide
- [ ] Use boolean operations when appropriate
- [ ] Minimize storage writes
- [ ] Reuse encrypted values instead of recalculating

---

## Performance Targets

### Good Performance Targets

| Operation | Target Gas | Excellent Gas |
|-----------|-----------|---------------|
| Simple encrypted addition | <200k | <150k |
| Encrypted transfer | <400k | <300k |
| Complex calculation (3-5 ops) | <800k | <600k |
| Batch operation (3 values) | <500k | <400k |

### Red Flags

- Single operation >1M gas
- Batch operation worse than individual
- Many nested `FHE.select()` calls
- Excessive permission grants
- Redundant encrypted storage

---

## Resources

- [FHEVM Gas Costs Documentation](https://docs.zama.ai/fhevm/fundamentals/gas)
- [Hardhat Gas Reporter](https://github.com/cgewecke/hardhat-gas-reporter)
- [Solidity Gas Optimization](https://docs.soliditylang.org/en/latest/internals/optimiser.html)

---

**Remember:** FHE operations are expensive by nature. Focus on:
1. **Necessity:** Only encrypt what must be private
2. **Efficiency:** Batch and minimize operations
3. **Measurement:** Profile before and after optimizations

Good performance in FHEVM means balancing privacy with practicality.
