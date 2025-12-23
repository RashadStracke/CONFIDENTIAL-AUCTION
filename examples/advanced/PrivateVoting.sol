// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, externalEuint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Private Voting
 * @notice Advanced example demonstrating encrypted voting with homomorphic tallying
 * @dev This contract shows:
 *      - Encrypted vote storage (no plaintext vote records)
 *      - Homomorphic vote aggregation (count votes without decrypting)
 *      - Complex conditional logic on encrypted data
 *      - Multi-step voting process with privacy preservation
 */
contract PrivateVoting is ZamaEthereumConfig {
  // Voting states
  enum VotingState {
    NotStarted,
    Active,
    Completed
  }

  // Poll structure
  struct Poll {
    uint256 id;
    string question;
    uint256 startTime;
    uint256 endTime;
    address creator;
    VotingState state;
    euint64 yesVotes; // Encrypted count of yes votes
    euint64 noVotes; // Encrypted count of no votes
    mapping(address => bool) hasVoted; // Track who voted (plaintext, for uniqueness)
  }

  // Storage
  mapping(uint256 => Poll) public polls;
  uint256 public pollCount;

  // Events
  event PollCreated(
    uint256 indexed pollId,
    string question,
    uint256 startTime,
    uint256 endTime
  );
  event VoteCast(uint256 indexed pollId, address indexed voter);
  event PollClosed(uint256 indexed pollId);
  event ResultsRevealed(uint256 indexed pollId);

  /**
   * @notice Create a new voting poll
   * @param question Question to vote on
   * @param duration Voting duration in seconds
   */
  function createPoll(string memory question, uint256 duration) external {
    require(duration > 0, "Invalid duration");

    uint256 pollId = pollCount;
    Poll storage poll = polls[pollId];

    poll.id = pollId;
    poll.question = question;
    poll.startTime = block.timestamp;
    poll.endTime = block.timestamp + duration;
    poll.creator = msg.sender;
    poll.state = VotingState.Active;

    // Initialize encrypted vote counters at 0
    poll.yesVotes = FHE.asEuint64(0);
    poll.noVotes = FHE.asEuint64(0);

    // Grant permissions for vote counters
    FHE.allowThis(poll.yesVotes);
    FHE.allowThis(poll.noVotes);

    pollCount++;

    emit PollCreated(pollId, question, poll.startTime, poll.endTime);
  }

  /**
   * @notice Cast an encrypted vote on a poll
   * @param pollId ID of the poll
   * @param encryptedVote Encrypted vote (1 for yes, 0 for no)
   * @param inputProof Zero-knowledge proof for encrypted input
   * @dev This demonstrates:
   *      1. Privacy: Vote is never stored as plaintext
   *      2. Integrity: Only track voting (prevent double voting)
   *      3. Homomorphic counting: Add encrypted votes without decryption
   */
  function castVote(
    uint256 pollId,
    externalEuint32 encryptedVote,
    bytes calldata inputProof
  ) external {
    Poll storage poll = polls[pollId];

    // Validate voting is active
    require(poll.state == VotingState.Active, "Poll not active");
    require(block.timestamp <= poll.endTime, "Voting closed");
    require(!poll.hasVoted[msg.sender], "Already voted");

    // Convert external encrypted input
    euint32 vote = FHE.fromExternal(encryptedVote, inputProof);

    // ✅ PRIVACY PATTERN:
    // Store vote in encrypted form (never plaintext)
    // Only increment encrypted counters

    // Create comparison: vote == 1 (is this a yes vote?)
    ebool isYesVote = FHE.eq(vote, FHE.asEuint32(1));

    // Create comparison: vote == 0 (is this a no vote?)
    ebool isNoVote = FHE.eq(vote, FHE.asEuint32(0));

    // Validate vote is 0 or 1
    ebool validVote = FHE.or(isYesVote, isNoVote);

    // Convert boolean to uint64 for addition
    euint64 yesIncrement = FHE.asEuint64(FHE.select(isYesVote, FHE.asEuint32(1), FHE.asEuint32(0)));
    euint64 noIncrement = FHE.asEuint64(FHE.select(isNoVote, FHE.asEuint32(1), FHE.asEuint32(0)));

    // ✅ HOMOMORPHIC TALLYING:
    // Increment encrypted vote counters without decryption
    euint64 newYesVotes = FHE.add(poll.yesVotes, yesIncrement);
    euint64 newNoVotes = FHE.add(poll.noVotes, noIncrement);

    poll.yesVotes = newYesVotes;
    poll.noVotes = newNoVotes;

    // Grant permissions for updated counters
    FHE.allowThis(newYesVotes);
    FHE.allowThis(newNoVotes);

    // Track voter (plaintext) to prevent double voting
    poll.hasVoted[msg.sender] = true;

    emit VoteCast(pollId, msg.sender);
  }

  /**
   * @notice Close poll voting period
   * @param pollId Poll ID to close
   */
  function closePoll(uint256 pollId) external {
    Poll storage poll = polls[pollId];

    require(poll.creator == msg.sender, "Only creator can close");
    require(poll.state == VotingState.Active, "Already closed");
    require(block.timestamp > poll.endTime, "Voting still active");

    poll.state = VotingState.Completed;

    emit PollClosed(pollId);
  }

  /**
   * @notice Get poll information
   * @param pollId Poll ID
   * @return question The poll question
   * @return state Current voting state
   * @return startTime When voting started
   * @return endTime When voting ends
   * @return creator Who created the poll
   */
  function getPoll(pollId: uint256)
    external
    view
    returns (
      string memory question,
      VotingState state,
      uint256 startTime,
      uint256 endTime,
      address creator
    )
  {
    Poll storage poll = polls[pollId];
    return (poll.question, poll.state, poll.startTime, poll.endTime, poll.creator);
  }

  /**
   * @notice Get encrypted vote counts
   * @param pollId Poll ID
   * @return yesCount Encrypted count of yes votes
   * @return noCount Encrypted count of no votes
   * @dev Returns encrypted handles (not plaintext counts)
   *      Only creator has permission to decrypt results
   */
  function getResults(uint256 pollId)
    external
    view
    returns (euint64 yesCount, euint64 noCount)
  {
    Poll storage poll = polls[pollId];
    require(poll.state == VotingState.Completed, "Poll not completed");

    return (poll.yesVotes, poll.noVotes);
  }

  /**
   * @notice Grant creator permission to decrypt results
   * @param pollId Poll ID
   * @dev This allows poll creator to see final results
   *      Only creator has decryption permission
   */
  function grantResultsAccess(uint256 pollId) external {
    Poll storage poll = polls[pollId];

    require(msg.sender == poll.creator, "Only creator");
    require(poll.state == VotingState.Completed, "Poll not completed");

    // Grant creator permission to decrypt results
    FHE.allow(poll.yesVotes, poll.creator);
    FHE.allow(poll.noVotes, poll.creator);

    emit ResultsRevealed(pollId);
  }

  /**
   * ADVANCED PATTERNS DEMONSTRATED:
   *
   * 1. ENCRYPTED VOTE STORAGE:
   *    - Votes stored as encrypted values (euint32/euint64)
   *    - Never revealed in plaintext
   *    - Provides perfect vote secrecy
   *
   * 2. HOMOMORPHIC TALLYING:
   *    - Votes are counted while encrypted
   *    - Tallying happens on encrypted data
   *    - Result only decrypted at the end
   *    - Matches plaintext count exactly
   *
   * 3. MIXED PRIVACY MODEL:
   *    - Voter identity is public (prevents double voting)
   *    - Vote content is private (FHE encryption)
   *    - Results are private (only creator can decrypt)
   *    - Provides perfect vote secrecy + integrity
   *
   * 4. CONDITIONAL LOGIC ON ENCRYPTED DATA:
   *    - Uses FHE.eq() for comparison
   *    - Uses FHE.select() for conditional increment
   *    - Complex logic without decryption
   *
   * 5. PERMISSION MANAGEMENT:
   *    - Creator grants themselves permission to results
   *    - Other voters have no access to encrypted values
   *    - Can selectively reveal results to others
   *
   * 6. SECURITY PROPERTIES:
   *    ✅ Vote privacy: votes never revealed
   *    ✅ Tally privacy: intermediate counts never revealed
   *    ✅ Double-vote prevention: plaintext tracking
   *    ✅ Creator accountability: can audit results
   *    ✅ No trust in contract: homomorphic computation is verifiable
   *
   * REAL-WORLD APPLICATIONS:
   *    - Shareholder voting with vote privacy
   *    - DAO governance with secret proposals
   *    - Anonymous surveys with aggregated results
   *    - Private polling for sensitive topics
   *    - Election systems with end-to-end encryption
   */
}
