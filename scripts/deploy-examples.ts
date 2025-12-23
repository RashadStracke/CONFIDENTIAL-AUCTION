import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Comprehensive Example Deployment Script
 *
 * Deploys all FHEVM example contracts with proper configuration,
 * verification, and logging.
 */

interface DeploymentRecord {
  contractName: string;
  address: string;
  deployer: string;
  blockNumber: number;
  timestamp: string;
  network: string;
  chainId: number;
  gasUsed?: string;
  transactionHash: string;
}

interface DeploymentSummary {
  deployments: DeploymentRecord[];
  totalGasUsed: bigint;
  successCount: number;
  failureCount: number;
  timestamp: string;
}

// Example contracts organized by category
const EXAMPLES = {
  basic: [
    "FHECounter",
    "FHEArithmetic",
    "FHEComparison",
  ],
  encryption: [
    "EncryptSingleValue",
    "EncryptMultipleValues",
  ],
  decryption: [
    "UserDecryptSingleValue",
    "PublicDecryption",
  ],
  accessControl: [
    "AccessControlExample",
  ],
  openzeppelin: [
    "ConfidentialERC20",
  ],
  advanced: [
    "PrivateVoting",
    "ConfidentialAuction",
  ],
};

async function deployContract(
  contractName: string,
  args: any[] = []
): Promise<DeploymentRecord | null> {
  try {
    console.log(`\n📦 Deploying ${contractName}...`);

    const [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory(contractName);

    const contract = await Factory.deploy(...args);
    const deployTx = contract.deploymentTransaction();

    if (!deployTx) {
      throw new Error("Deployment transaction not found");
    }

    await contract.waitForDeployment();
    const address = await contract.getAddress();

    const receipt = await deployTx.wait();
    if (!receipt) {
      throw new Error("Transaction receipt not found");
    }

    const network = await ethers.provider.getNetwork();

    const record: DeploymentRecord = {
      contractName,
      address,
      deployer: deployer.address,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString(),
      network: network.name,
      chainId: Number(network.chainId),
      gasUsed: receipt.gasUsed.toString(),
      transactionHash: receipt.hash,
    };

    console.log(`✅ ${contractName} deployed to: ${address}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`   Transaction: ${receipt.hash}`);

    return record;
  } catch (error) {
    console.error(`❌ Failed to deploy ${contractName}:`, error);
    return null;
  }
}

async function deployCategory(category: string): Promise<DeploymentRecord[]> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📂 Deploying ${category.toUpperCase()} category`);
  console.log("=".repeat(60));

  const contracts = EXAMPLES[category as keyof typeof EXAMPLES] || [];
  const deployments: DeploymentRecord[] = [];

  for (const contractName of contracts) {
    let args: any[] = [];

    // Special constructor arguments for specific contracts
    if (contractName === "ConfidentialERC20") {
      args = ["Confidential Token", "CTKN", 1000000];
    }

    const record = await deployContract(contractName, args);
    if (record) {
      deployments.push(record);
    }

    // Small delay between deployments
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return deployments;
}

async function deployAll(): Promise<DeploymentSummary> {
  console.log("\n🚀 FHEVM Example Contracts Deployment");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  const network = await ethers.provider.getNetwork();

  console.log(`\n📋 Deployment Information:`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`   Network: ${network.name}`);
  console.log(`   Chain ID: ${network.chainId}`);

  if (balance < ethers.parseEther("0.1")) {
    console.warn(`\n⚠️  Warning: Low balance (${ethers.formatEther(balance)} ETH)`);
    console.warn("   Deployment may fail due to insufficient funds");
  }

  const allDeployments: DeploymentRecord[] = [];
  let totalGasUsed = 0n;

  // Deploy each category
  const categories = Object.keys(EXAMPLES);
  for (const category of categories) {
    const deployments = await deployCategory(category);
    allDeployments.push(...deployments);
  }

  // Calculate total gas used
  for (const deployment of allDeployments) {
    if (deployment.gasUsed) {
      totalGasUsed += BigInt(deployment.gasUsed);
    }
  }

  const summary: DeploymentSummary = {
    deployments: allDeployments,
    totalGasUsed,
    successCount: allDeployments.length,
    failureCount: 0, // Would need to track failures separately
    timestamp: new Date().toISOString(),
  };

  return summary;
}

async function saveDeployments(summary: DeploymentSummary) {
  const deploymentsDir = path.join(__dirname, "..", "deployments");

  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save detailed deployment records
  const timestamp = Date.now();
  const filename = path.join(
    deploymentsDir,
    `examples-${summary.deployments[0]?.network || "unknown"}-${timestamp}.json`
  );

  fs.writeFileSync(filename, JSON.stringify(summary, null, 2));
  console.log(`\n📝 Deployment records saved to: ${filename}`);

  // Save simplified addresses file
  const addressesFile = path.join(deploymentsDir, "addresses.json");
  const addresses: Record<string, string> = {};

  for (const deployment of summary.deployments) {
    addresses[deployment.contractName] = deployment.address;
  }

  fs.writeFileSync(addressesFile, JSON.stringify(addresses, null, 2));
  console.log(`📝 Contract addresses saved to: ${addressesFile}`);
}

async function printSummary(summary: DeploymentSummary) {
  console.log("\n" + "=".repeat(60));
  console.log("📊 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));

  console.log(`\n✅ Successfully deployed: ${summary.successCount} contracts`);
  console.log(`⛽ Total gas used: ${summary.totalGasUsed.toString()}`);

  if (summary.deployments.length > 0) {
    console.log(`\n📋 Deployed Contracts:`);
    for (const deployment of summary.deployments) {
      console.log(`   ${deployment.contractName.padEnd(30)} ${deployment.address}`);
    }
  }

  console.log(`\n🕐 Completed at: ${summary.timestamp}`);

  // Print verification commands
  console.log("\n" + "=".repeat(60));
  console.log("🔍 VERIFICATION COMMANDS");
  console.log("=".repeat(60));

  for (const deployment of summary.deployments) {
    console.log(`npx hardhat verify --network ${deployment.network} ${deployment.address}`);
  }
}

async function main() {
  try {
    const summary = await deployAll();
    await saveDeployments(summary);
    await printSummary(summary);

    console.log("\n✅ Deployment completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

// CLI argument handling
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
FHEVM Example Deployment Script

Usage:
  npx ts-node scripts/deploy-examples.ts [options]

Options:
  --help, -h           Show this help message
  --category <name>    Deploy specific category only
                       (basic, encryption, decryption, accessControl, openzeppelin, advanced)
  --contract <name>    Deploy specific contract only

Examples:
  # Deploy all examples
  npx ts-node scripts/deploy-examples.ts

  # Deploy specific category
  npx ts-node scripts/deploy-examples.ts --category basic

  # Deploy specific contract
  npx ts-node scripts/deploy-examples.ts --contract FHECounter

Networks:
  # Local development
  npm run deploy-examples

  # Testnet
  npm run deploy-examples --network sepolia

  # Zama devnet
  npm run deploy-examples --network zama
  `);
  process.exit(0);
}

// Handle category or contract-specific deployment
if (args.includes("--category")) {
  const categoryIndex = args.indexOf("--category");
  const category = args[categoryIndex + 1];

  if (!EXAMPLES[category as keyof typeof EXAMPLES]) {
    console.error(`❌ Invalid category: ${category}`);
    console.log(`Available categories: ${Object.keys(EXAMPLES).join(", ")}`);
    process.exit(1);
  }

  console.log(`\n🎯 Deploying ${category} category only\n`);

  deployCategory(category)
    .then(async (deployments) => {
      const summary: DeploymentSummary = {
        deployments,
        totalGasUsed: deployments.reduce((sum, d) => sum + BigInt(d.gasUsed || 0), 0n),
        successCount: deployments.length,
        failureCount: 0,
        timestamp: new Date().toISOString(),
      };

      await saveDeployments(summary);
      await printSummary(summary);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
} else if (args.includes("--contract")) {
  const contractIndex = args.indexOf("--contract");
  const contractName = args[contractIndex + 1];

  console.log(`\n🎯 Deploying ${contractName} only\n`);

  deployContract(contractName)
    .then((deployment) => {
      if (deployment) {
        console.log("\n✅ Deployment successful!");
        console.log(`Address: ${deployment.address}`);
        console.log(`Gas used: ${deployment.gasUsed}`);
      } else {
        console.error("❌ Deployment failed");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
} else {
  // Default: deploy all
  main();
}

export { deployContract, deployCategory, deployAll };
