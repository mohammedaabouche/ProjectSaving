import React, { useState, useEffect } from "react";
import Web3 from "web3";
import detectEthereumProvider from '@metamask/detect-provider';
import SavingsVault from "./build/contracts/SavingsVault.json";

function App() {
  const [balance, setBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [interestRate, setInterestRate] = useState(0);
  const [account, setAccount] = useState(""); // État pour l'adresse du compte

  useEffect(() => {
    const init = async () => {
      const provider = await detectEthereumProvider();

      if (provider) {
        const web3 = new Web3(provider);
        await provider.request({ method: "eth_requestAccounts" });

        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]); // Stocker l'adresse du compte dans l'état

        const networkId = await web3.eth.net.getId();
        const deployedNetwork = SavingsVault.networks[networkId];

        // Vérifiez si le réseau déployé et l'adresse sont disponibles
        if (!deployedNetwork || !deployedNetwork.address) {
          alert("Le contrat n'est pas déployé sur le réseau actuel.");
          return; // Sortir si aucune adresse de contrat
        }

        const contract = new web3.eth.Contract(
          SavingsVault.abi,
          deployedNetwork.address
        );

        // Récupérer la balance du contrat pour le compte initial
        await updateBalance(contract, accounts[0]);

        // Écouter les changements de compte
        window.ethereum.on('accountsChanged', async (accounts) => {
          setAccount(accounts[0]); // Mettre à jour le compte actif
          await updateBalance(contract, accounts[0]); // Mettre à jour le solde pour le nouveau compte
        });

        // Écouter les changements de réseau
        window.ethereum.on('chainChanged', (chainId) => {
          window.location.reload(); // Recharger la page sur changement de réseau
        });
      } else {
        alert("Veuillez installer MetaMask !");
      }
    };

    init();
    
    // Nettoyage de l'effet
    return () => {
      window.ethereum.removeListener('accountsChanged', () => {});
      window.ethereum.removeListener('chainChanged', () => {});
    };
  }, []);

  const updateBalance = async (contract, account) => {
    // Mettre à jour la balance du compte
    const balance = await contract.methods.getBalance().call({ from: account });
    setBalance(balance);
  };

  const handleDeposit = async () => {
    if (!depositAmount) return;

    const provider = await detectEthereumProvider();
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();

    const networkId = await web3.eth.net.getId();
    const deployedNetwork = SavingsVault.networks[networkId];
    const contract = new web3.eth.Contract(
      SavingsVault.abi,
      deployedNetwork.address
    );

    await contract.methods.deposit().send({ from: accounts[0], value: web3.utils.toWei(depositAmount, 'ether') });

    // Mettre à jour la balance après dépôt
    await updateBalance(contract, accounts[0]);
    setDepositAmount(""); // Réinitialiser le champ
  };

  return (
    <div>
      <nav>
        <h1>Coffre-Fort d'Épargne</h1>
      </nav>
      <div className="wrapper">
        <h1 className="solde">
          Solde: <span id="balance">{Web3.utils.fromWei(balance, 'ether')}</span>{" "}
          <span className="currency">ETH</span>
        </h1>
        <h2>Adresse du Wallet: {account}</h2> {/* Afficher l'adresse du compte */}
        <input
          type="text"
          placeholder="taux d'interets"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
        />
        <div className="main">
          <div className="card">
            <h2>Dépôt</h2>
            <input
              type="number"
              placeholder="Montant du dépôt"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <button onClick={handleDeposit}>Déposer</button>
          </div>
          <div className="card">
            <h2>Retirer</h2>
            <input
              type="number"
              placeholder="Montant du retrait"
              // Ajoutez une gestion d'état pour le retrait ici
            />
            <button>Retirer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
