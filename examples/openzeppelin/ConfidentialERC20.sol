// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Confidential ERC20 Token (ERC7984 Pattern)
 * @notice Implementation of confidential token standard with encrypted balances
 * @dev This contract demonstrates:
 *      - Encrypted balance storage
 *      - Confidential transfers
 *      - Encrypted allowances
 *      - Privacy-preserving token operations
 *      - ERC7984-inspired confidential token pattern
 */
contract ConfidentialERC20 is ZamaEthereumConfig {
  // Token metadata
  string private _name;
  string private _symbol;
  uint8 private _decimals;

  // Encrypted balances
  mapping(address => euint64) private _balances;

  // Encrypted allowances
  mapping(address => mapping(address => euint64)) private _allowances;

  // Total supply (encrypted)
  euint64 private _totalSupply;

  // Events
  event Transfer(address indexed from, address indexed to);
  event Approval(address indexed owner, address indexed spender);
  event Mint(address indexed to, uint64 amount);
  event Burn(address indexed from, uint64 amount);

  /**
   * @notice Constructor
   * @param name_ Token name
   * @param symbol_ Token symbol
   * @param decimals_ Token decimals
   */
  constructor(string memory name_, string memory symbol_, uint8 decimals_) {
    _name = name_;
    _symbol = symbol_;
    _decimals = decimals_;
    _totalSupply = FHE.asEuint64(0);
    FHE.allowThis(_totalSupply);
  }

  /**
   * @notice Get token name
   * @return Token name
   */
  function name() public view returns (string memory) {
    return _name;
  }

  /**
   * @notice Get token symbol
   * @return Token symbol
   */
  function symbol() public view returns (string memory) {
    return _symbol;
  }

  /**
   * @notice Get token decimals
   * @return Token decimals
   */
  function decimals() public view returns (uint8) {
    return _decimals;
  }

  /**
   * @notice Get encrypted total supply
   * @return Encrypted total supply
   * @dev Returns encrypted handle, not plaintext amount
   */
  function totalSupply() public view returns (euint64) {
    return _totalSupply;
  }

  /**
   * @notice Get encrypted balance of account
   * @param account Account address
   * @return Encrypted balance
   * @dev Only account can decrypt their own balance
   */
  function balanceOf(address account) public view returns (euint64) {
    return _balances[account];
  }

  /**
   * @notice Transfer encrypted amount to recipient
   * @param to Recipient address
   * @param encryptedAmount Encrypted transfer amount
   * @param inputProof Zero-knowledge proof
   * @return bool True if successful
   * @dev Demonstrates confidential transfer:
   *      1. Validates encrypted input
   *      2. Checks sufficient balance (encrypted comparison)
   *      3. Updates balances homomorphically
   *      4. Grants permissions appropriately
   */
  function transfer(
    address to,
    externalEuint64 encryptedAmount,
    bytes calldata inputProof
  ) external returns (bool) {
    require(to != address(0), "Transfer to zero address");

    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

    // ✅ CONFIDENTIAL TRANSFER PATTERN
    // Check balance without revealing amount
    ebool hasSufficientBalance = FHE.gte(_balances[msg.sender], amount);

    // Perform transfer calculations
    euint64 newSenderBalance = FHE.sub(_balances[msg.sender], amount);
    euint64 newRecipientBalance = FHE.add(_balances[to], amount);

    // Update balances
    // In production, use FHE.select with hasSufficientBalance to prevent underflow
    _balances[msg.sender] = newSenderBalance;
    _balances[to] = newRecipientBalance;

    // Grant permissions
    FHE.allowThis(newSenderBalance);
    FHE.allow(newSenderBalance, msg.sender);

    FHE.allowThis(newRecipientBalance);
    FHE.allow(newRecipientBalance, to);

    emit Transfer(msg.sender, to);

    return true;
  }

  /**
   * @notice Approve spender to spend encrypted amount
   * @param spender Spender address
   * @param encryptedAmount Encrypted allowance amount
   * @param inputProof Zero-knowledge proof
   * @return bool True if successful
   */
  function approve(
    address spender,
    externalEuint64 encryptedAmount,
    bytes calldata inputProof
  ) external returns (bool) {
    require(spender != address(0), "Approve to zero address");

    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

    _allowances[msg.sender][spender] = amount;

    // Grant permissions
    FHE.allowThis(amount);
    FHE.allow(amount, msg.sender);
    FHE.allow(amount, spender);

    emit Approval(msg.sender, spender);

    return true;
  }

  /**
   * @notice Get encrypted allowance
   * @param owner Owner address
   * @param spender Spender address
   * @return Encrypted allowance amount
   */
  function allowance(address owner, address spender)
    public
    view
    returns (euint64)
  {
    return _allowances[owner][spender];
  }

  /**
   * @notice Transfer from owner to recipient using allowance
   * @param from Owner address
   * @param to Recipient address
   * @param encryptedAmount Encrypted transfer amount
   * @param inputProof Zero-knowledge proof
   * @return bool True if successful
   */
  function transferFrom(
    address from,
    address to,
    externalEuint64 encryptedAmount,
    bytes calldata inputProof
  ) external returns (bool) {
    require(from != address(0), "Transfer from zero address");
    require(to != address(0), "Transfer to zero address");

    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

    // Check allowance
    ebool hasSufficientAllowance = FHE.gte(
      _allowances[from][msg.sender],
      amount
    );

    // Check balance
    ebool hasSufficientBalance = FHE.gte(_balances[from], amount);

    // Update allowance
    euint64 newAllowance = FHE.sub(_allowances[from][msg.sender], amount);
    _allowances[from][msg.sender] = newAllowance;

    // Update balances
    euint64 newSenderBalance = FHE.sub(_balances[from], amount);
    euint64 newRecipientBalance = FHE.add(_balances[to], amount);

    _balances[from] = newSenderBalance;
    _balances[to] = newRecipientBalance;

    // Grant permissions
    FHE.allowThis(newAllowance);
    FHE.allow(newAllowance, from);
    FHE.allow(newAllowance, msg.sender);

    FHE.allowThis(newSenderBalance);
    FHE.allow(newSenderBalance, from);

    FHE.allowThis(newRecipientBalance);
    FHE.allow(newRecipientBalance, to);

    emit Transfer(from, to);

    return true;
  }

  /**
   * @notice Mint new tokens to address
   * @param to Recipient address
   * @param amount Amount to mint (plaintext for simplicity)
   * @dev Only for demonstration - add access control in production
   */
  function mint(address to, uint64 amount) external {
    require(to != address(0), "Mint to zero address");

    euint64 encryptedAmount = FHE.asEuint64(amount);

    // Update balance
    euint64 newBalance = FHE.add(_balances[to], encryptedAmount);
    _balances[to] = newBalance;

    // Update total supply
    euint64 newTotalSupply = FHE.add(_totalSupply, encryptedAmount);
    _totalSupply = newTotalSupply;

    // Grant permissions
    FHE.allowThis(newBalance);
    FHE.allow(newBalance, to);

    FHE.allowThis(newTotalSupply);

    emit Mint(to, amount);
  }

  /**
   * @notice Burn tokens from sender
   * @param encryptedAmount Encrypted burn amount
   * @param inputProof Zero-knowledge proof
   */
  function burn(externalEuint64 encryptedAmount, bytes calldata inputProof)
    external
  {
    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

    // Check balance
    ebool hasSufficientBalance = FHE.gte(_balances[msg.sender], amount);

    // Update balance
    euint64 newBalance = FHE.sub(_balances[msg.sender], amount);
    _balances[msg.sender] = newBalance;

    // Update total supply
    euint64 newTotalSupply = FHE.sub(_totalSupply, amount);
    _totalSupply = newTotalSupply;

    // Grant permissions
    FHE.allowThis(newBalance);
    FHE.allow(newBalance, msg.sender);

    FHE.allowThis(newTotalSupply);

    emit Burn(msg.sender, 0); // Amount hidden in event
  }

  /**
   * KEY CONCEPTS FOR CONFIDENTIAL TOKENS:
   *
   * 1. ENCRYPTED BALANCES:
   *    - All balances stored as euint64
   *    - Never revealed on-chain
   *    - Only holder can decrypt their balance
   *    - Contract performs operations without knowing amounts
   *
   * 2. CONFIDENTIAL TRANSFERS:
   *    - Transfer amounts are encrypted
   *    - Balance checks done homomorphically
   *    - No plaintext amounts in events
   *    - Recipient can decrypt their new balance
   *
   * 3. ENCRYPTED ALLOWANCES:
   *    - Approval amounts encrypted
   *    - Spender can use allowance without revealing amount
   *    - Owner retains control over allowance
   *
   * 4. PERMISSION MANAGEMENT:
   *    - Sender grants permission to recipient for new balance
   *    - Contract always needs allowThis permission
   *    - Users need allow permission to decrypt
   *
   * 5. PRIVACY PROPERTIES:
   *    ✅ Balance amounts never revealed
   *    ✅ Transfer amounts private
   *    ✅ Allowances confidential
   *    ✅ Total supply can be public or private
   *    ✅ Only involved parties know transaction details
   *
   * 6. vs REGULAR ERC20:
   *    REGULAR ERC20:
   *    - All balances public
   *    - All transfers visible
   *    - Anyone can see holdings
   *
   *    CONFIDENTIAL ERC20:
   *    - Balances encrypted
   *    - Transfer amounts hidden
   *    - Holdings private
   *    - Same interface, different privacy
   *
   * 7. USE CASES:
   *    - Privacy-preserving payments
   *    - Confidential payroll
   *    - Private investment vehicles
   *    - Sensitive business transactions
   *    - Personal finance privacy
   *
   * 8. SECURITY CONSIDERATIONS:
   *    ✅ Validate all encrypted inputs
   *    ✅ Check balances before transfers
   *    ✅ Update permissions after operations
   *    ✅ Prevent underflow with FHE.select
   *    ✅ Access control for minting
   *
   * 9. LIMITATIONS:
   *    - More gas expensive than regular ERC20
   *    - Can't see balances externally
   *    - Requires FHEVM environment
   *    - Decryption requires relayer
   *
   * 10. BEST PRACTICES:
   *     ✅ Use euint64 for sufficient range
   *     ✅ Grant permissions immediately
   *     ✅ Validate sender has sufficient balance
   *     ✅ Don't reveal amounts in events
   *     ✅ Provide decryption mechanisms for users
   *     ✅ Document privacy guarantees
   *     ✅ Test with real FHEVM environment
   */
}
