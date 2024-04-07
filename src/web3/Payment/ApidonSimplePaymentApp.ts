import { ethers } from "ethers";

import apidonSimplePaymentContract from "./ApidonSimplePaymentContract.json";

const apidonSimplePaymentContractAddressSepolia = process.env
  .APIDON_SIMPLE_PAYMENT_CONTRACT_ADDRESS as string;

const provider = new ethers.JsonRpcProvider(
  process.env.ALCHEMY_SEPOLIA_URL_ENDPOINT
);

const wallet = new ethers.Wallet(
  process.env.WEB3_PRIVATE_WALLET_ADDRESS as string,
  provider
);

const apidonPayment = new ethers.Contract(
  apidonSimplePaymentContractAddressSepolia,
  apidonSimplePaymentContract.abi,
  wallet
);

export { apidonPayment };
