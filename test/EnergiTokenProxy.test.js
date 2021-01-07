const EnergiToken = artifacts.require("EnergiToken.sol");
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

contract("EnergiTokenProxy", accounts => {

  const owner = accounts[0]
  let token, proxy, impl

  beforeEach('Setup proxy', async() => {
    token = await EnergiToken.new();
    proxy = await EnergiTokenProxy.new(owner, token.address);
    impl = await EnergiToken.at(proxy.address);
    await impl.initialize(owner, 'Energi', 'NRG', 18);
  });

  /**
   * Testing EnergiTokenProxy contract
   */

  it('Proxy owner and delegate', async () => {
    expect(await proxy.proxyOwner()).to.eq(owner)
    expect(await proxy.delegate()).to.eq(token.address)
  })

  it('setProxyOwner', async () => {
    expect(await proxy.proxyOwner()).to.eq(owner)
    await proxy.setProxyOwner(accounts[1])
    expect(await proxy.proxyOwner()).to.eq(accounts[1])
  })

  it('setProxyOwner: forbidden', async () => {
    expect(await proxy.proxyOwner()).to.eq(owner)
    await truffleAssert.reverts(
      proxy.setProxyOwner(accounts[1], {from: accounts[1]}),
      "VM Exception while processing transaction: revert EnergiTokenProxy: FORBIDDEN -- Reason given: EnergiTokenProxy: FORBIDDEN."
    );
    expect(await proxy.proxyOwner()).to.eq(owner)
  })

  it('setDelegate', async () => {
    expect(await proxy.delegate()).to.eq(token.address)
    await proxy.upgradeDelegate(accounts[1])
    expect(await proxy.delegate()).to.eq(accounts[1])
  })

  it('setDelegate: forbidden', async () => {
    expect(await proxy.delegate()).to.eq(token.address)
    await truffleAssert.reverts(
      proxy.upgradeDelegate(accounts[1], {from: accounts[1]}),
      "VM Exception while processing transaction: revert EnergiTokenProxy: FORBIDDEN -- Reason given: EnergiTokenProxy: FORBIDDEN."
    );
    expect(await proxy.delegate()).to.eq(token.address)
  })

  /**
   * Testing EnergiToken contract implementation through EnergiTokenProxy contract
   */

  it('name, symbol, decimals, totalSupply, balanceOf', async () => {
    expect(await impl.owner()).to.eq(owner)
    expect(await impl.name()).to.eq('Energi')
    expect(await impl.symbol()).to.eq('NRG')
    expect((await impl.decimals()).toString()).to.eq('18')
    expect((await impl.totalSupply()).toString()).to.eq('0')
    expect((await impl.balanceOf(accounts[1])).toString()).to.eq('0')
  })

  it('initialize: fail', async () => {
    expect(await impl.initialized()).to.eq(true)
    await truffleAssert.reverts(
      impl.initialize(accounts[1], 'Other', 'OTH', 15),
      "EnergiToken: ALREADY_INITIALIZED"
    );
    expect(await impl.owner()).to.eq(owner)
    expect(await impl.name()).to.eq('Energi')
    expect(await impl.symbol()).to.eq('NRG')
    expect((await impl.decimals()).toString()).to.eq('18')
  })

  it('approve', async () => {
    await impl.approve(accounts[1], TEST_AMOUNT)
    expect((await impl.allowance(owner, accounts[1])).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('transfer', async () => {
    await impl.mint(owner, TEST_AMOUNT)
    expect((await impl.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    await impl.transfer(accounts[1], TEST_AMOUNT)
    expect((await impl.balanceOf(owner)).toString()).to.eq('0')
    expect((await impl.balanceOf(accounts[1])).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('transfer: insufficient balance', async () => {
    await impl.mint(owner, TEST_AMOUNT)
    expect((await impl.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    const LARGER_AMOUNT = expandTo18Decimals(20)
    await truffleAssert.reverts(
      impl.transfer(accounts[1], LARGER_AMOUNT, {from: owner}),
      "VM Exception while processing transaction: revert ERC20: transfer amount exceeds balance -- Reason given: ERC20: transfer amount exceeds balance."
    );
    expect((await impl.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await impl.balanceOf(accounts[1])).toString()).to.eq('0')
  })

  it('transfer:fail', async () => {
    await expect(impl.transfer(accounts[1], 1)).to.be.reverted
    await expect(impl.transfer(owner, 1, {from: accounts[1]})).to.be.reverted
  })

  it('transferFrom', async () => {
    await impl.mint(owner, TEST_AMOUNT)
    expect((await impl.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    await impl.approve(accounts[1], TEST_AMOUNT)
    expect((await impl.allowance(owner, accounts[1])).toString()).to.eq(TEST_AMOUNT.toString())
    await impl.transferFrom(owner, accounts[1], TEST_AMOUNT, {from: accounts[1]})
    expect((await impl.allowance(owner, accounts[1])).toString()).to.eq('0')
    expect((await impl.balanceOf(owner)).toString()).to.eq('0')
    expect((await impl.balanceOf(accounts[1])).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('transferFrom: max allowance', async () => {
    await impl.mint(owner, TEST_AMOUNT)
    expect((await impl.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    await impl.approve(accounts[1], TEST_AMOUNT)
    await impl.approve(accounts[1], MaxUint256)
    await impl.transferFrom(owner, accounts[1], TEST_AMOUNT, {from: accounts[1]})
    expect((await impl.allowance(owner, accounts[1])).toString()).to.eq(MaxUint256.sub(TEST_AMOUNT))
    expect((await impl.balanceOf(owner)).toString()).to.eq('0')
    expect((await impl.balanceOf(accounts[1])).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('setOwner', async () => {
    expect(await impl.owner()).to.eq(owner)
    await impl.setOwner(accounts[1])
    expect(await impl.owner()).to.eq(accounts[1])
  })

  it('setOwner:fail', async () => {
    expect(await impl.owner()).to.eq(owner)
    await truffleAssert.reverts(
      impl.setOwner(accounts[1], {from: accounts[1]}),
      "EnergiToken: FORBIDDEN"
    );
    expect(await impl.owner()).to.eq(owner)
  })

  it('mint', async () => {
    await impl.mint(accounts[1], TEST_AMOUNT)
    expect((await impl.balanceOf(accounts[1])).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await impl.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('mint: forbidden', async () => {
    await truffleAssert.reverts(
      impl.mint(accounts[1], TEST_AMOUNT, {from: accounts[1]}),
      "EnergiToken: FORBIDDEN"
    );
    expect((await impl.balanceOf(accounts[1])).toString()).to.eq('0')
    expect((await impl.totalSupply()).toString()).to.eq('0')
  })

  it('burn', async () => {
    await impl.mint(accounts[1], TEST_AMOUNT)
    expect((await impl.balanceOf(accounts[1])).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await impl.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
    await impl.burn(accounts[1], TEST_AMOUNT, {from: owner})
    expect((await impl.balanceOf(accounts[1])).toString()).to.eq('0')
    expect((await impl.totalSupply()).toString()).to.eq('0')
  })

  it('burn: insufficient balance', async () => {
    await impl.mint(accounts[1], TEST_AMOUNT)
    expect((await impl.balanceOf(accounts[1])).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await impl.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
    const LARGER_AMOUNT = expandTo18Decimals(20)
    await truffleAssert.reverts(
      impl.burn(accounts[1], LARGER_AMOUNT, {from: owner}),
      "ERC20: burn amount exceeds balance"
    );
    expect((await impl.balanceOf(accounts[1])).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await impl.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
  })

  it('burn: forbidden', async () => {
    await impl.mint(owner, TEST_AMOUNT)
    await truffleAssert.reverts(
      impl.burn(owner, TEST_AMOUNT, {from: accounts[1]}),
      "EnergiToken: FORBIDDEN"
    );
    expect((await impl.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString())
    expect((await impl.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString())
  })
})
