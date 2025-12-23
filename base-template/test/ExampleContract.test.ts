/**
 * @chapter: basic-operations
 * Example Contract Tests
 *
 * This test file demonstrates basic FHEVM testing patterns.
 * Replace with your own test cases.
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import type { ExampleContract } from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ExampleContract", function () {
  let exampleContract: ExampleContract;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const ExampleContractFactory = await ethers.getContractFactory(
      "ExampleContract"
    );
    exampleContract = await ExampleContractFactory.deploy();
    await exampleContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const address = await exampleContract.getAddress();
      expect(address).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Value Management", function () {
    it("Should get value", async function () {
      const value = await exampleContract.getValue();
      // In a real FHEVM environment, this would return an encrypted handle
      expect(value).to.exist;
    });

    // Note: In a real FHEVM environment, you would:
    // 1. Create encrypted input using fhevm instance
    // 2. Generate input proof
    // 3. Pass encrypted value and proof to setValue
    // Example:
    // const encryptedInput = await fhevm.createEncryptedInput(
    //   contractAddress,
    //   user1.address
    // );
    // encryptedInput.add32(42);
    // const { handles, inputProof } = await encryptedInput.encrypt();
    // await exampleContract.connect(user1).setValue(handles[0], inputProof);
  });
});
