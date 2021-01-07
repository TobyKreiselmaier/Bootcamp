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

const TEST_AMOUNT = expandTo18Decimals(10)
const LARGER_TEST_AMOUNT = expandTo18Decimals(1500)
const MIN_REDEMPTION_AMOUNT = expandTo18Decimals(1000)

contract("EnergiTokenUpgrade2 through proxy", accounts => {

  const owner = accounts[0]
  const vault = accounts[1]
  const other = accounts[2]
  const wallet = accounts[3]

  let token, proxy, impl, tokenUpgrade, implUpgrade, tokenUpgrade2, implUpgrade2

  beforeEach('Setup proxy', async() => {
    token = await EnergiToken.new();
    proxy = await EnergiTokenProxy.new(owner, token.address);
    impl = await EnergiToken.at(proxy.address);
    await impl.initialize(owner, 'Energi', 'NRGT', 18);
    tokenUpgrade = await EnergiTokenUpgrade.new();
    await proxy.upgradeDelegate(tokenUpgrade.address);
    implUpgrade = await EnergiTokenUpgrade.at(proxy.address);
    await implUpgrade.initializeUpgrade(vault, MIN_REDEMPTION_AMOUNT);
    tokenUpgrade2 = await EnergiTokenUpgrade2.new();
    await proxy.upgradeDelegate(tokenUpgrade2.address);
    implUpgrade2 = await EnergiTokenUpgrade2.at(proxy.address);
  });

  /**
   * Testing EnergiTokenUpgrade2 contract implementation through EnergiTokenProxy contract
   */

  it('name, symbol, decimals, totalSupply, balanceOf, vault, minRedemptionAmount', async () => {
    expect(await implUpgrade2.owner()).to.eq(owner)
    expect(await implUpgrade2.name()).to.eq('Energi')
    expect(await implUpgrade2.symbol()).to.eq('NRGT')
    expect((await implUpgrade2.decimals()).toString()).to.eq('18')
    expect((await implUpgrade2.totalSupply()).toString()).to.eq('0')
    expect((await implUpgrade2.balanceOf(other)).toString()).to.eq('0')
    expect(await implUpgrade2.vault()).to.eq(vault)
    expect((await implUpgrade2.minRedemptionAmount()).toString()).to.eq(MIN_REDEMPTION_AMOUNT.toString())
  })

  it('approve', async () => {
    await implUpgrade2.approve(other, TEST_AMOUNT)
    expect((await implUpgrade2.allowance(owner, other)).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('transfer', async () => {
    await implUpgrade2.mint(owner, TEST_AMOUNT)
    expect((await implUpgrade2.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    await implUpgrade2.transfer(other, TEST_AMOUNT)
    expect((await implUpgrade2.balanceOf(owner)).toString()).to.eq('0')
    expect((await implUpgrade2.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('transfer: insufficient balance', async () => {
    await implUpgrade2.mint(owner, TEST_AMOUNT)
    expect((await implUpgrade2.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    const LARGER_AMOUNT = expandTo18Decimals(20)
    await truffleAssert.reverts(
      implUpgrade2.transfer(other, LARGER_AMOUNT, {from: owner}),
      "VM Exception while processing transaction: revert ERC20: transfer amount exceeds balance -- Reason given: ERC20: transfer amount exceeds balance."
    );
    expect((await implUpgrade2.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade2.balanceOf(other)).toString()).to.eq('0')
  })

  it('transfer:fail', async () => {
    await expect(implUpgrade2.transfer(other, 1)).to.be.reverted
    await expect(implUpgrade2.transfer(owner, 1, {from: other})).to.be.reverted
  })

  it('transferFrom', async () => {
    await implUpgrade2.mint(owner, TEST_AMOUNT)
    expect((await implUpgrade2.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    await implUpgrade2.approve(other, TEST_AMOUNT)
    expect((await implUpgrade2.allowance(owner, other)).toString()).to.eq(TEST_AMOUNT.toString())
    await implUpgrade2.transferFrom(owner, other, TEST_AMOUNT, {from: other})
    expect((await implUpgrade2.allowance(owner, other)).toString()).to.eq('0')
    expect((await implUpgrade2.balanceOf(owner)).toString()).to.eq('0')
    expect((await implUpgrade2.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('transferFrom: max allowance', async () => {
    await implUpgrade2.mint(owner, TEST_AMOUNT)
    expect((await implUpgrade2.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    await implUpgrade2.approve(other, TEST_AMOUNT)
    await implUpgrade2.approve(other, MaxUint256)
    await implUpgrade2.transferFrom(owner, other, TEST_AMOUNT, {from: other})
    expect((await implUpgrade2.allowance(owner, other)).toString()).to.eq(MaxUint256.sub(TEST_AMOUNT))
    expect((await implUpgrade2.balanceOf(owner)).toString()).to.eq('0')
    expect((await implUpgrade2.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('setOwner', async () => {
    expect(await implUpgrade2.owner()).to.eq(owner)
    await implUpgrade2.setOwner(other)
    expect(await implUpgrade2.owner()).to.eq(other)
  })

  it('setOwner:fail', async () => {
    expect(await implUpgrade2.owner()).to.eq(owner)
    await truffleAssert.reverts(
      implUpgrade2.setOwner(other, {from: other}),
      "EnergiToken: FORBIDDEN"
    );
    expect(await implUpgrade2.owner()).to.eq(owner)
  })

  it('setName', async () => {
    expect(await implUpgrade2.name()).to.eq('Energi')
    await implUpgrade2.setName('Energi Token')
    expect(await implUpgrade2.name()).to.eq('Energi Token')
  })

  it('setName:fail', async () => {
    expect(await implUpgrade2.name()).to.eq('Energi')
    await truffleAssert.reverts(
      implUpgrade2.setName('Energi Token', {from: other}),
      "EnergiToken: FORBIDDEN"
    );
    expect(await implUpgrade2.name()).to.eq('Energi')
  })

  it('setSymbol', async () => {
    expect(await implUpgrade2.symbol()).to.eq('NRGT')
    await implUpgrade2.setSymbol('NRGE')
    expect(await implUpgrade2.symbol()).to.eq('NRGE')
  })

  it('setSymbol:fail', async () => {
    expect(await implUpgrade2.symbol()).to.eq('NRGT')
    await truffleAssert.reverts(
      implUpgrade2.setSymbol('NRGE', {from: other}),
      "EnergiToken: FORBIDDEN"
    );
    expect(await implUpgrade2.symbol()).to.eq('NRGT')
  })

  it('setVault', async () => {
    expect(await implUpgrade2.vault()).to.eq(vault)
    await implUpgrade2.setVault(other)
    expect(await implUpgrade2.vault()).to.eq(other)
  })

  it('setVault: fail', async () => {
    expect(await implUpgrade2.vault()).to.eq(vault)
    await truffleAssert.reverts(
      implUpgrade2.setVault(other, {from: other}),
      "EnergiToken: FORBIDDEN"
    );
    expect(await implUpgrade2.vault()).to.eq(vault)
  })

  it('setMinRedemptionAmount', async () => {
    expect((await implUpgrade2.minRedemptionAmount()).toString()).to.eq(MIN_REDEMPTION_AMOUNT.toString())
    await implUpgrade2.setMinRedemptionAmount(TEST_AMOUNT)
    expect((await implUpgrade2.minRedemptionAmount()).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('setMinRedemptionAmount: fail', async () => {
    expect((await implUpgrade2.minRedemptionAmount()).toString()).to.eq(MIN_REDEMPTION_AMOUNT.toString())
    await truffleAssert.reverts(
      implUpgrade2.setMinRedemptionAmount(TEST_AMOUNT, {from: other}),
      "EnergiToken: FORBIDDEN"
    );
    expect((await implUpgrade2.minRedemptionAmount()).toString()).to.eq(MIN_REDEMPTION_AMOUNT.toString())
  })

  it('mint', async () => {
    await implUpgrade2.mint(other, TEST_AMOUNT)
    expect((await implUpgrade2.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade2.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('mint: forbidden', async () => {
    await truffleAssert.reverts(
      implUpgrade2.mint(other, TEST_AMOUNT, {from: other}),
      "EnergiToken: FORBIDDEN"
    );
    expect((await implUpgrade2.balanceOf(other)).toString()).to.eq('0')
    expect((await implUpgrade2.totalSupply()).toString()).to.eq('0')
  })

  it('burn', async () => {
    await implUpgrade2.mint(other, TEST_AMOUNT)
    expect((await implUpgrade2.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade2.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
    await implUpgrade2.burn(other, TEST_AMOUNT, {from: owner})
    expect((await implUpgrade2.balanceOf(other)).toString()).to.eq('0')
    expect((await implUpgrade2.totalSupply()).toString()).to.eq('0')
  })

  it('burn: insufficient balance', async () => {
    await implUpgrade2.mint(other, TEST_AMOUNT)
    expect((await implUpgrade2.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade2.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
    const LARGER_AMOUNT = expandTo18Decimals(20)
    await truffleAssert.reverts(
      implUpgrade2.burn(other, LARGER_AMOUNT, {from: owner}),
      "ERC20: burn amount exceeds balance"
    );
    expect((await implUpgrade2.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade2.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('burn: forbidden', async () => {
    await implUpgrade2.mint(owner, TEST_AMOUNT)
    await truffleAssert.reverts(
      implUpgrade2.burn(owner, TEST_AMOUNT, {from: other}),
      "EnergiToken: FORBIDDEN"
    );
    expect((await implUpgrade2.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade2.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('redeem', async () => {
    await implUpgrade2.mint(wallet, LARGER_TEST_AMOUNT)
    expect((await implUpgrade2.balanceOf(wallet)).toString()).to.eq(LARGER_TEST_AMOUNT.toString())
    await implUpgrade2.transfer(vault, LARGER_TEST_AMOUNT, {from: wallet});
    expect((await implUpgrade2.balanceOf(wallet)).toString()).to.eq('0')
    expect((await implUpgrade2.balanceOf(vault)).toString()).to.eq(LARGER_TEST_AMOUNT.toString())
  })


  it('redeem: redemption amount too small', async () => {
    await implUpgrade2.mint(wallet, TEST_AMOUNT)
    expect((await implUpgrade2.balanceOf(wallet)).toString()).to.eq(TEST_AMOUNT.toString())
    await truffleAssert.reverts(
      implUpgrade2.transfer(vault, TEST_AMOUNT, {from: wallet}),
      "EnergiToken: redemption amount too small"
    );
  })

  it('redeem with transferFrom', async () => {
    await implUpgrade2.mint(wallet, LARGER_TEST_AMOUNT)
    expect((await implUpgrade2.balanceOf(wallet)).toString()).to.eq(LARGER_TEST_AMOUNT.toString())
    await implUpgrade2.approve(other, LARGER_TEST_AMOUNT, {from: wallet})
    await implUpgrade2.transferFrom(wallet, vault, LARGER_TEST_AMOUNT, {from: other})
    expect((await implUpgrade2.allowance(wallet, other)).toString()).to.eq('0')
    expect((await implUpgrade2.balanceOf(wallet)).toString()).to.eq('0')
    expect((await implUpgrade2.balanceOf(vault)).toString()).to.eq(LARGER_TEST_AMOUNT.toString())
  })

  it('redeem with transferFrom: redemption amount too small', async () => {
    await implUpgrade2.mint(wallet, TEST_AMOUNT)
    expect((await implUpgrade2.balanceOf(wallet)).toString()).to.eq(TEST_AMOUNT.toString())
    await implUpgrade2.approve(other, TEST_AMOUNT, {from: wallet})
    await truffleAssert.reverts(
      implUpgrade2.transferFrom(wallet, vault, TEST_AMOUNT, {from: other}),
      "EnergiToken: redemption amount too small"
    );
    expect((await implUpgrade2.allowance(wallet, other)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade2.balanceOf(wallet)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await implUpgrade2.balanceOf(vault)).toString()).to.eq('0')
  })
})
