const EnergiToken = artifacts.require("EnergiToken.sol");
const EnergiTokenUpgrade = artifacts.require("EnergiTokenUpgrade.sol");
const EnergiTokenUpgrade2 = artifacts.require("EnergiTokenUpgrade2.sol");
const EnergiTokenProxy = artifacts.require("EnergiTokenProxy");
const chai = require('chai')
const expect = chai.expect
const truffleAssert = require("truffle-assertions");
const { MaxUint256 } = require('ethers/constants')
const { bigNumberify } = require('ethers/utils')
const { solidity, MockProvider, deployContract } = require('ethereum-waffle')

chai.use(solidity)

function expandTo18Decimals(n) {
  return bigNumberify(n).mul(bigNumberify(10).pow(18))
}

const TEST_AMOUNT = expandTo18Decimals(100)
const LARGER_TEST_AMOUNT = expandTo18Decimals(1500)
const OTHER_TEST_AMOUNT = expandTo18Decimals(1000)
const MIN_REDEMPTION_AMOUNT = expandTo18Decimals(1000)

contract("Upgrade initial implementation with EnergiTokenUpgrade then upgrade again with EnergiTokenUpgrade2", accounts => {

  const owner = accounts[0]
  const vault = accounts[1]
  const other = accounts[2]
  const wallet = accounts[3]
  const differentOther = accounts[4]

  let token, proxy, impl, tokenUpgrade, implUpgrade, tokenUpgrade2, implUpgrade2

  /**
   * Test upgrading EnergiToken implementation with new EnergiTokenUpgrade contract, then upgradign again with
   * EnergiTokenUpgrade2 contract
   */

  it('Upgrade EnergiToken implementation twice', async () => {

    // Deploy EnergiToken original implementation behind proxy
    token = await EnergiToken.new();
    proxy = await EnergiTokenProxy.new(owner, token.address);
    impl = await EnergiToken.at(proxy.address);
    await impl.initialize(owner, 'Energi', 'NRGT', 18);

    // Mint, transfer, approve, transferFrom and burn tokens
    await impl.mint(wallet, LARGER_TEST_AMOUNT) // Mint LARGER_TEST_AMOUNT to wallet
    await impl.transfer(other, TEST_AMOUNT, {from: wallet}) //  Wallet transfers TEST_AMOUNT to other
    await impl.approve(other, LARGER_TEST_AMOUNT, {from: wallet}) // Wallet approves other to transfer LARGER_TEST_AMOUNT
    await impl.transferFrom(wallet, other, TEST_AMOUNT, {from: other}) // Other transfers TEST_AMOUNT from wallet to other
    await impl.transferFrom(wallet, differentOther, OTHER_TEST_AMOUNT, {from: other}) // Other transfers OTHER_TEST_AMOUNT from wallet to differentOther
    await impl.transfer(differentOther, TEST_AMOUNT, {from: other}) // Other transfers TEST_AMOUNT to differentOther
    await impl.burn(wallet, TEST_AMOUNT) // Burn TEST_AMOUNT from wallet

    // Check balances, allowances and totalSupply
    expect((await impl.balanceOf(wallet)).toString()).to.eq(expandTo18Decimals(200).toString())
    expect((await impl.balanceOf(other)).toString()).to.eq(expandTo18Decimals(100).toString())
    expect((await impl.balanceOf(differentOther)).toString()).to.eq(expandTo18Decimals(1100).toString())
    expect((await impl.totalSupply()).toString()).to.eq(expandTo18Decimals(1400).toString())
    expect((await impl.allowance(wallet, other)).toString()).to.eq(expandTo18Decimals(400).toString())

    // Upgrade EnergiToken implementation
    tokenUpgrade = await EnergiTokenUpgrade.new();
    await proxy.upgradeDelegate(tokenUpgrade.address);
    implUpgrade = await EnergiTokenUpgrade.at(proxy.address);
    await implUpgrade.initializeUpgrade(vault, MIN_REDEMPTION_AMOUNT);

    // Check that balances, allowances and totalSupply are un-changed after upgrade
    expect((await implUpgrade.balanceOf(wallet)).toString()).to.eq(expandTo18Decimals(200).toString())
    expect((await implUpgrade.balanceOf(other)).toString()).to.eq(expandTo18Decimals(100).toString())
    expect((await implUpgrade.balanceOf(differentOther)).toString()).to.eq(expandTo18Decimals(1100).toString())
    expect((await implUpgrade.totalSupply()).toString()).to.eq(expandTo18Decimals(1400).toString())
    expect((await implUpgrade.allowance(wallet, other)).toString()).to.eq(expandTo18Decimals(400).toString())

    // Mint, transfer, approve, transferFrom, redeem and burn tokens
    await impl.mint(wallet, LARGER_TEST_AMOUNT) // Mint LARGER_TEST_AMOUNT to wallet
    // await impl.transfer(vault, TEST_AMOUNT, {from: wallet}) // Wallet tries to redeem TEST_AMOUNT, should be rejected
    await impl.transfer(vault, LARGER_TEST_AMOUNT, {from: wallet}) // Wallet redeems LARGER_TEST_AMOUNT
    await impl.mint(wallet, LARGER_TEST_AMOUNT) // Mint LARGER_TEST_AMOUNT to wallet
    await impl.transfer(other, TEST_AMOUNT, {from: wallet}) // Wallet transfer TEST_AMOUNT to other
    await impl.approve(other, OTHER_TEST_AMOUNT, {from: wallet}) // Wallet approves other to transfer OTHER_TEST_AMOUNT
    // await impl.transferFrom(wallet, vault, TEST_AMOUNT, {from: other}) // Other tries to redeem TEST_AMOUNT from wallet, should be rejected
    await impl.transferFrom(wallet, vault, OTHER_TEST_AMOUNT, {from: other}) // Other redeems OTHER_TEST_AMOUNT from wallet
    await impl.burn(vault, OTHER_TEST_AMOUNT) // Burn TEST_AMOUNT from vault

    // Check balances, allowances and totalSupply
    expect((await impl.balanceOf(wallet)).toString()).to.eq(expandTo18Decimals(600).toString())
    expect((await impl.balanceOf(other)).toString()).to.eq(expandTo18Decimals(200).toString())
    expect((await impl.balanceOf(vault)).toString()).to.eq(expandTo18Decimals(1500).toString())
    expect((await impl.totalSupply()).toString()).to.eq(expandTo18Decimals(3400).toString())
    expect((await impl.allowance(wallet, other)).toString()).to.eq(expandTo18Decimals(0).toString())

    // Upgrade EnergiToken implementation again
    tokenUpgrade2 = await EnergiTokenUpgrade2.new();
    await proxy.upgradeDelegate(tokenUpgrade2.address);
    implUpgrade2 = await EnergiTokenUpgrade2.at(proxy.address);

    // Set new name and symbol
    await implUpgrade2.setName('Energi Token');
    await implUpgrade2.setSymbol('NRGE');

    // Check that balances, allowances and totalSupply are un-changed after upgrade
    expect((await impl.balanceOf(wallet)).toString()).to.eq(expandTo18Decimals(600).toString())
    expect((await impl.balanceOf(other)).toString()).to.eq(expandTo18Decimals(200).toString())
    expect((await impl.balanceOf(vault)).toString()).to.eq(expandTo18Decimals(1500).toString())
    expect((await impl.totalSupply()).toString()).to.eq(expandTo18Decimals(3400).toString())
    expect((await impl.allowance(wallet, other)).toString()).to.eq(expandTo18Decimals(0).toString())

    // Mint, transfer, approve, transferFrom, redeem and burn tokens
    await impl.mint(other, LARGER_TEST_AMOUNT) // Mint LARGER_TEST_AMOUNT to other
    await impl.transfer(vault, LARGER_TEST_AMOUNT, {from: other}) // Other redeems LARGER_TEST_AMOUNT
    await impl.mint(wallet, LARGER_TEST_AMOUNT) // Mint LARGER_TEST_AMOUNT to wallet
    await impl.transfer(other, OTHER_TEST_AMOUNT, {from: wallet}) // Wallet transfer OTHER_TEST_AMOUNT to other
    await impl.approve(wallet, OTHER_TEST_AMOUNT, {from: other}) // other approves wallet to transfer OTHER_TEST_AMOUNT
    await impl.transferFrom(other, vault, OTHER_TEST_AMOUNT, {from: wallet}) // Wallet redeems OTHER_TEST_AMOUNT from other
    await impl.burn(wallet, TEST_AMOUNT) // Burn TEST_AMOUNT from wallet

    // Check balances, allowances and totalSupply
    expect((await impl.balanceOf(wallet)).toString()).to.eq(expandTo18Decimals(1000).toString())
    expect((await impl.balanceOf(other)).toString()).to.eq(expandTo18Decimals(200).toString())
    expect((await impl.balanceOf(vault)).toString()).to.eq(expandTo18Decimals(4000).toString())
    expect((await impl.totalSupply()).toString()).to.eq(expandTo18Decimals(6300).toString())
    expect((await impl.allowance(wallet, other)).toString()).to.eq(expandTo18Decimals(0).toString())
  })
})
