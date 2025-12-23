// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title User Decrypt Single Value Example
 * @notice Demonstrates user-controlled decryption of encrypted contract state
 * @dev This example shows:
 *      - How users can decrypt their values
 *      - Permission requirements for decryption
 *      - User vs. contract access control patterns
 *      - Decryption request patterns
 */
contract UserDecryptSingleValue is ZamaEthereumConfig {
  // Encrypted secrets stored per user
  mapping(address => euint32) private secrets;

  // Decryption request tracking
  mapping(address => bytes32) private pendingDecryptionRequests;

  event SecretStored(address indexed user);
  event DecryptionRequested(address indexed user, bytes32 requestId);
  event SecretRevealed(address indexed user, uint32 value);

  /**
   * @notice Store an encrypted secret for the caller
   * @param encryptedSecret Encrypted secret from client
   * @param inputProof Zero-knowledge proof for encrypted input
   */
  function storeSecret(
    externalEuint32 encryptedSecret,
    bytes calldata inputProof
  ) external {
    // Convert external encrypted input to internal format
    euint32 secret = FHE.fromExternal(encryptedSecret, inputProof);

    // Store encrypted secret
    secrets[msg.sender] = secret;

    // Grant permissions: contract and user can access
    FHE.allowThis(secret);
    FHE.allow(secret, msg.sender);

    emit SecretStored(msg.sender);
  }

  /**
   * @notice Get the encrypted secret for caller
   * @return The encrypted secret (handle)
   * @dev This returns an encrypted handle, not the plaintext value
   *      User must decrypt to reveal the actual value
   */
  function getSecret() external view returns (euint32) {
    return secrets[msg.sender];
  }

  /**
   * @notice Request decryption of stored secret
   * @dev In a real environment with decryption relayer:
   *      1. User calls this function to request decryption
   *      2. Smart contract emits event with request details
   *      3. Decryption relayer picks up the event
   *      4. Relayer decrypts using user's private key
   *      5. Relayer calls callback with decrypted value
   *
   *      This pattern ensures:
   *      - Only authorized users can decrypt their values
   *      - Decryption happens off-chain (no private keys in contract)
   *      - Result is returned via callback (allows async decryption)
   */
  function requestDecryption() external returns (bytes32) {
    euint32 secret = secrets[msg.sender];

    // Create unique request ID
    bytes32 requestId = keccak256(
      abi.encodePacked(msg.sender, block.timestamp, secret)
    );

    // Store request for relayer to process
    pendingDecryptionRequests[msg.sender] = requestId;

    // Emit event with encrypted value and permissions
    // Relayer listens to this event and decrypts using user's key
    emit DecryptionRequested(msg.sender, requestId);

    return requestId;
  }

  /**
   * @notice Callback for relayer to submit decrypted value
   * @param decryptedValue The plaintext value decrypted by relayer
   * @dev Only the relayer can call this, and only with valid decrypted values
   *      In production, this would be protected with relayer authentication
   */
  function revealDecryptedSecret(uint32 decryptedValue) external {
    // In production, verify this came from authorized relayer:
    // require(msg.sender == DECRYPTION_RELAYER, "Unauthorized");

    // Verify request exists (optional security measure)
    require(
      pendingDecryptionRequests[msg.sender] != bytes32(0),
      "No pending decryption request"
    );

    // Clear the request
    delete pendingDecryptionRequests[msg.sender];

    // Emit event with decrypted value
    emit SecretRevealed(msg.sender, decryptedValue);

    // Note: Could also return the value via memory, but events are more flexible
    // for async decryption scenarios
  }

  /**
   * @notice Check if user has pending decryption request
   * @return True if request is pending
   */
  function hasPendingDecryption(address user) external view returns (bool) {
    return pendingDecryptionRequests[user] != bytes32(0);
  }

  /**
   * @dev Key Concepts for User Decryption:
   *
   * 1. PERMISSION MODEL:
   *    - FHE.allow(value, user) = user can decrypt
   *    - FHE.allowThis(value) = contract can perform operations
   *    - Both needed for most use cases
   *
   * 2. DECRYPTION FLOW:
   *    - Contract grants permission to user: FHE.allow(encrypted_value, user)
   *    - User requests decryption via smart contract
   *    - Relayer picks up request, decrypts using user's private key
   *    - Relayer calls callback with plaintext result
   *
   * 3. USER VS CONTRACT ACCESS:
   *    - Users decrypt through relayer service
   *    - Contract can only use values in encrypted form
   *    - Contract can grant/revoke user permissions
   *
   * 4. SECURITY:
   *    - User's private key never sent to contract
   *    - Only authorized users can decrypt their values
   *    - Decryption happens off-chain
   *    - Contract enforces access control
   */
}
