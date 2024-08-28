import { useState, useEffect } from "react";
import { Card, Button, ProgressBar } from "react-bootstrap";
import { getContract } from "../utils/contract";
import { ethers } from "ethers";
import 'animate.css';

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    const contract = getContract();
    if (contract) {
      const campaignCount = await contract.campaignCount();
      const campaignList = [];

      for (let i = 0; i < campaignCount; i++) {
        const campaign = await contract.getCampaignDetails(i);
        campaignList.push({
          id: i,
          creator: campaign[0],
          goalAmount: ethers.utils.formatEther(campaign[1]),
          deadline: new Date(campaign[2] * 1000),
          fundsRaised: ethers.utils.formatEther(campaign[3]),
          isSuccessful: campaign[4],
          isWithdrawn: campaign[5],
          isCanceled: campaign[6],
        });
      }

      setCampaigns(campaignList);
    }
  };

  return (
    <div className="mt-4">
      <h2>Active Campaigns</h2>
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
              <Button 
                variant="primary" 
                className="mt-3"
                disabled={campaign.isSuccessful}
              >
                {campaign.isSuccessful ? "Successful" : "Contribute"}
              </Button>
            )}
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
