const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require('chai');
const { ethers } = require('hardhat');

const addresses = [
  '0x4e34EeC85C800Fc61829b1b50Edb0a45f57BB632',
  '0x33f99cC965Ea46A44eAc7d4fDAff91429Ee4E43a',
  '0x31c6683a2f80B17c9576a39554505CBdCb80501e',
  '0x1EF008Fe5bDEE78b1C2Aafaf60631f40e84B3374'
]

describe('MetaCookies Contract', () => {
  const deployContractFixture = async () => {
    const [wallet, walletTo] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory('MetaCookies')
    const contract = await Contract.deploy();
    const tx = await contract.initialize();
    await tx.wait()

    return { contract, wallet, walletTo }
  }

  describe('Deployment', () => {
    it('Should set the right owner', async () => {
      const { contract, wallet } = await loadFixture(deployContractFixture)
      expect(await contract.owner()).to.equal(wallet.address)
    })
  })

  describe('Public Sale', () => {
    it('Should revert an error when total tokens needed exceeds max supply', async () => {
      const { contract, wallet, walletTo } = await loadFixture(deployContractFixture)
      const secondUser = contract.connect(walletTo)
      await contract.activePublicSale(true);
      const amount = ethers.utils.parseUnits('0.15', 'ether')
      await secondUser.publicSaleMint(10, { value: amount})
      await contract.airdrop(addresses, 830)
      await expect(contract.publicSaleMint(10, { value: amount})).to.be.revertedWith('ERC721A: Amount of tokens exceeds max supply.');
    })
  })

  describe('Airdrop', () => {
    it('Should revert an error when is called by user different of the owner', async () => {
      const { contract, wallet, walletTo } = await loadFixture(deployContractFixture)
      const secondUser = contract.connect(walletTo)
      await expect(secondUser.airdrop(addresses, 5)).to.be.revertedWith('Ownable: caller is not the owner');
    })

    it('Should revert an error when total tokens needed exceeds max supply', async () => {
      const { contract, wallet, walletTo } = await loadFixture(deployContractFixture)
      await expect(contract.airdrop(addresses, 900)).to.be.revertedWith('ERC721A: Amount of tokens exceeds max supply.');
    })

    it('Should change all addresses balance.', async () => {
      const { contract, wallet, walletTo } = await loadFixture(deployContractFixture)
      await contract.airdrop(addresses, 600);

      const balances = await Promise.all(addresses.map(async i => (await contract.balanceOf(i)).toString()));
      const expectedBalances = addresses.map(x => '600');
      expect(balances).to.deep.equal(expectedBalances);
    })
  })
})