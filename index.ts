import { createPublicClient, http, getContract } from 'viem';
import { baseSepolia } from 'viem/chains';
import { type Address, privateKeyToAccount } from 'viem/accounts';
import { SignProtocolClient, SpMode, EvmChains } from '@ethsign/sp-sdk';

const walletBalanceAbi = [
    {
        "inputs": [
            { "internalType": "address", "name": "user", "type": "address" },
            { "internalType": "address", "name": "token", "type": "address" }
        ],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
];

// WalletBalanceProvider is a smart contract in Aave protocol for querying balances.
const walletBalanceProvider = '0xdeB02056E277174566A1c425a8e60550142B70A2';

// Define token addresses for aUSDC (deposits) and vUSDC (borrowed tokens)
const aUSDC = '0xf53B60F4006cab2b3C4688ce41fD5362427A2A66';
const vUSDC = '0xe248511Fd529222f349C6Fd92328f6C5cd876Da0';
const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

const privateKey = process.env['PRIVATE_KEY'] as Address;
const account = privateKeyToAccount(privateKey);

// Public client to interact with Sepolia network
const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
});

// Contract instance to interact with WalletBalanceProvider
const contract = getContract({
    address: walletBalanceProvider,
    abi: walletBalanceAbi,
    client: publicClient,
});

// Function to fetch token balance of a user
async function fetchBalance(userAddress: Address, asset: Address): Promise<number> {
    try {
        const balance = await contract.read.balanceOf([userAddress, asset]);
        const readableBalance = Number(balance) / 1_000_000; // Assuming USDC has 6 decimal places
        return readableBalance;
    } catch (error) {
        console.error('Error fetching balance:', error);
        throw error;
    }
}

// Initialize SignProtocol client for schema creation
const client = new SignProtocolClient(SpMode.OnChain, {
    chain: EvmChains.baseSepolia,
    account: privateKeyToAccount(privateKey),
});

/**
 * Function to create an attestation for credit score data
 * @param data Credit score data including on-chain and off-chain scores
 * https://testnet-scan.sign.global/schema/onchain_evm_84532_0x264
 * https://docs.sign.global/for-builders/getting-started/index/building-a-simple-notary-platform/attestation-creation
 */
async function createAttestationForCreditScore(data: any) {
    try {
        const attestation = await client.createAttestation({
            schemaId: data.schemaId,
            data: data.data,
            indexingValue: data.userAddress
        });

        console.log('Created Attestation:', attestation);
        return attestation;
    } catch (error) {
        console.error('Error creating attestation:', error);
        throw error;
    }
}

/**
 * Main function to fetch balances and calculate borrowing capacity and utilization ratio.
 */
(async () => {
    try {
        const userAddress = '0x08C4E4BdAb2473E454B8B2a4400358792786d341';

        // Fetch balances for aUSDC (deposits), vUSDC (borrowed tokens), and USDC
        const aUSDCBalance = await fetchBalance(userAddress, aUSDC);
        const vUSDCBalance = await fetchBalance(userAddress, vUSDC);
        const usdcBalance = await fetchBalance(userAddress, USDC);

        // Borrow capacity calculation based on deposits and debt
        const borrowCapacity = (aUSDCBalance * 0.77) - vUSDCBalance;

        // Calculate the value between 0-1, which represents the utilization ratio
        const utilizationRatio = 1 - (vUSDCBalance / (aUSDCBalance + usdcBalance));
        const percentage = utilizationRatio * 100;

        console.table([
            { Token: 'aUSDC', Balance: aUSDCBalance },        // Deposited USDC
            { Token: 'vUSDC', Balance: vUSDCBalance },        // Borrowed USDC (debt)
            { Token: 'USDC', Balance: usdcBalance },          // USDC balance if relevant
            { Token: 'Borrow Capacity', Balance: borrowCapacity },  // Calculated capacity
            { Token: 'Utilization Percentage', Value: `${percentage.toFixed(2)}%` } // Utilization percentage
        ]);

        const creditScoreData = {
            schemaId: "0x264",
            data: [Math.floor(Number(percentage)),0],
            userAddress,
        };


        console.log(creditScoreData);


        // Create an attestation for the credit score data
        const attestation = await createAttestationForCreditScore(creditScoreData);

        console.log('Successfully created attestation:', attestation);
    } catch (error) {
        console.error('Error:', error);
    }
})();
