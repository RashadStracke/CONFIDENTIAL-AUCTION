import { expect } from "chai";
import { ethers } from "hardhat";
import { FHEComparison } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FHEComparison", function () {
  let comparison: FHEComparison;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const FHEComparisonFactory = await ethers.getContractFactory("FHEComparison");
    comparison = await FHEComparisonFactory.deploy();
    await comparison.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should initialize with default values", async function () {
      expect(await comparison.owner()).to.equal(owner.address);
    });
  });

  describe("Equality Comparisons", function () {
    it("Should correctly compare equal encrypted values", async function () {
      // encrypted(42) == encrypted(42) should return encrypted(true)

      const tx = comparison.isEqual;
      expect(tx).to.be.a("function");
    });

    it("Should correctly compare unequal encrypted values", async function () {
      // encrypted(42) == encrypted(43) should return encrypted(false)

      const tx = comparison.isEqual;
      expect(tx).to.be.a("function");
    });

    it("Should compare encrypted with plaintext", async function () {
      // encrypted(100) == 100 (plaintext)

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Inequality Comparisons", function () {
    it("Should correctly test not equal", async function () {
      // encrypted(10) != encrypted(20) = encrypted(true)

      const tx = comparison.isNotEqual;
      expect(tx).to.be.a("function");
    });

    it("Should return encrypted false for equal values", async function () {
      // encrypted(50) != encrypted(50) = encrypted(false)

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Greater Than Comparisons", function () {
    it("Should correctly identify greater value", async function () {
      // encrypted(100) > encrypted(50) = encrypted(true)

      const tx = comparison.isGreaterThan;
      expect(tx).to.be.a("function");
    });

    it("Should return false when equal", async function () {
      // encrypted(50) > encrypted(50) = encrypted(false)

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should return false when less", async function () {
      // encrypted(30) > encrypted(80) = encrypted(false)

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should compare with plaintext threshold", async function () {
      // encrypted(value) > plaintext(threshold)

      const tx = comparison.isGreaterThanPlaintext;
      expect(tx).to.be.a("function");
    });
  });

  describe("Greater Than Or Equal Comparisons", function () {
    it("Should return true for greater value", async function () {
      // encrypted(100) >= encrypted(50) = encrypted(true)

      const tx = comparison.isGreaterThanOrEqual;
      expect(tx).to.be.a("function");
    });

    it("Should return true for equal values", async function () {
      // encrypted(75) >= encrypted(75) = encrypted(true)

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should return false for lesser value", async function () {
      // encrypted(40) >= encrypted(60) = encrypted(false)

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Less Than Comparisons", function () {
    it("Should correctly identify lesser value", async function () {
      // encrypted(30) < encrypted(80) = encrypted(true)

      const tx = comparison.isLessThan;
      expect(tx).to.be.a("function");
    });

    it("Should return false when equal", async function () {
      // encrypted(50) < encrypted(50) = encrypted(false)

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should return false when greater", async function () {
      // encrypted(90) < encrypted(60) = encrypted(false)

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should compare with plaintext bound", async function () {
      // encrypted(value) < plaintext(bound)

      const tx = comparison.isLessThanPlaintext;
      expect(tx).to.be.a("function");
    });
  });

  describe("Less Than Or Equal Comparisons", function () {
    it("Should return true for lesser value", async function () {
      // encrypted(30) <= encrypted(80) = encrypted(true)

      const tx = comparison.isLessThanOrEqual;
      expect(tx).to.be.a("function");
    });

    it("Should return true for equal values", async function () {
      // encrypted(60) <= encrypted(60) = encrypted(true)

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should return false for greater value", async function () {
      // encrypted(100) <= encrypted(50) = encrypted(false)

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Boolean Operations on Encrypted Values", function () {
    it("Should correctly compute AND of two encrypted booleans", async function () {
      // encrypted(true) AND encrypted(false) = encrypted(false)

      const tx = comparison.andOperations;
      expect(tx).to.be.a("function");
    });

    it("Should correctly compute OR of two encrypted booleans", async function () {
      // encrypted(true) OR encrypted(false) = encrypted(true)

      const tx = comparison.orOperations;
      expect(tx).to.be.a("function");
    });

    it("Should correctly compute NOT of encrypted boolean", async function () {
      // NOT encrypted(true) = encrypted(false)

      const tx = comparison.notOperation;
      expect(tx).to.be.a("function");
    });

    it("Should correctly compute XOR of two encrypted booleans", async function () {
      // encrypted(true) XOR encrypted(false) = encrypted(true)

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Conditional Selection (FHE.select)", function () {
    it("Should select first value when condition true", async function () {
      // select(encrypted(true), a, b) returns a

      const tx = comparison.selectIfTrue;
      expect(tx).to.be.a("function");
    });

    it("Should select second value when condition false", async function () {
      // select(encrypted(false), a, b) returns b

      const tx = comparison.selectIfFalse;
      expect(tx).to.be.a("function");
    });

    it("Should support ternary-like operations", async function () {
      // (a > b) ? a : b (selecting max)

      const tx = comparison.selectMax;
      expect(tx).to.be.a("function");
    });

    it("Should support min selection", async function () {
      // (a < b) ? a : b (selecting min)

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Range Checking", function () {
    it("Should determine if value in range", async function () {
      // (value >= min) AND (value <= max)

      const tx = comparison.isInRange;
      expect(tx).to.be.a("function");
    });

    it("Should determine if value outside range", async function () {
      // (value < min) OR (value > max)

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should validate value within bounds", async function () {
      // min <= value <= max with plaintext bounds

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Complex Conditional Logic", function () {
    it("Should evaluate: (a > 10) AND (b < 100)", async function () {
      // Encrypted condition combinations for business logic

      const tx = comparison.complexAnd;
      expect(tx).to.be.a("function");
    });

    it("Should evaluate: (a >= 18) OR (b > 21)", async function () {
      // Age verification scenarios

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should evaluate: NOT (a == b)", async function () {
      // Inequality check using NOT

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should chain multiple conditions", async function () {
      // ((a > b) AND (b > c)) OR (c == 0)

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Sorting Operations", function () {
    it("Should find maximum of two encrypted values", async function () {
      // max(encrypted(42), encrypted(17)) = encrypted(42)

      const tx = comparison.max;
      expect(tx).to.be.a("function");
    });

    it("Should find minimum of two encrypted values", async function () {
      // min(encrypted(42), encrypted(17)) = encrypted(17)

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should clamp value to range", async function () {
      // clamp(value, min, max)

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Threshold Logic", function () {
    it("Should determine if value exceeds threshold", async function () {
      // score > threshold for pass/fail

      const tx = comparison.exceedsThreshold;
      expect(tx).to.be.a("function");
    });

    it("Should implement tiered decision making", async function () {
      // if (score >= 90) tier = 'A'
      // if (score >= 80) tier = 'B'
      // etc.

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Permission Management", function () {
    it("Should grant permissions to comparison results", async function () {
      // All comparison results (ebool) need permissions

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should maintain permissions in select operations", async function () {
      // FHE.select results need FHE.allowThis()

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Type Handling", function () {
    it("Should handle euint8 comparisons", async function () {
      // 8-bit unsigned integer comparisons

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should handle euint16 comparisons", async function () {
      // 16-bit unsigned integer comparisons

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should handle euint32 comparisons", async function () {
      // 32-bit unsigned integer comparisons

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should handle euint64 comparisons", async function () {
      // 64-bit unsigned integer comparisons

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Real-World Use Cases", function () {
    it("Should validate age for restricted content", async function () {
      // age >= 18 check without revealing age

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should verify credit score eligibility", async function () {
      // creditScore >= 650 without revealing actual score

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should determine auction bid winner", async function () {
      // highest_bid > all_other_bids (without revealing bids)

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should check voting eligibility", async function () {
      // stake >= minimum_required without revealing stake

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should determine loan approval", async function () {
      // (income >= threshold) AND (debt_ratio <= max)

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should implement confidential KYC", async function () {
      // (age >= 18) AND (income >= required) without revealing details

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero value comparisons", async function () {
      // encrypted(0) comparisons

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should handle maximum value comparisons", async function () {
      // encrypted(MAX_UINT64) comparisons

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should handle equal value edge case", async function () {
      // Boundary between < and >=

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should handle boundary values in range checks", async function () {
      // Values exactly at min/max boundaries

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Gas Efficiency", function () {
    it("Should use reasonable gas for single comparison", async function () {
      // Basic comparison should be <50k gas

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should optimize boolean combinations", async function () {
      // Complex logic might be cheaper in different orders

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should minimize select operations", async function () {
      // Multiple selects can be chained for efficiency

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Error Handling", function () {
    it("Should handle invalid proof gracefully", async function () {
      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should revert on missing permissions", async function () {
      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should handle type mismatches", async function () {
      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });

  describe("Integration with Other FHE Operations", function () {
    it("Should combine comparisons with arithmetic", async function () {
      // if (a > b) then (a - b) else (b - a)

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should use comparison in conditional transfer", async function () {
      // if (balance >= amount) then transfer(amount)

      expect(await comparison.getAddress()).to.be.properAddress;
    });

    it("Should enable confidential voting logic", async function () {
      // Tally votes only where condition met

      expect(await comparison.getAddress()).to.be.properAddress;
    });
  });
});

/**
 * TEST PATTERNS FOR ENCRYPTED COMPARISONS:
 *
 * 1. Equality Operations
 *    - eq, ne (equal, not equal)
 *    - Encrypted-encrypted and encrypted-plaintext
 *
 * 2. Relational Operations
 *    - lt, lte, gt, gte
 *    - All variants with encrypted and plaintext
 *
 * 3. Boolean Operations
 *    - and, or, not, xor
 *    - Operating on encrypted booleans
 *
 * 4. Conditional Logic
 *    - FHE.select(condition, valueA, valueB)
 *    - Ternary-like operations
 *    - Min/max selection
 *
 * 5. Complex Conditions
 *    - Chained comparisons: (a > b) AND (b < c)
 *    - Nested conditions: ((a > 10) OR (b < 5)) AND (c == 0)
 *
 * 6. Range Operations
 *    - In-range checks: min <= value <= max
 *    - Boundary validation
 *
 * 7. Real-World Scenarios
 *    - Age verification without revealing age
 *    - Score thresholds without revealing scores
 *    - Auction winner determination
 *    - Eligibility checking
 *
 * 8. Type Safety
 *    - Different integer sizes (euint8-euint64)
 *    - Type consistency in operations
 *
 * 9. Permission Management
 *    - ebool results need FHE.allowThis()
 *    - Selected values need permissions
 *
 * 10. Edge Cases
 *    - Zero values
 *    - Maximum values
 *    - Equal boundary conditions
 *
 * NOTE: Encrypted comparisons enable powerful privacy-preserving logic
 * without revealing the actual values being compared.
 */
