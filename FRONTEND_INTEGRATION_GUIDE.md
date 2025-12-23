## FHEVM Frontend Integration Guide

Complete guide for integrating FHEVM contracts with frontend applications.

## Table of Contents

- [Setup and Dependencies](#setup-and-dependencies)
- [FHEVM Instance Initialization](#fhevm-instance-initialization)
- [Wallet Connection](#wallet-connection)
- [Encrypting Inputs](#encrypting-inputs)
- [Sending Transactions](#sending-transactions)
- [Decrypting Values](#decrypting-values)
- [React Integration](#react-integration)
- [Best Practices](#best-practices)
- [Complete Examples](#complete-examples)

---

## Setup and Dependencies

### Install Required Packages

```bash
npm install fhevmjs ethers@^6
```

**Package Purposes:**
- `fhevmjs`: Encryption, decryption, proof generation
- `ethers`: Blockchain interaction, wallet management

### TypeScript Setup

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true
  }
}
```

### Environment Configuration

```typescript
// config.ts
export const CONFIG = {
  // Network
  networkUrl: process.env.NEXT_PUBLIC_NETWORK_URL || 'https://devnet.zama.ai',
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '8009'),

  // FHEVM
  gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.zama.ai',
  publicKey: process.env.NEXT_PUBLIC_FHE_PUBLIC_KEY,

  // Contract addresses
  contractAddresses: {
    counter: process.env.NEXT_PUBLIC_CONTRACT_COUNTER,
    token: process.env.NEXT_PUBLIC_CONTRACT_TOKEN,
  },
};
```

---

## FHEVM Instance Initialization

### Create FHEVM Instance

```typescript
// fhevm.ts
import { createFhevmInstance, FhevmInstance } from 'fhevmjs';
import { CONFIG } from './config';

let fhevmInstance: FhevmInstance | null = null;

export async function initializeFhevm(): Promise<FhevmInstance> {
  if (fhevmInstance) {
    return fhevmInstance;
  }

  try {
    console.log('🔐 Initializing FHEVM...');

    fhevmInstance = await createFhevmInstance({
      networkUrl: CONFIG.networkUrl,
      gatewayUrl: CONFIG.gatewayUrl,
    });

    console.log('✅ FHEVM initialized');
    return fhevmInstance;
  } catch (error) {
    console.error('❌ FHEVM initialization failed:', error);
    throw error;
  }
}

export function getFhevmInstance(): FhevmInstance {
  if (!fhevmInstance) {
    throw new Error('FHEVM not initialized. Call initializeFhevm() first.');
  }
  return fhevmInstance;
}
```

### Usage

```typescript
// In your app initialization
import { initializeFhevm } from './fhevm';

async function initApp() {
  const fhevm = await initializeFhevm();
  // Now ready to encrypt/decrypt
}
```

---

## Wallet Connection

### Connect Wallet (MetaMask)

```typescript
// wallet.ts
import { BrowserProvider, Signer } from 'ethers';

export interface WalletState {
  connected: boolean;
  address: string | null;
  provider: BrowserProvider | null;
  signer: Signer | null;
  chainId: number | null;
}

export async function connectWallet(): Promise<WalletState> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    return {
      connected: true,
      address,
      provider,
      signer,
      chainId: Number(network.chainId),
    };
  } catch (error) {
    console.error('Wallet connection failed:', error);
    throw error;
  }
}

export async function switchNetwork(chainId: number): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: any) {
    // Network not added, add it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: 'Zama Devnet',
          rpcUrls: [CONFIG.networkUrl],
          nativeCurrency: {
            name: 'ZAMA',
            symbol: 'ZAMA',
            decimals: 18,
          },
        }],
      });
    } else {
      throw error;
    }
  }
}
```

---

## Encrypting Inputs

### Single Value Encryption

```typescript
// encryption.ts
import { getFhevmInstance } from './fhevm';

export async function encryptValue(
  value: number | bigint,
  contractAddress: string,
  userAddress: string,
  type: 'uint8' | 'uint16' | 'uint32' | 'uint64' = 'uint32'
): Promise<{ handle: string; proof: string }> {
  const fhevm = getFhevmInstance();

  // Create encrypted input for specific contract and user
  const encryptedInput = fhevm.createEncryptedInput(
    contractAddress,
    userAddress
  );

  // Add value based on type
  switch (type) {
    case 'uint8':
      encryptedInput.add8(Number(value));
      break;
    case 'uint16':
      encryptedInput.add16(Number(value));
      break;
    case 'uint32':
      encryptedInput.add32(Number(value));
      break;
    case 'uint64':
      encryptedInput.add64(BigInt(value));
      break;
  }

  // Generate encryption and proof
  const encrypted = encryptedInput.encrypt();

  return {
    handle: encrypted.handles[0],
    proof: encrypted.inputProof,
  };
}
```

### Multiple Values Encryption

```typescript
export async function encryptMultipleValues(
  values: Array<{ value: number | bigint; type: string }>,
  contractAddress: string,
  userAddress: string
): Promise<{ handles: string[]; proof: string }> {
  const fhevm = getFhevmInstance();

  const encryptedInput = fhevm.createEncryptedInput(
    contractAddress,
    userAddress
  );

  // Add all values
  for (const { value, type } of values) {
    switch (type) {
      case 'uint8':
        encryptedInput.add8(Number(value));
        break;
      case 'uint16':
        encryptedInput.add16(Number(value));
        break;
      case 'uint32':
        encryptedInput.add32(Number(value));
        break;
      case 'uint64':
        encryptedInput.add64(BigInt(value));
        break;
      case 'bool':
        encryptedInput.addBool(Boolean(value));
        break;
    }
  }

  // Single proof for all values
  const encrypted = encryptedInput.encrypt();

  return {
    handles: encrypted.handles,
    proof: encrypted.inputProof,
  };
}
```

### Example Usage

```typescript
// Encrypt single value
const { handle, proof } = await encryptValue(
  42,
  contractAddress,
  userAddress,
  'uint32'
);

// Encrypt multiple values
const { handles, proof: batchProof } = await encryptMultipleValues(
  [
    { value: 25, type: 'uint32' },     // age
    { value: 50000, type: 'uint64' },  // income
    { value: 750, type: 'uint32' },    // credit score
  ],
  contractAddress,
  userAddress
);
```

---

## Sending Transactions

### Send Encrypted Transaction

```typescript
// transactions.ts
import { Contract, Signer } from 'ethers';
import { encryptValue } from './encryption';

export async function sendEncryptedTransaction(
  contract: Contract,
  functionName: string,
  value: number | bigint,
  valueType: string,
  signer: Signer
): Promise<any> {
  const contractAddress = await contract.getAddress();
  const userAddress = await signer.getAddress();

  // Encrypt value and generate proof
  const { handle, proof } = await encryptValue(
    value,
    contractAddress,
    userAddress,
    valueType as any
  );

  // Call contract function with encrypted value and proof
  const tx = await contract[functionName](handle, proof);

  console.log('📤 Transaction sent:', tx.hash);

  // Wait for confirmation
  const receipt = await tx.wait();

  console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

  return receipt;
}
```

### Example: Counter Increment

```typescript
// Example: Increment FHECounter
import { ethers } from 'ethers';
import { sendEncryptedTransaction } from './transactions';
import FHECounterABI from './abis/FHECounter.json';

async function incrementCounter(amount: number) {
  const { signer } = await connectWallet();

  const contract = new ethers.Contract(
    CONFIG.contractAddresses.counter,
    FHECounterABI,
    signer
  );

  const receipt = await sendEncryptedTransaction(
    contract,
    'add',
    amount,
    'uint32',
    signer
  );

  return receipt;
}
```

---

## Decrypting Values

### Request Decryption

```typescript
// decryption.ts
import { Contract } from 'ethers';

export async function requestDecryption(
  contract: Contract,
  encryptedHandle: string
): Promise<string> {
  // Request decryption from oracle
  // Returns request ID for tracking

  const tx = await contract.requestDecrypt(encryptedHandle);
  const receipt = await tx.wait();

  // Extract request ID from event
  const event = receipt.logs
    .map((log: any) => contract.interface.parseLog(log))
    .find((e: any) => e?.name === 'DecryptionRequested');

  if (!event) {
    throw new Error('Decryption request event not found');
  }

  return event.args.requestId;
}

export async function getDecryptedValue(
  contract: Contract,
  requestId: string
): Promise<number | null> {
  // Poll for decrypted value
  // Returns null if not yet decrypted

  try {
    const result = await contract.getDecryptedResult(requestId);
    return Number(result);
  } catch {
    return null;
  }
}

export async function waitForDecryption(
  contract: Contract,
  requestId: string,
  maxWaitMs: number = 30000
): Promise<number> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const value = await getDecryptedValue(contract, requestId);

    if (value !== null) {
      return value;
    }

    // Wait 2 seconds before polling again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Decryption timeout');
}
```

### Example Usage

```typescript
// Request and wait for decryption
const requestId = await requestDecryption(contract, encryptedHandle);
console.log('Decryption requested:', requestId);

const decryptedValue = await waitForDecryption(contract, requestId);
console.log('Decrypted value:', decryptedValue);
```

---

## React Integration

### Custom Hook: useFHEVM

```typescript
// hooks/useFHEVM.tsx
import { useState, useEffect } from 'react';
import { initializeFhevm, getFhevmInstance } from '../fhevm';
import type { FhevmInstance } from 'fhevmjs';

export function useFHEVM() {
  const [fhevm, setFhevm] = useState<FhevmInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initializeFhevm()
      .then(instance => {
        setFhevm(instance);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { fhevm, loading, error };
}
```

### Custom Hook: useWallet

```typescript
// hooks/useWallet.tsx
import { useState, useEffect } from 'react';
import { connectWallet, WalletState } from '../wallet';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    provider: null,
    signer: null,
    chainId: null,
  });

  const connect = async () => {
    const state = await connectWallet();
    setWallet(state);
  };

  const disconnect = () => {
    setWallet({
      connected: false,
      address: null,
      provider: null,
      signer: null,
      chainId: null,
    });
  };

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        connect();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  return { wallet, connect, disconnect };
}
```

### Custom Hook: useContract

```typescript
// hooks/useContract.tsx
import { useState, useEffect } from 'react';
import { Contract } from 'ethers';
import { useWallet } from './useWallet';

export function useContract(address: string, abi: any) {
  const { wallet } = useWallet();
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (wallet.signer && address) {
      const contractInstance = new Contract(address, abi, wallet.signer);
      setContract(contractInstance);
    } else {
      setContract(null);
    }
  }, [wallet.signer, address, abi]);

  return contract;
}
```

---

## Complete Examples

### Example 1: Counter App Component

```typescript
// components/Counter.tsx
import React, { useState } from 'react';
import { useFHEVM } from '../hooks/useFHEVM';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { sendEncryptedTransaction } from '../transactions';
import FHECounterABI from '../abis/FHECounter.json';
import { CONFIG } from '../config';

export function Counter() {
  const { fhevm, loading: fhevmLoading } = useFHEVM();
  const { wallet, connect } = useWallet();
  const contract = useContract(CONFIG.contractAddresses.counter, FHECounterABI);

  const [amount, setAmount] = useState('1');
  const [txLoading, setTxLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  const handleIncrement = async () => {
    if (!contract || !wallet.signer) return;

    setTxLoading(true);
    try {
      const receipt = await sendEncryptedTransaction(
        contract,
        'add',
        parseInt(amount),
        'uint32',
        wallet.signer
      );

      setTxHash(receipt.hash);
      alert('Counter incremented successfully!');
    } catch (error) {
      console.error('Increment failed:', error);
      alert('Failed to increment counter');
    } finally {
      setTxLoading(false);
    }
  };

  if (fhevmLoading) {
    return <div>Initializing FHEVM...</div>;
  }

  if (!wallet.connected) {
    return (
      <div>
        <button onClick={connect}>Connect Wallet</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Confidential Counter</h2>
      <p>Connected: {wallet.address}</p>

      <div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to add"
        />
        <button onClick={handleIncrement} disabled={txLoading}>
          {txLoading ? 'Processing...' : 'Increment'}
        </button>
      </div>

      {txHash && (
        <p>
          Transaction: <a href={`https://explorer.zama.ai/tx/${txHash}`}>{txHash}</a>
        </p>
      )}
    </div>
  );
}
```

### Example 2: Token Transfer

```typescript
// components/TokenTransfer.tsx
import React, { useState } from 'react';
import { encryptValue } from '../encryption';
import { useContract } from '../hooks/useContract';
import { useWallet } from '../hooks/useWallet';
import ConfidentialERC20ABI from '../abis/ConfidentialERC20.json';

export function TokenTransfer() {
  const { wallet } = useWallet();
  const contract = useContract(CONFIG.contractAddresses.token, ConfidentialERC20ABI);

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!contract || !wallet.signer || !wallet.address) return;

    setLoading(true);
    try {
      const contractAddress = await contract.getAddress();

      // Encrypt amount
      const { handle, proof } = await encryptValue(
        BigInt(amount),
        contractAddress,
        wallet.address,
        'uint64'
      );

      // Send transfer transaction
      const tx = await contract.transfer(recipient, handle, proof);
      await tx.wait();

      alert('Transfer successful!');
      setRecipient('');
      setAmount('');
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Confidential Token Transfer</h2>

      <div>
        <input
          type="text"
          placeholder="Recipient address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>

      <div>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <button onClick={handleTransfer} disabled={loading}>
        {loading ? 'Transferring...' : 'Transfer'}
      </button>
    </div>
  );
}
```

---

## Best Practices

### Security

- ✅ Always validate contract addresses before encryption
- ✅ Verify user address matches msg.sender
- ✅ Never store private keys in frontend code
- ✅ Use HTTPS for all API calls
- ✅ Validate all user inputs before encryption

### Performance

- ✅ Initialize FHEVM instance once and reuse
- ✅ Cache contract instances
- ✅ Batch multiple values in single proof when possible
- ✅ Show loading states during encryption/transactions
- ✅ Use optimistic UI updates where appropriate

### User Experience

- ✅ Show clear error messages
- ✅ Display transaction status and progress
- ✅ Provide transaction links to block explorer
- ✅ Handle wallet connection errors gracefully
- ✅ Support wallet switching

### Error Handling

```typescript
// Always wrap FHE operations in try-catch
try {
  const { handle, proof } = await encryptValue(...);
  const tx = await contract.setValue(handle, proof);
  await tx.wait();
} catch (error: any) {
  if (error.code === 'ACTION_REJECTED') {
    console.log('User rejected transaction');
  } else if (error.message.includes('proof validation')) {
    console.error('Invalid proof - regenerate encryption');
  } else {
    console.error('Transaction failed:', error);
  }
}
```

---

## Testing Frontend Integration

```typescript
// __tests__/encryption.test.ts
import { encryptValue } from '../encryption';
import { initializeFhevm } from '../fhevm';

describe('Encryption', () => {
  beforeAll(async () => {
    await initializeFhevm();
  });

  it('should encrypt value correctly', async () => {
    const { handle, proof } = await encryptValue(
      42,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      'uint32'
    );

    expect(handle).toBeDefined();
    expect(proof).toBeDefined();
    expect(typeof handle).toBe('string');
    expect(typeof proof).toBe('string');
  });
});
```

---

## Resources

- [fhevmjs Documentation](https://docs.zama.ai/fhevmjs)
- [Ethers.js Documentation](https://docs.ethers.org)
- [React Best Practices](https://react.dev)
- [FHEVM Examples Repository](https://github.com/zama-ai/fhevm)

---

**Next Steps:**
1. Review [ANTI_PATTERNS_GUIDE.md](./ANTI_PATTERNS_GUIDE.md) for common mistakes
2. Check [INPUT_PROOF_GUIDE.md](./INPUT_PROOF_GUIDE.md) for proof details
3. See [TROUBLESHOOTING_FAQ.md](./TROUBLESHOOTING_FAQ.md) for debugging tips
