import { createPublicClient, http, getContract } from 'viem';
import { baseSepolia } from 'viem/chains';
import { type Address, privateKeyToAccount } from 'viem/accounts';

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

/*WalletBalanceProvider is a smart contract or an API endpoint in the Aave protocol
 that provides users with details of their wallet's balances across different tokens */

const walletBalanceProvider = '0xdeB02056E277174566A1c425a8e60550142B70A2';

// aUSDC is an Aave-specific token representing the user's deposit of USDC into the Aave protocol.
const aUSDC = '0xf53B60F4006cab2b3C4688ce41fD5362427A2A66';
// vUSDC represents a variable-rate borrowing position for USDC.
const vUSDC = '0xe248511Fd529222f349C6Fd92328f6C5cd876Da0';

const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'

const privateKey = process.env['PRIVATE_KEY'] as Address;
const account = privateKeyToAccount(privateKey);

const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
});

const contract = getContract({
    address: walletBalanceProvider,
    abi: walletBalanceAbi,
    client: publicClient,
});

async function fetchBalance(userAddress: Address, asset: Address): Promise<number> {
    try {
        const balance = await contract.read.balanceOf([userAddress, asset]);
        const readableBalance = Number(balance) / 1_000_000;
        return readableBalance;
    } catch (error) {
        console.error('Error fetching aUSDC balance:', error);
        throw error;
    }
}
// User's address 
const userAddress = '0x08C4E4BdAb2473E454B8B2a4400358792786d341';

(async () => {
    try {
        // Fetch balances for aUSDC (deposits) and vUSDC (debt)
        const aUSDCBalance = await fetchBalance(userAddress, aUSDC);
        const vUSDCBalance = await fetchBalance(userAddress, vUSDC);
        const usdcBalance = await fetchBalance(userAddress, USDC); // Fetching USDC balance if needed

        // Borrow capacity calculation
        const borrowCapacity = (aUSDCBalance * 0.77) - vUSDCBalance;

        // Calculate the value between 0-1
        const utilizationRatio = 1 - (vUSDCBalance / (aUSDCBalance + usdcBalance));
        const percentage = utilizationRatio * 100;

        console.table([
            { Token: 'aUSDC', Balance: aUSDCBalance },        // Deposited USDC
            { Token: 'vUSDC', Balance: vUSDCBalance },        // Borrowed USDC (debt)
            { Token: 'USDC', Balance: usdcBalance },          // USDC balance if relevant
            { Token: 'Borrow Capacity', Balance: borrowCapacity },  // Calculated capacity
            { Token: 'Utilization Percentage', Value: `${percentage.toFixed(2)}%` } // Utilization percentage
        ]);

    } catch (error) {
        console.error('Error:', error);
    }
})();


/* {
        schemid: credit score

        onchainscore:   int ( 1 - (vtokens/(ausdc+usdc)) ) *  100  (0-1)
        offchainscore:  int()
        timestamp: 
    } */