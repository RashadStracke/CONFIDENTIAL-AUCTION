// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Encrypt Single Value Example
 * @notice Demonstrates how to handle encrypted input values in FHEVM
 * @dev This example shows:
 *      - Converting external encrypted inputs to internal format
 *      - Zero-knowledge proof validation
 *      - Permission management for encrypted values
 *      - Common pitfalls and best practices
 */
contract EncryptSingleValue is ZamaEthereumConfig {
  // Mapping to store encrypted values per user
  mapping(address => euint32) private userValues;

  event ValueStored(address indexed user);

  /**
   * @notice Store an encrypted value for the caller
   * @param encryptedValue Encrypted value from client
   * @param inputProof Zero-knowledge proof attesting encryption correctness
   * @dev The input must be encrypted with binding to [contract, user] pair
   *
   * Best Practice:
   * Client-side encryption should use:
   * const enc = await fhevm.createEncryptedInput(contractAddress, signerAddress);
   * enc.add32(value);
   * const { handles, inputProof } = await enc.encrypt();
   */
  function storeValue(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external {
    // ✅ CORRECT: Validate and convert external encrypted input
    // This checks the zero-knowledge proof and converts to internal format
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // Store the encrypted value
    userValues[msg.sender] = value;

    // ✅ CRITICAL: Grant both contract and user permissions
    FHE.allowThis(value); // Contract needs access for future operations
    FHE.allow(value, msg.sender); // User can decrypt their value

    emit ValueStored(msg.sender);
  }

  /**
   * @notice Get the stored encrypted value for caller
   * @return The encrypted value (handle)
   * @dev Can only return the encrypted handle, not plaintext
   *      User must use decryption mechanism to get plaintext value
   */
  function getValue() external view returns (euint32) {
    return userValues[msg.sender];
  }

  /**
   * @notice Example showing INCORRECT patterns (for educational purposes)
   * @dev These patterns will FAIL and are shown to help developers learn
   */

  // ❌ ANTI-PATTERN 1: Missing FHE.allowThis()
  // function incorrectStore1(externalEuint32 encryptedValue, bytes calldata inputProof) external {
  //     euint32 value = FHE.fromExternal(encryptedValue, inputProof);
  //     userValues[msg.sender] = value;
  //     FHE.allow(value, msg.sender); // Missing FHE.allowThis()!
  //     // Contract won't be able to use this value in future operations
  // }

  // ❌ ANTI-PATTERN 2: Missing permissions entirely
  // function incorrectStore2(externalEuint32 encryptedValue, bytes calldata inputProof) external {
  //     euint32 value = FHE.fromExternal(encryptedValue, inputProof);
  //     userValues[msg.sender] = value;
  //     // No FHE.allow() or FHE.allowThis()!
  //     // Neither contract nor user can access this value
  // }

  // ❌ ANTI-PATTERN 3: Trying to use encrypted value as plaintext
  // function incorrectComparison(externalEuint32 encryptedValue, bytes calldata inputProof) external {
  //     euint32 value = FHE.fromExternal(encryptedValue, inputProof);
  //     // This will NOT work:
  //     // if (value > 100) { ... }
  //     // Must use: FHE.gt(value, FHE.asEuint32(100))
  // }
}
