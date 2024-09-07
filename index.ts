import { createPublicClient, http, getContract } from 'viem';
import { baseSepolia } from 'viem/chains';
import { type Address, privateKeyToAccount } from 'viem/accounts';

// Contract ABI and address
const contractAbi = [
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

const contractAddress = '0xdeB02056E277174566A1c425a8e60550142B70A2';
const tokenAddress = '0xf53B60F4006cab2b3C4688ce41fD5362427A2A66';

// Your private key for the account
const privateKey = process.env['PRIVATE_KEY'] as Address;
const account = privateKeyToAccount(privateKey);

// Create a viem public client
const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
});

// Instantiate the contract using viem's getContract method
const contract = getContract({
    address: contractAddress,
    abi: contractAbi,
    client: publicClient,
});

// Function to fetch the aUSDC balance for a given user
async function fetchAUSDCBalance(userAddress: Address): Promise<number> {
    try {
        // Interact with the contract using the method name and args
        const balance = await contract.read.balanceOf([userAddress, tokenAddress]);

        // Convert balance from wei (smallest unit) to human-readable format (USDC has 6 decimals)
        const readableBalance = Number(balance) / 1_000_000;
        return readableBalance;
    } catch (error) {
        console.error('Error fetching aUSDC balance:', error);
        throw error;
    }
}

// Example user address (replace with actual user address)
const userAddress = '0x08C4E4BdAb2473E454B8B2a4400358792786d341';

// Fetch the aUSDC balance and log it
(async () => {
    try {
        const aUSDCBalance = await fetchAUSDCBalance(userAddress);
        console.log(`User aUSDC Balance: ${aUSDCBalance}`);
    } catch (error) {
        console.error('Error:', error);
    }
})();
