// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Public Decryption Example
 * @notice Demonstrates public decryption where results are revealed on-chain
 * @dev This contract shows:
 *      - When to use public decryption
 *      - How to request public decryption
 *      - Handling decryption callbacks
 *      - Security considerations for public decryption
 */
contract PublicDecryption is ZamaEthereumConfig {
  // Auction with encrypted bids
  struct Auction {
    uint256 id;
    string name;
    uint256 endTime;
    euint64 highestBid;
    address highestBidder;
    bool ended;
    uint64 revealedHighestBid; // Publicly revealed after auction ends
  }

  // Encrypted sealed bid
  struct Bid {
    address bidder;
    euint64 amount;
    uint256 timestamp;
  }

  mapping(uint256 => Auction) public auctions;
  mapping(uint256 => Bid[]) private auctionBids;
  mapping(uint256 => mapping(address => bool)) public hasBid;

  uint256 public auctionCount;

  // Decryption request tracking
  mapping(bytes32 => uint256) private decryptionRequests;

  event AuctionCreated(uint256 indexed auctionId, string name, uint256 endTime);
  event BidPlaced(uint256 indexed auctionId, address indexed bidder);
  event AuctionEnded(uint256 indexed auctionId);
  event DecryptionRequested(uint256 indexed auctionId, bytes32 requestId);
  event HighestBidRevealed(uint256 indexed auctionId, uint64 amount, address bidder);

  /**
   * @notice Create a new auction
   * @param name Auction name
   * @param duration Auction duration in seconds
   */
  function createAuction(string memory name, uint256 duration) external {
    require(duration > 0, "Invalid duration");

    uint256 auctionId = auctionCount++;

    auctions[auctionId] = Auction({
      id: auctionId,
      name: name,
      endTime: block.timestamp + duration,
      highestBid: FHE.asEuint64(0),
      highestBidder: address(0),
      ended: false,
      revealedHighestBid: 0
    });

    FHE.allowThis(auctions[auctionId].highestBid);

    emit AuctionCreated(auctionId, name, block.timestamp + duration);
  }

  /**
   * @notice Place encrypted bid on auction
   * @param auctionId Auction ID
   * @param encryptedBid Encrypted bid amount
   * @param inputProof Zero-knowledge proof
   */
  function placeBid(
    uint256 auctionId,
    externalEuint32 encryptedBid,
    bytes calldata inputProof
  ) external {
    Auction storage auction = auctions[auctionId];
    require(block.timestamp < auction.endTime, "Auction ended");
    require(!hasBid[auctionId][msg.sender], "Already bid");

    // Convert bid to euint64
    euint32 bid32 = FHE.fromExternal(encryptedBid, inputProof);
    euint64 bidAmount = FHE.asEuint64(bid32);

    // Store bid
    auctionBids[auctionId].push(
      Bid({ bidder: msg.sender, amount: bidAmount, timestamp: block.timestamp })
    );

    hasBid[auctionId][msg.sender] = true;

    // Update highest bid (homomorphically)
    // Compare: bidAmount > highestBid
    euint64 currentHighest = auction.highestBid;

    // Use FHE.select to update if bid is higher
    // This happens without revealing any bid amounts
    auction.highestBid = FHE.select(
      FHE.gt(bidAmount, currentHighest),
      bidAmount,
      currentHighest
    );

    // Update bidder if this is highest
    // Note: In real implementation, you'd track bidder encrypted as well
    // or use more sophisticated patterns

    FHE.allowThis(auction.highestBid);
    FHE.allowThis(bidAmount);
    FHE.allow(bidAmount, msg.sender);

    emit BidPlaced(auctionId, msg.sender);
  }

  /**
   * @notice End auction and request public decryption of winner
   * @param auctionId Auction ID
   * @dev This demonstrates PUBLIC DECRYPTION:
   *      1. Auction ends
   *      2. Highest bid needs to be revealed on-chain
   *      3. Request public decryption of encrypted value
   *      4. Decryption oracle processes request
   *      5. Callback receives plaintext value
   *      6. Value stored publicly on-chain
   */
  function endAuction(uint256 auctionId) external returns (bytes32) {
    Auction storage auction = auctions[auctionId];
    require(block.timestamp >= auction.endTime, "Auction not ended");
    require(!auction.ended, "Already ended");

    auction.ended = true;

    // ✅ REQUEST PUBLIC DECRYPTION
    // Create unique request ID
    bytes32 requestId = keccak256(
      abi.encodePacked(
        auctionId,
        auction.highestBid,
        block.timestamp,
        "public_decrypt"
      )
    );

    // Store request mapping
    decryptionRequests[requestId] = auctionId;

    // In real FHEVM environment with decryption oracle:
    // The oracle would:
    // 1. Listen for this event
    // 2. Decrypt the value using network keys
    // 3. Call revealHighestBid() with plaintext result
    // 4. Result becomes public on-chain

    emit DecryptionRequested(auctionId, requestId);
    emit AuctionEnded(auctionId);

    return requestId;
  }

  /**
   * @notice Callback to receive decrypted highest bid
   * @param requestId Decryption request ID
   * @param decryptedAmount Plaintext highest bid amount
   * @dev This would be called by the decryption oracle
   *      In production, protect with oracle authentication:
   *      require(msg.sender == DECRYPTION_ORACLE, "Unauthorized");
   */
  function revealHighestBid(bytes32 requestId, uint64 decryptedAmount) external {
    uint256 auctionId = decryptionRequests[requestId];
    Auction storage auction = auctions[auctionId];

    require(auction.ended, "Auction not ended");
    require(auction.revealedHighestBid == 0, "Already revealed");

    // ✅ STORE PUBLICLY REVEALED VALUE
    // This is now plaintext on-chain, visible to everyone
    auction.revealedHighestBid = decryptedAmount;

    // Clear request
    delete decryptionRequests[requestId];

    emit HighestBidRevealed(auctionId, decryptedAmount, auction.highestBidder);
  }

  /**
   * @notice Get auction details including revealed bid (if ended)
   * @param auctionId Auction ID
   * @return name Auction name
   * @return endTime Auction end time
   * @return ended Whether auction has ended
   * @return revealedBid Revealed highest bid (0 if not revealed)
   * @return bidder Highest bidder address
   */
  function getAuctionDetails(uint256 auctionId)
    external
    view
    returns (
      string memory name,
      uint256 endTime,
      bool ended,
      uint64 revealedBid,
      address bidder
    )
  {
    Auction storage auction = auctions[auctionId];
    return (
      auction.name,
      auction.endTime,
      auction.ended,
      auction.revealedHighestBid,
      auction.highestBidder
    );
  }

  /**
   * @notice Get total number of bids for an auction
   * @param auctionId Auction ID
   * @return Number of bids
   */
  function getBidCount(uint256 auctionId) external view returns (uint256) {
    return auctionBids[auctionId].length;
  }

  /**
   * KEY CONCEPTS FOR PUBLIC DECRYPTION:
   *
   * 1. WHEN TO USE PUBLIC DECRYPTION:
   *    - Final results need to be public (auction winner)
   *    - Settlement requires plaintext values
   *    - Public verification needed
   *    - Regulatory requirements for disclosure
   *
   * 2. DECRYPTION FLOW:
   *    a) Contract requests decryption
   *    b) Emits event with encrypted value handle
   *    c) Decryption oracle listens for event
   *    d) Oracle decrypts using network keys
   *    e) Oracle calls callback with plaintext
   *    f) Plaintext stored on-chain
   *
   * 3. SECURITY CONSIDERATIONS:
   *    ✅ Only decrypt when necessary
   *    ✅ Protect callback with oracle authentication
   *    ✅ Validate decryption requests
   *    ✅ Ensure proper timing (after bids closed)
   *    ✅ Track request-response mapping
   *
   * 4. VS USER DECRYPTION:
   *    PUBLIC DECRYPTION:
   *    - Result visible to everyone
   *    - Stored on-chain as plaintext
   *    - Used for final settlements
   *    - Requires decryption oracle
   *
   *    USER DECRYPTION:
   *    - Result only for specific user
   *    - Not stored on-chain
   *    - Used for private information
   *    - User requests via off-chain service
   *
   * 5. ORACLE AUTHENTICATION:
   *    In production:
   *    address constant DECRYPTION_ORACLE = 0x...;
   *    require(msg.sender == DECRYPTION_ORACLE, "Unauthorized");
   *
   * 6. REQUEST-RESPONSE PATTERN:
   *    - Create unique request ID
   *    - Map request to context (auction ID, etc.)
   *    - Emit event with all necessary info
   *    - Oracle responds via callback
   *    - Validate and store result
   *
   * 7. TIMING CONSIDERATIONS:
   *    - Decryption is async (takes time)
   *    - Don't block on decryption
   *    - Use events to track status
   *    - Handle pending state gracefully
   *
   * 8. GAS COSTS:
   *    - Decryption request: ~50k gas
   *    - Callback processing: ~30k gas
   *    - Total: ~80k gas for decryption
   *
   * 9. USE CASES:
   *    - Auction winner reveals
   *    - Voting results publication
   *    - Lottery number reveal
   *    - Settlement calculations
   *    - Public verification needs
   *
   * 10. ANTI-PATTERNS:
   *     ❌ Decrypting all bids (privacy violation)
   *     ❌ Decrypting before process complete
   *     ❌ Not authenticating oracle callback
   *     ❌ Blocking execution waiting for decrypt
   *     ❌ Exposing intermediate values
   *
   * 11. PRIVACY PRESERVATION:
   *     - Only decrypt final result
   *     - Keep all bids encrypted
   *     - Don't reveal losing bids
   *     - Minimize public information
   *     - Users can still decrypt their own bids privately
   *
   * 12. BEST PRACTICES:
   *     ✅ Request decryption only after process ends
   *     ✅ Authenticate decryption oracle
   *     ✅ Track requests with unique IDs
   *     ✅ Handle async nature properly
   *     ✅ Emit events for tracking
   *     ✅ Validate all inputs and outputs
   *     ✅ Minimize what gets decrypted publicly
   *     ✅ Document why public decryption is needed
   */
}
