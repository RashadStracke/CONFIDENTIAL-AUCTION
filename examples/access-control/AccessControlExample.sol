// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Access Control Example
 * @notice Demonstrates FHE access control patterns with FHE.allow() and FHE.allowThis()
 * @dev This example shows:
 *      - Why access control is necessary
 *      - How FHE.allow() grants user permissions
 *      - How FHE.allowThis() grants contract permissions
 *      - FHE.allowTransient() for temporary access
 *      - Common mistakes and their consequences
 */
contract AccessControlExample is ZamaEthereumConfig {
  // Encrypted balances per user
  mapping(address => euint32) private balances;

  // Shared encrypted value
  euint32 private sharedValue;

  // Admin address
  address public admin;

  event BalanceUpdated(address indexed user);
  event SharedValueUpdated();
  event PermissionGranted(address indexed user);

  constructor() {
    admin = msg.sender;
  }

  /**
   * @notice Store encrypted balance for user
   * @param encryptedAmount Encrypted amount
   * @param inputProof Zero-knowledge proof
   * @dev Demonstrates basic access control pattern
   */
  function setBalance(
    externalEuint32 encryptedAmount,
    bytes calldata inputProof
  ) external {
    euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);

    balances[msg.sender] = amount;

    // ✅ CORRECT: Grant both permissions
    FHE.allowThis(amount); // Contract can use this in operations
    FHE.allow(amount, msg.sender); // User can decrypt their balance

    emit BalanceUpdated(msg.sender);
  }

  /**
   * @notice Transfer amount from sender to recipient
   * @param recipient Recipient address
   * @param encryptedAmount Encrypted transfer amount
   * @param inputProof Zero-knowledge proof
   * @dev Shows how to transfer between encrypted values
   */
  function transfer(
    address recipient,
    externalEuint32 encryptedAmount,
    bytes calldata inputProof
  ) external {
    euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);

    // Subtract from sender (homomorphic subtraction)
    euint32 newSenderBalance = FHE.sub(balances[msg.sender], amount);
    balances[msg.sender] = newSenderBalance;

    // Add to recipient (homomorphic addition)
    euint32 newRecipientBalance = FHE.add(balances[recipient], amount);
    balances[recipient] = newRecipientBalance;

    // ✅ Grant permissions to both parties for their new balances
    FHE.allowThis(newSenderBalance);
    FHE.allow(newSenderBalance, msg.sender);

    FHE.allowThis(newRecipientBalance);
    FHE.allow(newRecipientBalance, recipient);

    emit BalanceUpdated(msg.sender);
    emit BalanceUpdated(recipient);
  }

  /**
   * @notice Get caller's encrypted balance
   * @return Encrypted balance handle
   * @dev User must have permission to decrypt
   */
  function getBalance() external view returns (euint32) {
    return balances[msg.sender];
  }

  /**
   * @notice Update shared value (admin only)
   * @param encryptedValue New encrypted value
   * @param inputProof Zero-knowledge proof
   * @dev Demonstrates selective permission granting
   */
  function updateSharedValue(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external {
    require(msg.sender == admin, "Only admin");

    euint32 value = FHE.fromExternal(encryptedValue, inputProof);
    sharedValue = value;

    // ✅ Grant contract permission for operations
    FHE.allowThis(value);

    // ✅ Grant admin permission to decrypt
    FHE.allow(value, admin);

    emit SharedValueUpdated();
  }

  /**
   * @notice Grant user permission to decrypt shared value
   * @param user User to grant permission to
   * @dev Shows how to selectively grant permissions
   */
  function grantSharedAccess(address user) external {
    require(msg.sender == admin, "Only admin");

    // ✅ Grant user permission to decrypt shared value
    FHE.allow(sharedValue, user);

    emit PermissionGranted(user);
  }

  /**
   * @notice Compare two encrypted values using transient permission
   * @param value1 First encrypted value (from caller)
   * @param value2 Second encrypted value (from caller)
   * @param inputProof Zero-knowledge proof
   * @return ebool Result of comparison (also encrypted)
   * @dev Demonstrates FHE.allowTransient() for temporary operations
   */
  function compareValues(
    externalEuint32 value1,
    externalEuint32 value2,
    bytes calldata inputProof
  ) external returns (ebool) {
    euint32 v1 = FHE.fromExternal(value1, inputProof);
    euint32 v2 = FHE.fromExternal(value2, inputProof);

    // ✅ Use allowTransient for temporary comparison
    // These permissions are only valid within this transaction
    FHE.allowTransient(v1);
    FHE.allowTransient(v2);

    // Perform comparison
    ebool result = FHE.gt(v1, v2);

    // Grant permanent permission to result
    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    return result;
  }

  /**
   * @notice Get shared value (must have permission)
   * @return Encrypted shared value handle
   * @dev Only users with granted permission can decrypt this
   */
  function getSharedValue() external view returns (euint32) {
    return sharedValue;
  }

  /**
   * KEY CONCEPTS:
   *
   * 1. WHY ACCESS CONTROL?
   *    - Encrypted values have "handles" that reference encrypted data
   *    - Without permissions, even handle owner can't decrypt or use the value
   *    - Permissions must be explicitly granted
   *
   * 2. FHE.allowThis(value):
   *    - Grants contract permission to use value in operations
   *    - Required for: comparisons, arithmetic, storage updates
   *    - Without this, contract can't perform FHE operations
   *
   * 3. FHE.allow(value, address):
   *    - Grants specific address permission to decrypt value
   *    - User can request decryption through relayer
   *    - Multiple addresses can have permission to same value
   *
   * 4. FHE.allowTransient(value):
   *    - Temporary permission for current transaction only
   *    - Useful for intermediate computations
   *    - More gas-efficient for one-time operations
   *
   * 5. COMMON MISTAKES:
   *
   *    ❌ Missing FHE.allowThis():
   *       euint32 value = FHE.fromExternal(input, proof);
   *       FHE.allow(value, msg.sender); // Only user permission!
   *       // Contract can't use this value later
   *
   *    ❌ Missing FHE.allow() for user:
   *       euint32 value = FHE.fromExternal(input, proof);
   *       FHE.allowThis(value); // Only contract permission!
   *       // User can't decrypt their own value
   *
   *    ❌ Not updating permissions after operations:
   *       euint32 result = FHE.add(a, b);
   *       // Missing FHE.allowThis(result) and FHE.allow(result, user)
   *       // New value has no permissions!
   *
   * 6. BEST PRACTICES:
   *    ✅ Always grant both FHE.allowThis() and FHE.allow() for persistent values
   *    ✅ Use FHE.allowTransient() for temporary computations
   *    ✅ Update permissions after every FHE operation that creates new values
   *    ✅ Be explicit about who should have access to each value
   */
}
