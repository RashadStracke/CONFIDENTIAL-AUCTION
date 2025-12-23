# FHE Anti-Patterns Guide

Complete guide to common mistakes in FHEVM development and how to avoid them.

## Overview

This guide documents the most common anti-patterns found in FHEVM contracts and provides guidance on how to identify and fix them.

## Critical Anti-Patterns

### Anti-Pattern 1: Missing FHE.allowThis()

**Severity:** CRITICAL ⚠️

**What Goes Wrong:**
```solidity
// ❌ BROKEN CODE
function storeValue(externalEuint32 input, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(input, proof);
    userValues[msg.sender] = value;
    FHE.allow(value, msg.sender);  // User can decrypt
    // Missing: FHE.allowThis(value)
    // Contract cannot use this value in future operations!
}
```

**Why It Fails:**
- Contract needs permission to perform operations on encrypted values
- Without `FHE.allowThis()`, contract can't:
  - Perform arithmetic operations
  - Make comparisons
  - Update the value
  - Use it with other encrypted values

**The Fix:**
```solidity
// ✅ CORRECT CODE
function storeValue(externalEuint32 input, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(input, proof);
    userValues[msg.sender] = value;

    // ALWAYS grant both permissions
    FHE.allowThis(value);           // Contract permission
    FHE.allow(value, msg.sender);   // User permission
}
```

**Prevention:**
- Always grant permissions immediately after creating encrypted value
- Use both `FHE.allowThis()` and `FHE.allow()` together
- Create a checklist: After every FHE operation, grant permissions

---

### Anti-Pattern 2: Missing FHE.allow()

**Severity:** CRITICAL ⚠️

**What Goes Wrong:**
```solidity
// ❌ BROKEN CODE
function storeValue(externalEuint32 input, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(input, proof);
    userValues[msg.sender] = value;
    FHE.allowThis(value);  // Contract can use it
    // Missing: FHE.allow(value, msg.sender)
    // User cannot decrypt their own value!
}
```

**Why It Fails:**
- User can't decrypt encrypted values without explicit permission
- Even the value owner needs `FHE.allow()` to request decryption
- Results in locked, inaccessible values

**The Fix:**
```solidity
// ✅ CORRECT CODE
function storeValue(externalEuint32 input, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(input, proof);
    userValues[msg.sender] = value;

    FHE.allowThis(value);
    FHE.allow(value, msg.sender);   // User can decrypt
}
```

**Prevention:**
- Grant user permission for all values they should access
- Think about permission model: who should access what?
- Document permission requirements

---

### Anti-Pattern 3: Using Encrypted Values in Conditionals

**Severity:** CRITICAL ⚠️

**What Goes Wrong:**
```solidity
// ❌ BROKEN CODE - WON'T COMPILE/WORK
function withdrawFunds(externalEuint32 amountEncrypted, bytes calldata proof) external {
    euint32 amount = FHE.fromExternal(amountEncrypted, proof);

    // This will NOT work!
    if (amount > 100) {  // Can't use encrypted values directly
        // ...
    }

    // This also won't work!
    if (userBalance >= amount) {  // Can't compare encrypted values
        // ...
    }
}
```

**Why It Fails:**
- Encrypted values are not boolean, can't be used in conditions
- `euint32` is not comparable to plaintext numbers
- Results in type errors or undefined behavior

**The Fix:**
```solidity
// ✅ CORRECT CODE
function withdrawFunds(externalEuint32 amountEncrypted, bytes calldata proof) external {
    euint32 amount = FHE.fromExternal(amountEncrypted, proof);

    // Step 1: Create encrypted boolean result
    ebool isLargeAmount = FHE.gt(amount, FHE.asEuint32(100));
    ebool hasSufficientBalance = FHE.gte(userBalance, amount);

    // Step 2: Combine conditions
    ebool canWithdraw = FHE.and(isLargeAmount, hasSufficientBalance);

    // Step 3: Use FHE.select for conditional logic
    euint32 withdrawAmount = FHE.select(canWithdraw, amount, FHE.asEuint32(0));

    // Perform withdrawal with encrypted amount
    userBalance = FHE.sub(userBalance, withdrawAmount);
}
```

**Prevention:**
- Never use encrypted values in `if` statements
- Use `FHE.eq()`, `FHE.gt()`, `FHE.lt()` for comparisons
- Use `FHE.select()` for conditional logic
- Think: "How would this work on encrypted data?"

---

### Anti-Pattern 4: Forgetting to Update Permissions After Operations

**Severity:** HIGH ⚠️

**What Goes Wrong:**
```solidity
// ❌ BROKEN CODE
function increment(externalEuint32 input, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(input, proof);

    // Create new value through operation
    euint32 newValue = FHE.add(userValues[msg.sender], value);
    userValues[msg.sender] = newValue;

    // Missing permissions for newValue!
    // newValue has no FHE.allowThis or FHE.allow
    // Contract and user can't use it!
}
```

**Why It Fails:**
- Each FHE operation creates a new encrypted value
- New values don't automatically inherit permissions
- Results in inaccessible encrypted values
- Contract can't perform further operations

**The Fix:**
```solidity
// ✅ CORRECT CODE
function increment(externalEuint32 input, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(input, proof);

    // Create new value
    euint32 newValue = FHE.add(userValues[msg.sender], value);
    userValues[msg.sender] = newValue;

    // ALWAYS grant permissions for result
    FHE.allowThis(newValue);
    FHE.allow(newValue, msg.sender);
}
```

**Prevention:**
- After every FHE operation that creates a new value, grant permissions
- Create a rule: No unencrypted operation without permission grant
- Use static analysis to check permission grants

---

### Anti-Pattern 5: Mixing Encrypted and Plaintext Without Conversion

**Severity:** MEDIUM ⚠️

**What Goes Wrong:**
```solidity
// ❌ BROKEN CODE
function addAmount(externalEuint32 input, bytes calldata proof) external {
    euint32 encryptedValue = FHE.fromExternal(input, proof);
    uint32 plainValue = 100;

    // Can't add encrypted and plaintext directly!
    euint32 result = FHE.add(encryptedValue, plainValue);  // Type error
}
```

**Why It Fails:**
- FHE operations require both operands to be encrypted type
- plaintext `uint32` is different from `euint32`
- Type system prevents mixing

**The Fix:**
```solidity
// ✅ CORRECT CODE
function addAmount(externalEuint32 input, bytes calldata proof) external {
    euint32 encryptedValue = FHE.fromExternal(input, proof);
    uint32 plainValue = 100;

    // Convert plaintext to encrypted first
    euint32 encryptedConstant = FHE.asEuint32(plainValue);

    // Now can perform operation
    euint32 result = FHE.add(encryptedValue, encryptedConstant);

    // Grant permissions
    FHE.allowThis(result);
}
```

**Prevention:**
- Always convert plaintext to encrypted before operations
- Use `FHE.asEuint32()`, `FHE.asEuint64()` etc.
- Check types when writing FHE operations

---

### Anti-Pattern 6: Storing Values Without Initialization

**Severity:** MEDIUM ⚠️

**What Goes Wrong:**
```solidity
// ❌ BROKEN CODE
mapping(address => euint32) private userValues;

function getUserValue(address user) external view returns (euint32) {
    return userValues[user];  // Returns uninitialized value (0)
                               // But without proper permissions!
}

function updateValue(address user, externalEuint32 input, bytes calldata proof) external {
    // Adding to uninitialized value
    euint32 newValue = FHE.add(userValues[user], FHE.fromExternal(input, proof));
    // Result may not work correctly
}
```

**Why It Fails:**
- Uninitialized mapping returns default (0) without permissions
- Operations on uninitialized values may fail
- Unclear program behavior

**The Fix:**
```solidity
// ✅ CORRECT CODE
mapping(address => euint32) private userValues;
mapping(address => bool) private userInitialized;

function initializeUser() external {
    require(!userInitialized[msg.sender], "Already initialized");

    userValues[msg.sender] = FHE.asEuint32(0);
    userInitialized[msg.sender] = true;

    // Grant permissions immediately
    FHE.allowThis(userValues[msg.sender]);
    FHE.allow(userValues[msg.sender], msg.sender);
}

function getUserValue(address user) external view returns (euint32) {
    require(userInitialized[user], "User not initialized");
    return userValues[user];
}
```

**Prevention:**
- Explicitly initialize encrypted values
- Track initialization state
- Check initialization before operations
- Initialize with FHE.asEuint32(0) or similar

---

### Anti-Pattern 7: Reusing Input Proofs

**Severity:** HIGH ⚠️

**What Goes Wrong:**
```solidity
// ❌ BROKEN CODE
function storeAndUse(externalEuint32 input, bytes calldata proof) external {
    // First use
    euint32 value1 = FHE.fromExternal(input, proof);
    userValues[msg.sender] = value1;

    // Later: trying to reuse same proof
    euint32 value2 = FHE.fromExternal(input, proof);  // Invalid!
    // Proof is only valid for first transaction
}
```

**Why It Fails:**
- Input proofs are single-use only
- Proof is bound to specific transaction
- Reusing proof will fail validation
- Security risk if proofs were reusable

**The Fix:**
```solidity
// ✅ CORRECT CODE
function storeAndUse(externalEuint32 input1, externalEuint32 input2,
                     bytes calldata proof) external {
    // Use single proof for multiple inputs from same encryption session
    euint32 value1 = FHE.fromExternal(input1, proof);
    euint32 value2 = FHE.fromExternal(input2, proof);

    userValues[msg.sender] = value1;
    otherValues[msg.sender] = value2;
}

// Or get fresh proof for new transaction
function useAgain(externalEuint32 input, bytes calldata freshProof) external {
    euint32 value = FHE.fromExternal(input, freshProof);  // New proof
    userValues[msg.sender] = value;
}
```

**Prevention:**
- Generate fresh proofs for each transaction
- Understand single-use nature of proofs
- Client-side: always create new encrypted input per transaction
- Don't attempt to cache or reuse proofs

---

### Anti-Pattern 8: Assuming Overflow/Underflow Protection

**Severity:** MEDIUM ⚠️

**What Goes Wrong:**
```solidity
// ❌ BROKEN CODE
function transfer(externalEuint32 amount, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(amount, proof);

    // No underflow protection!
    userBalance = FHE.sub(userBalance, value);  // Could underflow

    // No overflow protection!
    totalSupply = FHE.add(totalSupply, value);  // Could overflow
}
```

**Why It Fails:**
- FHE operations wrap around like Solidity
- No automatic overflow/underflow detection
- Results in silent data corruption
- Security vulnerabilities

**The Fix:**
```solidity
// ✅ CORRECT CODE
function transfer(externalEuint32 amount, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(amount, proof);

    // Check balance before subtraction
    ebool hasSufficientBalance = FHE.gte(userBalance, value);

    // Use FHE.select to prevent underflow
    euint32 newBalance = FHE.select(
        hasSufficientBalance,
        FHE.sub(userBalance, value),
        userBalance  // Don't change if insufficient
    );

    userBalance = newBalance;

    // For addition, consider maximum values
    require(supply < type(uint64).max, "Supply too large");
    totalSupply = FHE.add(totalSupply, value);
}
```

**Prevention:**
- Always validate amounts before operations
- Use FHE.select for safe conditional updates
- Check maximum values
- Add runtime checks for critical operations
- Test with extreme values

---

### Anti-Pattern 9: Not Validating External Input

**Severity:** HIGH ⚠️

**What Goes Wrong:**
```solidity
// ❌ BROKEN CODE
function processInput(externalEuint32 input, bytes calldata proof) external {
    // No validation of input or proof
    euint32 value = FHE.fromExternal(input, proof);  // Proof might be invalid!

    // If proof is invalid, FHE.fromExternal may not work correctly
    userValues[msg.sender] = value;
}
```

**Why It Fails:**
- Malicious users might provide invalid proofs
- Invalid proofs could cause undefined behavior
- Security vulnerability

**The Fix:**
```solidity
// ✅ CORRECT CODE
function processInput(externalEuint32 input, bytes calldata proof) external {
    // Validate input format
    require(input != 0, "Input cannot be zero");

    // Validate proof format
    require(proof.length > 0, "Proof required");
    require(proof.length <= 1024, "Proof too large");

    // Try to convert, let FHE.fromExternal validate proof
    // If proof is invalid, this will fail
    euint32 value = FHE.fromExternal(input, proof);

    // Additional validation if needed
    require(value != FHE.asEuint32(0), "Zero value");  // Optional

    userValues[msg.sender] = value;
}
```

**Prevention:**
- Validate input bounds
- Validate proof format and length
- Let FHE.fromExternal validate cryptographic proofs
- Handle errors gracefully
- Test with malicious inputs

---

### Anti-Pattern 10: Exposing Sensitive Information in Events

**Severity:** MEDIUM ⚠️

**What Goes Wrong:**
```solidity
// ❌ BROKEN CODE
event Transfer(address indexed from, address indexed to, uint256 amount);

function transfer(address to, externalEuint32 encAmount, bytes calldata proof) external {
    euint32 amount = FHE.fromExternal(encAmount, proof);

    // ...update balances...

    // DON'T reveal encrypted amount in event!
    emit Transfer(msg.sender, to, uint256(uint32(encAmount)));  // Reveals handle!
}
```

**Why It Fails:**
- Reveals encrypted value handles
- Could leak information
- Privacy violation
- Defeats purpose of FHE

**The Fix:**
```solidity
// ✅ CORRECT CODE
event Transfer(address indexed from, address indexed to);  // No amount

function transfer(address to, externalEuint32 encAmount, bytes calldata proof) external {
    euint32 amount = FHE.fromExternal(encAmount, proof);

    // ...update balances...

    // Emit event without revealing amount
    emit Transfer(msg.sender, to);

    // Amount remains encrypted and private
}

// Provide separate decryption mechanism for those with access
function getTransactionAmount(uint256 transactionId) external view returns (euint32) {
    require(hasAccessToTransaction(msg.sender, transactionId), "No access");
    return transactions[transactionId].amount;
}
```

**Prevention:**
- Never include encrypted values in events
- Remove amounts from event logs
- Use separate mechanisms for interested parties to decrypt
- Think about information leakage
- Document what's private and what's public

---

## Best Practices Summary

### Permission Management ✅
```solidity
// ALWAYS do this:
euint32 result = FHE.add(a, b);
FHE.allowThis(result);           // Step 1: Contract permission
FHE.allow(result, recipient);    // Step 2: User permission
```

### Input Validation ✅
```solidity
// ALWAYS validate:
require(input != 0, "Invalid input");
require(proof.length > 0, "Missing proof");
euint32 value = FHE.fromExternal(input, proof);
```

### Type Conversion ✅
```solidity
// ALWAYS convert when mixing types:
uint32 plainValue = 100;
euint32 encryptedValue = ...;
euint32 encryptedConstant = FHE.asEuint32(plainValue);
euint32 result = FHE.add(encryptedValue, encryptedConstant);
```

### Conditional Logic ✅
```solidity
// NEVER use if statements with encrypted values:
// ❌ if (encryptedValue > 100) { }
// ✅ Use FHE.select instead:
ebool condition = FHE.gt(encryptedValue, FHE.asEuint32(100));
euint32 result = FHE.select(condition, valueIfTrue, valueIfFalse);
```

### Privacy Preservation ✅
```solidity
// NEVER expose encrypted values:
// ❌ emit Transfer(from, to, encryptedAmount);
// ✅ Emit without sensitive data:
emit Transfer(from, to);
```

## Common Error Messages and Solutions

### "Permission denied"
**Cause:** Missing `FHE.allowThis()` or `FHE.allow()`
**Solution:** Add both permission grants after creating encrypted value

### "Invalid input proof"
**Cause:** Proof doesn't match encrypted value or was reused
**Solution:** Ensure fresh proof for each transaction, correct binding

### "Cannot compare encrypted values"
**Cause:** Using `>`, `<`, `==` on encrypted values
**Solution:** Use `FHE.gt()`, `FHE.lt()`, `FHE.eq()` instead

### "Type mismatch euint32 vs uint32"
**Cause:** Mixing encrypted and plaintext without conversion
**Solution:** Use `FHE.asEuint32()` to convert plaintext

### "Zero value"
**Cause:** Using uninitialized encrypted values
**Solution:** Explicitly initialize with `FHE.asEuint32(0)`

## Testing Anti-Patterns

**Always test:**
- ✅ Inputs that would cause underflow/overflow
- ✅ Invalid proofs
- ✅ Missing permissions scenarios
- ✅ Uninitialized values
- ✅ Edge cases (0, max values, etc.)
- ✅ Multiple sequential operations
- ✅ Concurrent access patterns

## Code Review Checklist

When reviewing FHEVM code, check for:

- [ ] All encrypted values have `FHE.allowThis()` grant
- [ ] All encrypted values have `FHE.allow()` grant to intended users
- [ ] No encrypted values used in `if` statements
- [ ] All comparisons use `FHE.eq()`, `FHE.gt()`, etc.
- [ ] All conditional logic uses `FHE.select()`
- [ ] All new encrypted values from operations have permissions granted
- [ ] No plaintext mixed with encrypted without conversion
- [ ] Input proofs validated
- [ ] No overflow/underflow without checks
- [ ] No sensitive information in events
- [ ] Proper initialization of values
- [ ] No proof reuse

---

**Remember:** FHEVM requires a different mental model than plaintext Solidity. Always think:
- "How would this work on encrypted data?"
- "Who should have access to this value?"
- "What permissions do I need to grant?"
- "Could this underflow or overflow?"

Caught an anti-pattern? File an issue or contribute a fix!
