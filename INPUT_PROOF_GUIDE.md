# Input Proof Complete Guide

Comprehensive guide to understanding and using input proofs in FHEVM.

## Table of Contents
- [What Are Input Proofs?](#what-are-input-proofs)
- [Why Are They Needed?](#why-are-they-needed)
- [How They Work](#how-they-work)
- [Creating Input Proofs](#creating-input-proofs)
- [Using Input Proofs](#using-input-proofs)
- [Best Practices](#best-practices)
- [Common Mistakes](#common-mistakes)
- [Advanced Topics](#advanced-topics)

## What Are Input Proofs?

**Input proofs** are cryptographic zero-knowledge proofs that validate encrypted inputs sent to FHEVM smart contracts.

### Key Characteristics

```
Input Proof = Zero-Knowledge Proof that:
1. Encrypted value correctly bound to [contract, user] pair
2. Encryptor knows plaintext value
3. Encryption performed correctly
4. No cheating or tampering occurred
```

### Components

```
Encrypted Input Package:
├── Handle (bytes) - Reference to encrypted value
├── Input Proof (bytes) - Zero-knowledge proof
└── Binding - Tied to specific [contract, user]
```

## Why Are They Needed?

### Problem Without Input Proofs

```solidity
// WITHOUT INPUT PROOFS (Insecure!)
function deposit(euint64 amount) external {
    // Problem 1: No validation that user actually encrypted this
    // Problem 2: No binding to contract/user
    // Problem 3: Could be forged or manipulated
    // Problem 4: Replay attacks possible

    balance[msg.sender] = FHE.add(balance[msg.sender], amount);
}
```

**Vulnerabilities:**
- ❌ User could claim arbitrary encrypted amount
- ❌ No proof they know the plaintext value
- ❌ Could copy encrypted value from elsewhere
- ❌ Replay attacks from other contexts
- ❌ No integrity protection

### Solution With Input Proofs

```solidity
// WITH INPUT PROOFS (Secure!)
function deposit(externalEuint64 amount, bytes calldata inputProof) external {
    // ✅ Proof validates:
    // - User encrypted this value
    // - Encryption bound to THIS contract
    // - Encryption bound to THIS user
    // - User knows plaintext
    // - Encryption is valid

    euint64 validatedAmount = FHE.fromExternal(amount, inputProof);
    balance[msg.sender] = FHE.add(balance[msg.sender], validatedAmount);
}
```

**Security Provided:**
- ✅ Cryptographic proof of correctness
- ✅ Binding to specific contract
- ✅ Binding to specific user
- ✅ Proof of knowledge
- ✅ Replay protection

## How They Work

### Step-by-Step Process

#### Step 1: Client-Side Encryption

```typescript
// Client side (TypeScript/JavaScript)
import { createFhevmInstance } from 'fhevmjs';

// Initialize FHEVM instance
const fhevm = await createFhevmInstance({
  networkUrl: 'https://devnet.zama.ai',
  gatewayUrl: 'https://gateway.zama.ai',
});

// Create encrypted input for specific contract and user
const contractAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
const userAddress = await signer.getAddress();

const encryptedInput = fhevm.createEncryptedInput(
  contractAddress,
  userAddress
);

// Add value(s) to encrypt
encryptedInput.add64(1000); // Encrypt value 1000

// Generate encryption and proof
const { handles, inputProof } = encryptedInput.encrypt();

console.log('Encrypted handle:', handles[0]);
console.log('Input proof:', inputProof);
```

**What Happens:**
1. Values encrypted using FHEVM public key
2. Encryption bound to `[contractAddress, userAddress]` pair
3. Zero-knowledge proof generated showing:
   - User knows plaintext value
   - Encryption performed correctly
   - Binding is valid
4. Returns handle and proof

#### Step 2: Submit to Contract

```typescript
// Submit encrypted value and proof to contract
const tx = await contract.deposit(
  handles[0],   // Encrypted value handle
  inputProof    // Zero-knowledge proof
);

await tx.wait();
```

#### Step 3: Contract-Side Validation

```solidity
// Contract side (Solidity)
function deposit(externalEuint64 amountExternal, bytes calldata inputProof) external {
    // FHE.fromExternal validates:
    // 1. Proof is cryptographically valid
    // 2. Encryption bound to THIS contract address
    // 3. Encryption bound to msg.sender
    // 4. Proof hasn't been replayed
    // 5. Encryption format is correct

    euint64 amount = FHE.fromExternal(amountExternal, inputProof);

    // If validation fails, FHE.fromExternal reverts
    // If successful, amount is valid encrypted value

    balance[msg.sender] = FHE.add(balance[msg.sender], amount);
}
```

### Cryptographic Details

**Proof Components:**
```
Input Proof Contains:
├── Zero-knowledge proof of:
│   ├── Correct encryption
│   ├── Knowledge of plaintext
│   └── Valid binding
├── Metadata:
│   ├── Contract address
│   ├── User address
│   └── Timestamp/nonce
└── Signature
```

**Validation Steps:**
1. Verify zero-knowledge proof
2. Check contract address matches
3. Check user address matches msg.sender
4. Verify encryption parameters
5. Ensure freshness (no replay)

## Creating Input Proofs

### Single Value Encryption

```typescript
// Client-side: Encrypt single value
const encryptedInput = fhevm.createEncryptedInput(
  contractAddress,
  userAddress
);

// Add value of appropriate type
encryptedInput.add32(100);  // uint32 value

// Encrypt and get proof
const { handles, inputProof } = encryptedInput.encrypt();

// Use in contract call
await contract.setValue(handles[0], inputProof);
```

### Multiple Values With Single Proof

```typescript
// Client-side: Encrypt multiple values with ONE proof
const encryptedInput = fhevm.createEncryptedInput(
  contractAddress,
  userAddress
);

// Add multiple values
encryptedInput.add32(25);      // age
encryptedInput.add64(50000);   // income
encryptedInput.add32(750);     // credit score

// Get handles and single proof
const { handles, inputProof } = encryptedInput.encrypt();

// All handles use SAME proof
await contract.createProfile(
  handles[0],  // age
  handles[1],  // income
  handles[2],  // credit score
  inputProof   // ONE proof for all
);
```

### Type-Specific Encryption

```typescript
// Different types have different methods
encryptedInput.add8(value);    // uint8 -> euint8
encryptedInput.add16(value);   // uint16 -> euint16
encryptedInput.add32(value);   // uint32 -> euint32
encryptedInput.add64(value);   // uint64 -> euint64
encryptedInput.addBool(value); // bool -> ebool
encryptedInput.addAddress(value); // address -> eaddress
```

## Using Input Proofs

### Basic Usage Pattern

```solidity
// Solidity contract
function processValue(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
) external {
    // Step 1: Validate and convert
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // Step 2: Use validated value
    userValues[msg.sender] = value;

    // Step 3: Grant permissions
    FHE.allowThis(value);
    FHE.allow(value, msg.sender);
}
```

### Multiple Values Pattern

```solidity
function processMultiple(
    externalEuint32 value1,
    externalEuint32 value2,
    externalEuint64 value3,
    bytes calldata inputProof  // Single proof!
) external {
    // Same proof validates all values
    euint32 v1 = FHE.fromExternal(value1, inputProof);
    euint32 v2 = FHE.fromExternal(value2, inputProof);
    euint64 v3 = FHE.fromExternal(value3, inputProof);

    // All values validated by same proof
    // All bound to same [contract, user] pair
}
```

### Conditional Value Pattern

```solidity
function conditionalDeposit(
    externalEuint64 amount,
    bytes calldata inputProof,
    bool shouldDeposit
) external {
    if (shouldDeposit) {
        // Only validate if needed
        euint64 value = FHE.fromExternal(amount, inputProof);
        balance[msg.sender] = FHE.add(balance[msg.sender], value);

        FHE.allowThis(balance[msg.sender]);
        FHE.allow(balance[msg.sender], msg.sender);
    }
}
```

## Best Practices

### ✅ Do's

#### 1. Always Validate Input Proofs
```solidity
// ✅ CORRECT
function store(externalEuint32 value, bytes calldata proof) external {
    euint32 validated = FHE.fromExternal(value, proof);
    // ...
}
```

#### 2. Use Single Proof for Multiple Values
```typescript
// ✅ EFFICIENT
const enc = fhevm.createEncryptedInput(contract, user);
enc.add32(value1);
enc.add32(value2);
enc.add32(value3);
const { handles, inputProof } = enc.encrypt();
// One proof for all values
```

#### 3. Generate Fresh Proof Per Transaction
```typescript
// ✅ CORRECT
async function deposit() {
  // Create new encrypted input each time
  const enc = fhevm.createEncryptedInput(contract, user);
  enc.add64(amount);
  const { handles, inputProof } = enc.encrypt();

  await contract.deposit(handles[0], inputProof);
}
```

#### 4. Check Proof Validity in Contract
```solidity
// ✅ CORRECT
function process(externalEuint32 value, bytes calldata proof) external {
    require(proof.length > 0, "Proof required");

    // FHE.fromExternal validates proof
    // Will revert if invalid
    euint32 validated = FHE.fromExternal(value, proof);
}
```

### ❌ Don'ts

#### 1. Don't Reuse Proofs
```typescript
// ❌ WRONG - Don't reuse proof
const { handles, inputProof } = enc.encrypt();

await contract.call1(handles[0], inputProof); // First use: OK
await contract.call2(handles[0], inputProof); // Second use: INVALID!
```

#### 2. Don't Share Proofs Between Users
```typescript
// ❌ WRONG - Proof bound to specific user
const aliceProof = aliceEnc.encrypt();

// Bob can't use Alice's proof
await contract.connect(bob).call(aliceProof.handles[0], aliceProof.inputProof);
// Will fail validation!
```

#### 3. Don't Use Wrong Contract Address
```typescript
// ❌ WRONG - Proof bound to specific contract
const enc = fhevm.createEncryptedInput(
  contractA,  // Wrong contract!
  user
);

// Can't use this proof with contractB
await contractB.call(handles[0], inputProof);  // Will fail!
```

#### 4. Don't Skip Proof Validation
```solidity
// ❌ WRONG - Never skip validation
function unsafeStore(euint32 value) external {  // No proof parameter!
    userValues[msg.sender] = value;
    // No validation - security vulnerability!
}
```

## Common Mistakes

### Mistake 1: Wrong Signer
```typescript
// ❌ WRONG
const enc = fhevm.createEncryptedInput(contract, alice.address);
enc.add32(100);
const { handles, inputProof } = enc.encrypt();

// Bob tries to submit Alice's proof
await contract.connect(bob).store(handles[0], inputProof);
// FAILS: Proof bound to Alice, but Bob is sender
```

**Fix:**
```typescript
// ✅ CORRECT
const enc = fhevm.createEncryptedInput(contract, bob.address);
enc.add32(100);
const { handles, inputProof } = enc.encrypt();

await contract.connect(bob).store(handles[0], inputProof);
// SUCCESS: Proof bound to Bob, Bob is sender
```

### Mistake 2: Proof Reuse
```typescript
// ❌ WRONG
const { handles, inputProof } = enc.encrypt();

// Use proof twice
await contract.deposit(handles[0], inputProof);  // First: OK
await contract.deposit(handles[0], inputProof);  // Second: FAILS
```

**Fix:**
```typescript
// ✅ CORRECT
// Create new proof for each transaction
const enc1 = fhevm.createEncryptedInput(contract, user);
enc1.add64(100);
const proof1 = enc1.encrypt();
await contract.deposit(proof1.handles[0], proof1.inputProof);

const enc2 = fhevm.createEncryptedInput(contract, user);
enc2.add64(200);
const proof2 = enc2.encrypt();
await contract.deposit(proof2.handles[0], proof2.inputProof);
```

### Mistake 3: Missing Proof Parameter
```solidity
// ❌ WRONG
function store(externalEuint32 value) external {  // Missing proof!
    // Can't validate without proof
    euint32 v = FHE.fromExternal(value, ???);  // What to use?
}
```

**Fix:**
```solidity
// ✅ CORRECT
function store(
    externalEuint32 value,
    bytes calldata inputProof  // Include proof
) external {
    euint32 validated = FHE.fromExternal(value, inputProof);
    userValues[msg.sender] = validated;
}
```

### Mistake 4: Type Mismatch
```typescript
// ❌ WRONG
const enc = fhevm.createEncryptedInput(contract, user);
enc.add32(value);  // Add as 32-bit
const { handles, inputProof } = enc.encrypt();

// Call function expecting 64-bit
await contract.store64(handles[0], inputProof);  // Type mismatch!
```

**Fix:**
```typescript
// ✅ CORRECT - Match types
const enc = fhevm.createEncryptedInput(contract, user);
enc.add64(value);  // Add as 64-bit
const { handles, inputProof } = enc.encrypt();

await contract.store64(handles[0], inputProof);  // Types match
```

## Advanced Topics

### Batch Operations Optimization

```typescript
// Efficient: One proof for multiple values
const enc = fhevm.createEncryptedInput(contract, user);

for (let i = 0; i < 10; i++) {
  enc.add32(values[i]);
}

const { handles, inputProof } = enc.encrypt();

// Submit all at once with single proof
await contract.batchProcess(handles, inputProof);
```

### Gas Optimization

**Input Proof Size:**
- Typical size: 200-500 bytes
- Gas cost: ~10,000-25,000 gas for proof validation
- Batch multiple values to amortize proof cost

### Security Considerations

**What Proofs Protect Against:**
- ✅ Forged encrypted values
- ✅ Replay attacks
- ✅ Cross-contract attacks
- ✅ User impersonation
- ✅ Value tampering

**What Proofs Don't Protect Against:**
- ❌ Application logic bugs
- ❌ Permission management errors
- ❌ Overflow/underflow
- ❌ Reentrancy attacks
- ❌ Front-running (use other mechanisms)

### Proof Verification Details

```
Verification Process:
1. Extract metadata from proof
2. Verify contract address matches current contract
3. Verify user address matches msg.sender
4. Validate zero-knowledge proof cryptographically
5. Check proof freshness
6. If all pass, return validated encrypted value
7. If any fail, revert transaction
```

## Testing Input Proofs

### Test Valid Proofs
```typescript
it("should accept valid proof", async () => {
  const enc = await fhevm.createEncryptedInput(contract.address, alice.address);
  enc.add32(100);
  const { handles, inputProof } = enc.encrypt();

  await expect(
    contract.connect(alice).store(handles[0], inputProof)
  ).to.not.be.reverted;
});
```

### Test Invalid Proofs
```typescript
it("should reject wrong signer", async () => {
  const enc = await fhevm.createEncryptedInput(contract.address, alice.address);
  enc.add32(100);
  const { handles, inputProof } = enc.encrypt();

  // Bob tries to use Alice's proof
  await expect(
    contract.connect(bob).store(handles[0], inputProof)
  ).to.be.reverted;
});

it("should reject reused proof", async () => {
  const enc = await fhevm.createEncryptedInput(contract.address, alice.address);
  enc.add32(100);
  const { handles, inputProof } = enc.encrypt();

  await contract.connect(alice).store(handles[0], inputProof);  // First use: OK

  // Try to reuse proof
  await expect(
    contract.connect(alice).store(handles[0], inputProof)  // Second use
  ).to.be.reverted;
});
```

## Summary

**Key Takeaways:**

1. **Input proofs are essential** for FHEVM security
2. **One proof per transaction** - never reuse
3. **Bind to specific [contract, user]** pair
4. **Validate with FHE.fromExternal()** in contracts
5. **Use single proof for multiple values** when possible
6. **Generate fresh proofs** for each transaction
7. **Test proof validation** thoroughly

**Mental Model:**
```
Input Proof = Cryptographic Receipt That Says:
"I (user) encrypted this value correctly
 for this specific contract
 and I know the plaintext value
 and nobody has tampered with it"
```

---

**Further Reading:**
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zero-Knowledge Proofs Primer](https://docs.zama.ai/fhevm/fundamentals/zkproofs)
- [FHEVM Security Model](https://docs.zama.ai/fhevm/security)
