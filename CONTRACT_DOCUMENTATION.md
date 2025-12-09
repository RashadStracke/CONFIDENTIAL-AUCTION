# Smart Contract Reference - Confidential Auction

Complete technical reference for all smart contract functions and components.

## Main Contract: ConfidentialAuction

### Contract Overview

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";

contract ConfidentialAuction {
    // State variables
    // Events
    // Functions
}
```

**Purpose**: Manage confidential auctions with encrypted bidding using FHE.

**Network**: Zama FHEVM compatible networks (Sepolia Testnet)

**Gas Estimate**: ~200k per transaction

---

## Data Structures

### Auction Struct

```solidity
struct Auction {
    uint256 id;                    // Unique identifier (1-indexed)
    string title;                  // Auction name (plaintext)
    string description;            // Auction details (plaintext)
    string category;               // Classification category (plaintext)
    uint256 minimumBid;            // Minimum acceptable bid (wei)
    address creator;               // Auction creator address
    uint256 timestamp;             // Creation time (Unix seconds)
    bool isActive;                 // Auction active status
    uint256 endTime;               // Expiration time (Unix seconds)
    euint64 highestBidAmount;      // ENCRYPTED highest bid
    address highestBidder;         // Current highest bidder address
    uint256 bidCount;              // Total number of bids
}
```

#### Field Descriptions

| Field | Type | Visibility | Notes |
|-------|------|------------|-------|
| id | uint256 | Public | Auto-incremented on creation |
| title | string | Public | Searchable metadata |
| description | string | Public | Full auction details |
| category | string | Public | Classification for filtering |
| minimumBid | uint256 | Public | Enforced at bid placement |
| creator | address | Public | Can end auction early |
| timestamp | uint256 | Public | For chronological sorting |
| isActive | bool | Public | Status flag |
| endTime | uint256 | Public | 7 days after creation |
| highestBidAmount | euint64 | Private | ENCRYPTED - Not directly readable |
| highestBidder | address | Public | Winner identification |
| bidCount | uint256 | Public | Participation tracking |

### Bid Struct

```solidity
struct Bid {
    address bidder;               // Bidder wallet address
    euint64 amount;               // ENCRYPTED bid amount
    ebool isHighBid;              // ENCRYPTED flag (redundant)
    string comments;              // Optional message (plaintext)
    uint256 timestamp;            // Bid placement time
    bool isRevealed;              // Decryption status
}
```

#### Field Descriptions

| Field | Type | Visibility | Notes |
|-------|------|------------|-------|
| bidder | address | Public | For settlement and identification |
| amount | euint64 | Private | ENCRYPTED - Cannot be read directly |
| isHighBid | ebool | Private | ENCRYPTED - Redundant with comparisons |
| comments | string | Public | Bidder's optional message |
| timestamp | uint256 | Public | Bid submission time |
| isRevealed | bool | Private | Flag for decryption status |

---

## State Variables

### Public State Variables

```solidity
// Auction mappings
mapping(uint256 => Auction) public auctions;
mapping(uint256 => Bid[]) public auctionBids;
mapping(address => uint256[]) public userAuctions;
mapping(address => mapping(uint256 => bool)) public hasUserBid;

// Counters
uint256 public nextAuctionId = 1;
uint256 public totalAuctions = 0;
```

### State Variable Details

#### `auctions`
- **Type**: `mapping(uint256 => Auction)`
- **Access**: Public (read-only externally)
- **Usage**: Store all auctions by ID
- **Example**: `auctions[1]` returns first auction

#### `auctionBids`
- **Type**: `mapping(uint256 => Bid[])`
- **Access**: Public (read-only externally)
- **Usage**: Store bids per auction
- **Example**: `auctionBids[1][0]` returns first bid on auction 1

#### `userAuctions`
- **Type**: `mapping(address => uint256[])`
- **Access**: Public (read-only externally)
- **Usage**: Track auctions created by each user
- **Example**: `userAuctions[0x123...]` returns all auctions by user

#### `hasUserBid`
- **Type**: `mapping(address => mapping(uint256 => bool))`
- **Access**: Public (read-only externally)
- **Usage**: Prevent duplicate bids from same user
- **Example**: `hasUserBid[0x123...][1]` is true if user bid on auction 1

#### `nextAuctionId`
- **Type**: `uint256`
- **Initial Value**: 1
- **Usage**: Auto-increment for auction IDs
- **Increment**: +1 per `createAuction()` call

#### `totalAuctions`
- **Type**: `uint256`
- **Initial Value**: 0
- **Usage**: Track total auctions created
- **Increment**: +1 per `createAuction()` call

---

## Events

### AuctionCreated

```solidity
event AuctionCreated(
    uint256 indexed auctionId,
    string title,
    string category,
    uint256 minimumBid,
    address indexed creator,
    uint256 endTime
);
```

**Emitted When**: `createAuction()` succeeds

**Use Cases**:
- Notify UI of new auction
- Index auctions for marketplace
- Trigger off-chain notifications

**Example Listener**:
```typescript
contract.on("AuctionCreated", (auctionId, title, category, ...) => {
  console.log(`New auction: ${title} by ${category}`);
});
```

### BidPlaced

```solidity
event BidPlaced(
    uint256 indexed auctionId,
    address indexed bidder,
    uint256 timestamp
);
```

**Emitted When**: `placeBid()` succeeds

**Use Cases**:
- Notify auction creator of new bid
- Track bidding activity
- Update UI in real-time

**Example Listener**:
```typescript
contract.on("BidPlaced", (auctionId, bidder, timestamp) => {
  console.log(`Bid placed on auction ${auctionId}`);
});
```

### AuctionEnded

```solidity
event AuctionEnded(
    uint256 indexed auctionId,
    address winner,
    uint256 winningBid
);
```

**Emitted When**: `endAuction()` completes

**Use Cases**:
- Notify winner and creator
- Record final results
- Trigger settlement

**Example Listener**:
```typescript
contract.on("AuctionEnded", (auctionId, winner, bid) => {
  console.log(`Auction ${auctionId} won by ${winner}`);
});
```

---

## Functions

### Constructor

```solidity
constructor()
```

**Purpose**: Initialize contract (no-op in current implementation)

**Inputs**: None

**Outputs**: Contract instance deployed

**State Changes**: None

**Gas Cost**: ~50k

**Example**:
```typescript
const contract = await ConfidentialAuction.deploy();
```

---

### createAuction()

```solidity
function createAuction(
    string memory _title,
    string memory _description,
    string memory _category,
    uint256 _minimumBid
) public
```

**Purpose**: Create new auction

**Inputs**:
- `_title` (string): Auction name (1-255 characters)
- `_description` (string): Full auction details
- `_category` (string): Classification (e.g., "Art", "Gaming")
- `_minimumBid` (uint256): Minimum bid in wei

**Outputs**: Emits `AuctionCreated` event

**State Changes**:
1. Increments `nextAuctionId`
2. Increments `totalAuctions`
3. Creates new `Auction` in `auctions` mapping
4. Adds ID to `userAuctions[msg.sender]`

**Requirements**:
- `_title` cannot be empty
- `_description` cannot be empty
- `_category` cannot be empty
- `_minimumBid` must be > 0

**Gas Cost**: ~150k

**Errors**:
- `"Title cannot be empty"` - if `_title` is empty
- `"Description cannot be empty"` - if `_description` is empty
- `"Category cannot be empty"` - if `_category` is empty
- `"Minimum bid must be greater than 0"` - if `_minimumBid` is 0

**Example**:
```typescript
const tx = await contract.createAuction(
  "Vintage Watch",
  "A rare 1950s Rolex",
  "Watches",
  ethers.parseEther("1.0")  // 1 ETH minimum
);

// Listen for confirmation
contract.on("AuctionCreated", (id, title, ...) => {
  console.log(`Auction ${id}: ${title}`);
});
```

**Auction Duration**: Fixed at 7 days from creation

**Initial State**:
- `isActive`: true
- `highestBidAmount`: 0 (encrypted)
- `highestBidder`: address(0)
- `bidCount`: 0

---

### placeBid()

```solidity
function placeBid(
    uint256 _auctionId,
    bool _isHighBid,
    uint256 _bidAmount,
    string memory _comments
) public payable
```

**Purpose**: Place encrypted bid on auction

**Inputs**:
- `_auctionId` (uint256): Target auction ID
- `_isHighBid` (bool): Flag (encrypted but not actively used)
- `_bidAmount` (uint256): Bid amount in wei
- `_comments` (string): Optional bidder message

**Outputs**: Emits `BidPlaced` event

**State Changes**:
1. Appends new `Bid` to `auctionBids[_auctionId]`
2. Increments `auctions[_auctionId].bidCount`
3. Sets `hasUserBid[msg.sender][_auctionId] = true`
4. Updates `auctions[_auctionId].highestBidAmount` (via FHE comparison)
5. Updates `auctions[_auctionId].highestBidder` (if bid > 0)

**Requirements**:
- Auction ID must be valid (1 to `nextAuctionId - 1`)
- Auction must be active (`isActive == true`)
- Current time must be before `endTime`
- Bidder cannot be auction creator
- Bidder can only bid once per auction
- `msg.value` (ETH sent) must be >= `minimumBid`

**Gas Cost**: ~200k

**Errors**:
- `"Invalid auction ID"` - if `_auctionId` is out of range
- `"Auction is not active"` - if auction ended or cancelled
- `"Auction has ended"` - if `block.timestamp >= endTime`
- `"Cannot bid on your own auction"` - if bidder is creator
- `"You have already placed a bid on this auction"` - duplicate bid attempt
- `"Bid below minimum amount"` - if `msg.value < minimumBid`

**FHE Operations**:
```solidity
// Encrypt bid amount
euint64 encryptedBidAmount = FHE.asEuint64(uint64(_bidAmount));

// Compare with current highest (encrypted comparison)
ebool isNewHighest = encryptedBidAmount.gt(currentHighest);

// Conditionally update (homomorphic select)
auctions[_auctionId].highestBidAmount = FHE.select(
    isNewHighest,
    encryptedBidAmount,
    currentHighest
);
```

**Privacy**:
- Bid amount is encrypted with FHE
- Comparison happens on encrypted data
- No plaintext bid amount revealed

**Example**:
```typescript
const tx = await contract.placeBid(
  1,                          // Auction ID
  true,                       // isHighBid flag
  ethers.parseEther("1.5"),   // 1.5 ETH bid
  "Great item, love it!",    // Comments
  { value: ethers.parseEther("1.5") }  // ETH to send
);
```

**Integer Casting Note**:
- `_bidAmount` (uint256) is cast to `uint64` for FHE
- Overflow risk if bid > 2^64-1 (~18.4 ETH in wei)
- Consider adding validation for large bids

---

### endAuction()

```solidity
function endAuction(uint256 _auctionId) public
```

**Purpose**: Conclude auction and settle with highest bidder

**Inputs**:
- `_auctionId` (uint256): Auction to end

**Outputs**: Emits `AuctionEnded` event, transfers ETH

**State Changes**:
1. Sets `auctions[_auctionId].isActive = false`
2. Transfers `minimumBid` ETH to auction creator
3. Emits `AuctionEnded` event

**Requirements**:
- Auction ID must be valid
- Auction must be active
- Either:
  - `block.timestamp >= endTime`, OR
  - `msg.sender == creator` (early end by creator)

**Gas Cost**: ~50k + transfer cost

**Errors**:
- `"Invalid auction ID"` - if `_auctionId` is out of range
- `"Auction is not active"` - if already ended
- `"Auction has not ended yet and you are not the creator"` - insufficient permission

**Settlement Logic**:
```solidity
// Note: Current implementation has limitation
// It transfers minimumBid regardless of actual highest bid
// Production version should decrypt and transfer actual winning bid
```

**Limitations**:
- Transfers fixed `minimumBid` amount (not actual winning bid)
- Requires decryption capability (not implemented)
- No refund mechanism for losing bidders

**Example**:
```typescript
// Auction creator ending early
const tx = await contract.connect(creator).endAuction(1);

// Or anyone ending after expiration
const tx = await contract.endAuction(1);

// Listen for completion
contract.on("AuctionEnded", (id, winner, bid) => {
  console.log(`Auction ${id} ended, winner: ${winner}`);
});
```

---

### getActiveAuctions()

```solidity
function getActiveAuctions() public view returns (Auction[] memory)
```

**Purpose**: Retrieve all active, non-expired auctions

**Inputs**: None

**Outputs**: Array of `Auction` structs

**State Changes**: None (view function)

**Gas Cost**: O(n) where n = total auctions, ~50k-200k

**Algorithm**:
1. Count active auctions (first pass)
2. Allocate array of that size
3. Populate array (second pass)

**Performance**: O(n) time, O(m) space (m = active count)

**Note**: Expensive operation - use off-chain indexing for production

**Example**:
```typescript
const active = await contract.getActiveAuctions();
console.log(`${active.length} active auctions`);

active.forEach(auction => {
  console.log(`- ${auction.title} (ends ${new Date(auction.endTime * 1000)})`);
});
```

---

### getUserAuctions()

```solidity
function getUserAuctions(address _user) public view returns (uint256[] memory)
```

**Purpose**: Get all auction IDs created by specific user

**Inputs**:
- `_user` (address): User address to query

**Outputs**: Array of auction IDs

**State Changes**: None (view function)

**Gas Cost**: O(1) mapping read, ~1k gas

**Example**:
```typescript
const userAuctions = await contract.getUserAuctions("0x123...");
console.log(`User created ${userAuctions.length} auctions`);

userAuctions.forEach(id => {
  const auction = await contract.getAuction(id);
  console.log(`- ${auction.title}`);
});
```

---

### getAuctionBidCount()

```solidity
function getAuctionBidCount(uint256 _auctionId) public view returns (uint256)
```

**Purpose**: Get number of bids on specific auction

**Inputs**:
- `_auctionId` (uint256): Auction ID

**Outputs**: Bid count (uint256)

**State Changes**: None (view function)

**Gas Cost**: ~5k

**Requirements**:
- Auction ID must be valid

**Example**:
```typescript
const bidCount = await contract.getAuctionBidCount(1);
console.log(`${bidCount} bids on auction 1`);
```

**Use Case**: Track auction popularity without revealing bid amounts

---

### hasPlacedBid()

```solidity
function hasPlacedBid(address _user, uint256 _auctionId) public view returns (bool)
```

**Purpose**: Check if specific user has bid on auction

**Inputs**:
- `_user` (address): User to check
- `_auctionId` (uint256): Auction to check

**Outputs**: Boolean (true if user has bid)

**State Changes**: None (view function)

**Gas Cost**: ~1k

**Example**:
```typescript
const hasBid = await contract.hasPlacedBid("0x123...", 1);
if (hasBid) {
  console.log("User has already bid on this auction");
} else {
  console.log("User can place a bid");
}
```

---

### getAuction()

```solidity
function getAuction(uint256 _auctionId) public view returns (Auction memory)
```

**Purpose**: Retrieve complete auction details

**Inputs**:
- `_auctionId` (uint256): Auction ID

**Outputs**: `Auction` struct

**State Changes**: None (view function)

**Gas Cost**: ~5k

**Requirements**:
- Auction ID must be valid

**Encrypted Fields Note**:
- `highestBidAmount` is encrypted and cannot be read externally
- Contract can operate on it, but external callers cannot decrypt

**Example**:
```typescript
const auction = await contract.getAuction(1);
console.log(`Auction: ${auction.title}`);
console.log(`Created by: ${auction.creator}`);
console.log(`Ends: ${new Date(auction.endTime * 1000)}`);
console.log(`Bids: ${auction.bidCount}`);

// Note: Cannot access auction.highestBidAmount directly
// It's encrypted (euint64 type)
```

---

### getTotalCounts()

```solidity
function getTotalCounts() public view returns (
    uint256 totalAuctionCount,
    uint256 activeAuctionCount
)
```

**Purpose**: Get overall auction statistics

**Inputs**: None

**Outputs**: Tuple of (total, active)

**State Changes**: None (view function)

**Gas Cost**: O(n), ~50k-200k

**Example**:
```typescript
const [total, active] = await contract.getTotalCounts();
console.log(`Total: ${total} auctions`);
console.log(`Active: ${active} auctions`);
console.log(`Ended: ${total - active} auctions`);
```

---

### emergencyWithdraw()

```solidity
function emergencyWithdraw() public
```

**Purpose**: Emergency withdrawal function (testing only)

**Inputs**: None

**Outputs**: None

**State Changes**: Transfers all contract balance

**Requirements**:
- `msg.sender` must be the contract itself (prevents external calls)

**Gas Cost**: ~5k + transfer

**Example**:
```typescript
// This function cannot be called externally due to msg.sender check
// It's designed for contract-to-contract calls only
```

**Security Note**: This is for testing/emergency only - should be removed in production

---

### receive() and fallback()

```solidity
receive() external payable {}
fallback() external payable {}
```

**Purpose**: Accept ETH transfers and function calls with no matching signature

**Use Cases**:
- Accept ETH without function call
- Handle malformed calls gracefully

**Example**:
```typescript
// Send ETH directly to contract
await signer.sendTransaction({
  to: contractAddress,
  value: ethers.parseEther("1.0")
});
```

---

## Usage Examples

### Complete Auction Workflow

```typescript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const [creator, bidder1, bidder2] = await ethers.getSigners();

const Contract = await ethers.getContractFactory("ConfidentialAuction");
const contract = await Contract.deploy();

// 1. Create auction
console.log("Creating auction...");
const createTx = await contract.connect(creator).createAuction(
  "Vintage Watch",
  "Beautiful 1950s Rolex in excellent condition",
  "Watches",
  ethers.parseEther("0.5")  // 0.5 ETH minimum
);
await createTx.wait();

// 2. Place bids
console.log("Placing bids...");
const bid1 = await contract.connect(bidder1).placeBid(
  1,
  true,
  ethers.parseEther("0.6"),
  "I love this watch!",
  { value: ethers.parseEther("0.6") }
);
await bid1.wait();

const bid2 = await contract.connect(bidder2).placeBid(
  1,
  true,
  ethers.parseEther("0.8"),
  "Great vintage piece",
  { value: ethers.parseEther("0.8") }
);
await bid2.wait();

// 3. Check auction status
console.log("Checking auction status...");
const auction = await contract.getAuction(1);
console.log(`Bids: ${auction.bidCount}`);
console.log(`Creator: ${auction.creator}`);

// 4. End auction
console.log("Ending auction...");
const endTx = await contract.connect(creator).endAuction(1);
await endTx.wait();

console.log("Auction complete!");
```

---

## Security Considerations

### Known Limitations

1. **Bid Decryption**: Current implementation doesn't actually decrypt winning bid
2. **Refunds**: Losing bidders don't receive refunds
3. **Auction Cancellation**: No mechanism to cancel auctions
4. **Access Control**: Minimal ACL (only creator-based checks)

### Recommendations for Production

1. Implement proper bid decryption mechanism
2. Add refund system for non-winning bidders
3. Add auction cancellation with refund
4. Use OpenZeppelin's AccessControl for granular permissions
5. Add bid amount limits to prevent overflow
6. Implement payment splitting (e.g., platform fees)

---

## Version Information

- **Solidity**: ^0.8.24
- **FHEVM Library**: @fhevm/solidity v0.7.0
- **Last Updated**: December 2025

---

For additional support, refer to:
- DEVELOPER_GUIDE.md - Setup and development
- TECHNICAL_ARCHITECTURE.md - System design
- README.md - User documentation
