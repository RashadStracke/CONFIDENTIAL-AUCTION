// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title FHE Counter
 * @notice Simple encrypted counter demonstrating basic FHEVM operations
 * @dev This example shows:
 *      - Encrypted state variables (euint32)
 *      - FHE arithmetic operations (add, sub)
 *      - Access control with FHE.allow() and FHE.allowThis()
 *      - Input proofs for encrypted values
 */
contract FHECounter is ZamaEthereumConfig {
  // Encrypted counter value
  euint32 private _count;

  event CounterIncremented(address indexed user);
  event CounterDecremented(address indexed user);

  /**
   * @notice Returns the current count
   * @return The current encrypted count value
   * @dev The returned value is an encrypted handle, not a plaintext number
   */
  function getCount() external view returns (euint32) {
    return _count;
  }

  /**
   * @notice Increments the counter by a specified encrypted value
   * @param inputEuint32 Encrypted value to add to counter
   * @param inputProof Zero-knowledge proof for the encrypted input
   * @dev This example omits overflow checks for simplicity
   *      In production, implement proper range validation
   */
  function increment(
    externalEuint32 inputEuint32,
    bytes calldata inputProof
  ) external {
    // Validate and convert external encrypted input
    euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

    // Perform homomorphic addition on encrypted values
    _count = FHE.add(_count, encryptedEuint32);

    // Grant access permissions
    FHE.allowThis(_count); // Contract can access the value
    FHE.allow(_count, msg.sender); // Caller can access the value

    emit CounterIncremented(msg.sender);
  }

  /**
   * @notice Decrements the counter by a specified encrypted value
   * @param inputEuint32 Encrypted value to subtract from counter
   * @param inputProof Zero-knowledge proof for the encrypted input
   * @dev This example omits underflow checks for simplicity
   *      In production, implement proper range validation
   */
  function decrement(
    externalEuint32 inputEuint32,
    bytes calldata inputProof
  ) external {
    // Validate and convert external encrypted input
    euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

    // Perform homomorphic subtraction on encrypted values
    _count = FHE.sub(_count, encryptedEuint32);

    // Grant access permissions
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);

    emit CounterDecremented(msg.sender);
  }
}
