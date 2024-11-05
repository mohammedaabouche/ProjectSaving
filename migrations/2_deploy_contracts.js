const SavingsVault = artifacts.require("SavingsVault");

module.exports = function(deployer) {
  deployer.deploy(SavingsVault, 5); // Remplacez 5 par le taux d'intérêt que vous souhaitez définir
};
