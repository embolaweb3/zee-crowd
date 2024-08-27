import { useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { getContract } from "../../utils/contract";
import { ethers } from "ethers";

export default function CreateCampaign() {
  const [goalAmount, setGoalAmount] = useState(0);

  const createCampaign = async () => {
    const contract = getContract();
    if (contract) {
      try {
        const tx = await contract.createCampaign(ethers.utils.parseEther(goalAmount.toString()));
        await tx.wait();
        alert("Campaign created successfully!");
      } catch (error) {
        console.error(error);
        alert("Failed to create campaign.");
      }
    }
  };

  return (
    <div className="mt-4">
      <h2>Create Campaign</h2>
      <Form>
        <InputGroup className="mb-3">
          <Form.Control
            type="number"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            placeholder="Goal Amount (in ETH)"
          />
        </InputGroup>
        <Button variant="success" onClick={createCampaign}>
          Create
        </Button>
      </Form>
    </div>
  );
}
