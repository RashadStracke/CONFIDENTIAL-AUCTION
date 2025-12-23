# Summary

## Introduction

* [Overview](README.md)
* [Quick Start Guide](../README.md)
* [Examples Library](../examples/README.md)

## Getting Started

* [Developer Guide](../DEVELOPER_GUIDE.md)
* [Technical Architecture](../TECHNICAL_ARCHITECTURE.md)
* [Testing Guide](../TESTING_GUIDE.md)

## Basic Operations

* [FHE Counter](../examples/basic/FHECounter.md)
  * Introduction to encrypted state
  * Homomorphic addition and subtraction
  * Access control basics
* [FHE Arithmetic](../examples/basic/FHEArithmetic.md)
  * Addition, subtraction, multiplication
  * Division and remainder operations
  * Chaining operations
  * Mixing encrypted and plaintext values
* [FHE Comparison](../examples/basic/FHEComparison.md)
  * Equality and inequality checks
  * Greater than, less than comparisons
  * Conditional selection (FHE.select)
  * Boolean logic on encrypted data

## Encryption Patterns

* [Encrypt Single Value](../examples/encryption/EncryptSingleValue.md)
  * Converting external encrypted inputs
  * Zero-knowledge proof validation
  * Permission management
  * Common pitfalls and anti-patterns
* [Encrypt Multiple Values](../examples/encryption/EncryptMultipleValues.md)
  * Batch encryption in single transaction
  * Single input proof for multiple values
  * Struct-based encrypted storage
  * Selective permission granting

## Decryption Patterns

* [User Decrypt Single Value](../examples/decryption/UserDecryptSingleValue.md)
  * User-controlled private decryption
  * Decryption request patterns
  * Relayer callback mechanisms
  * Privacy-preserving decryption flow
* [Public Decryption](../examples/decryption/PublicDecryption.md)
  * When to use public decryption
  * Oracle-based decryption flow
  * Async decryption handling
  * Security considerations

## Access Control

* [Access Control Patterns](../examples/access-control/AccessControlExample.md)
  * FHE.allowThis() - Contract permission
  * FHE.allow() - User permission
  * FHE.allowTransient() - Temporary permission
  * Permission updates during operations
  * Selective access granting

## Advanced Patterns

* [Private Voting](../examples/advanced/PrivateVoting.md)
  * Encrypted vote storage
  * Homomorphic vote tallying
  * Privacy-preserving voting
  * Multi-step voting process
* [Confidential Auction](../contracts/ConfidentialAuction.md)
  * Blind auction with sealed bids
  * Encrypted bid management
  * Homomorphic bid comparison
  * Winner determination without decryption

## Automation & Tools

* [Automation Guide](../AUTOMATION_GUIDE.md)
* [Scripts Documentation](../scripts/README.md)
* [Create FHEVM Example](../scripts/create-fhevm-example.md)
* [Create FHEVM Category](../scripts/create-fhevm-category.md)
* [Generate Documentation](../scripts/generate-docs.md)

## API Reference

* [Contract Documentation](../CONTRACT_DOCUMENTATION.md)
* [Function Reference](../CONTRACT_DOCUMENTATION.md#api-reference)
* [Type Definitions](../TECHNICAL_ARCHITECTURE.md#fhe-types)

## Best Practices

* [Testing Strategies](../TESTING_GUIDE.md)
* [Security Considerations](../TECHNICAL_ARCHITECTURE.md#security)
* [Performance Optimization](../examples/README.md#performance-considerations)
* [Common Pitfalls](../examples/README.md#common-errors-and-solutions)

## Project Maintenance

* [Maintenance Guide](../MAINTENANCE_GUIDE.md)
* [Adding New Examples](../MAINTENANCE_GUIDE.md#adding-new-examples)
* [Updating Dependencies](../MAINTENANCE_GUIDE.md#dependency-updates)
* [Version Management](../MAINTENANCE_GUIDE.md#version-management)

## Competition Submission

* [Submission Overview](../SUBMISSION_OVERVIEW.md)
* [Requirements Checklist](../COMPETITION_REQUIREMENTS.md)
* [Submission Index](../SUBMISSION_INDEX.md)
* [Completion Summary](../PROJECT_COMPLETION_SUMMARY.md)

## Resources

* [FHEVM Documentation](https://docs.zama.ai/fhevm)
* [Hardhat Documentation](https://hardhat.org)
* [Solidity Documentation](https://docs.soliditylang.org)
* [Zama Community](https://community.zama.ai)
