pragma solidity ^0.4.17;

contract CampaignFactory {
    address[] public deployedContracts;

    function getDeployedContracts() public view returns (address[]) {
        return deployedContracts;
    }

    function createCampaign(uint minContribution) public {
        address newContractInstance = new Campaign(minContribution, msg.sender);

        deployedContracts.push(newContractInstance);
    }
}

contract Campaign {
    address public manager;
    uint public minimumContribution;
    mapping(address => bool) public approvers;
    uint public approversCount;
    Request[] public requests;
    
    struct Request {
        string description;
        address recipient;
        uint value;
        bool complete;
        mapping(address => bool) approvals;
        uint approvalCount;
    }
    
    function Campaign(uint minContribution, address creator) public {
        manager = creator;
        minimumContribution = minContribution;
        approversCount = 0;
    }

    function createRequest(string desc, uint val, address vendorAddress) public {
        require(msg.sender == manager, "Only the manager can do this.");

        Request memory newRequest = Request({
            description: desc,
            value: val,
            recipient: vendorAddress,
            approvalCount: 0,
            complete: false
        });

        requests.push(newRequest);
    }

    function getNumRequests() public view returns (uint) {
        return requests.length;
    }

    function approveRequest(uint index) public {
        require(approvers[msg.sender], "You must be an approver to do that");

        Request storage targetRequest = requests[index];
        require(targetRequest.approvals[msg.sender] == false, "You've already voted on this request");

        targetRequest.approvals[msg.sender] = true;
        targetRequest.approvalCount++;
    } 

    function finalizeRequest(uint index) public {
        require(msg.sender == manager, "Only the contract manager can finalize a request");
        Request storage targetRequest = requests[index];
        require(targetRequest.complete == false, "This request is already complete.");
        require(targetRequest.value <= address(this).balance, "Contract balance is too low to fulfill this request");
        require(targetRequest.approvalCount > (approversCount / 2), "50% of approvers must approve of this before it can complete");

        targetRequest.recipient.transfer(targetRequest.value);
        targetRequest.complete = true;
    }

    function getUsersVoteForRequest(uint index, address user) public view returns (bool) {
        return requests[index].approvals[user];
    }

    function isApprover(address user) public view returns (bool) {
        return approvers[user];
    }

    function contribute() public payable {
        require(msg.value > minimumContribution, "Below minimum contribution");

        if(approvers[msg.sender] == false) {
            approversCount++;
        }
        approvers[msg.sender] = true;
    }
}