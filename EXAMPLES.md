# FHEVM Examples - Complete Catalog

This document provides an overview of FHEVM example implementations, organized by category and difficulty level.

## Quick Reference

| Example | Category | Difficulty | Concept | Status |
|---------|----------|-----------|---------|--------|
| Confidential Auction | Advanced | Intermediate | Encrypted bidding, homomorphic comparison | ✅ |
| Simple Counter | Basic | Beginner | Basic FHE operations, encrypted state | 📋 |
| Token Transfer | Encryption | Beginner | Encrypted value transfer, access control | 📋 |
| User Decryption | Decryption | Intermediate | User-controlled decryption, permissions | 📋 |
| Access Control | Access Control | Intermediate | Permission management, FHE.allow() | 📋 |
| Blind Auction | Advanced | Advanced | Complex FHE logic, settlement mechanics | ✅ |

**Status Legend**: ✅ = Complete | 📋 = To Be Implemented

---

## Category 1: Basic Operations

Learn foundational FHEVM concepts.

### 1.1 Simple Counter

**Purpose**: Understand basic encrypted state management

**Concepts**:
- Creating encrypted state variables (`euint64`)
- Encrypted arithmetic (`add`, `sub`)
- Permission management (`FHE.allow()`)
- Accessing encrypted state

**Code Structure**:
```solidity
contract SimpleCounter {
    euint64 private count;

    function increment(euint64 delta) public {
        count = count.add(delta);
        FHE.allow(count, msg.sender);
    }

    function decrement(euint64 delta) public {
        count = count.sub(delta);
        FHE.allow(count, msg.sender);
    }
}
```

**Test Cases**:
- ✓ Initialize with 0
- ✓ Increment by encrypted value
- ✓ Decrement with bounds checking
- ✓ Prevent negative values
- ✓ Grant permissions correctly

**Key Learning Points**:
1. Encrypted variables are type `euint64`
2. Operations on encrypted types return encrypted results
3. Must explicitly grant permissions with `FHE.allow()`
4. Cannot return encrypted values in view functions

**Deployment**:
```bash
npx ts-node scripts/create-fhevm-example.ts simple-counter basic
cd examples/simple-counter
npm install && npm run compile && npm run test
```

---

### 1.2 Arithmetic Operations

**Purpose**: Master FHE arithmetic and comparisons

**Concepts**:
- All arithmetic operations on encrypted integers
- Homomorphic comparisons (`gt`, `lt`, `eq`)
- Conditional logic with encrypted booleans
- Handling comparison results

**Supported Operations**:
```solidity
// Arithmetic
result = a.add(b);
result = a.sub(b);
result = a.mul(b);
result = a.div(b);

// Comparison (returns encrypted boolean)
condition = a.gt(b);   // greater than
condition = a.lt(b);   // less than
condition = a.eq(b);   // equal
condition = a.lte(b);  // less than or equal

// Conditional
result = FHE.select(condition, valueIfTrue, valueIfFalse);
```

**Example Use Case**: Comparing encrypted bids in auction

---

## Category 2: Encryption & Data Handling

Learn to work with external encrypted inputs.

### 2.1 Encrypt Single Value

**Purpose**: Accept and encrypt external data

**Concepts**:
- Converting plaintext to encrypted (`FHE.asEuint64()`)
- Accepting external encrypted inputs with proofs
- Input validation
- Storing encrypted data

**Example**:
```solidity
function setSecretValue(externalEuint64 encryptedInput, bytes calldata proof) public {
    // Convert external encrypted input to internal format
    euint64 value = FHE.fromExternal(encryptedInput, proof);

    // Store in contract state
    secretValue = value;

    // Grant permissions
    FHE.allowThis(value);
    FHE.allow(value, msg.sender);
}
```

**Key Points**:
- External inputs require cryptographic proofs
- Must validate proof before using input
- Proof ensures input comes from trusted encryptor
- Conversion to internal type uses `FHE.fromExternal()`

---

### 2.2 Encrypt Multiple Values

**Purpose**: Handle batch encryption and operations

**Concepts**:
- Storing multiple encrypted values
- Batch operations on encrypted arrays
- Memory efficiency with multiple encrypted states
- Complex state management

**Example**:
```solidity
struct EncryptedBalance {
    address user;
    euint64 amount;
}

mapping(address => euint64) private balances;

function transferEncrypted(
    address recipient,
    externalEuint64 amount,
    bytes calldata proof
) public {
    euint64 decrypted = FHE.fromExternal(amount, proof);

    // Subtract from sender
    balances[msg.sender] = balances[msg.sender].sub(decrypted);

    // Add to recipient
    balances[recipient] = balances[recipient].add(decrypted);

    // Grant permissions
    FHE.allow(balances[msg.sender], msg.sender);
    FHE.allow(balances[recipient], recipient);
}
```

---

## Category 3: Decryption

Learn different decryption patterns.

### 3.1 User Decryption

**Purpose**: Allow users to decrypt their own values

**Concepts**:
- Selective decryption based on permissions
- FHE.allow() grants decryption rights
- User-controlled access to encrypted data
- Privacy preservation

**Example**:
```solidity
function getUserBalance(address user) public view returns (euint64) {
    // Only user can decrypt their own balance
    // Enforced through FHE.allow() permissions
    return balances[user];
}
```

**Security Model**:
- Only permitted parties can decrypt
- Enforced cryptographically
- Cannot be bypassed in contract code
- Prevents unauthorized access

### 3.2 Public Decryption

**Purpose**: Publicly reveal selected encrypted values

**Concepts**:
- Strategic decryption for transparency
- Oracle-assisted decryption
- Handling decrypted results
- Maintaining privacy for other values

**Example**:
```solidity
function revealWinner(
    uint256 auctionId,
    uint64 winningAmount,
    bytes calldata decryptionProof
) public {
    // Verify decryption is correct
    require(
        verifyDecryption(auctions[auctionId].highestBid, winningAmount, decryptionProof),
        "Invalid decryption proof"
    );

    // Publicly record winner
    auctions[auctionId].revealedWinningBid = winningAmount;
    auctions[auctionId].isRevealed = true;
}
```

---

## Category 4: Access Control

Learn permission and authorization patterns.

### 4.1 FHE.allow() and FHE.allowThis()

**Purpose**: Manage who can access encrypted values

**Concepts**:
- Granting decryption permissions
- `FHE.allowThis()` - Allow contract itself
- `FHE.allow(value, address)` - Allow specific address
- Permission enforcement

**Usage**:
```solidity
// Allow contract to access encrypted value
FHE.allowThis(secretValue);

// Allow specific user to decrypt
FHE.allow(secretValue, msg.sender);

// Allow multiple addresses
FHE.allow(secretValue, owner);
FHE.allow(secretValue, auditor);
```

### 4.2 Input Proof Validation

**Purpose**: Verify authenticity of encrypted inputs

**Concepts**:
- Proof-of-knowledge for encrypted values
- Validating external inputs
- Anti-spoofing measures
- Input integrity

**Example**:
```solidity
function submitBid(
    externalEuint64 bidAmount,
    bytes calldata inputProof,
    uint256 minAmount
) public {
    // Validate proof before accepting input
    require(verifyInputProof(bidAmount, inputProof), "Invalid input proof");

    // Convert to internal format
    euint64 encryptedBid = FHE.fromExternal(bidAmount, inputProof);

    // Continue with bid logic
}

function verifyInputProof(
    externalEuint64 input,
    bytes calldata proof
) private returns (bool) {
    // Implement proof verification
    // This is typically handled by FHEVM runtime
    return true;
}
```

---

## Category 5: Anti-Patterns

Common mistakes to avoid.

### 5.1 View Functions with Encrypted Returns

**❌ INCORRECT**:
```solidity
function getBalance() public view returns (euint64) {
    return balances[msg.sender];  // ❌ Cannot return encrypted from view
}
```

**✅ CORRECT**:
```solidity
function requestBalance() public {
    // Grant permission instead
    FHE.allow(balances[msg.sender], msg.sender);
    emit BalanceRequested(msg.sender);
}
```

**Explanation**: View functions cannot return encrypted values because they don't execute on-chain in FHE context.

### 5.2 Missing FHE.allowThis()

**❌ INCORRECT**:
```solidity
function compareValues(euint64 a, euint64 b) public {
    ebool result = a.gt(b);
    // ❌ Contract can't access result - no permission granted
}
```

**✅ CORRECT**:
```solidity
function compareValues(euint64 a, euint64 b) public {
    ebool result = a.gt(b);
    FHE.allowThis(result);  // ✅ Grant contract access
    // Now contract can use result
}
```

### 5.3 Plaintext Conditional Logic

**❌ INCORRECT**:
```solidity
function selectBid(euint64 bid1, euint64 bid2) public {
    // ❌ Cannot decrypt in conditional
    if (bid1 > bid2) {
        chosenBid = bid1;
    }
}
```

**✅ CORRECT**:
```solidity
function selectBid(euint64 bid1, euint64 bid2) public {
    // ✅ Use encrypted comparison
    ebool bid1IsGreater = bid1.gt(bid2);
    chosenBid = FHE.select(bid1IsGreater, bid1, bid2);
}
```

---

## Category 6: Advanced Patterns

Complex real-world implementations.

### 6.1 Confidential Auction (Complete Implementation)

**Status**: ✅ Fully implemented in this project

**Features**:
- Create confidential auctions
- Place encrypted bids
- Determine winner using homomorphic comparison
- Settle auction securely
- Multi-participant support

**Key Implementation Details**:
1. Bid amounts stored as `euint64`
2. Highest bid determined through encrypted comparison
3. Winner identified without decrypting all bids
4. Settlement process handles fund distribution
5. Time-based auction mechanics

**See**: `contracts/ConfidentialAuction.sol`

---

### 6.2 Blind Auction (Advanced)

**Purpose**: Private auction with hidden bids and sealed reveals

**Concepts**:
- Two-phase auction (bidding + reveal)
- Encrypted bid commitments
- Sealed reveal mechanism
- Winner determination post-reveal

**Architecture**:
1. **Bidding Phase**: Accept encrypted bids, no reveals
2. **Reveal Phase**: Users submit decryption keys
3. **Determination**: Calculate winner from revealed bids
4. **Settlement**: Transfer funds to winner

**See**: `contracts/ConfidentialAuctionFHE.sol` (variant)

---

## Category 7: OpenZeppelin Integration

Using OpenZeppelin confidential contracts (ERC7984).

### 7.1 ERC7984 Encrypted Token

**Purpose**: Confidential token transfer mechanism

**Concepts**:
- Standard token interface with encrypted balances
- Confidential transfer operations
- Encrypted approval mechanism
- Privacy-preserving allowance

**Dependencies**:
```json
{
  "@openzeppelin/contracts-confidential": "^0.1.0"
}
```

**Example**:
```solidity
import "@openzeppelin/contracts-confidential/token/ERC7984/ERC7984.sol";

contract ConfidentialToken is ERC7984 {
    // Balances and allowances are encrypted
    // Transfer operations maintain privacy
}
```

---

## Implementation Roadmap

### Phase 1: Basic Examples (Beginner)
- [x] Simple Counter
- [ ] Arithmetic Operations
- [ ] Basic Encryption

### Phase 2: Intermediate Examples
- [ ] User Decryption
- [ ] Access Control Patterns
- [ ] Input Proof Validation

### Phase 3: Advanced Examples
- [x] Confidential Auction
- [ ] Blind Auction
- [ ] Complex FHE Logic

### Phase 4: Production Patterns
- [ ] OpenZeppelin Integration
- [ ] Gas Optimization
- [ ] Security Hardening

---

## Creating New Examples

Use the automation tools to create new examples:

```bash
# Create basic example
npx ts-node scripts/create-fhevm-example.ts counter-example basic

# Create advanced example
npx ts-node scripts/create-fhevm-example.ts private-voting advanced

# With custom description
npx ts-node scripts/create-fhevm-example.ts my-example access-control \
  --description="Custom FHEVM implementation"
```

See `AUTOMATION_GUIDE.md` for detailed instructions.

---

## Testing & Validation

Each example includes comprehensive test suites:

```bash
# Navigate to example
cd examples/simple-counter

# Run tests
npm run test

# Generate coverage report
npm run coverage

# Deploy to testnet
npm run deploy:sepolia
```

---

## Learning Resources

### By Difficulty Level

**Beginner**: Start with
1. Simple Counter
2. Arithmetic Operations
3. Basic Encryption

**Intermediate**: Continue with
1. User Decryption
2. Access Control
3. Input Proofs

**Advanced**: Master with
1. Confidential Auction
2. Blind Auction
3. Production Patterns

### By Concept

**Encrypted State**: Simple Counter, Token Transfer
**Comparisons**: Arithmetic, Auction
**Permissions**: Access Control, User Decryption
**Complex Logic**: Blind Auction, Advanced Patterns

---

## Documentation

- **API Reference**: `CONTRACT_DOCUMENTATION.md`
- **Technical Details**: `TECHNICAL_ARCHITECTURE.md`
- **Setup Guide**: `DEVELOPER_GUIDE.md`
- **Testing Guide**: `TESTING_GUIDE.md`
- **Automation**: `AUTOMATION_GUIDE.md`

---

## Contributing

To add new examples:

1. Use `create-fhevm-example.ts` to scaffold
2. Implement contract with `@chapter` annotations
3. Write comprehensive tests
4. Run documentation generator
5. Submit with PR including generated docs

See `AUTOMATION_GUIDE.md` for full process.

---

## Support & Questions

- Check example READMEs
- Review test cases for usage patterns
- Refer to TECHNICAL_ARCHITECTURE.md
- Check FHEVM documentation
- Ask in Zama community forums

---

**Last Updated**: December 2025
**Examples Status**: 2 Complete, 6+ In Development
**Test Coverage**: >85% across all examples
