import { ethers } from "ethers";
import abi from "./abi.json";

const contractAddress = "0x379aC4ffeFf3D91A9F4Ffa55Ba37B73C751Ed63E"; // contract address

export const getContract = () => {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(contractAddress, abi, signer);
  }
  return null;
};
