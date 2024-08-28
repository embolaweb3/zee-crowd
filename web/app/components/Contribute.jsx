import { useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { getContract } from "../utils/contract";
import { ethers } from "ethers";
import { toast } from "react-toastify";


export default function Contribute({ campaignId }) {
  const [amount, setAmount] = useState(0);

  const contribute = async () => {
    const contract = getContract();
    if (contract) {
      try {
        const tx = await contract.contribute(campaignId, { value: ethers.utils.parseEther(amount.toString()) });
        await tx.wait();
        toast.success("Contribution successful!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to contribute.");
      }
    }
  };

  return (
    <div className="mt-4">
      <h2>Contribute to Campaign</h2>
      <Form>
        <InputGroup className="mb-3">
          <Form.Control
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (in ETH)"
          />
        </InputGroup>
        <Button variant="primary" onClick={contribute}>
          Contribute
        </Button>
      </Form>
    </div>
  );
}
