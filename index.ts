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

const walletBalanceProvider = '0xdeB02056E277174566A1c425a8e60550142B70A2';
const aUSDC = '0xf53B60F4006cab2b3C4688ce41fD5362427A2A66';

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

async function fetchAUSDCBalance(userAddress: Address): Promise<number> {
    try {
        const balance = await contract.read.balanceOf([userAddress, aUSDC]);
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
        const aUSDCBalance = await fetchAUSDCBalance(userAddress);
        console.log(`aUSDC: ${aUSDCBalance}`);
    } catch (error) {
        console.error('Error:', error);
    }
})();
