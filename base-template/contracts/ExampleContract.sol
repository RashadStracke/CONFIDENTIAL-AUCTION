// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Example Contract
 * @notice Replace this contract with your FHEVM implementation
 * @dev This is a template showing basic FHE patterns
 */
contract ExampleContract is ZamaEthereumConfig {
  euint32 private _value;

  event ValueUpdated(address indexed user);

  /**
   * @notice Get the current value
   * @return The current encrypted value
   */
  function getValue() external view returns (euint32) {
    return _value;
  }

  /**
   * @notice Update value with encrypted input
   * @param encryptedInput The encrypted value from user
   * @param inputProof Zero-knowledge proof for encrypted input
   */
  function setValue(
    externalEuint32 encryptedInput,
    bytes calldata inputProof
  ) external {
    euint32 decrypted = FHE.fromExternal(encryptedInput, inputProof);
    _value = decrypted;

    FHE.allowThis(_value);
    FHE.allow(_value, msg.sender);

    emit ValueUpdated(msg.sender);
  }
}
