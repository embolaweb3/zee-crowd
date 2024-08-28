import { useState, useEffect } from "react";
import { Button, Card, ProgressBar, Form, Spinner } from "react-bootstrap";
import { getContract } from "../../utils/contract";
import { toast } from "react-toastify";
import { ethers } from "ethers";

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState({});
  const [contributions, setContributions] = useState({});

  useEffect(() => {
    const fetchCampaigns = async () => {
      const contract = getContract();
      if (contract) {
        try {
          const campaignCount = await contract.campaignCount();
          const fetchedCampaigns = [];
          for (let i = 0; i < campaignCount; i++) {
            const campaign = await contract.campaigns(i);
            fetchedCampaigns.push({
              id: i,
              creator: campaign.creator,
              goalAmount: ethers.utils.formatEther(campaign.goalAmount),
              fundsRaised: ethers.utils.formatEther(campaign.fundsRaised),
              deadline: new Date(campaign.deadline * 1000),
              isSuccessful: campaign.isSuccessful,
              isWithdrawn: campaign.isWithdrawn,
              isCanceled: campaign.isCanceled,
            });
          }
          setCampaigns(fetchedCampaigns);
        } catch (error) {
          console.error("Failed to fetch campaigns:", error);
        }
      }
    };

    fetchCampaigns();
  }, []);

  const handleContributionChange = (campaignId, value) => {
    setContributions((prev) => ({
      ...prev,
      [campaignId]: value,
    }));
  };

  const contribute = async (campaignId) => {
    const contract = getContract();
    const amount = contributions[campaignId];
    if (contract && amount) {
      try {
        setIsLoading((prev) => ({ ...prev, [campaignId]: true }));
        const tx = await contract.contribute(campaignId, { value: ethers.utils.parseEther(amount) });
        await tx.wait();
        toast.success("Contribution successful!");
      } catch (error) {
        console.error("Failed to contribute:", error);
        toast.error("Failed to contribute.");
      } finally {
        setIsLoading((prev) => ({ ...prev, [campaignId]: false }));
      }
    } else {
      toast.error("Please enter a valid contribution amount.");
    }
  };

  return (
    <div className="mt-4">
      <h2 className="animate__animated animate__fadeInDown">Active Campaigns</h2>
      {campaigns.map((campaign) => (
        <Card className="mb-3 shadow-sm animate__animated animate__fadeInUp" key={campaign.id}>
          <Card.Body>
            <Card.Title>Campaign #{campaign.id}</Card.Title>
            <Card.Text>
              <strong>Creator:</strong> {campaign.creator}<br/>
              <strong>Goal:</strong> {campaign.goalAmount} ETH<br/>
              <strong>Funds Raised:</strong> {campaign.fundsRaised} ETH<br/>
              <strong>Deadline:</strong> {campaign.deadline.toLocaleString()}<br/>
              <strong>Status:</strong> {campaign.isCanceled ? "Canceled" : campaign.isSuccessful ? "Successful" : "Ongoing"}
            </Card.Text>
            <ProgressBar 
              now={(campaign.fundsRaised / campaign.goalAmount) * 100}
              label={`${((campaign.fundsRaised / campaign.goalAmount) * 100).toFixed(2)}%`}
            />
            {!campaign.isCanceled && !campaign.isWithdrawn && (
              <div className="mt-3">
                <Form.Control
                  type="number"
                  step="0.01"
                  placeholder="Enter amount in ETH"
                  value={contributions[campaign.id] || ""}
                  onChange={(e) => handleContributionChange(campaign.id, e.target.value)}
                  className="mb-2"
                />
                <Button 
                  variant="primary" 
                  className={`${isLoading[campaign.id] ? 'animate__animated animate__pulse animate__infinite' : ''}`}
                  onClick={() => contribute(campaign.id)}
                  disabled={isLoading[campaign.id] || campaign.isSuccessful}
                >
                  {isLoading[campaign.id] ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Contributing...
                    </>
                  ) : campaign.isSuccessful ? "Successful" : "Contribute"}
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
