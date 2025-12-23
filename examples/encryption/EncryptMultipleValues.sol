// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, externalEuint32, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Encrypt Multiple Values Example
 * @notice Demonstrates handling multiple encrypted values in a single transaction
 * @dev This contract shows:
 *      - Batch encryption of multiple values
 *      - Storing multiple encrypted values
 *      - Managing permissions for multiple values
 *      - Efficient patterns for multi-value operations
 */
contract EncryptMultipleValues is ZamaEthereumConfig {
  // User profile with multiple encrypted fields
  struct EncryptedProfile {
    euint32 age;
    euint64 income;
    euint32 creditScore;
    bool initialized;
  }

  mapping(address => EncryptedProfile) private profiles;

  event ProfileCreated(address indexed user);
  event ProfileUpdated(address indexed user);

  /**
   * @notice Create encrypted profile with multiple values
   * @param encryptedAge Encrypted age
   * @param encryptedIncome Encrypted income
   * @param encryptedCreditScore Encrypted credit score
   * @param inputProof Single zero-knowledge proof for all inputs
   * @dev Demonstrates batch encryption pattern:
   *      Client side:
   *      const enc = fhevm.createEncryptedInput(contractAddr, userAddr);
   *      enc.add32(25);      // age
   *      enc.add64(50000);   // income
   *      enc.add32(750);     // credit score
   *      const { handles, inputProof } = enc.encrypt();
   *      contract.createProfile(handles[0], handles[1], handles[2], inputProof);
   */
  function createProfile(
    externalEuint32 encryptedAge,
    externalEuint64 encryptedIncome,
    externalEuint32 encryptedCreditScore,
    bytes calldata inputProof
  ) external {
    require(!profiles[msg.sender].initialized, "Profile already exists");

    // ✅ BATCH ENCRYPTION PATTERN
    // Convert all external encrypted inputs
    euint32 age = FHE.fromExternal(encryptedAge, inputProof);
    euint64 income = FHE.fromExternal(encryptedIncome, inputProof);
    euint32 creditScore = FHE.fromExternal(encryptedCreditScore, inputProof);

    // Store all encrypted values
    profiles[msg.sender] = EncryptedProfile({
      age: age,
      income: income,
      creditScore: creditScore,
      initialized: true
    });

    // ✅ GRANT PERMISSIONS FOR ALL VALUES
    // Contract permissions
    FHE.allowThis(age);
    FHE.allowThis(income);
    FHE.allowThis(creditScore);

    // User permissions
    FHE.allow(age, msg.sender);
    FHE.allow(income, msg.sender);
    FHE.allow(creditScore, msg.sender);

    emit ProfileCreated(msg.sender);
  }

  /**
   * @notice Update specific field in profile
   * @param fieldName Name of field to update ("age", "income", "creditScore")
   * @param encryptedValue New encrypted value
   * @param inputProof Zero-knowledge proof
   */
  function updateField(
    string memory fieldName,
    externalEuint64 encryptedValue,
    bytes calldata inputProof
  ) external {
    require(profiles[msg.sender].initialized, "Profile not initialized");

    if (
      keccak256(bytes(fieldName)) == keccak256(bytes("age"))
    ) {
      euint32 newAge = FHE.fromExternal(
        externalEuint32.wrap(externalEuint64.unwrap(encryptedValue)),
        inputProof
      );
      profiles[msg.sender].age = newAge;
      FHE.allowThis(newAge);
      FHE.allow(newAge, msg.sender);
    } else if (
      keccak256(bytes(fieldName)) == keccak256(bytes("income"))
    ) {
      euint64 newIncome = FHE.fromExternal(encryptedValue, inputProof);
      profiles[msg.sender].income = newIncome;
      FHE.allowThis(newIncome);
      FHE.allow(newIncome, msg.sender);
    } else if (
      keccak256(bytes(fieldName)) == keccak256(bytes("creditScore"))
    ) {
      euint32 newScore = FHE.fromExternal(
        externalEuint32.wrap(externalEuint64.unwrap(encryptedValue)),
        inputProof
      );
      profiles[msg.sender].creditScore = newScore;
      FHE.allowThis(newScore);
      FHE.allow(newScore, msg.sender);
    } else {
      revert("Invalid field name");
    }

    emit ProfileUpdated(msg.sender);
  }

  /**
   * @notice Get all encrypted profile values
   * @return age Encrypted age
   * @return income Encrypted income
   * @return creditScore Encrypted credit score
   * @dev Returns all encrypted handles at once
   */
  function getProfile()
    external
    view
    returns (euint32 age, euint64 income, euint32 creditScore)
  {
    require(profiles[msg.sender].initialized, "Profile not initialized");

    EncryptedProfile storage profile = profiles[msg.sender];
    return (profile.age, profile.income, profile.creditScore);
  }

  /**
   * @notice Calculate eligibility score from multiple encrypted factors
   * @dev Demonstrates operations on multiple encrypted values:
   *      score = (creditScore * 40%) + (income/1000 * 30%) + (age * 30%)
   */
  function calculateEligibilityScore() external view returns (euint32) {
    require(profiles[msg.sender].initialized, "Profile not initialized");

    EncryptedProfile storage profile = profiles[msg.sender];

    // Convert income to same scale (divide by 1000)
    euint64 thousand = FHE.asEuint64(1000);
    euint64 normalizedIncome = FHE.div(profile.income, thousand);
    euint32 incomeScore = FHE.asEuint32(normalizedIncome);

    // Weight credit score (40%)
    euint32 forty = FHE.asEuint32(40);
    euint32 hundred = FHE.asEuint32(100);
    euint32 creditWeight = FHE.div(FHE.mul(profile.creditScore, forty), hundred);

    // Weight income score (30%)
    euint32 thirty = FHE.asEuint32(30);
    euint32 incomeWeight = FHE.div(FHE.mul(incomeScore, thirty), hundred);

    // Weight age (30%)
    euint32 ageWeight = FHE.div(FHE.mul(profile.age, thirty), hundred);

    // Sum all weighted scores
    euint32 totalScore = FHE.add(creditWeight, incomeWeight);
    totalScore = FHE.add(totalScore, ageWeight);

    return totalScore;
  }

  /**
   * @notice Grant access to specific profile fields to another user
   * @param user User to grant access to
   * @param grantAge Whether to grant access to age
   * @param grantIncome Whether to grant access to income
   * @param grantCreditScore Whether to grant access to credit score
   * @dev Demonstrates selective permission granting
   */
  function grantAccess(
    address user,
    bool grantAge,
    bool grantIncome,
    bool grantCreditScore
  ) external {
    require(profiles[msg.sender].initialized, "Profile not initialized");
    require(user != address(0), "Invalid user address");

    EncryptedProfile storage profile = profiles[msg.sender];

    // ✅ SELECTIVE PERMISSION GRANTING
    if (grantAge) {
      FHE.allow(profile.age, user);
    }

    if (grantIncome) {
      FHE.allow(profile.income, user);
    }

    if (grantCreditScore) {
      FHE.allow(profile.creditScore, user);
    }
  }

  /**
   * KEY CONCEPTS FOR MULTIPLE VALUES:
   *
   * 1. BATCH ENCRYPTION CLIENT-SIDE:
   *    const enc = fhevm.createEncryptedInput(contract, user);
   *    enc.add32(value1);
   *    enc.add64(value2);
   *    enc.add32(value3);
   *    const { handles, inputProof } = enc.encrypt();
   *    // Single proof validates all inputs
   *
   * 2. SINGLE INPUT PROOF:
   *    - One proof can validate multiple encrypted inputs
   *    - More efficient than separate proofs
   *    - All values must be from same encryption session
   *
   * 3. STRUCT STORAGE:
   *    - Group related encrypted values in structs
   *    - Easier to manage and update
   *    - Clear data relationships
   *
   * 4. PERMISSION MANAGEMENT:
   *    - Each encrypted value needs separate permissions
   *    - Must grant permissions for all values
   *    - Can grant selective access
   *
   * 5. OPERATIONS ON MULTIPLE VALUES:
   *    - Can perform calculations across encrypted fields
   *    - Results are also encrypted
   *    - No intermediate decryption needed
   *
   * 6. TYPE SAFETY:
   *    - Different euint sizes (euint32, euint64, etc.)
   *    - Must convert between types explicitly
   *    - FHE.asEuint32(), FHE.asEuint64()
   *
   * 7. GAS OPTIMIZATION:
   *    - Batch operations when possible
   *    - Minimize storage updates
   *    - Reuse encrypted values
   *
   * 8. BEST PRACTICES:
   *    ✅ Use single input proof for multiple values
   *    ✅ Grant permissions immediately after creation
   *    ✅ Group related values in structs
   *    ✅ Validate all inputs before storage
   *    ✅ Emit events for tracking
   *
   * 9. COMMON PATTERNS:
   *    - Profile management (age, income, etc.)
   *    - Multi-factor scoring
   *    - Batch updates
   *    - Selective disclosure
   *
   * 10. ANTI-PATTERNS:
   *     ❌ Separate proofs for each value (inefficient)
   *     ❌ Forgetting permissions for some values
   *     ❌ Not validating field existence
   *     ❌ Mixing up value types without conversion
   */
}
