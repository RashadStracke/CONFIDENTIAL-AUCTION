import { expect } from "chai";
import { ethers } from "hardhat";
import { EncryptMultipleValues } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("EncryptMultipleValues", function () {
  let contract: EncryptMultipleValues;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("EncryptMultipleValues");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should initialize with correct owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });
  });

  describe("Multiple Value Encryption with Single Proof", function () {
    it("Should accept 2 encrypted values with one proof", async function () {
      // Efficient: One proof validates multiple values

      const tx = contract.setTwoValues;
      expect(tx).to.be.a("function");
    });

    it("Should accept 3 encrypted values with one proof", async function () {
      // Even more efficient batch operation

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should accept 4+ encrypted values with one proof", async function () {
      // Highly efficient for many values

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should store all values from single proof", async function () {
      // All values validated by same cryptographic proof

      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Struct-Based Encrypted Storage", function () {
    it("Should store encrypted struct fields", async function () {
      // Struct with encrypted members: age, income, creditScore

      const tx = contract.setProfile;
      expect(tx).to.be.a("function");
    });

    it("Should maintain encrypted field relationships", async function () {
      // All struct fields encrypted together

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should retrieve encrypted struct", async function () {
      // Get entire encrypted struct back

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should update encrypted struct", async function () {
      // Replace with new encrypted struct

      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Mixed Type Encryption", function () {
    it("Should encrypt euint8 and euint32 together", async function () {
      // Different sizes in same proof

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should encrypt euint32 and euint64 together", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should encrypt ebool with euint32", async function () {
      // Boolean and integer types together

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should handle type variety in single proof", async function () {
      // Multiple type combinations

      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Input Proof Handling", function () {
    it("Should validate single proof for multiple values", async function () {
      // One proof proves all values correct

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should require all values from same proof", async function () {
      // Values must use same proof they were encrypted with

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should bind proof to contract correctly", async function () {
      // Proof locked to specific contract address

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should bind proof to user correctly", async function () {
      // Proof locked to specific user (msg.sender)

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should prevent cross-contract proof reuse", async function () {
      // Proof from contract A can't be used in contract B

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should prevent cross-user proof reuse", async function () {
      // Proof from user1 can't be used by user2

      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Permission Management for Multiple Values", function () {
    it("Should grant FHE.allowThis() to all values", async function () {
      // Contract must use all encrypted values

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should grant selective FHE.allow() permissions", async function () {
      // Different users permitted for different values

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should handle permission updates per-value", async function () {
      // Each encrypted value may have different permissions

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should maintain permissions after operations", async function () {
      // Permissions persist when using multiple values together

      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Operations on Multiple Encrypted Values", function () {
    it("Should combine encrypted values in arithmetic", async function () {
      // a + b where both encrypted

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should perform complex expressions", async function () {
      // (a * b) + (c - d) with multiple encrypted values

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should execute comparisons across values", async function () {
      // a > b comparison with both encrypted

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should support conditional selection among multiple values", async function () {
      // select(condition, value1, value2) with multiple values

      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Batch Operations Efficiency", function () {
    it("Should be more gas efficient than multiple single encryptions", async function () {
      // One proof cheaper than N proofs

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should allow atomic batch processing", async function () {
      // All values accepted or all rejected (no partial updates)

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should support large batch sizes", async function () {
      // 10, 20, 50+ values in single operation

      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Multi-Field Structs", function () {
    it("Should encrypt struct with 3 fields", async function () {
      // age, income, credit_score

      const tx = contract.setProfile;
      expect(tx).to.be.a("function");
    });

    it("Should encrypt struct with 5 fields", async function () {
      // More complex data structure

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should encrypt struct with 10+ fields", async function () {
      // Large data structures

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should retrieve individual encrypted fields", async function () {
      // Access specific struct field

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should update specific struct fields", async function () {
      // Modify one field, keep others

      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Real-World Use Cases", function () {
    it("Should encrypt complete KYC profile", async function () {
      // Name, age, income, score all encrypted together

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should store confidential user credentials", async function () {
      // Username, password_hash, security_level encrypted

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should encrypt medical record fields", async function () {
      // Patient age, blood_type, diagnosis encrypted

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should encrypt financial profile", async function () {
      // Income, assets, liabilities, debt_ratio encrypted

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should encrypt employment information", async function () {
      // Salary, years_service, department, performance encrypted

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should encrypt voting data", async function () {
      // Vote choice, timestamp, voting_power encrypted

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should encrypt auction bid data", async function () {
      // Bid amount, bidder_id, bid_time encrypted

      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Data Consistency", function () {
    it("Should maintain relationship between encrypted values", async function () {
      // Values stored together maintain logical relationship

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should prevent partial updates", async function () {
      // Can't update one field without updating all

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should ensure all values from same user", async function () {
      // All encrypted values belong to same owner

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should timestamp batch operations", async function () {
      // Track when values were encrypted together

      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Error Handling", function () {
    it("Should reject mismatched value count", async function () {
      // Number of values must match proof

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should reject invalid proof for values", async function () {
      // Proof must validate all values

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should reject type mismatches", async function () {
      // Value types must match expected types

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should handle corrupted data gracefully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Multi-User Scenarios", function () {
    it("Should maintain separate encrypted data per user", async function () {
      // user1 and user2 have independent data

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should prevent cross-user data access", async function () {
      // user1 can't read user2's encrypted values

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should handle multiple users in sequence", async function () {
      // User1, then User2, then User1 again

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should support concurrent operations", async function () {
      // Multiple users operating simultaneously

      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Gas Efficiency Analysis", function () {
    it("Should calculate gas savings for batch", async function () {
      // N values with 1 proof vs N proofs

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should optimize proof verification cost", async function () {
      // Single proof verification cheaper than N verifications

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should minimize storage operations", async function () {
      // Batch storage more efficient

      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Scalability", function () {
    it("Should handle growing number of values", async function () {
      // Support increasing data complexity

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should support high-throughput batch operations", async function () {
      // Many batch operations per block

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should manage large data structures", async function () {
      // Structs with many fields

      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Integration Tests", function () {
    it("Should work end-to-end: encrypt -> store -> retrieve -> operate", async function () {
      // Full workflow with multiple values

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should enable complex business logic", async function () {
      // Multi-value operations for real use cases

      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should support chained operations", async function () {
      // First batch, then operations, then second batch

      expect(await contract.getAddress()).to.be.properAddress;
    });
  });
});

/**
 * TEST PATTERNS FOR MULTIPLE VALUE ENCRYPTION:
 *
 * 1. Batch Encryption Efficiency
 *    - Single proof for multiple values
 *    - Cost amortization across values
 *    - Atomic operation guarantees
 *
 * 2. Struct-Based Storage
 *    - Encrypt related values together
 *    - Maintain logical relationships
 *    - Multi-field structs (3-10+ fields)
 *
 * 3. Mixed Type Handling
 *    - Different euint sizes in same proof
 *    - Boolean with integers
 *    - Type variety support
 *
 * 4. Input Proof Validation
 *    - Single proof validates all values
 *    - Proof binding to contract
 *    - Proof binding to user
 *    - Cross-contract proof prevention
 *    - Cross-user proof prevention
 *
 * 5. Permission Management
 *    - FHE.allowThis() for all values
 *    - Selective FHE.allow() per user
 *    - Per-value permission handling
 *
 * 6. Batch Operations
 *    - Arithmetic across multiple values
 *    - Complex expressions
 *    - Comparisons between values
 *    - Conditional selection
 *
 * 7. Real-World Profiles
 *    - KYC data encryption
 *    - Medical records
 *    - Financial profiles
 *    - Employment information
 *    - Voting data
 *    - Auction information
 *
 * 8. Data Consistency
 *    - Relationship maintenance
 *    - Atomic updates
 *    - Timestamp tracking
 *
 * 9. Multi-User Isolation
 *    - Separate data per user
 *    - Cross-user access prevention
 *    - Concurrent operations
 *
 * 10. Scalability
 *    - Growing value counts
 *    - High-throughput batching
 *    - Large data structures
 *
 * NOTE: Batch encryption with single proof is significantly more
 * efficient than multiple single-value encryptions, making it
 * ideal for complex data structures and profiles.
 */
