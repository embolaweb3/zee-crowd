import { useState } from "react";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { getContract } from "../../utils/contract";
import { ethers } from "ethers";
import { toast } from "react-toastify";

export default function CreateCampaign() {
  const [goalAmount, setGoalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const createCampaign = async () => {
    const contract = getContract();
    if (contract) {
      try {
        setIsLoading(true);
        const tx = await contract.createCampaign(ethers.utils.parseEther(goalAmount.toString()));
        await tx.wait();
        toast.success("Campaign created successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to create campaign.");
      } finally {
        setIsLoading(false);
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
            disabled={isLoading}
          />
        </InputGroup>
        <Button variant="success" onClick={createCampaign} disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Creating...
            </>
          ) : (
            "Create"
          )}
        </Button>
      </Form>
    </div>
  );
}
