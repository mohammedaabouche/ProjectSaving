// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SavingsVault {
    struct Account {
        uint256 balance;
        uint256 lastInterestTimestamp;
    }

    mapping(address => Account) private accounts;
    uint256 public interestRate; // Taux d'intérêt annuel en pourcentage (e.g., 5 pour 5%)
    uint256 public interestInterval = 365 days; // Période pour un taux d’intérêt annuel (1 an en secondes)

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event InterestAccumulated(address indexed user, uint256 interest);

    constructor(uint256 _interestRate) {
        interestRate = _interestRate;
    }

    // Mise à jour des intérêts pour un utilisateur
    modifier updateInterest(address user) {
        uint256 elapsed = block.timestamp - accounts[user].lastInterestTimestamp;
        if (elapsed > 0 && accounts[user].balance > 0) {
            uint256 interest = (accounts[user].balance * interestRate * elapsed) / (interestInterval * 100);
            accounts[user].balance += interest;
            accounts[user].lastInterestTimestamp = block.timestamp;
            emit InterestAccumulated(user, interest);
        }
        _;
    }

    // Fonction de dépôt avec mise à jour des intérêts
    function deposit() external payable updateInterest(msg.sender) {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        accounts[msg.sender].balance += msg.value;
        accounts[msg.sender].lastInterestTimestamp = block.timestamp;
        emit Deposit(msg.sender, msg.value);
    }

    // Fonction de retrait avec mise à jour des intérêts
    function withdraw(uint256 amount) external updateInterest(msg.sender) {
        require(amount <= accounts[msg.sender].balance, "Insufficient balance");
        accounts[msg.sender].balance -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdraw(msg.sender, amount);
    }

    // Fonction pour obtenir le solde, incluant les intérêts accumulés
    function getBalance() external view returns (uint256) {
        uint256 elapsed = block.timestamp - accounts[msg.sender].lastInterestTimestamp;
        uint256 interest = (accounts[msg.sender].balance * interestRate * elapsed) / (interestInterval * 100);
        return accounts[msg.sender].balance + interest;
    }
}
