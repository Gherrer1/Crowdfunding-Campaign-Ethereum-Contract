pragma solidity ^0.4.17;

contract Campaign {
    address public manager;
    uint public minimumContribution;
    mapping(address => bool) public approvers;
    Request[] public requests;
    
    struct Request {
        string description;
        address recipient;
        uint value;
        bool complete;
        mapping(address => bool) approvals;
        uint approvalCount;
    }
    
    function Campaign(uint minContribution) public {
        manager = msg.sender;
        minimumContribution = minContribution;
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

    function getApprovalCountForRequest(uint index) public view returns (uint) {
        return requests[index].approvalCount;
    }

    function getUsersVoteForRequest(uint index, address user) public view returns (bool) {
        return requests[index].approvals[user];
    }

    function isApprover(address user) public view returns (bool) {
        return approvers[user];
    }

    function contribute() public payable {
        require(msg.value > minimumContribution, "Below minimum contribution");

        approvers[msg.sender] = true;
    }

    // hmm we cant yet return struct objects. There's a work around where you return all the fields individually,
    // but thats kinda lame. let's see what Stephen has to say.
    // function getRequests() public view returns (Requestq[]) {
    //     return requests;
    // }
}