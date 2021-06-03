// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

contract Electron {
  // Model a Candidate
  struct Candidate {
    uint id;
    string name;
    uint voteCount;
  }

  // Read/Write candidate
  mapping(uint => Candidate) public candidates;

  // Store Candidates Count
  uint public candidatesCount;

  // Store accounts that have voted
  mapping(address => bool) public voters;

  event votedEvent(uint indexed _candidateId);

  constructor() public {
    addCandidate("Candidate 1");
    addCandidate("Candidate 2");
  }

  function addCandidate(string memory _name) private {
    candidatesCount++;
    candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
  }

  function vote(uint _candidateId) public {
    // require that they haven't voted before
    require(!voters[msg.sender]);

    // require valid candidate
    require(_candidateId > 0 && _candidateId <= candidatesCount);

    // record that voter has voted
    voters[msg.sender] = true;

    // update candidate vote count
    candidates[_candidateId].voteCount++;

    // trigger voted event
    votedEvent(_candidateId);
  }
}