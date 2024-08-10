// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@zetachain/toolkit/contracts/OnlySystem.sol";

/**
 * @title Crowdfunding
 * @dev A contract for creating and managing crowdfunding campaigns on the ZetaChain.
 * Inherits from zContract and OnlySystem for cross-chain functionality and system-level access control.
 */
contract Crowdfunding is zContract, OnlySystem {

    /**
     * @dev Structure representing a crowdfunding campaign.
     * @param creator The address of the campaign creator.
     * @param goalAmount The funding goal for the campaign.
     * @param deadline The timestamp until which the campaign is active.
     * @param fundsRaised The total amount of funds raised so far.
     * @param isSuccessful Indicates if the campaign reached its funding goal.
     * @param isWithdrawn Indicates if the funds have been withdrawn by the creator.
     * @param isCanceled Indicates if the campaign has been canceled.
     */
    struct Campaign {
        address payable creator;
        uint goalAmount;
        uint deadline;
        uint fundsRaised;
        bool isSuccessful;
        bool isWithdrawn;
        bool isCanceled;
    }

    // Mapping from campaign ID to Campaign details.
    mapping(uint => Campaign) public campaigns;
    
    // The number of campaigns created.
    uint public campaignCount = 0;

    // Mapping from campaign ID to contributor address to contribution amount.
    mapping(uint => mapping(address => uint)) public contributions;
    
    // Mapping from campaign ID to a list of contributor addresses.
    mapping(uint => address[]) public contributors;

    // Events emitted by various actions in the contract.
    event CampaignCreated(uint campaignId, address creator, uint goalAmount, uint deadline);
    event ContributionReceived(uint campaignId, address contributor, uint amount);
    event FundsWithdrawn(uint campaignId, address creator, uint amount);
    event CampaignCanceled(uint campaignId, address creator);
    event OwnershipTransferred(uint campaignId, address oldOwner, address newOwner);
    event DeadlineExtended(uint campaignId, uint newDeadline);

    // The system contract that enables cross-chain functionality.
    SystemContract public systemContract;

    /**
     * @dev Constructor to initialize the contract with the address of the system contract.
     * @param systemContractAddress The address of the SystemContract on ZetaChain.
     */
    constructor(address systemContractAddress) {
        systemContract = SystemContract(systemContractAddress);
    }

    /**
     * @dev Modifier to restrict access to the campaign creator.
     * @param _campaignId The ID of the campaign.
     */
    modifier onlyCreator(uint _campaignId) {
        require(msg.sender == campaigns[_campaignId].creator, "Only the campaign creator can call this.");
        _;
    }

    /**
     * @dev Modifier to check if a campaign exists.
     * @param _campaignId The ID of the campaign.
     */
    modifier campaignExists(uint _campaignId) {
        require(_campaignId < campaignCount, "Campaign does not exist.");
        _;
    }

    /**
     * @dev Modifier to check if a campaign is still active.
     * @param _campaignId The ID of the campaign.
     */
    modifier campaignActive(uint _campaignId) {
        require(block.timestamp < campaigns[_campaignId].deadline, "Campaign is no longer active.");
        _;
    }

    /**
     * @dev Modifier to check if a campaign has not been canceled.
     * @param _campaignId The ID of the campaign.
     */
    modifier campaignNotCanceled(uint _campaignId) {
        require(!campaigns[_campaignId].isCanceled, "Campaign is canceled.");
        _;
    }

    /**
     * @dev Creates a new crowdfunding campaign.
     * @param _goalAmount The funding goal for the campaign.
     */
    function createCampaign(uint _goalAmount) public {
        require(_goalAmount > 0, "Goal amount should be greater than zero.");

        uint fixedDuration = 5 minutes; // Fixed deadline of 5 minutes

        campaigns[campaignCount] = Campaign({
            creator: payable(msg.sender),
            goalAmount: _goalAmount,
            deadline: block.timestamp + fixedDuration,
            fundsRaised: 0,
            isSuccessful: false,
            isWithdrawn: false,
            isCanceled: false
        });

        emit CampaignCreated(campaignCount, msg.sender, _goalAmount, block.timestamp + fixedDuration);
        campaignCount++;
    }

    /**
     * @dev Allows a user to contribute to an active campaign.
     * @param _campaignId The ID of the campaign.
     */
    function contribute(uint _campaignId) external payable campaignExists(_campaignId) campaignActive(_campaignId) campaignNotCanceled(_campaignId) {
        require(msg.value > 0, "Contribution should be greater than zero.");

        Campaign storage campaign = campaigns[_campaignId];
        campaign.fundsRaised += msg.value;
        contributions[_campaignId][msg.sender] += msg.value;
        contributors[_campaignId].push(msg.sender);

        emit ContributionReceived(_campaignId, msg.sender, msg.value);

        if (campaign.fundsRaised >= campaign.goalAmount) {
            campaign.isSuccessful = true;
        }
    }

    /**
     * @dev Allows the campaign creator to withdraw funds if the campaign is successful.
     * @param _campaignId The ID of the campaign.
     */
    function withdrawFunds(uint _campaignId) external onlyCreator(_campaignId) campaignExists(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp >= campaign.deadline, "Campaign is still active.");
        require(campaign.isSuccessful, "Campaign did not reach its goal.");
        require(!campaign.isWithdrawn, "Funds already withdrawn.");
        require(!campaign.isCanceled, "Campaign is canceled.");

        campaign.isWithdrawn = true;
        (bool success, ) = campaign.creator.call{ value: campaign.fundsRaised }("");
        require(success, "Transfer failed.");

        emit FundsWithdrawn(_campaignId, campaign.creator, campaign.fundsRaised);
    }

    /**
     * @dev Allows contributors to get a refund if the campaign fails.
     * @param _campaignId The ID of the campaign.
     */
    function getRefund(uint _campaignId) external campaignExists(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp >= campaign.deadline, "Campaign is still active.");
        require(!campaign.isSuccessful, "Campaign reached its goal.");
        require(!campaign.isCanceled, "Campaign is canceled.");

        uint amountContributed = contributions[_campaignId][msg.sender];
        require(amountContributed > 0, "No contributions found.");

        contributions[_campaignId][msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{ value: amountContributed }("");
        require(success, "Refund transfer failed.");
    }

    /**
     * @dev Allows the campaign creator to cancel the campaign if it's still active and hasn't reached its goal.
     * @param _campaignId The ID of the campaign.
     */
    function cancelCampaign(uint _campaignId) external onlyCreator(_campaignId) campaignExists(_campaignId) campaignNotCanceled(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp < campaign.deadline, "Campaign is no longer active.");
        require(campaign.fundsRaised < campaign.goalAmount, "Campaign has already reached its goal.");

        campaign.isCanceled = true;

        emit CampaignCanceled(_campaignId, msg.sender);
    }

    /**
     * @dev Allows the campaign creator to transfer ownership of the campaign to a new address.
     * @param _campaignId The ID of the campaign.
     * @param newOwner The address of the new owner.
     */
    function transferOwnership(uint _campaignId, address newOwner) external onlyCreator(_campaignId) campaignExists(_campaignId) {
        require(newOwner != address(0), "New owner address cannot be zero.");

        address oldOwner = campaigns[_campaignId].creator;
        campaigns[_campaignId].creator = payable(newOwner);

        emit OwnershipTransferred(_campaignId, oldOwner, newOwner);
    }

    /**
     * @dev Allows the campaign creator to extend the deadline of the campaign.
     * @param _campaignId The ID of the campaign.
     * @param newDuration The amount of time to extend the deadline by.
     */
    function extendDeadline(uint _campaignId, uint newDuration) public onlyCreator(_campaignId) campaignExists(_campaignId) campaignActive(_campaignId) {
        require(newDuration > 0, "New duration should be greater than zero.");

        campaigns[_campaignId].deadline += newDuration;

        emit DeadlineExtended(_campaignId, campaigns[_campaignId].deadline);
    }

    /**
     * @dev Returns the details of a campaign.
     * @param _campaignId The ID of the campaign.
     * @return creator The address of the campaign creator.
     * @return goalAmount The funding goal of the campaign.
     * @return deadline The timestamp of the campaign's deadline.
     * @return fundsRaised The total funds raised for the campaign.
     * @return isSuccessful Indicates if the campaign reached its goal.
     * @return isWithdrawn Indicates if the funds have been withdrawn by the creator.
     * @return isCanceled Indicates if the campaign has been canceled.
     */
    function getCampaignDetails(uint _campaignId) external view campaignExists(_campaignId) returns (address, uint, uint, uint, bool, bool, bool) {
        Campaign memory campaign = campaigns[_campaignId];
        return (campaign.creator, campaign.goalAmount, campaign.deadline, campaign.fundsRaised, campaign.isSuccessful, campaign.isWithdrawn, campaign.isCanceled);
    }

    /**
     * @dev Handles cross-chain calls. It interprets the message and triggers appropriate actions.
     * @param context The context of the cross-chain call.
     * @param zrc20 The address of the ZRC20 token involved in the call.
     * @param amount The amount of ZRC20 tokens transferred.
     * @param message The encoded message containing the function name and parameters.
     */
    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external virtual override onlySystem(systemContract) {
        (string memory functionName, uint256 campaignId, uint256 goalAmount, uint256 newDuration) = abi.decode(message, (string, uint256, uint256, uint256));

        if (keccak256(abi.encodePacked(functionName)) == keccak256(abi.encodePacked("createCampaign"))) {
            createCampaign(goalAmount);
        } else if (keccak256(abi.encodePacked(functionName)) == keccak256(abi.encodePacked("extendDeadline"))) {
            extendDeadline(campaignId, newDuration);
        }
    }
}
