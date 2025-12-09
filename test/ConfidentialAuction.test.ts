import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * @chapter advanced-patterns
 * Comprehensive test suite for Confidential Auction
 * Demonstrates blind auction with FHE-encrypted bids
 */
describe("ConfidentialAuction", function () {
  let contract: any;
  let owner: any;
  let bidder1: any;
  let bidder2: any;
  let bidder3: any;

  beforeEach(async function () {
    // @chapter: setup
    // Deploy contract fresh for each test
    const Factory = await ethers.getContractFactory("ConfidentialAuction");
    contract = await Factory.deploy();
    await contract.waitForDeployment();

    [owner, bidder1, bidder2, bidder3] = await ethers.getSigners();
  });

  describe("Auction Creation - Basic Functionality", function () {
    /**
     * @chapter: basic-operations
     * Test creating a new auction with valid parameters
     */
    it("should create auction with valid parameters", async function () {
      const tx = await contract.createAuction(
        "Vintage Watch",
        "Beautiful 1950s Rolex in pristine condition",
        "Watches",
        ethers.parseEther("1.0")
      );

      await expect(tx).to.emit(contract, "AuctionCreated");

      const auction = await contract.getAuction(1);
      expect(auction.title).to.equal("Vintage Watch");
      expect(auction.creator).to.equal(owner.address);
      expect(auction.category).to.equal("Watches");
      expect(auction.minimumBid).to.equal(ethers.parseEther("1.0"));
      expect(auction.isActive).to.be.true;
      expect(auction.bidCount).to.equal(0);
    });

    /**
     * @chapter: basic-operations
     * Test auction ID auto-increment
     */
    it("should auto-increment auction IDs", async function () {
      await contract.createAuction("Item 1", "Desc 1", "Cat 1", ethers.parseEther("1.0"));
      await contract.createAuction("Item 2", "Desc 2", "Cat 2", ethers.parseEther("2.0"));
      await contract.createAuction("Item 3", "Desc 3", "Cat 3", ethers.parseEther("3.0"));

      const [total, _] = await contract.getTotalCounts();
      expect(total).to.equal(3);

      const auction2 = await contract.getAuction(2);
      expect(auction2.title).to.equal("Item 2");

      const auction3 = await contract.getAuction(3);
      expect(auction3.title).to.equal("Item 3");
    });

    /**
     * @chapter: access-control
     * Test user auction tracking
     */
    it("should track auctions created by user", async function () {
      await contract.connect(bidder1).createAuction(
        "User Item",
        "Created by bidder1",
        "Test",
        ethers.parseEther("1.0")
      );

      const userAuctions = await contract.getUserAuctions(bidder1.address);
      expect(userAuctions.length).to.equal(1);
      expect(userAuctions[0]).to.equal(1);
    });

    /**
     * @chapter: input-proof
     * Test validation - reject empty title
     */
    it("should reject auction with empty title", async function () {
      await expect(
        contract.createAuction(
          "",
          "Description",
          "Category",
          ethers.parseEther("1.0")
        )
      ).to.be.revertedWith("Title cannot be empty");
    });

    /**
     * @chapter: input-proof
     * Test validation - reject empty description
     */
    it("should reject auction with empty description", async function () {
      await expect(
        contract.createAuction(
          "Title",
          "",
          "Category",
          ethers.parseEther("1.0")
        )
      ).to.be.revertedWith("Description cannot be empty");
    });

    /**
     * @chapter: input-proof
     * Test validation - reject empty category
     */
    it("should reject auction with empty category", async function () {
      await expect(
        contract.createAuction(
          "Title",
          "Description",
          "",
          ethers.parseEther("1.0")
        )
      ).to.be.revertedWith("Category cannot be empty");
    });

    /**
     * @chapter: input-proof
     * Test validation - reject zero minimum bid
     */
    it("should reject auction with zero minimum bid", async function () {
      await expect(
        contract.createAuction(
          "Title",
          "Description",
          "Category",
          0
        )
      ).to.be.revertedWith("Minimum bid must be greater than 0");
    });

    /**
     * @chapter: basic-operations
     * Test auction end time is set to 7 days
     */
    it("should set auction duration to 7 days", async function () {
      const blockBefore = await ethers.provider.getBlock("latest");
      const timeBefore = blockBefore!.timestamp;

      await contract.createAuction(
        "Title",
        "Description",
        "Category",
        ethers.parseEther("1.0")
      );

      const auction = await contract.getAuction(1);
      const expectedEndTime = timeBefore + (7 * 24 * 60 * 60);

      expect(Number(auction.endTime)).to.be.closeTo(expectedEndTime, 10);
    });
  });

  describe("Encrypted Bidding - FHE Operations", function () {
    /**
     * @chapter: encryption
     * Test placing encrypted bid on valid auction
     */
    it("should place encrypted bid on auction", async function () {
      // Create auction first
      await contract.createAuction(
        "Test Item",
        "Description",
        "Category",
        ethers.parseEther("1.0")
      );

      // Place bid
      const bidAmount = ethers.parseEther("1.5");
      const tx = await contract.connect(bidder1).placeBid(
        1,
        true,
        bidAmount,
        "Great item!",
        { value: bidAmount }
      );

      await expect(tx).to.emit(contract, "BidPlaced");

      // Verify bid was recorded
      const bidCount = await contract.getAuctionBidCount(1);
      expect(bidCount).to.equal(1);

      const hasBid = await contract.hasPlacedBid(bidder1.address, 1);
      expect(hasBid).to.be.true;
    });

    /**
     * @chapter: advanced-patterns
     * Test homomorphic comparison updates highest bidder
     */
    it("should track highest bidder through encrypted comparison", async function () {
      // Create auction
      await contract.createAuction(
        "Item",
        "Description",
        "Category",
        ethers.parseEther("1.0")
      );

      // First bid
      await contract.connect(bidder1).placeBid(
        1,
        true,
        ethers.parseEther("1.5"),
        "Bid 1",
        { value: ethers.parseEther("1.5") }
      );

      let auction = await contract.getAuction(1);
      expect(auction.highestBidder).to.equal(bidder1.address);

      // Second bid (higher)
      await contract.connect(bidder2).placeBid(
        1,
        true,
        ethers.parseEther("2.0"),
        "Bid 2",
        { value: ethers.parseEther("2.0") }
      );

      auction = await contract.getAuction(1);
      expect(auction.highestBidder).to.equal(bidder2.address);
    });

    /**
     * @chapter: access-control
     * Test preventing creator from bidding on own auction
     */
    it("should prevent creator from bidding on own auction", async function () {
      // Creator creates auction
      await contract.createAuction(
        "Item",
        "Description",
        "Category",
        ethers.parseEther("1.0")
      );

      // Creator tries to bid on own auction
      await expect(
        contract.placeBid(
          1,
          true,
          ethers.parseEther("1.5"),
          "My bid",
          { value: ethers.parseEther("1.5") }
        )
      ).to.be.revertedWith("Cannot bid on your own auction");
    });

    /**
     * @chapter: anti-patterns
     * Test preventing duplicate bids from same bidder
     */
    it("should prevent duplicate bids from same bidder", async function () {
      // Create auction
      await contract.createAuction(
        "Item",
        "Description",
        "Category",
        ethers.parseEther("1.0")
      );

      // First bid succeeds
      await contract.connect(bidder1).placeBid(
        1,
        true,
        ethers.parseEther("1.5"),
        "First bid",
        { value: ethers.parseEther("1.5") }
      );

      // Second bid from same bidder fails
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

    /**
     * @chapter: input-proof
     * Test rejecting bid below minimum
     */
    it("should reject bid below minimum amount", async function () {
      // Create auction with 1 ETH minimum
      await contract.createAuction(
        "Item",
        "Description",
        "Category",
        ethers.parseEther("1.0")
      );

      // Try to bid 0.5 ETH (below minimum)
      await expect(
        contract.connect(bidder1).placeBid(
          1,
          true,
          ethers.parseEther("0.5"),
          "Low bid",
          { value: ethers.parseEther("0.5") }
        )
      ).to.be.revertedWith("Bid below minimum amount");
    });

    /**
     * @chapter: input-proof
     * Test rejecting bid on invalid auction
     */
    it("should reject bid on non-existent auction", async function () {
      await expect(
        contract.connect(bidder1).placeBid(
          999,
          true,
          ethers.parseEther("1.0"),
          "Bid",
          { value: ethers.parseEther("1.0") }
        )
      ).to.be.revertedWith("Invalid auction ID");
    });

    /**
     * @chapter: basic-operations
     * Test multiple bidders on same auction
     */
    it("should allow multiple bidders on same auction", async function () {
      // Create auction
      await contract.createAuction(
        "Item",
        "Description",
        "Category",
        ethers.parseEther("1.0")
      );

      // Multiple bids
      await contract.connect(bidder1).placeBid(
        1, true, ethers.parseEther("1.5"), "Bid 1",
        { value: ethers.parseEther("1.5") }
      );
      await contract.connect(bidder2).placeBid(
        1, true, ethers.parseEther("2.0"), "Bid 2",
        { value: ethers.parseEther("2.0") }
      );
      await contract.connect(bidder3).placeBid(
        1, true, ethers.parseEther("2.5"), "Bid 3",
        { value: ethers.parseEther("2.5") }
      );

      const bidCount = await contract.getAuctionBidCount(1);
      expect(bidCount).to.equal(3);

      const auction = await contract.getAuction(1);
      expect(auction.highestBidder).to.equal(bidder3.address);
    });
  });

  describe("Auction Settlement", function () {
    /**
     * @chapter: access-control
     * Test creator can end auction early
     */
    it("should allow creator to end auction", async function () {
      // Create auction
      await contract.createAuction(
        "Item",
        "Description",
        "Category",
        ethers.parseEther("1.0")
      );

      // Creator ends auction
      const tx = await contract.endAuction(1);
      await expect(tx).to.emit(contract, "AuctionEnded");

      // Verify auction is inactive
      const auction = await contract.getAuction(1);
      expect(auction.isActive).to.be.false;
    });

    /**
     * @chapter: access-control
     * Test non-creator cannot end active auction
     */
    it("should prevent non-creator from ending active auction early", async function () {
      // Create auction
      await contract.createAuction(
        "Item",
        "Description",
        "Category",
        ethers.parseEther("1.0")
      );

      // Non-creator tries to end auction
      await expect(
        contract.connect(bidder1).endAuction(1)
      ).to.be.revertedWith("Auction has not ended yet and you are not the creator");
    });

    /**
     * @chapter: basic-operations
     * Test anyone can end expired auction
     */
    it("should allow anyone to end expired auction", async function () {
      // Create auction
      await contract.createAuction(
        "Item",
        "Description",
        "Category",
        ethers.parseEther("1.0")
      );

      // Get auction end time
      const auction = await contract.getAuction(1);
      const endTime = Number(auction.endTime);

      // Fast-forward time past auction end
      const now = Math.floor(Date.now() / 1000);
      const timeJump = endTime - now + 1;

      if (timeJump > 0) {
        await ethers.provider.send("evm_increaseTime", [timeJump]);
        await ethers.provider.send("evm_mine", []);
      }

      // Non-creator can now end auction
      const tx = await contract.connect(bidder1).endAuction(1);
      await expect(tx).to.emit(contract, "AuctionEnded");
    });

    /**
     * @chapter: anti-patterns
     * Test cannot end already-ended auction
     */
    it("should prevent ending already-ended auction", async function () {
      // Create auction
      await contract.createAuction(
        "Item",
        "Description",
        "Category",
        ethers.parseEther("1.0")
      );

      // End auction
      await contract.endAuction(1);

      // Try to end again
      await expect(
        contract.endAuction(1)
      ).to.be.revertedWith("Auction is not active");
    });

    /**
     * @chapter: basic-operations
     * Test settlement transfers funds
     */
    it("should transfer funds to creator on settlement", async function () {
      // Create auction
      await contract.createAuction(
        "Item",
        "Description",
        "Category",
        ethers.parseEther("1.0")
      );

      // Place bid
      await contract.connect(bidder1).placeBid(
        1,
        true,
        ethers.parseEther("1.5"),
        "Bid",
        { value: ethers.parseEther("1.5") }
      );

      // Get creator balance before
      const balanceBefore = await ethers.provider.getBalance(owner.address);

      // End auction
      const endTx = await contract.endAuction(1);
      const endReceipt = await endTx.wait();
      const gasUsed = endReceipt!.gasUsed * endReceipt!.gasPrice;

      // Get creator balance after
      const balanceAfter = await ethers.provider.getBalance(owner.address);

      // Creator should have received at least minimum bid
      expect(balanceAfter).to.be.greaterThan(balanceBefore - gasUsed);
    });
  });

  describe("Query Functions", function () {
    /**
     * @chapter: basic-operations
     * Test retrieving active auctions
     */
    it("should return active auctions", async function () {
      // Create auctions
      await contract.createAuction("Item 1", "Desc", "Cat", ethers.parseEther("1.0"));
      await contract.createAuction("Item 2", "Desc", "Cat", ethers.parseEther("1.0"));

      // Get active auctions
      const active = await contract.getActiveAuctions();
      expect(active.length).to.equal(2);
      expect(active[0].title).to.equal("Item 1");
      expect(active[1].title).to.equal("Item 2");
    });

    /**
     * @chapter: basic-operations
     * Test ended auctions excluded from active list
     */
    it("should exclude ended auctions from active list", async function () {
      // Create auctions
      await contract.createAuction("Item 1", "Desc", "Cat", ethers.parseEther("1.0"));
      await contract.createAuction("Item 2", "Desc", "Cat", ethers.parseEther("1.0"));

      // Get active count
      const activeBefore = await contract.getActiveAuctions();
      const countBefore = activeBefore.length;

      // End first auction
      await contract.endAuction(1);

      // Get active count after
      const activeAfter = await contract.getActiveAuctions();
      const countAfter = activeAfter.length;

      expect(countAfter).to.equal(countBefore - 1);
      expect(activeAfter[0].title).to.equal("Item 2");
    });

    /**
     * @chapter: access-control
     * Test getting user's auctions
     */
    it("should return user's created auctions", async function () {
      // User creates auctions
      await contract.connect(bidder1).createAuction(
        "User Item 1", "Desc", "Cat",
        ethers.parseEther("1.0")
      );
      await contract.connect(bidder1).createAuction(
        "User Item 2", "Desc", "Cat",
        ethers.parseEther("2.0")
      );

      // Get user's auctions
      const userAuctions = await contract.getUserAuctions(bidder1.address);
      expect(userAuctions.length).to.equal(2);
    });

    /**
     * @chapter: basic-operations
     * Test getting bid count
     */
    it("should return correct bid count", async function () {
      // Create auction
      await contract.createAuction(
        "Item", "Desc", "Cat",
        ethers.parseEther("1.0")
      );

      // Place bids
      await contract.connect(bidder1).placeBid(
        1, true, ethers.parseEther("1.5"), "Bid",
        { value: ethers.parseEther("1.5") }
      );
      await contract.connect(bidder2).placeBid(
        1, true, ethers.parseEther("2.0"), "Bid",
        { value: ethers.parseEther("2.0") }
      );

      // Check bid count
      const bidCount = await contract.getAuctionBidCount(1);
      expect(bidCount).to.equal(2);
    });

    /**
     * @chapter: basic-operations
     * Test checking if user has bid
     */
    it("should correctly identify bidders", async function () {
      // Create auction
      await contract.createAuction(
        "Item", "Desc", "Cat",
        ethers.parseEther("1.0")
      );

      // Place bid
      await contract.connect(bidder1).placeBid(
        1, true, ethers.parseEther("1.5"), "Bid",
        { value: ethers.parseEther("1.5") }
      );

      // Check bidders
      expect(await contract.hasPlacedBid(bidder1.address, 1)).to.be.true;
      expect(await contract.hasPlacedBid(bidder2.address, 1)).to.be.false;
    });

    /**
     * @chapter: basic-operations
     * Test getting total statistics
     */
    it("should return accurate total counts", async function () {
      // Create auctions
      await contract.createAuction("Item 1", "Desc", "Cat", ethers.parseEther("1.0"));
      await contract.createAuction("Item 2", "Desc", "Cat", ethers.parseEther("1.0"));
      await contract.createAuction("Item 3", "Desc", "Cat", ethers.parseEther("1.0"));

      // Get counts
      const [total, active] = await contract.getTotalCounts();

      expect(total).to.equal(3);
      expect(active).to.equal(3);

      // End one auction
      await contract.endAuction(1);

      // Get counts again
      const [totalAfter, activeAfter] = await contract.getTotalCounts();
      expect(totalAfter).to.equal(3);
      expect(activeAfter).to.equal(2);
    });
  });

  describe("End-to-End Workflow", function () {
    /**
     * @chapter: advanced-patterns
     * Complete auction lifecycle from creation to settlement
     */
    it("should complete full auction lifecycle", async function () {
      // 1. Creator creates auction
      await contract.createAuction(
        "Vintage Watch",
        "Beautiful 1950s Rolex",
        "Watches",
        ethers.parseEther("1.0")
      );

      // 2. Bidders place encrypted bids
      await contract.connect(bidder1).placeBid(
        1, true, ethers.parseEther("1.5"), "Great item!",
        { value: ethers.parseEther("1.5") }
      );

      await contract.connect(bidder2).placeBid(
        1, true, ethers.parseEther("2.0"), "I want this",
        { value: ethers.parseEther("2.0") }
      );

      await contract.connect(bidder3).placeBid(
        1, true, ethers.parseEther("2.5"), "Best offer",
        { value: ethers.parseEther("2.5") }
      );

      // 3. Verify auction state
      let auction = await contract.getAuction(1);
      expect(auction.bidCount).to.equal(3);
      expect(auction.isActive).to.be.true;
      expect(auction.highestBidder).to.equal(bidder3.address);

      // 4. Creator ends auction
      await contract.endAuction(1);

      // 5. Verify final state
      auction = await contract.getAuction(1);
      expect(auction.isActive).to.be.false;
      expect(auction.highestBidder).to.equal(bidder3.address);
    });

    /**
     * @chapter: advanced-patterns
     * Multiple concurrent auctions independence
     */
    it("should handle multiple concurrent auctions independently", async function () {
      // Create auctions from different creators
      await contract.connect(owner).createAuction(
        "Item A", "Desc A", "Cat A",
        ethers.parseEther("1.0")
      );

      await contract.connect(bidder1).createAuction(
        "Item B", "Desc B", "Cat B",
        ethers.parseEther("2.0")
      );

      // Place bids on both
      await contract.connect(bidder2).placeBid(
        1, true, ethers.parseEther("1.5"), "Bid A",
        { value: ethers.parseEther("1.5") }
      );

      await contract.connect(owner).placeBid(
        2, true, ethers.parseEther("2.5"), "Bid B",
        { value: ethers.parseEther("2.5") }
      );

      // Verify independence
      const auction1 = await contract.getAuction(1);
      const auction2 = await contract.getAuction(2);

      expect(auction1.bidCount).to.equal(1);
      expect(auction2.bidCount).to.equal(1);
      expect(auction1.creator).to.equal(owner.address);
      expect(auction2.creator).to.equal(bidder1.address);
    });
  });
});
