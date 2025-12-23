# FHEVM Security Audit Checklist

Comprehensive security checklist for FHEVM smart contract development and deployment.

## Table of Contents

- [Contract Development](#contract-development)
- [FHE-Specific Security](#fhe-specific-security)
- [Encryption and Proofs](#encryption-and-proofs)
- [Permission Management](#permission-management)
- [Testing and Verification](#testing-and-verification)
- [Deployment Security](#deployment-security)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Contract Development

### Code Quality

- [ ] **Code Review**
  - [ ] Two developers have reviewed all new code
  - [ ] Code follows FHEVM best practices
  - [ ] No hardcoded values or secrets
  - [ ] Clear variable and function names
  - [ ] Comments explain complex logic

- [ ] **Test Coverage**
  - [ ] All functions have tests
  - [ ] Edge cases covered (zero, max values, etc.)
  - [ ] Error conditions tested
  - [ ] Happy path and failure paths tested
  - [ ] Coverage report shows >80% coverage

- [ ] **Static Analysis**
  - [ ] Solidity compiler warnings addressed
  - [ ] No "unchecked" blocks without justification
  - [ ] Type safety maintained throughout
  - [ ] No deprecated functions used

- [ ] **Linting and Formatting**
  - [ ] Code passes solhint
  - [ ] Consistent formatting (prettier)
  - [ ] No unused imports or variables
  - [ ] No debug code or console.logs

### Standard Solidity Security

- [ ] **Access Control**
  - [ ] Only authorized functions callable by each role
  - [ ] Owner/admin functions properly restricted
  - [ ] No privilege escalation possible
  - [ ] Access control events emitted

- [ ] **Reentrancy Protection**
  - [ ] External calls follow checks-effects-interactions pattern
  - [ ] State changes before external calls
  - [ ] Reentrancy guards if needed
  - [ ] No recursive calls without safeguards

- [ ] **Integer Arithmetic**
  - [ ] No integer overflow/underflow in critical paths
  - [ ] SafeMath or native checks used
  - [ ] Division by zero prevented
  - [ ] Modulo operations safe

- [ ] **State Management**
  - [ ] No uninitialized variables
  - [ ] State transitions are atomic
  - [ ] No race conditions possible
  - [ ] Storage layout optimized

---

## FHE-Specific Security

### Encrypted Value Handling

- [ ] **Encrypted State Variables**
  - [ ] All sensitive data encrypted (euint types)
  - [ ] No sensitive data in plaintext storage
  - [ ] Encrypted state properly initialized
  - [ ] State transitions maintain confidentiality

- [ ] **Handle Management**
  - [ ] Handles created and stored correctly
  - [ ] Handle lifecycle tracked properly
  - [ ] No handle reuse across different values
  - [ ] Garbage collection of unused handles

- [ ] **Type Safety**
  - [ ] Correct euint types used (euint8, euint16, euint32, euint64)
  - [ ] No mixing of different integer types without conversion
  - [ ] ebool values handled separately from euints
  - [ ] eaddress types used appropriately

- [ ] **Operations**
  - [ ] Only supported FHE operations used
  - [ ] Operations don't leak information through gas costs
  - [ ] Operations don't leak information through patterns
  - [ ] Conditional logic stays encrypted

---

## Encryption and Proofs

### Input Proof Security

- [ ] **Proof Validation**
  - [ ] `FHE.fromExternal()` called for all external inputs
  - [ ] Input proofs required for all encrypted inputs
  - [ ] Proof binding to contract verified
  - [ ] Proof binding to user (msg.sender) verified

- [ ] **Proof Management**
  - [ ] Proofs cannot be reused (prevented by FHE library)
  - [ ] Proof freshness checked (recent timestamp)
  - [ ] Replay attacks prevented
  - [ ] No cross-user proof usage allowed

- [ ] **Proof Validation Events**
  - [ ] Invalid proofs cause transaction revert
  - [ ] Clear error messages for proof failures
  - [ ] Proof validation failure logged
  - [ ] No silent failures on bad proofs

### Type Compatibility

- [ ] **Type Matching**
  - [ ] Proof data types match contract expectations
  - [ ] No type confusion possible
  - [ ] Casting/conversion done explicitly
  - [ ] Type errors caught at compile time

- [ ] **Value Range**
  - [ ] Values fit in declared type
  - [ ] No overflow from input values
  - [ ] Bounds checking where appropriate
  - [ ] Maximum value handling

---

## Permission Management

### FHE Permissions

- [ ] **Contract Permissions (allowThis)**
  - [ ] `FHE.allowThis()` called for operation results
  - [ ] Contract can use all needed encrypted values
  - [ ] Permissions set before value storage
  - [ ] Permission grants don't leak information

- [ ] **User Permissions (allow)**
  - [ ] `FHE.allow()` called for user-decryptable values
  - [ ] Correct user addresses granted permissions
  - [ ] Users can only decrypt their own data
  - [ ] Cross-user access prevented

- [ ] **Permission Updates**
  - [ ] Permissions updated after operations
  - [ ] New handles get appropriate permissions
  - [ ] Permissions don't accumulate unnecessarily
  - [ ] Old permissions cleaned up

- [ ] **Transient Permissions**
  - [ ] `FHE.allowTransient()` used for temporary values
  - [ ] Transient permissions sufficient for local ops
  - [ ] No unnecessary storage of transient handles
  - [ ] Performance benefit realized

### Permission Verification

- [ ] **Before Operations**
  - [ ] Contract verified to have permission
  - [ ] Required permission present before use
  - [ ] Multiple permissions checked if needed

- [ ] **After Operations**
  - [ ] Result handles get required permissions
  - [ ] Both allowThis and allow checked if needed
  - [ ] Permissions set atomically with operation

---

## Testing and Verification

### Test Coverage

- [ ] **Unit Tests**
  - [ ] Each function tested independently
  - [ ] All branches covered
  - [ ] All error conditions tested
  - [ ] Success and failure paths tested

- [ ] **Integration Tests**
  - [ ] Multiple functions work together
  - [ ] External integrations tested
  - [ ] Real-world scenarios tested
  - [ ] Multi-user interactions tested

- [ ] **Encryption Tests**
  - [ ] Encrypted inputs tested
  - [ ] Proofs validated in tests
  - [ ] Permissions verified in tests
  - [ ] Decryption tested

- [ ] **Security Tests**
  - [ ] Unauthorized access prevented
  - [ ] Invalid proofs rejected
  - [ ] Permission bypasses impossible
  - [ ] Edge cases handled safely

### Test Data

- [ ] **Test Values**
  - [ ] Zero values tested
  - [ ] Maximum values tested
  - [ ] Boundary values tested
  - [ ] Normal range values tested

- [ ] **Test Users**
  - [ ] Single user tested
  - [ ] Multiple users tested
  - [ ] User isolation verified
  - [ ] Cross-user operations verified

- [ ] **Test Scenarios**
  - [ ] Happy path works
  - [ ] Error paths handled
  - [ ] Edge cases covered
  - [ ] Concurrent operations tested

---

## Deployment Security

### Pre-Deployment

- [ ] **Final Review**
  - [ ] All code reviewed again
  - [ ] No debug code present
  - [ ] No test-only code in production
  - [ ] All tests passing

- [ ] **Configuration**
  - [ ] Network settings correct
  - [ ] Gas limits appropriate
  - [ ] Timeout values reasonable
  - [ ] Signer properly configured

- [ ] **Secrets Management**
  - [ ] Private keys secured
  - [ ] `.env` file in `.gitignore`
  - [ ] No secrets in git history
  - [ ] Use separate keys for prod/test

- [ ] **Documentation**
  - [ ] Deployment procedure documented
  - [ ] Rollback procedure documented
  - [ ] Emergency procedures documented
  - [ ] Contacts list prepared

### Deployment Process

- [ ] **Pre-Deployment Checks**
  - [ ] Sufficient funds for deployment
  - [ ] Sufficient gas limit set
  - [ ] Network connectivity verified
  - [ ] RPC endpoints responsive

- [ ] **Deployment Steps**
  - [ ] Compile on clean state
  - [ ] Deployment script tested on testnet
  - [ ] Deployment executed
  - [ ] Contract deployed to correct address

- [ ] **Post-Deployment Verification**
  - [ ] Contract exists at address
  - [ ] Code matches compiled version
  - [ ] Initialization parameters correct
  - [ ] Contract responds to calls

### Verification

- [ ] **On-Chain Verification**
  - [ ] Source code verified on block explorer
  - [ ] Compiler version matches
  - [ ] Constructor arguments correct
  - [ ] Bytecode matches local compilation

- [ ] **Functional Verification**
  - [ ] Basic functions callable
  - [ ] Return values reasonable
  - [ ] State changes observable
  - [ ] Events emitted correctly

---

## Monitoring and Maintenance

### Runtime Security

- [ ] **Ongoing Monitoring**
  - [ ] Transaction success tracked
  - [ ] Failed transactions investigated
  - [ ] Unusual patterns detected
  - [ ] Error rates monitored

- [ ] **Alert Thresholds**
  - [ ] Unusual activity alerts set
  - [ ] High gas cost alerts active
  - [ ] Failed transaction alerts
  - [ ] Security event notifications

- [ ] **Incident Response**
  - [ ] Incident response plan documented
  - [ ] Contact list prepared
  - [ ] Emergency procedures rehearsed
  - [ ] Pause mechanism tested

### Maintenance

- [ ] **Regular Updates**
  - [ ] Dependencies kept current
  - [ ] Security patches applied
  - [ ] Breaking changes handled
  - [ ] Compatibility checked

- [ ] **Documentation Updates**
  - [ ] README kept current
  - [ ] Deployment guide updated
  - [ ] API documentation current
  - [ ] Known issues documented

- [ ] **Backup and Recovery**
  - [ ] Contract state backed up
  - [ ] Backup tested for restoration
  - [ ] Recovery procedures documented
  - [ ] Regular backup schedule

---

## FHE Security Pitfalls to Avoid

### ❌ Common Mistakes

- [ ] **Missing Permissions**
  ```solidity
  // ❌ WRONG: No permissions granted
  euint32 result = FHE.add(a, b);
  ```
  ```solidity
  // ✅ CORRECT
  euint32 result = FHE.add(a, b);
  FHE.allowThis(result);
  ```

- [ ] **Using Encrypted Values in Conditionals**
  ```solidity
  // ❌ WRONG: Can't compare handles directly
  if (encryptedValue > 100) { }
  ```
  ```solidity
  // ✅ CORRECT: Must use FHE.gt and FHE.select
  ebool condition = FHE.gt(encryptedValue, FHE.asEuint32(100));
  ```

- [ ] **Skipping Input Proof Validation**
  ```solidity
  // ❌ WRONG: No validation
  function setValue(euint32 value) external { }
  ```
  ```solidity
  // ✅ CORRECT: Always validate
  function setValue(externalEuint32 value, bytes calldata proof) external {
      euint32 validated = FHE.fromExternal(value, proof);
  }
  ```

- [ ] **Reusing Input Proofs**
  ```solidity
  // ❌ WRONG: Same proof twice
  contract.call1(handle, proof);
  contract.call2(handle, proof);  // FAILS
  ```
  ```solidity
  // ✅ CORRECT: Generate fresh proof for each call
  const proof1 = await encrypt(value1);
  const proof2 = await encrypt(value2);
  ```

- [ ] **Forgetting to Update Permissions**
  ```solidity
  // ❌ WRONG: Result has no permissions
  euint32 newValue = FHE.add(oldValue, amount);
  storage[key] = newValue;  // Can't use later
  ```
  ```solidity
  // ✅ CORRECT: Update permissions with new value
  euint32 newValue = FHE.add(oldValue, amount);
  FHE.allowThis(newValue);
  storage[key] = newValue;
  ```

### ✅ Best Practices

- [ ] Always validate external encrypted inputs with proofs
- [ ] Always grant permissions to operation results
- [ ] Always use encrypted comparisons for conditional logic
- [ ] Always test permission scenarios
- [ ] Always review permission management code
- [ ] Always assume data is sensitive by default

---

## Audit Sign-Off

```
Security Audit Checklist Completion

Date: ___________________
Auditor: ___________________
Internal/External: ___________________

Total Items: ____
Completed: ____
Passed: ____
Failed: ____
Not Applicable: ____

Critical Issues Found: ____
High Issues Found: ____
Medium Issues Found: ____
Low Issues Found: ____

Overall Security Rating: [Select]
☐ Excellent
☐ Good
☐ Acceptable
☐ Poor
☐ Rejected

Recommendations for Improvement:
_________________________________
_________________________________
_________________________________

Approved for Production: ☐ Yes ☐ No

Reviewer Signature: ___________________
```

---

## Resources

- [FHEVM Security Best Practices](https://docs.zama.ai/fhevm/security)
- [Smart Contract Audit Guide](https://docs.soliditylang.org/en/latest/security-considerations.html)
- [OWASP Smart Contract Top 10](https://owasp.org/www-project-smart-contract-top-10/)

---

**Use this checklist for:**
- Pre-deployment security review
- Internal security audits
- Third-party audit requirements
- Security assessment documentation
- Compliance verification

**Update this checklist when:**
- New contract features are added
- Security best practices evolve
- New vulnerabilities are discovered
- Major dependencies are updated
