pragma solidity ^0.5.0;
contract Ballot {

    event NewVote(uint proposal, address voter);

    struct Voter {
        uint weight; // weight is accumulated by delegation
        bool voted;  // if true, that person already voted
        address delegate; // person delegated to
        uint vote;   // index of the voted proposal
    }

    struct Proposal {
        bytes32 name;   // short name (up to 32 bytes)
        uint voteCount; // number of accumulated votes
    }

    address public m_chairperson;
    mapping(address => Voter) public m_voters;
    Proposal[] public m_proposals;
    uint public m_deadline;
    bool public m_allowDelegation;

    constructor(bytes32[] memory proposalNames, uint deadline, bool allowDelegation) public {
        m_chairperson = msg.sender;
        m_voters[m_chairperson].weight = 1;
        m_deadline = deadline;
        m_allowDelegation = allowDelegation;

        for (uint i = 0; i < proposalNames.length; i++) {
            m_proposals.push(Proposal({
                name: proposalNames[i],
                voteCount: 0
            }));
        }
    }

    function giveRightToVote(address voter) public {
        require(m_deadline > block.timestamp, "Ballot is over.");
        require(
            msg.sender == m_chairperson,
            "Only chairperson can give right to vote."
        );
        require(
            !m_voters[voter].voted,
            "The voter already voted."
        );
        require(m_voters[voter].weight == 0, "The voter already have right to vote");
        m_voters[voter].weight = 1;
    }

    function delegate(address to) public {
        require(m_allowDelegation, "Delegation is not allowed.");
        require(m_deadline > block.timestamp, "Ballot is over.");
        Voter storage sender = m_voters[msg.sender];
        require(!sender.voted, "You already voted.");
        require(to != msg.sender, "Self-delegation is disallowed.");

        while (m_voters[to].delegate != address(0)) {
            to = m_voters[to].delegate;
            require(to != msg.sender, "Found loop in delegation.");
        }

        sender.voted = true;
        sender.delegate = to;
        Voter storage delegate_ = m_voters[to];
        if (delegate_.voted) {
            m_proposals[delegate_.vote].voteCount += sender.weight;
        } else {
            delegate_.weight += sender.weight;
        }
    }

    function vote(uint proposal) public {
        require(m_deadline > block.timestamp, "Ballot is over.");
        Voter storage sender = m_voters[msg.sender];
        require(!sender.voted, "Already voted.");
        sender.voted = true;
        sender.vote = proposal;

        m_proposals[proposal].voteCount += sender.weight;
        emit NewVote(proposal, msg.sender);
    }

    function winningProposal() public view
            returns (uint winningProposal_)
    {
        uint winningVoteCount = 0;
        for (uint p = 0; p < m_proposals.length; p++) {
            if (m_proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = m_proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    function winnerName() public view
            returns (bytes32 winnerName_)
    {
        winnerName_ = m_proposals[winningProposal()].name;
    }
}
