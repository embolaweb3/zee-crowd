import { Button } from "react-bootstrap";
import { getContract } from "../utils/contract";
import { toast } from "react-toastify";


export default function WithdrawFunds({ campaignId }) {
  const withdrawFunds = async () => {
    const contract = getContract();
    if (contract) {
      try {
        const tx = await contract.withdrawFunds(campaignId);
        await tx.wait();
        toast.success("Funds withdrawn successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to withdraw funds.");
      }
    }
  };

  return (
    <div className="mt-4">
      <Button variant="warning" onClick={withdrawFunds}>
        Withdraw Funds
      </Button>
    </div>
  );
}
