pragma solidity ^0.4.17;

contract Campaign {
    address public manager;
    uint public minimumContribution;
    address[] public approvers;
    Requestq[] public requests;
    
    struct Requestq {
        address vendorAddress;
    }
    
    function Campaign(uint minContribution) public {
        manager = msg.sender;
        minimumContribution = minContribution;
    }

    function getApprovers() public view returns (address[]) {
        return approvers;
    }

    // hmm we cant yet return struct objects. There's a work around where you return all the fields individually,
    // but thats kinda lame. let's see what Stephen has to say.
    // function getRequests() public view returns (Requestq[]) {
    //     return requests;
    // }
}