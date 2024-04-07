import { ethers } from "ethers";

import apidonNFTContract from "./ApidonNFTContract.json";

export const apidonNFTSepoliaContractAddress = process.env
  .NEXT_PUBLIC_APIDON_NFT_CONTRACT_ADDRESS as string;

const provider = new ethers.JsonRpcProvider(
  process.env.ALCHEMY_SEPOLIA_URL_ENDPOINT
);

const walletPrivateAddress = process.env.WEB3_PRIVATE_WALLET_ADDRESS as string;
const wallet = new ethers.Wallet(walletPrivateAddress, provider);

export const apidonNFT = new ethers.Contract(
  apidonNFTSepoliaContractAddress,
  apidonNFTContract.abi,
  wallet
);