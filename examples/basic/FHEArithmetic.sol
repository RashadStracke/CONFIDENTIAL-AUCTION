// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title FHE Arithmetic Operations
 * @notice Demonstrates all basic FHE arithmetic operations
 * @dev This contract shows:
 *      - FHE.add() - Homomorphic addition
 *      - FHE.sub() - Homomorphic subtraction
 *      - FHE.mul() - Homomorphic multiplication
 *      - FHE.div() - Homomorphic division
 *      - FHE.rem() - Homomorphic remainder/modulo
 *      - Chaining multiple operations
 */
contract FHEArithmetic is ZamaEthereumConfig {
  // Encrypted state variables
  mapping(address => euint32) private userValues;

  event ValueUpdated(address indexed user, string operation);
  event ArithmeticPerformed(address indexed user, string operation);

  /**
   * @notice Store an encrypted value for the caller
   * @param encryptedValue Encrypted value from client
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

    emit ValueUpdated(msg.sender, "set");
  }

  /**
   * @notice Get the stored encrypted value for caller
   * @return The encrypted value (handle)
   */
  function getValue() external view returns (euint32) {
    return userValues[msg.sender];
  }

  /**
   * @notice Add an encrypted value to stored value
   * @param encryptedValue Encrypted value to add
   * @param inputProof Zero-knowledge proof
   * @dev Demonstrates: result = userValue + encryptedValue
   */
  function add(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // ✅ HOMOMORPHIC ADDITION
    // Adds two encrypted values without decryption
    euint32 result = FHE.add(userValues[msg.sender], value);

    userValues[msg.sender] = result;

    // Grant permissions to new result
    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ArithmeticPerformed(msg.sender, "add");
  }

  /**
   * @notice Subtract an encrypted value from stored value
   * @param encryptedValue Encrypted value to subtract
   * @param inputProof Zero-knowledge proof
   * @dev Demonstrates: result = userValue - encryptedValue
   */
  function subtract(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // ✅ HOMOMORPHIC SUBTRACTION
    // Subtracts encrypted values without decryption
    euint32 result = FHE.sub(userValues[msg.sender], value);

    userValues[msg.sender] = result;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ArithmeticPerformed(msg.sender, "subtract");
  }

  /**
   * @notice Multiply stored value by encrypted value
   * @param encryptedValue Encrypted value to multiply by
   * @param inputProof Zero-knowledge proof
   * @dev Demonstrates: result = userValue * encryptedValue
   */
  function multiply(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // ✅ HOMOMORPHIC MULTIPLICATION
    // Multiplies encrypted values without decryption
    euint32 result = FHE.mul(userValues[msg.sender], value);

    userValues[msg.sender] = result;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ArithmeticPerformed(msg.sender, "multiply");
  }

  /**
   * @notice Divide stored value by encrypted value
   * @param encryptedValue Encrypted divisor
   * @param inputProof Zero-knowledge proof
   * @dev Demonstrates: result = userValue / encryptedValue
   *      Note: Division by zero will fail in FHEVM
   */
  function divide(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // ✅ HOMOMORPHIC DIVISION
    // Divides encrypted values without decryption
    euint32 result = FHE.div(userValues[msg.sender], value);

    userValues[msg.sender] = result;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ArithmeticPerformed(msg.sender, "divide");
  }

  /**
   * @notice Calculate remainder of stored value divided by encrypted value
   * @param encryptedValue Encrypted divisor
   * @param inputProof Zero-knowledge proof
   * @dev Demonstrates: result = userValue % encryptedValue
   */
  function remainder(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // ✅ HOMOMORPHIC MODULO
    // Calculates remainder on encrypted values
    euint32 result = FHE.rem(userValues[msg.sender], value);

    userValues[msg.sender] = result;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ArithmeticPerformed(msg.sender, "remainder");
  }

  /**
   * @notice Perform complex calculation: (a + b) * c
   * @param encryptedA First operand
   * @param encryptedB Second operand
   * @param encryptedC Third operand
   * @param inputProof Zero-knowledge proof for all inputs
   * @dev Demonstrates chaining multiple FHE operations
   */
  function complexOperation(
    externalEuint32 encryptedA,
    externalEuint32 encryptedB,
    externalEuint32 encryptedC,
    bytes calldata inputProof
  ) external {
    // Convert external inputs
    euint32 a = FHE.fromExternal(encryptedA, inputProof);
    euint32 b = FHE.fromExternal(encryptedB, inputProof);
    euint32 c = FHE.fromExternal(encryptedC, inputProof);

    // ✅ CHAINING OPERATIONS
    // Step 1: Add a and b
    euint32 sum = FHE.add(a, b);

    // Step 2: Multiply result by c
    euint32 result = FHE.mul(sum, c);

    // Store result
    userValues[msg.sender] = result;

    // Grant permissions
    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ArithmeticPerformed(msg.sender, "complex");
  }

  /**
   * @notice Add a plaintext constant to encrypted value
   * @param constant Plaintext constant to add
   * @dev Demonstrates mixing encrypted and plaintext values
   */
  function addConstant(uint32 constant) external {
    // Convert plaintext to encrypted
    euint32 encryptedConstant = FHE.asEuint32(constant);

    // Perform addition
    euint32 result = FHE.add(userValues[msg.sender], encryptedConstant);

    userValues[msg.sender] = result;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ArithmeticPerformed(msg.sender, "addConstant");
  }

  /**
   * @notice Calculate average of two encrypted values
   * @param encryptedValue Second value to average with
   * @param inputProof Zero-knowledge proof
   * @dev Demonstrates: result = (userValue + encryptedValue) / 2
   */
  function average(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // Add values
    euint32 sum = FHE.add(userValues[msg.sender], value);

    // Divide by 2
    euint32 two = FHE.asEuint32(2);
    euint32 result = FHE.div(sum, two);

    userValues[msg.sender] = result;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    emit ArithmeticPerformed(msg.sender, "average");
  }

  /**
   * KEY CONCEPTS:
   *
   * 1. HOMOMORPHIC ARITHMETIC:
   *    - Operations performed on encrypted data
   *    - Result is also encrypted
   *    - No plaintext values revealed
   *    - Mathematically correct results
   *
   * 2. SUPPORTED OPERATIONS:
   *    - FHE.add(a, b) - Addition
   *    - FHE.sub(a, b) - Subtraction
   *    - FHE.mul(a, b) - Multiplication
   *    - FHE.div(a, b) - Division
   *    - FHE.rem(a, b) - Remainder/Modulo
   *
   * 3. CHAINING OPERATIONS:
   *    - Results can be used in subsequent operations
   *    - euint32 temp = FHE.add(a, b);
   *    - euint32 final = FHE.mul(temp, c);
   *    - No intermediate decryption needed
   *
   * 4. MIXING ENCRYPTED AND PLAINTEXT:
   *    - Use FHE.asEuint32(plaintext) to convert
   *    - Then operate normally with encrypted values
   *    - Useful for constants and known values
   *
   * 5. PERMISSION MANAGEMENT:
   *    - Each result needs new permissions
   *    - FHE.allowThis() for contract
   *    - FHE.allow() for user
   *    - Permissions don't transfer automatically
   *
   * 6. PERFORMANCE CONSIDERATIONS:
   *    - FHE operations are computationally expensive
   *    - Multiplication more expensive than addition
   *    - Division most expensive operation
   *    - Minimize operation count when possible
   *
   * 7. OVERFLOW/UNDERFLOW:
   *    - Operations wrap around like Solidity
   *    - euint32 max is 2^32 - 1
   *    - No automatic overflow checks
   *    - Implement checks if needed
   *
   * 8. BEST PRACTICES:
   *    ✅ Always grant permissions after operations
   *    ✅ Use constants via FHE.asEuint32()
   *    ✅ Chain operations efficiently
   *    ✅ Minimize expensive operations (mul, div)
   *    ✅ Emit events for operation tracking
   *
   * 9. COMMON MISTAKES:
   *    ❌ Forgetting to grant permissions to results
   *    ❌ Trying to use plaintext directly with encrypted
   *    ❌ Not handling division by zero
   *    ❌ Assuming overflow protection
   *
   * 10. REAL-WORLD APPLICATIONS:
   *     - Private financial calculations
   *     - Confidential scoring systems
   *     - Secret ballot aggregation
   *     - Privacy-preserving analytics
   *     - Encrypted machine learning inference
   */
}
