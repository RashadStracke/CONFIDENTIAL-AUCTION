# Understanding FHE Handles Complete Guide

Comprehensive guide to understanding encrypted handles in FHEVM.

## Table of Contents
- [What Are Handles?](#what-are-handles)
- [How Handles Are Generated](#how-handles-are-generated)
- [Handle Lifecycle](#handle-lifecycle)
- [Symbolic Execution](#symbolic-execution)
- [Handle Permissions](#handle-permissions)
- [Best Practices](#best-practices)
- [Common Issues](#common-issues)

## What Are Handles?

**Handles** are references (pointers) to encrypted values stored in the FHEVM coprocessor.

### Key Concept

```
Handle = Unique identifier referencing encrypted ciphertext
│
├─ NOT the encrypted value itself
├─ NOT the plaintext value
├─ NOT a cryptographic key
└─ REFERENCE to where encrypted data is stored
```

### Analogy

```
Think of handles like:
- Database row IDs
- File descriptors in operating systems
- Memory pointers in C
- Object references in Java

The handle points to the actual encrypted data,
but doesn't contain the data itself.
```

### Visual Representation

```
┌─────────────────────┐
│   Solidity Storage  │
│                     │
│  euint32 balance    │◄──── This IS the handle
│  = 0x7A3F...B4C2    │      (reference to encrypted data)
└─────────────────────┘
           │
           │ points to
           ▼
┌─────────────────────────────────────┐
│    FHEVM Coprocessor Storage       │
│                                     │
│  Handle: 0x7A3F...B4C2              │
│  ├─ Encrypted Value: [ciphertext]  │◄──── Actual encrypted data
│  ├─ Type: euint32                  │
│  ├─ Permissions: {...}             │
│  └─ Metadata: {...}                │
└─────────────────────────────────────┘
```

## How Handles Are Generated

### Generation Process

#### 1. Client-Side Encryption
```typescript
// Step 1: Create encrypted input
const encryptedInput = fhevm.createEncryptedInput(contractAddr, userAddr);
encryptedInput.add32(42);

// Step 2: Encrypt and get handle
const { handles, inputProof } = encryptedInput.encrypt();

console.log('Handle:', handles[0]);
// Output: 0x7A3F8B2D5E9C1A4F6D8E2B5C9F3A7D1E4B8C2F6A9D3E7B1C5F8A2D6E9B3C7F1A
```

**What happens:**
1. Plaintext value (42) encrypted using FHEVM public key
2. Ciphertext stored in FHEVM coprocessor
3. Unique handle generated pointing to this ciphertext
4. Handle returned to client

#### 2. Contract-Side Operations
```solidity
// Step 3: Contract receives handle
function setValue(externalEuint32 handleExternal, bytes calldata proof) external {
    // FHE.fromExternal validates and converts to internal handle
    euint32 internalHandle = FHE.fromExternal(handleExternal, proof);
    //      ^^^^^^^^^^^^^^
    //      This is also a handle, but validated and usable by contract

    userValues[msg.sender] = internalHandle;
}
```

#### 3. Operation Results Generate New Handles
```solidity
function add(externalEuint32 input, bytes calldata proof) external {
    euint32 inputHandle = FHE.fromExternal(input, proof);
    euint32 storedHandle = userValues[msg.sender];

    // Operation creates NEW handle
    euint32 resultHandle = FHE.add(storedHandle, inputHandle);
    //      ^^^^^^^^^^^^
    //      Brand new handle pointing to new encrypted value

    userValues[msg.sender] = resultHandle;
}
```

### Handle Structure

```
Handle (256 bits / 32 bytes):
┌─────────────────────────────────────────────┐
│  [Type Info][Version][Coprocessor ID][UUID] │
└─────────────────────────────────────────────┘
     8 bits    8 bits      64 bits     176 bits

Components:
- Type Info: euint8, euint16, euint32, euint64, ebool, eaddress
- Version: FHEVM protocol version
- Coprocessor ID: Which coprocessor stores the data
- UUID: Unique identifier for this specific encrypted value
```

## Handle Lifecycle

### Stage 1: Creation

```solidity
// New handle created
euint32 balance = FHE.asEuint32(0);
//      ^^^^^^^
//      New handle pointing to encrypted 0
```

**Events:**
1. Request sent to FHEVM coprocessor
2. Value encrypted
3. Ciphertext stored
4. Handle generated and returned
5. Handle stored in contract state

### Stage 2: Usage

```solidity
// Using handle in operations
euint32 oldBalance = balance;  // Copy handle (not data)
euint32 deposit = FHE.fromExternal(input, proof);  // New handle

euint32 newBalance = FHE.add(oldBalance, deposit);
//      ^^^^^^^^^^
//      Yet another NEW handle for the result
```

**Key Point:** Every FHE operation creates a NEW handle

### Stage 3: Permission Management

```solidity
// Granting permissions to handles
FHE.allowThis(newBalance);      // Contract can use this handle
FHE.allow(newBalance, user);    // User can decrypt via this handle
```

**What happens:**
- Permission metadata attached to ciphertext referenced by handle
- Permissions stored in coprocessor
- Access controlled when handle is used

### Stage 4: Decryption

```solidity
// User requests decryption
function requestDecrypt() external returns (bytes32) {
    euint32 balanceHandle = balances[msg.sender];
    //      ^^^^^^^^^^^^^
    //      Handle used to identify which ciphertext to decrypt

    // Decryption oracle uses handle to:
    // 1. Find the ciphertext in coprocessor
    // 2. Check permissions
    // 3. Decrypt if authorized
    // 4. Return plaintext
}
```

### Stage 5: Cleanup

```solidity
// Handle goes out of scope or is overwritten
balances[msg.sender] = newBalance;  // Old handle replaced
//                                     Old ciphertext may be garbage collected
```

**Note:** FHEVM handles garbage collection automatically

## Symbolic Execution

**Symbolic execution** means operations on handles are symbolic (not immediate).

### Concept

```
Traditional (Plaintext):
uint32 a = 5;
uint32 b = 3;
uint32 c = a + b;  ◄──── Immediately evaluated to 8
                          Result known instantly

FHE (Encrypted):
euint32 a = FHE.asEuint32(5);     ◄──── Creates handle to encrypted 5
euint32 b = FHE.asEuint32(3);     ◄──── Creates handle to encrypted 3
euint32 c = FHE.add(a, b);         ◄──── Creates handle to encrypted result
                                          Result NOT known in contract!
```

### Delayed Evaluation

```solidity
function complexCalculation() external {
    euint32 a = values[0];  // Handle to encrypted value
    euint32 b = values[1];  // Handle to encrypted value

    // All operations are SYMBOLIC
    euint32 sum = FHE.add(a, b);       // Handle to (a + b)
    euint32 product = FHE.mul(a, b);   // Handle to (a * b)
    euint32 result = FHE.add(sum, product);  // Handle to ((a+b) + (a*b))

    // Contract never knows actual values
    // Only has handles to encrypted results
    // Actual computation happens in coprocessor

    results[msg.sender] = result;  // Store handle
}
```

### Execution Flow

```
Contract Level (Symbolic):
┌──────────────────────────────────┐
│  euint32 a = value1;             │
│  euint32 b = value2;             │
│  euint32 c = FHE.add(a, b);      │◄──── Just creating references
│  return c;                       │      No actual computation here
└──────────────────────────────────┘
           │
           │ Handles passed to
           ▼
Coprocessor Level (Actual):
┌──────────────────────────────────┐
│  ciphertext_a = decrypt_handle(a)│◄──── Real encrypted values
│  ciphertext_b = decrypt_handle(b)│
│  ciphertext_c = HE_add(          │◄──── Homomorphic addition
│    ciphertext_a,                 │      on actual ciphertexts
│    ciphertext_b                  │
│  )                               │
│  return handle_to(ciphertext_c)  │◄──── Return new handle
└──────────────────────────────────┘
```

### Why Symbolic Execution?

**Benefits:**
1. **Contract stays oblivious** - Never sees plaintext
2. **Type safety** - euint32 can't be used as uint32
3. **Security** - No way to accidentally reveal values
4. **Flexibility** - Can build complex expressions
5. **Efficiency** - Computations batched in coprocessor

**Example:**
```solidity
// Contract can build complex expressions symbolically
function calculateScore(
    externalEuint32 age,
    externalEuint32 income,
    externalEuint32 credit,
    bytes calldata proof
) external returns (euint32) {
    euint32 ageScore = FHE.fromExternal(age, proof);
    euint32 incomeScore = FHE.fromExternal(income, proof);
    euint32 creditScore = FHE.fromExternal(credit, proof);

    // Build expression symbolically
    euint32 weighted1 = FHE.mul(ageScore, FHE.asEuint32(30));
    euint32 weighted2 = FHE.mul(incomeScore, FHE.asEuint32(40));
    euint32 weighted3 = FHE.mul(creditScore, FHE.asEuint32(30));

    euint32 sum = FHE.add(weighted1, weighted2);
    euint32 total = FHE.add(sum, weighted3);

    // Contract only has handle to final result
    // Actual calculation happens in coprocessor
    return total;
}
```

## Handle Permissions

### Permission Model

```
Each Handle Has Associated Permissions:
┌────────────────────────────────┐
│  Handle: 0x7A3F...             │
│  ├─ Contract Permissions:      │
│  │  └─ 0xContract1: [use]     │◄──── Contract can perform operations
│  ├─ User Permissions:          │
│  │  ├─ 0xUser1: [decrypt]     │◄──── User1 can request decryption
│  │  └─ 0xUser2: [decrypt]     │◄──── User2 can request decryption
│  └─ Metadata                   │
└────────────────────────────────┘
```

### Permission Types

**Contract Permission (allowThis):**
```solidity
FHE.allowThis(handle);
```
- Allows contract to perform FHE operations on this handle
- Required for: add, sub, mul, div, comparisons, select
- Without this, contract can't use the handle

**User Permission (allow):**
```solidity
FHE.allow(handle, userAddress);
```
- Allows specific user to request decryption
- Required for user to see plaintext value
- Can grant to multiple users

**Transient Permission (allowTransient):**
```solidity
FHE.allowTransient(handle);
```
- Temporary permission for current transaction only
- More gas efficient
- Use for intermediate computations

### Permission Propagation

```solidity
// Permissions don't automatically propagate
euint32 a = balances[alice];  // Has permissions
euint32 b = balances[bob];    // Has permissions

euint32 sum = FHE.add(a, b);  // NEW handle, NO permissions!

// Must grant permissions to new handle
FHE.allowThis(sum);
FHE.allow(sum, alice);
```

## Best Practices

### 1. Understand Handles Are References
```solidity
// ✅ CORRECT understanding
euint32 balance = userBalances[msg.sender];  // Copy HANDLE (cheap)
euint32 newBalance = FHE.add(balance, deposit);  // New HANDLE to new value
```

### 2. Grant Permissions Immediately
```solidity
// ✅ CORRECT
euint32 result = FHE.add(a, b);
FHE.allowThis(result);      // Immediate
FHE.allow(result, user);    // Immediate
```

### 3. Don't Assume Handle == Value
```solidity
// ❌ WRONG thinking
euint32 balance = FHE.asEuint32(100);
if (balance == 100) { }  // Doesn't work! balance is HANDLE, not 100

// ✅ CORRECT thinking
euint32 balance = FHE.asEuint32(100);  // Handle to encrypted 100
ebool isHundred = FHE.eq(balance, FHE.asEuint32(100));  // Encrypted comparison
```

### 4. Track Handle Lifecycle
```solidity
// ✅ CORRECT - Track what each handle represents
euint32 oldBalance = balances[user];  // Original balance handle
euint32 deposit = FHE.fromExternal(input, proof);  // Deposit handle
euint32 newBalance = FHE.add(oldBalance, deposit);  // New balance handle

balances[user] = newBalance;  // Update to new handle
// oldBalance handle no longer used
```

### 5. Remember Operations Create New Handles
```solidity
// ✅ CORRECT understanding
euint32 a = getValue();
euint32 b = a;  // b and a are SAME handle (same reference)

euint32 c = FHE.add(a, FHE.asEuint32(1));  // c is NEW handle (different reference)
```

## Common Issues

### Issue 1: Missing Permissions on New Handles
```solidity
// ❌ WRONG
euint32 result = FHE.add(a, b);
// Missing permissions!
return result;  // Contract can't use this later
```

**Fix:**
```solidity
// ✅ CORRECT
euint32 result = FHE.add(a, b);
FHE.allowThis(result);
FHE.allow(result, user);
return result;
```

### Issue 2: Treating Handles as Values
```solidity
// ❌ WRONG
euint32 balance = getBalance();
uint32 plainBalance = uint32(balance);  // Can't convert handle to plaintext!
```

**Fix:**
```solidity
// ✅ CORRECT
euint32 balanceHandle = getBalance();
// Use decryption mechanism to get plaintext
uint32 plainBalance = requestAndWaitForDecryption(balanceHandle);
```

### Issue 3: Comparing Handles Directly
```solidity
// ❌ WRONG
euint32 a = valueA;
euint32 b = valueB;
if (a > b) { }  // Can't compare handles with >
```

**Fix:**
```solidity
// ✅ CORRECT
euint32 a = valueA;
euint32 b = valueB;
ebool aGreaterThanB = FHE.gt(a, b);  // Encrypted comparison
euint32 result = FHE.select(aGreaterThanB, a, b);  // Conditional logic
```

### Issue 4: Not Understanding Handle Copies
```solidity
// ❌ WRONG understanding
euint32 original = balance;
euint32 copy = original;
// Thinking: copy is a separate encrypted value
// Reality: copy and original are THE SAME handle
```

**Fix:**
```solidity
// ✅ CORRECT understanding
euint32 original = balance;
euint32 copy = original;  // SAME handle, SAME encrypted value

// To create truly separate value, must perform operation
euint32 separate = FHE.add(original, FHE.asEuint32(0));  // NEW handle
```

## Advanced Topics

### Handle Reuse

```solidity
// Handles can be reused
mapping(address => euint32) balances;

function deposit() external {
    euint32 oldBalance = balances[msg.sender];  // Old handle
    euint32 newBalance = FHE.add(oldBalance, amount);  // New handle

    balances[msg.sender] = newBalance;  // Overwrite with new handle
    // Old handle may be garbage collected
}
```

### Handle Storage Costs

```
Storage Cost:
- Handle itself: 32 bytes (one storage slot)
- Referenced ciphertext: stored in coprocessor (off-chain)

Gas Costs:
- Storing handle: ~20,000 gas (SSTORE)
- Creating new handle: ~50,000-100,000 gas (depends on operation)
- Copying handle: ~2,100 gas (SLOAD + SSTORE)
```

### Handle Serialization

Handles can be:
- ✅ Stored in contract storage
- ✅ Passed as function parameters
- ✅ Returned from functions
- ✅ Emitted in events (but reveals handle)
- ❌ Converted to plaintext
- ❌ Used in arithmetic directly
- ❌ Compared with standard operators

## Summary

**Key Takeaways:**

1. **Handles are references**, not the encrypted data itself
2. **Each operation creates a new handle**
3. **Permissions must be granted** to each handle
4. **Execution is symbolic** - contract doesn't see plaintext
5. **Handles enable type safety** and security
6. **Think of handles as pointers** to encrypted data

**Mental Model:**
```
Handle = Smart Pointer to Encrypted Data
├─ Points to ciphertext in coprocessor
├─ Carries type information (euint32, euint64, etc.)
├─ Has associated permissions
├─ Created by every FHE operation
└─ Enables symbolic execution model
```

---

**Further Reading:**
- [FHEVM Architecture](https://docs.zama.ai/fhevm/architecture)
- [FHE Operations Reference](https://docs.zama.ai/fhevm/reference/functions)
- [Permission Management](https://docs.zama.ai/fhevm/fundamentals/permissions)
