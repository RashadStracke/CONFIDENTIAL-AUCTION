import { ethers } from "hardhat";

/**
 * @chapter: automation
 * Base template deployment script
 *
 * This script serves as a template for deploying FHEVM example contracts.
 * Customize it for your specific contract deployment needs.
 */

async function main() {
  console.log("Deploying contracts...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (chainId: ${network.chainId})`);
  console.log();

  // Example: Deploy a basic contract
  // Modify this to match your contract name and constructor parameters

  try {
    // Get contract factory
    const ContractName = await ethers.getContractFactory("ContractName");

    // Deploy with optional constructor parameters
    // For example: const contract = await ContractName.deploy(param1, param2);
    const contract = await ContractName.deploy();

    // Wait for deployment to complete
    const deploymentTx = await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log(`✓ Contract deployed successfully`);
    console.log(`Contract address: ${contractAddress}`);
    console.log(`Deployment hash: ${deploymentTx}`);
    console.log();

    // Save deployment information
    saveDeploymentInfo({
      contractName: "ContractName",
      address: contractAddress,
      network: network.name,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
    });

    console.log("✓ Deployment information saved to deployments.json");

    // Verify contract (if on supported network)
    if (process.env.ETHERSCAN_API_KEY && network.name !== "hardhat") {
      console.log("\nVerifying contract on block explorer...");
      try {
        await verifyContract(contractAddress, []);
      } catch (error) {
        console.error("Verification failed:", error);
      }
    }
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

/**
 * Save deployment information to file
 */
function saveDeploymentInfo(info: any): void {
  const fs = require("fs");
  const path = require("path");

  const deploymentsPath = path.join(__dirname, "..", "deployments.json");

  let deployments: any = {};
  if (fs.existsSync(deploymentsPath)) {
    const content = fs.readFileSync(deploymentsPath, "utf-8");
    deployments = JSON.parse(content);
  }

  deployments[info.network] = info;

  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
}

/**
 * Verify contract on block explorer
 */
async function verifyContract(
  address: string,
  constructorArgs: any[]
): Promise<void> {
  try {
    await ethers.provider.send("hardhat_verify", [
      {
        address,
        constructorArguments: constructorArgs,
      },
    ]);
  } catch (error) {
    // Verification might not be available on all networks
    console.warn("Contract verification not available on this network");
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
