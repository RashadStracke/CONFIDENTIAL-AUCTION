// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title FHE Comparison Operations
 * @notice Demonstrates all comparison operations on encrypted data
 * @dev This contract shows:
 *      - FHE.eq() - Equality comparison
 *      - FHE.ne() - Not equal comparison
 *      - FHE.gt() - Greater than
 *      - FHE.gte() - Greater than or equal
 *      - FHE.lt() - Less than
 *      - FHE.lte() - Less than or equal
 *      - FHE.select() - Conditional selection
 *      - Boolean operations on encrypted booleans
 */
contract FHEComparison is ZamaEthereumConfig {
  mapping(address => euint32) private userValues;
  mapping(address => ebool) private userFlags;

  event ComparisonPerformed(address indexed user, string operation);
  event ConditionalExecuted(address indexed user);

  /**
   * @notice Set encrypted value for caller
   * @param encryptedValue Encrypted value
   * @param inputProof Zero-knowledge proof
   */
  function setValue(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);
    userValues[msg.sender] = value;

    FHE.allowThis(value);
    FHE.allow(value, msg.sender);
  }

  /**
   * @notice Get encrypted value for caller
   * @return Encrypted value handle
   */
  function getValue() external view returns (euint32) {
    return userValues[msg.sender];
  }

  /**
   * @notice Compare if stored value equals given value
   * @param encryptedValue Value to compare with
   * @param inputProof Zero-knowledge proof
   * @return ebool Encrypted boolean result
   * @dev Demonstrates: userValue == encryptedValue
   */
  function isEqual(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external returns (ebool) {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // ✅ ENCRYPTED EQUALITY CHECK
    // Result is encrypted boolean (ebool)
    ebool result = FHE.eq(userValues[msg.sender], value);

    userFlags[msg.sender] = result;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ComparisonPerformed(msg.sender, "equal");

    return result;
  }

  /**
   * @notice Compare if stored value does not equal given value
   * @param encryptedValue Value to compare with
   * @param inputProof Zero-knowledge proof
   * @return ebool Encrypted boolean result
   * @dev Demonstrates: userValue != encryptedValue
   */
  function isNotEqual(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external returns (ebool) {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // ✅ ENCRYPTED NOT-EQUAL CHECK
    ebool result = FHE.ne(userValues[msg.sender], value);

    userFlags[msg.sender] = result;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ComparisonPerformed(msg.sender, "not_equal");

    return result;
  }

  /**
   * @notice Compare if stored value is greater than given value
   * @param encryptedValue Value to compare with
   * @param inputProof Zero-knowledge proof
   * @return ebool Encrypted boolean result
   * @dev Demonstrates: userValue > encryptedValue
   */
  function isGreaterThan(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external returns (ebool) {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // ✅ ENCRYPTED GREATER-THAN CHECK
    ebool result = FHE.gt(userValues[msg.sender], value);

    userFlags[msg.sender] = result;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ComparisonPerformed(msg.sender, "greater_than");

    return result;
  }

  /**
   * @notice Compare if stored value is greater than or equal to given value
   * @param encryptedValue Value to compare with
   * @param inputProof Zero-knowledge proof
   * @return ebool Encrypted boolean result
   * @dev Demonstrates: userValue >= encryptedValue
   */
  function isGreaterOrEqual(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external returns (ebool) {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // ✅ ENCRYPTED GREATER-OR-EQUAL CHECK
    ebool result = FHE.gte(userValues[msg.sender], value);

    userFlags[msg.sender] = result;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ComparisonPerformed(msg.sender, "greater_or_equal");

    return result;
  }

  /**
   * @notice Compare if stored value is less than given value
   * @param encryptedValue Value to compare with
   * @param inputProof Zero-knowledge proof
   * @return ebool Encrypted boolean result
   * @dev Demonstrates: userValue < encryptedValue
   */
  function isLessThan(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external returns (ebool) {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // ✅ ENCRYPTED LESS-THAN CHECK
    ebool result = FHE.lt(userValues[msg.sender], value);

    userFlags[msg.sender] = result;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ComparisonPerformed(msg.sender, "less_than");

    return result;
  }

  /**
   * @notice Compare if stored value is less than or equal to given value
   * @param encryptedValue Value to compare with
   * @param inputProof Zero-knowledge proof
   * @return ebool Encrypted boolean result
   * @dev Demonstrates: userValue <= encryptedValue
   */
  function isLessOrEqual(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external returns (ebool) {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // ✅ ENCRYPTED LESS-OR-EQUAL CHECK
    ebool result = FHE.lte(userValues[msg.sender], value);

    userFlags[msg.sender] = result;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ComparisonPerformed(msg.sender, "less_or_equal");

    return result;
  }

  /**
   * @notice Conditional selection based on comparison
   * @param threshold Encrypted threshold value
   * @param valueIfAbove Value to use if user value > threshold
   * @param valueIfBelow Value to use if user value <= threshold
   * @param inputProof Zero-knowledge proof
   * @return euint32 Selected value (encrypted)
   * @dev Demonstrates: result = (userValue > threshold) ? valueIfAbove : valueIfBelow
   */
  function conditionalSelect(
    externalEuint32 threshold,
    externalEuint32 valueIfAbove,
    externalEuint32 valueIfBelow,
    bytes calldata inputProof
  ) external returns (euint32) {
    euint32 thresholdValue = FHE.fromExternal(threshold, inputProof);
    euint32 aboveValue = FHE.fromExternal(valueIfAbove, inputProof);
    euint32 belowValue = FHE.fromExternal(valueIfBelow, inputProof);

    // Step 1: Compare
    ebool isAbove = FHE.gt(userValues[msg.sender], thresholdValue);

    // Step 2: Select based on comparison
    // ✅ FHE.select() - Encrypted ternary operator
    // FHE.select(condition, trueValue, falseValue)
    euint32 result = FHE.select(isAbove, aboveValue, belowValue);

    userValues[msg.sender] = result;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ConditionalExecuted(msg.sender);

    return result;
  }

  /**
   * @notice Get maximum of stored value and provided value
   * @param encryptedValue Value to compare with
   * @param inputProof Zero-knowledge proof
   * @return euint32 Maximum value (encrypted)
   * @dev Demonstrates: result = max(userValue, encryptedValue)
   */
  function getMax(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external returns (euint32) {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // Compare which is greater
    ebool isUserGreater = FHE.gt(userValues[msg.sender], value);

    // Select the greater value
    euint32 maxValue = FHE.select(
      isUserGreater,
      userValues[msg.sender],
      value
    );

    userValues[msg.sender] = maxValue;

    FHE.allowThis(maxValue);
    FHE.allow(maxValue, msg.sender);

    return maxValue;
  }

  /**
   * @notice Get minimum of stored value and provided value
   * @param encryptedValue Value to compare with
   * @param inputProof Zero-knowledge proof
   * @return euint32 Minimum value (encrypted)
   * @dev Demonstrates: result = min(userValue, encryptedValue)
   */
  function getMin(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external returns (euint32) {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // Compare which is smaller
    ebool isUserLess = FHE.lt(userValues[msg.sender], value);

    // Select the smaller value
    euint32 minValue = FHE.select(isUserLess, userValues[msg.sender], value);

    userValues[msg.sender] = minValue;

    FHE.allowThis(minValue);
    FHE.allow(minValue, msg.sender);

    return minValue;
  }

  /**
   * @notice Check if value is within range
   * @param minValue Minimum value (inclusive)
   * @param maxValue Maximum value (inclusive)
   * @param inputProof Zero-knowledge proof
   * @return ebool True if minValue <= userValue <= maxValue
   * @dev Demonstrates: result = (userValue >= min) && (userValue <= max)
   */
  function isInRange(
    externalEuint32 minValue,
    externalEuint32 maxValue,
    bytes calldata inputProof
  ) external returns (ebool) {
    euint32 min = FHE.fromExternal(minValue, inputProof);
    euint32 max = FHE.fromExternal(maxValue, inputProof);

    // Check if >= min
    ebool isAboveMin = FHE.gte(userValues[msg.sender], min);

    // Check if <= max
    ebool isBelowMax = FHE.lte(userValues[msg.sender], max);

    // Combine with AND
    ebool inRange = FHE.and(isAboveMin, isBelowMax);

    userFlags[msg.sender] = inRange;

    FHE.allowThis(inRange);
    FHE.allow(inRange, msg.sender);

    return inRange;
  }

  /**
   * @notice Clamp value to range
   * @param minValue Minimum allowed value
   * @param maxValue Maximum allowed value
   * @param inputProof Zero-knowledge proof
   * @return euint32 Clamped value
   * @dev Demonstrates: result = clamp(userValue, min, max)
   *      If userValue < min, return min
   *      If userValue > max, return max
   *      Otherwise return userValue
   */
  function clampToRange(
    externalEuint32 minValue,
    externalEuint32 maxValue,
    bytes calldata inputProof
  ) external returns (euint32) {
    euint32 min = FHE.fromExternal(minValue, inputProof);
    euint32 max = FHE.fromExternal(maxValue, inputProof);

    euint32 value = userValues[msg.sender];

    // If value < min, use min, else use value
    ebool isBelowMin = FHE.lt(value, min);
    euint32 clampedMin = FHE.select(isBelowMin, min, value);

    // If value > max, use max, else use current
    ebool isAboveMax = FHE.gt(clampedMin, max);
    euint32 clamped = FHE.select(isAboveMax, max, clampedMin);

    userValues[msg.sender] = clamped;

    FHE.allowThis(clamped);
    FHE.allow(clamped, msg.sender);

    return clamped;
  }

  /**
   * KEY CONCEPTS FOR COMPARISONS:
   *
   * 1. COMPARISON OPERATORS:
   *    - FHE.eq(a, b)  - Equal (==)
   *    - FHE.ne(a, b)  - Not equal (!=)
   *    - FHE.gt(a, b)  - Greater than (>)
   *    - FHE.gte(a, b) - Greater or equal (>=)
   *    - FHE.lt(a, b)  - Less than (<)
   *    - FHE.lte(a, b) - Less or equal (<=)
   *
   * 2. RESULT TYPE - ebool:
   *    - All comparisons return ebool (encrypted boolean)
   *    - ebool is encrypted, not plaintext
   *    - Can't use in regular if statements
   *    - Use FHE.select() for conditional logic
   *
   * 3. FHE.select() - ENCRYPTED TERNARY:
   *    FHE.select(condition, ifTrue, ifFalse)
   *    - condition: ebool (encrypted boolean)
   *    - ifTrue: value if condition is true
   *    - ifFalse: value if condition is false
   *    - Returns encrypted result
   *
   * 4. BOOLEAN OPERATIONS:
   *    - FHE.and(a, b) - Logical AND
   *    - FHE.or(a, b)  - Logical OR
   *    - FHE.not(a)    - Logical NOT
   *    - Combine ebool values logically
   *
   * 5. COMMON PATTERNS:
   *    MAX: FHE.select(FHE.gt(a, b), a, b)
   *    MIN: FHE.select(FHE.lt(a, b), a, b)
   *    CLAMP: Multiple FHE.select() operations
   *    RANGE CHECK: FHE.and(FHE.gte(x, min), FHE.lte(x, max))
   *
   * 6. ANTI-PATTERNS:
   *    ❌ Using encrypted values in if statements
   *    if (encryptedValue > 10) { } // DOESN'T WORK!
   *
   *    ❌ Trying to decrypt ebool directly
   *    bool result = ebool; // DOESN'T WORK!
   *
   *    ❌ Using regular boolean operators
   *    ebool1 && ebool2 // DOESN'T WORK!
   *    Use: FHE.and(ebool1, ebool2)
   *
   * 7. BEST PRACTICES:
   *    ✅ Use FHE.select() for conditional logic
   *    ✅ Combine conditions with FHE.and/or
   *    ✅ Grant permissions to ebool results
   *    ✅ Chain comparisons efficiently
   *
   * 8. PERFORMANCE:
   *    - Comparisons are expensive (but necessary)
   *    - FHE.select() is efficient
   *    - Minimize comparison count
   *    - Combine conditions when possible
   *
   * 9. USE CASES:
   *    - Access control (age verification)
   *    - Auction winner determination
   *    - Credit score checks
   *    - Threshold-based logic
   *    - Min/max calculations
   *    - Range validation
   *
   * 10. SECURITY:
   *     - Comparisons reveal no information
   *     - Results encrypted (ebool)
   *     - No branching on plaintext
   *     - Perfect for privacy-preserving logic
   */
}
