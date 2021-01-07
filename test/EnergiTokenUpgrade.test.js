const EnergiToken = artifacts.require("EnergiToken.sol");
const EnergiTokenUpgrade = artifacts.require("EnergiTokenUpgrade.sol");
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

const TEST_AMOUNT = expandTo18Decimals(10)
const LARGER_TEST_AMOUNT = expandTo18Decimals(1500)
const MIN_REDEMPTION_AMOUNT = expandTo18Decimals(1000)

contract("EnergiTokenUpgrade through proxy", accounts => {

  const owner = accounts[0]
  const vault = accounts[1]
  const other = accounts[2]
  const wallet = accounts[3]

  let token, proxy, impl, tokenUpgrade, implUpgrade

  beforeEach('Setup proxy', async() => {
    token = await EnergiToken.new();
    proxy = await EnergiTokenProxy.new(owner, token.address);
    impl = await EnergiToken.at(proxy.address);
    await impl.initialize(owner, 'Energi', 'NRG', 18);
    tokenUpgrade = await EnergiTokenUpgrade.new();
    await proxy.upgradeDelegate(tokenUpgrade.address);
    implUpgrade = await EnergiTokenUpgrade.at(proxy.address);
    await implUpgrade.initializeUpgrade(vault, MIN_REDEMPTION_AMOUNT);
  });

  /**
   * Testing EnergiTokenUpgrade contract implementation through EnergiTokenProxy contract
   */

  it('name, symbol, decimals, totalSupply, balanceOf, vault, minRedemptionAmount', async () => {
    expect(await implUpgrade.owner()).to.eq(owner)
    expect(await implUpgrade.name()).to.eq('Energi')
    expect(await implUpgrade.symbol()).to.eq('NRG')
    expect((await implUpgrade.decimals()).toString()).to.eq('18')
    expect((await implUpgrade.totalSupply()).toString()).to.eq('0')
    expect((await implUpgrade.balanceOf(other)).toString()).to.eq('0')
    expect(await implUpgrade.vault()).to.eq(vault)
    expect((await implUpgrade.minRedemptionAmount()).toString()).to.eq(MIN_REDEMPTION_AMOUNT.toString())
  })

  it('initialize: fail', async () => {
    expect(await implUpgrade.initialized()).to.eq(true)
    expect(await implUpgrade.upgradeInitialized()).to.eq(true)
    await truffleAssert.reverts(
      implUpgrade.initializeUpgrade(accounts[2], TEST_AMOUNT),
      "EnergiTokenUpgrade: ALREADY_INITIALIZED"
    );
    expect(await implUpgrade.owner()).to.eq(owner)
    expect(await implUpgrade.name()).to.eq('Energi')
    expect(await implUpgrade.symbol()).to.eq('NRG')
    expect((await implUpgrade.decimals()).toString()).to.eq('18')
    expect(await implUpgrade.vault()).to.eq(vault)
    expect((await implUpgrade.minRedemptionAmount()).toString()).to.eq(MIN_REDEMPTION_AMOUNT.toString())
  })

  it('approve', async () => {
    await implUpgrade.approve(other, TEST_AMOUNT)
    expect((await implUpgrade.allowance(owner, other)).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('transfer', async () => {
    await implUpgrade.mint(owner, TEST_AMOUNT)
    expect((await implUpgrade.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    await implUpgrade.transfer(other, TEST_AMOUNT)
    expect((await implUpgrade.balanceOf(owner)).toString()).to.eq('0')
    expect((await implUpgrade.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('transfer: insufficient balance', async () => {
    await implUpgrade.mint(owner, TEST_AMOUNT)
    expect((await implUpgrade.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    const LARGER_AMOUNT = expandTo18Decimals(20)
    await truffleAssert.reverts(
      implUpgrade.transfer(other, LARGER_AMOUNT, {from: owner}),
      "VM Exception while processing transaction: revert ERC20: transfer amount exceeds balance -- Reason given: ERC20: transfer amount exceeds balance."
    );
    expect((await implUpgrade.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade.balanceOf(other)).toString()).to.eq('0')
  })

  it('transfer:fail', async () => {
    await expect(implUpgrade.transfer(other, 1)).to.be.reverted
    await expect(implUpgrade.transfer(owner, 1, {from: other})).to.be.reverted
  })

  it('transferFrom', async () => {
    await implUpgrade.mint(owner, TEST_AMOUNT)
    expect((await implUpgrade.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    await implUpgrade.approve(other, TEST_AMOUNT)
    expect((await implUpgrade.allowance(owner, other)).toString()).to.eq(TEST_AMOUNT.toString())
    await implUpgrade.transferFrom(owner, other, TEST_AMOUNT, {from: other})
    expect((await implUpgrade.allowance(owner, other)).toString()).to.eq('0')
    expect((await implUpgrade.balanceOf(owner)).toString()).to.eq('0')
    expect((await implUpgrade.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('transferFrom: max allowance', async () => {
    await implUpgrade.mint(owner, TEST_AMOUNT)
    expect((await implUpgrade.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    await implUpgrade.approve(other, TEST_AMOUNT)
    await implUpgrade.approve(other, MaxUint256)
    await implUpgrade.transferFrom(owner, other, TEST_AMOUNT, {from: other})
    expect((await implUpgrade.allowance(owner, other)).toString()).to.eq(MaxUint256.sub(TEST_AMOUNT))
    expect((await implUpgrade.balanceOf(owner)).toString()).to.eq('0')
    expect((await implUpgrade.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('setOwner', async () => {
    expect(await implUpgrade.owner()).to.eq(owner)
    await implUpgrade.setOwner(other)
    expect(await implUpgrade.owner()).to.eq(other)
  })

  it('setOwner:fail', async () => {
    expect(await implUpgrade.owner()).to.eq(owner)
    await truffleAssert.reverts(
      implUpgrade.setOwner(other, {from: other}),
      "EnergiToken: FORBIDDEN"
    );
    expect(await implUpgrade.owner()).to.eq(owner)
  })

  it('setVault', async () => {
    expect(await implUpgrade.vault()).to.eq(vault)
    await implUpgrade.setVault(other)
    expect(await implUpgrade.vault()).to.eq(other)
  })

  it('setVault: fail', async () => {
    expect(await implUpgrade.vault()).to.eq(vault)
    await truffleAssert.reverts(
      implUpgrade.setVault(other, {from: other}),
      "EnergiToken: FORBIDDEN"
    );
    expect(await implUpgrade.vault()).to.eq(vault)
  })

  it('setMinRedemptionAmount', async () => {
    expect((await implUpgrade.minRedemptionAmount()).toString()).to.eq(MIN_REDEMPTION_AMOUNT.toString())
    await implUpgrade.setMinRedemptionAmount(TEST_AMOUNT)
    expect((await implUpgrade.minRedemptionAmount()).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('setMinRedemptionAmount: fail', async () => {
    expect((await implUpgrade.minRedemptionAmount()).toString()).to.eq(MIN_REDEMPTION_AMOUNT.toString())
    await truffleAssert.reverts(
      implUpgrade.setMinRedemptionAmount(TEST_AMOUNT, {from: other}),
      "EnergiToken: FORBIDDEN"
    );
    expect((await implUpgrade.minRedemptionAmount()).toString()).to.eq(MIN_REDEMPTION_AMOUNT.toString())
  })

  it('mint', async () => {
    await implUpgrade.mint(other, TEST_AMOUNT)
    expect((await implUpgrade.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('mint: forbidden', async () => {
    await truffleAssert.reverts(
      implUpgrade.mint(other, TEST_AMOUNT, {from: other}),
      "EnergiToken: FORBIDDEN"
    );
    expect((await implUpgrade.balanceOf(other)).toString()).to.eq('0')
    expect((await implUpgrade.totalSupply()).toString()).to.eq('0')
  })

  it('burn', async () => {
    await implUpgrade.mint(other, TEST_AMOUNT)
    expect((await implUpgrade.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
    await implUpgrade.burn(other, TEST_AMOUNT, {from: owner})
    expect((await implUpgrade.balanceOf(other)).toString()).to.eq('0')
    expect((await implUpgrade.totalSupply()).toString()).to.eq('0')
  })

  it('burn: insufficient balance', async () => {
    await implUpgrade.mint(other, TEST_AMOUNT)
    expect((await implUpgrade.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
    const LARGER_AMOUNT = expandTo18Decimals(20)
    await truffleAssert.reverts(
      implUpgrade.burn(other, LARGER_AMOUNT, {from: owner}),
      "ERC20: burn amount exceeds balance"
    );
    expect((await implUpgrade.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('burn: forbidden', async () => {
    await implUpgrade.mint(owner, TEST_AMOUNT)
    await truffleAssert.reverts(
      implUpgrade.burn(owner, TEST_AMOUNT, {from: other}),
      "EnergiToken: FORBIDDEN"
    );
    expect((await implUpgrade.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('redeem', async () => {
    await implUpgrade.mint(wallet, LARGER_TEST_AMOUNT)
    expect((await implUpgrade.balanceOf(wallet)).toString()).to.eq(LARGER_TEST_AMOUNT.toString())
    await implUpgrade.transfer(vault, LARGER_TEST_AMOUNT, {from: wallet});
    expect((await implUpgrade.balanceOf(wallet)).toString()).to.eq('0')
    expect((await implUpgrade.balanceOf(vault)).toString()).to.eq(LARGER_TEST_AMOUNT.toString())
  })


  it('redeem: redemption amount too small', async () => {
    await implUpgrade.mint(wallet, TEST_AMOUNT)
    expect((await implUpgrade.balanceOf(wallet)).toString()).to.eq(TEST_AMOUNT.toString())
    await truffleAssert.reverts(
      implUpgrade.transfer(vault, TEST_AMOUNT, {from: wallet}),
      "EnergiToken: redemption amount too small"
    );
  })

  it('redeem with transferFrom', async () => {
    await implUpgrade.mint(wallet, LARGER_TEST_AMOUNT)
    expect((await implUpgrade.balanceOf(wallet)).toString()).to.eq(LARGER_TEST_AMOUNT.toString())
    await implUpgrade.approve(other, LARGER_TEST_AMOUNT, {from: wallet})
    await implUpgrade.transferFrom(wallet, vault, LARGER_TEST_AMOUNT, {from: other})
    expect((await implUpgrade.allowance(wallet, other)).toString()).to.eq('0')
    expect((await implUpgrade.balanceOf(wallet)).toString()).to.eq('0')
    expect((await implUpgrade.balanceOf(vault)).toString()).to.eq(LARGER_TEST_AMOUNT.toString())
  })

  it('redeem with transferFrom: redemption amount too small', async () => {
    await implUpgrade.mint(wallet, TEST_AMOUNT)
    expect((await implUpgrade.balanceOf(wallet)).toString()).to.eq(TEST_AMOUNT.toString())
    await implUpgrade.approve(other, TEST_AMOUNT, {from: wallet})
    await truffleAssert.reverts(
      implUpgrade.transferFrom(wallet, vault, TEST_AMOUNT, {from: other}),
      "EnergiToken: redemption amount too small"
    );
    expect((await implUpgrade.allowance(wallet, other)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade.balanceOf(wallet)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade.balanceOf(vault)).toString()).to.eq('0')
  })
})
