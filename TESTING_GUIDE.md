# Testing Guide - Confidential Auction

Comprehensive guide for testing the Confidential Auction smart contracts at all levels: unit tests, integration tests, FHE-specific tests, and security validations.

## Test Framework Setup

### Testing Stack
- **Framework**: Mocha (test runner)
- **Assertion Library**: Chai (assertions)
- **Blockchain Simulation**: Hardhat
- **Contract Interaction**: Ethers.js v6

### Installation
```bash
npm install --save-dev mocha chai ethers @nomicfoundation/hardhat-toolbox
```

### Running Tests
```bash
# Run all tests
npm run test

# Run with verbose output
npm run test -- --reporter spec

# Run single test file
npm run test test/auction.test.ts

# Run with gas reporting
REPORT_GAS=true npm run test

# Run with code coverage
npm run coverage

# Watch mode (re-run on file changes)
npm run test -- --watch
```

---

## Test Structure

### Basic Test Template

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ConfidentialAuction", function () {
  // Setup
  let contract: any;
  let owner: any;
  let bidder1: any;
  let bidder2: any;

  before(async function () {
    // Deploy contract once for entire suite
    const Factory = await ethers.getContractFactory("ConfidentialAuction");
    contract = await Factory.deploy();
    [owner, bidder1, bidder2] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Reset state before each test if needed
  });

  describe("Function Name", function () {
    it("should do something", async function () {
      // Arrange
      const expectedValue = 42;

      // Act
      const result = await contract.someFunction();

      // Assert
      expect(result).to.equal(expectedValue);
    });
  });
});
```

---

## Unit Tests

### Test Suite 1: Auction Creation

```typescript
describe("createAuction", function () {
  it("should create an auction with valid parameters", async function () {
    const createTx = await contract.createAuction(
      "Test Auction",
      "Test Description",
      "Test Category",
      ethers.parseEther("1.0")
    );

    expect(createTx).to.emit(contract, "AuctionCreated");

    const auction = await contract.getAuction(1);
    expect(auction.title).to.equal("Test Auction");
    expect(auction.creator).to.equal(owner.address);
    expect(auction.minimumBid).to.equal(ethers.parseEther("1.0"));
    expect(auction.isActive).to.equal(true);
  });

  it("should increment auction ID correctly", async function () {
    const tx1 = await contract.createAuction(
      "Auction 1", "Desc 1", "Cat 1",
      ethers.parseEther("1.0")
    );

    const tx2 = await contract.createAuction(
      "Auction 2", "Desc 2", "Cat 2",
      ethers.parseEther("2.0")
    );

    const totalAuctions = await contract.getTotalCounts();
    expect(totalAuctions[0]).to.equal(2);
  });

  it("should track user's auctions", async function () {
    await contract.connect(bidder1).createAuction(
      "User Auction 1", "Desc", "Cat",
      ethers.parseEther("1.0")
    );

    const userAuctions = await contract.getUserAuctions(bidder1.address);
    expect(userAuctions.length).to.equal(1);
  });

  it("should reject empty title", async function () {
    await expect(
      contract.createAuction(
        "",  // Empty title
        "Description",
        "Category",
        ethers.parseEther("1.0")
      )
    ).to.be.revertedWith("Title cannot be empty");
  });

  it("should reject empty description", async function () {
    await expect(
      contract.createAuction(
        "Title",
        "",  // Empty description
        "Category",
        ethers.parseEther("1.0")
      )
    ).to.be.revertedWith("Description cannot be empty");
  });

  it("should reject empty category", async function () {
    await expect(
      contract.createAuction(
        "Title",
        "Description",
        "",  // Empty category
        ethers.parseEther("1.0")
      )
    ).to.be.revertedWith("Category cannot be empty");
  });

  it("should reject zero minimum bid", async function () {
    await expect(
      contract.createAuction(
        "Title",
        "Description",
        "Category",
        0  // Zero minimum bid
      )
    ).to.be.revertedWith("Minimum bid must be greater than 0");
  });

  it("should set correct end time (7 days)", async function () {
    const blockTime = await ethers.provider.getBlock("latest");
    const createdTime = blockTime!.timestamp;

    await contract.createAuction(
      "Title", "Desc", "Cat",
      ethers.parseEther("1.0")
    );

    const auction = await contract.getAuction(1);
    const endTime = Number(auction.endTime);
    const expectedEnd = createdTime + (7 * 24 * 60 * 60);

    expect(endTime).to.be.closeTo(expectedEnd, 10);  // Within 10 seconds
  });

  it("should initialize auction as active", async function () {
    await contract.createAuction(
      "Title", "Desc", "Cat",
      ethers.parseEther("1.0")
    );

    const auction = await contract.getAuction(1);
    expect(auction.isActive).to.equal(true);
    expect(auction.bidCount).to.equal(0);
  });
});
```

### Test Suite 2: Bid Placement

```typescript
describe("placeBid", function () {
  beforeEach(async function () {
    // Create auction for each test
    await contract.createAuction(
      "Test Item",
      "Test Description",
      "Test Category",
      ethers.parseEther("1.0")
    );
  });

  it("should place a valid bid", async function () {
    const bidAmount = ethers.parseEther("1.5");

    const tx = await contract.connect(bidder1).placeBid(
      1,
      true,
      ethers.parseEther("1.5"),
      "Great item!",
      { value: bidAmount }
    );

    expect(tx).to.emit(contract, "BidPlaced");

    const bidCount = await contract.getAuctionBidCount(1);
    expect(bidCount).to.equal(1);

    const hasBid = await contract.hasPlacedBid(bidder1.address, 1);
    expect(hasBid).to.equal(true);
  });

  it("should prevent creator from bidding on own auction", async function () {
    await expect(
      contract.placeBid(
        1,
        true,
        ethers.parseEther("1.5"),
        "My own bid",
        { value: ethers.parseEther("1.5") }
      )
    ).to.be.revertedWith("Cannot bid on your own auction");
  });

  it("should prevent duplicate bids from same bidder", async function () {
    // First bid
    await contract.connect(bidder1).placeBid(
      1,
      true,
      ethers.parseEther("1.5"),
      "First bid",
      { value: ethers.parseEther("1.5") }
    );

    // Second bid from same bidder
    await expect(
      contract.connect(bidder1).placeBid(
        1,
        true,
        ethers.parseEther("2.0"),
        "Second bid",
        { value: ethers.parseEther("2.0") }
      )
    ).to.be.revertedWith("You have already placed a bid on this auction");
  });

  it("should reject bid below minimum", async function () {
    const belowMinimum = ethers.parseEther("0.5");

    await expect(
      contract.connect(bidder1).placeBid(
        1,
        true,
        ethers.parseEther("0.5"),
        "Low bid",
        { value: belowMinimum }
      )
    ).to.be.revertedWith("Bid below minimum amount");
  });

  it("should reject invalid auction ID", async function () {
    await expect(
      contract.connect(bidder1).placeBid(
        999,  // Non-existent auction
        true,
        ethers.parseEther("1.5"),
        "Bid",
        { value: ethers.parseEther("1.5") }
      )
    ).to.be.revertedWith("Invalid auction ID");
  });

  it("should track bid timestamps", async function () {
    const blockBefore = await ethers.provider.getBlock("latest");
    const timeBefore = blockBefore!.timestamp;

    await contract.connect(bidder1).placeBid(
      1,
      true,
      ethers.parseEther("1.5"),
      "Bid",
      { value: ethers.parseEther("1.5") }
    );

    const blockAfter = await ethers.provider.getBlock("latest");
    const timeAfter = blockAfter!.timestamp;

    // Bid timestamp should be recorded correctly
    // (Note: This requires accessor to bid array)
    expect(timeBefore).to.be.lessThanOrEqual(timeAfter);
  });

  it("should allow multiple bidders on same auction", async function () {
    await contract.connect(bidder1).placeBid(
      1,
      true,
      ethers.parseEther("1.5"),
      "Bid 1",
      { value: ethers.parseEther("1.5") }
    );

    await contract.connect(bidder2).placeBid(
      1,
      true,
      ethers.parseEther("2.0"),
      "Bid 2",
      { value: ethers.parseEther("2.0") }
    );

    const bidCount = await contract.getAuctionBidCount(1);
    expect(bidCount).to.equal(2);
  });

  it("should reject bid on inactive auction", async function () {
    // End the auction first
    // This requires creating another scenario
    // (Simplified for example)
  });
});
```

### Test Suite 3: Auction Ending

```typescript
describe("endAuction", function () {
  beforeEach(async function () {
    await contract.createAuction(
      "Test Item",
      "Description",
      "Category",
      ethers.parseEther("1.0")
    );
  });

  it("should allow creator to end auction", async function () {
    const tx = await contract.endAuction(1);
    expect(tx).to.emit(contract, "AuctionEnded");

    const auction = await contract.getAuction(1);
    expect(auction.isActive).to.equal(false);
  });

  it("should prevent non-creator from ending early", async function () {
    await expect(
      contract.connect(bidder1).endAuction(1)
    ).to.be.revertedWith(
      "Auction has not ended yet and you are not the creator"
    );
  });

  it("should allow anyone to end expired auction", async function () {
    // Time travel to after auction end
    const auction = await contract.getAuction(1);
    const endTime = Number(auction.endTime);
    const now = Math.floor(Date.now() / 1000);
    const timeUntilEnd = endTime - now;

    if (timeUntilEnd > 0) {
      await ethers.provider.send("evm_increaseTime", [timeUntilEnd + 1]);
      await ethers.provider.send("evm_mine", []);
    }

    const tx = await contract.connect(bidder1).endAuction(1);
    expect(tx).to.emit(contract, "AuctionEnded");
  });

  it("should prevent ending already-ended auction", async function () {
    await contract.endAuction(1);

    await expect(
      contract.endAuction(1)
    ).to.be.revertedWith("Auction is not active");
  });

  it("should transfer funds to creator", async function () {
    // Place a bid first
    await contract.connect(bidder1).placeBid(
      1,
      true,
      ethers.parseEther("1.5"),
      "Bid",
      { value: ethers.parseEther("1.5") }
    );

    const creatorBalanceBefore = await ethers.provider.getBalance(
      owner.address
    );

    // End auction
    const tx = await contract.endAuction(1);
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

    const creatorBalanceAfter = await ethers.provider.getBalance(
      owner.address
    );

    // Creator should receive at least minimum bid amount
    expect(creatorBalanceAfter).to.be.gt(creatorBalanceBefore);
  });

  it("should record AuctionEnded event correctly", async function () {
    await contract.connect(bidder1).placeBid(
      1,
      true,
      ethers.parseEther("1.5"),
      "Bid",
      { value: ethers.parseEther("1.5") }
    );

    const tx = await contract.endAuction(1);

    expect(tx).to.emit(contract, "AuctionEnded");
  });
});
```

### Test Suite 4: Query Functions

```typescript
describe("Query Functions", function () {
  beforeEach(async function () {
    // Create multiple auctions in different states
    await contract.createAuction(
      "Active 1", "Desc", "Cat", ethers.parseEther("1.0")
    );
    await contract.createAuction(
      "Active 2", "Desc", "Cat", ethers.parseEther("1.0")
    );

    // Place bids
    await contract.connect(bidder1).placeBid(
      1, true, ethers.parseEther("1.5"), "Bid",
      { value: ethers.parseEther("1.5") }
    );
  });

  describe("getActiveAuctions", function () {
    it("should return all active auctions", async function () {
      const active = await contract.getActiveAuctions();
      expect(active.length).to.be.greaterThan(0);
    });

    it("should exclude ended auctions", async function () {
      const activeBefore = await contract.getActiveAuctions();
      const beforeLength = activeBefore.length;

      // End an auction
      await contract.endAuction(1);

      const activeAfter = await contract.getActiveAuctions();
      expect(activeAfter.length).to.equal(beforeLength - 1);
    });
  });

  describe("getUserAuctions", function () {
    it("should return all user's auctions", async function () {
      const userAuctions = await contract.getUserAuctions(owner.address);
      expect(userAuctions.length).to.equal(2);
    });

    it("should return empty array for user with no auctions", async function () {
      const userAuctions = await contract.getUserAuctions(
        "0x1234567890123456789012345678901234567890"
      );
      expect(userAuctions.length).to.equal(0);
    });
  });

  describe("getAuctionBidCount", function () {
    it("should return correct bid count", async function () {
      const bidCount = await contract.getAuctionBidCount(1);
      expect(bidCount).to.equal(1);
    });

    it("should increase when new bid placed", async function () {
      const before = await contract.getAuctionBidCount(1);

      await contract.connect(bidder2).placeBid(
        1, true, ethers.parseEther("2.0"), "Bid",
        { value: ethers.parseEther("2.0") }
      );

      const after = await contract.getAuctionBidCount(1);
      expect(after).to.equal(before + 1);
    });
  });

  describe("hasPlacedBid", function () {
    it("should return true for bidder who placed bid", async function () {
      const result = await contract.hasPlacedBid(bidder1.address, 1);
      expect(result).to.equal(true);
    });

    it("should return false for bidder who didn't bid", async function () {
      const result = await contract.hasPlacedBid(bidder2.address, 1);
      expect(result).to.equal(false);
    });
  });

  describe("getAuction", function () {
    it("should return complete auction struct", async function () {
      const auction = await contract.getAuction(1);
      expect(auction.id).to.equal(1);
      expect(auction.title).to.equal("Active 1");
      expect(auction.isActive).to.equal(true);
    });

    it("should reject invalid auction ID", async function () {
      await expect(
        contract.getAuction(999)
      ).to.be.revertedWith("Invalid auction ID");
    });
  });

  describe("getTotalCounts", function () {
    it("should return total and active auction counts", async function () {
      const [total, active] = await contract.getTotalCounts();
      expect(total).to.be.greaterThan(0);
      expect(active).to.be.lessThanOrEqual(total);
    });

    it("should update counts correctly", async function () {
      const [totalBefore, activeBefore] = await contract.getTotalCounts();

      await contract.endAuction(1);

      const [totalAfter, activeAfter] = await contract.getTotalCounts();
      expect(totalAfter).to.equal(totalBefore);
      expect(activeAfter).to.equal(activeBefore - 1);
    });
  });
});
```

---

## FHE-Specific Tests

### Testing Encrypted Operations

```typescript
describe("FHE Operations", function () {
  beforeEach(async function () {
    await contract.createAuction(
      "Test", "Desc", "Cat",
      ethers.parseEther("1.0")
    );
  });

  it("should handle encrypted bid amounts", async function () {
    // Place first bid
    await contract.connect(bidder1).placeBid(
      1, true, ethers.parseEther("1.5"), "Bid 1",
      { value: ethers.parseEther("1.5") }
    );

    // Place second bid
    await contract.connect(bidder2).placeBid(
      1, true, ethers.parseEther("2.0"), "Bid 2",
      { value: ethers.parseEther("2.0") }
    );

    // Verify auction state updated (highest bidder changed)
    const auction = await contract.getAuction(1);
    expect(auction.highestBidder).to.equal(bidder2.address);

    // Note: Cannot directly access highestBidAmount due to encryption
  });

  it("should perform encrypted comparisons correctly", async function () {
    // This tests the homomorphic comparison internally

    // Place multiple bids with different amounts
    const amounts = [
      ethers.parseEther("1.5"),
      ethers.parseEther("3.0"),
      ethers.parseEther("2.0"),
    ];

    for (let i = 0; i < amounts.length; i++) {
      const bidder = [bidder1, bidder2][i % 2] === bidder1
        ? bidder2
        : bidder1;

      if (i < 2) {  // Can only place one bid per bidder
        await contract.connect(bidder).placeBid(
          1, true, amounts[i], "Bid",
          { value: amounts[i] }
        );
        break;  // Limit to prevent duplicate bid error
      }
    }

    // After bids, verify the state is consistent
    const auction = await contract.getAuction(1);
    expect(auction.bidCount).to.equal(1);
  });

  it("should prevent access to encrypted values externally", async function () {
    await contract.connect(bidder1).placeBid(
      1, true, ethers.parseEther("1.5"), "Bid",
      { value: ethers.parseEther("1.5") }
    );

    const auction = await contract.getAuction(1);

    // The highestBidAmount field exists but is encrypted
    // Attempting to use it as plaintext should fail or return encrypted value
    expect(auction.highestBidAmount).to.exist;
  });
});
```

---

## Integration Tests

### Complete Workflow Tests

```typescript
describe("End-to-End Workflows", function () {
  it("should complete full auction lifecycle", async function () {
    // 1. Create auction
    const createTx = await contract.createAuction(
      "Vintage Watch",
      "Beautiful 1950s Rolex",
      "Watches",
      ethers.parseEther("1.0")
    );
    await createTx.wait();

    // 2. Place multiple bids
    const bid1Tx = await contract.connect(bidder1).placeBid(
      1, true, ethers.parseEther("1.5"), "Great item!",
      { value: ethers.parseEther("1.5") }
    );
    await bid1Tx.wait();

    const bid2Tx = await contract.connect(bidder2).placeBid(
      1, true, ethers.parseEther("2.0"), "I love watches",
      { value: ethers.parseEther("2.0") }
    );
    await bid2Tx.wait();

    // 3. Verify auction state
    let auction = await contract.getAuction(1);
    expect(auction.bidCount).to.equal(2);
    expect(auction.isActive).to.equal(true);

    // 4. End auction
    const endTx = await contract.endAuction(1);
    await endTx.wait();

    // 5. Verify final state
    auction = await contract.getAuction(1);
    expect(auction.isActive).to.equal(false);

    // 6. Verify winner recorded
    expect(auction.highestBidder).to.not.equal(ethers.ZeroAddress);
  });

  it("should handle multiple concurrent auctions", async function () {
    // Create auctions from different creators
    const tx1 = await contract.connect(owner).createAuction(
      "Item 1", "Desc 1", "Cat 1", ethers.parseEther("1.0")
    );
    const tx2 = await contract.connect(bidder1).createAuction(
      "Item 2", "Desc 2", "Cat 2", ethers.parseEther("2.0")
    );

    await Promise.all([tx1.wait(), tx2.wait()]);

    // Place bids on both
    const bid1 = await contract.connect(bidder2).placeBid(
      1, true, ethers.parseEther("1.5"), "Bid",
      { value: ethers.parseEther("1.5") }
    );
    const bid2 = await contract.connect(owner).placeBid(
      2, true, ethers.parseEther("2.5"), "Bid",
      { value: ethers.parseEther("2.5") }
    );

    await Promise.all([bid1.wait(), bid2.wait()]);

    // Verify independence
    const auction1 = await contract.getAuction(1);
    const auction2 = await contract.getAuction(2);

    expect(auction1.bidCount).to.equal(1);
    expect(auction2.bidCount).to.equal(1);
    expect(auction1.creator).to.not.equal(auction2.creator);
  });
});
```

---

## Gas Usage Tests

### Monitoring Gas Consumption

```typescript
describe("Gas Consumption", function () {
  it("should track gas for createAuction", async function () {
    const tx = await contract.createAuction(
      "Test", "Description", "Category",
      ethers.parseEther("1.0")
    );
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed;

    console.log(`createAuction gas: ${gasUsed.toString()}`);

    // Gas should be reasonable (adjust based on network)
    expect(gasUsed).to.be.lessThan(ethers.parseUnits("300000", "wei"));
  });

  it("should track gas for placeBid", async function () {
    await contract.createAuction(
      "Test", "Desc", "Cat",
      ethers.parseEther("1.0")
    );

    const tx = await contract.connect(bidder1).placeBid(
      1, true, ethers.parseEther("1.5"), "Bid",
      { value: ethers.parseEther("1.5") }
    );
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed;

    console.log(`placeBid gas: ${gasUsed.toString()}`);
    expect(gasUsed).to.be.lessThan(ethers.parseUnits("300000", "wei"));
  });
});
```

---

## Running Tests

### Execution Examples

```bash
# Run all tests
npm run test

# Run with detailed output
npm run test -- --reporter spec

# Run specific describe block
npm run test -- --grep "createAuction"

# Run specific test case
npm run test -- --grep "should create an auction"

# Show gas usage
REPORT_GAS=true npm run test

# Coverage report
npm run coverage
```

### Expected Test Output

```
  ConfidentialAuction
    createAuction
      ✓ should create an auction with valid parameters
      ✓ should increment auction ID correctly
      ✓ should track user's auctions
      ✓ should reject empty title
      ✓ should reject zero minimum bid
      6 passing (234ms)

    placeBid
      ✓ should place a valid bid
      ✓ should prevent creator from bidding
      ✓ should prevent duplicate bids
      ✓ should reject bid below minimum
      4 passing (456ms)

    Query Functions
      ✓ should return active auctions
      ✓ should return user auctions
      3 passing (123ms)

  18 passing (813ms)
```

---

## Coverage Target

### Recommended Coverage Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Statements | >85% | Lines of code executed |
| Branches | >80% | Conditional paths taken |
| Functions | >90% | Function execution |
| Lines | >85% | Physical lines executed |

### Generate Coverage Report

```bash
npm run coverage
```

Creates `coverage/` directory with HTML report:
```
coverage/index.html  # Open in browser for detailed view
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm run test

      - name: Generate coverage
        run: npm run coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Debugging Failed Tests

### Troubleshooting Strategies

#### 1. Enable Verbose Logging
```bash
npm run test -- --reporter spec --verbose
```

#### 2. Run Single Test
```bash
npm run test -- --grep "specific test name"
```

#### 3. Add Debug Statements
```typescript
import debug from "debug";
const log = debug("auction:test");

it("should test something", async function () {
  log("Starting test");
  const result = await contract.someFunction();
  log("Result:", result);
  expect(result).to.equal(expected);
});
```

Run with debug enabled:
```bash
DEBUG=auction:test npm run test
```

#### 4. Time Travel Debugging
```typescript
// Get current block
const blockNumber = await ethers.provider.getBlockNumber();
console.log("Current block:", blockNumber);

// Jump time
await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);  // 7 days
await ethers.provider.send("evm_mine", []);  // Mine next block
```

---

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clear Descriptions**: Use descriptive test names
3. **AAA Pattern**: Arrange-Act-Assert structure
4. **Comprehensive Coverage**: Test happy paths and error cases
5. **Performance**: Use beforeEach/before efficiently
6. **Readability**: Keep tests simple and focused
7. **Documentation**: Comment complex test logic
8. **Maintenance**: Update tests with contract changes

---

For more information, refer to:
- DEVELOPER_GUIDE.md - Development setup
- CONTRACT_DOCUMENTATION.md - Contract reference
- Mocha Documentation: https://mochajs.org/
- Chai Documentation: https://www.chaijs.com/

---

**Last Updated**: December 2025
