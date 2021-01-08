const eBTC = artifacts.require('eBTC.sol');
const eBTCProxy = artifacts.require('eBTCProxy.sol');
import { expect as _expect, use } from 'chai';
const expect = _expect;
import { reverts } from 'truffle-assertions';
import { MaxUint256 } from 'ethers/constants';
import { bigNumberify } from 'ethers/utils';
import { solidity } from 'ethereum-waffle';

use(solidity);

function expandTo18Decimals(n) {
  return bigNumberify(n).mul(bigNumberify(10).pow(18));
}

const TEST_AMOUNT = expandTo18Decimals(10);
const LARGER_TEST_AMOUNT = expandTo18Decimals(1500);
const MIN_REDEMPTION_AMOUNT = expandTo18Decimals(1000);

contract('eBTC through proxy', accounts => {

  const owner = accounts[0];
  const vault = accounts[1];
  const other = accounts[2];
  const wallet = accounts[3];

  let token, proxy, instance;

  beforeEach('Setup proxy', async() => {
    token = await eBTC.new();
    proxy = await eBTCProxy.new(owner, token.address);
    instance = await eBTC.at(proxy.address);
    await instance.initialize(owner, 'eBTC', 'eBTC', 18);
  });

  /**
   * Testing eBTC contract instance through eBTCProxy contract
   */

  it('name, symbol, decimals, totalSupply, balanceOf, vault, minRedemptionAmount', async () => {
    expect(await instance.owner()).to.eq(owner);
    expect(await instance.name()).to.eq('eBTC');
    expect(await instance.symbol()).to.eq('eBTC');
    expect((await instance.decimals()).toString()).to.eq('18');
    expect((await instance.totalSupply()).toString()).to.eq('0');
    expect((await instance.balanceOf(other)).toString()).to.eq('0');
    expect(await instance.vault()).to.eq(vault);
    expect((await instance.minRedemptionAmount()).toString()).to.eq(MIN_REDEMPTION_AMOUNT.toString());
  });

  it('approve', async () => {
    await instance.approve(other, TEST_AMOUNT);
    expect((await instance.allowance(owner, other)).toString()).to.eq(TEST_AMOUNT.toString());
  });

  it('transfer', async () => {
    await instance.mint(owner, TEST_AMOUNT);
    expect((await instance.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString());
    await instance.transfer(other, TEST_AMOUNT);
    expect((await instance.balanceOf(owner)).toString()).to.eq('0');
    expect((await instance.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString());
  });

  it('transfer: insufficient balance', async () => {
    await instance.mint(owner, TEST_AMOUNT);
    expect((await instance.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString());
    await reverts(
      instance.transfer(other, LARGER_TEST_AMOUNT, {from: owner}), 'transfer amount exceeds balance.');
    expect((await instance.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString());
    expect((await instance.balanceOf(other)).toString()).to.eq('0');
  });

  it('transfer:fail', async () => {
    await expect(instance.transfer(other, 1)).to.be.reverted;
    await expect(instance.transfer(owner, 1, {from: other})).to.be.reverted;
  });

  it('transferFrom', async () => {
    await instance.mint(owner, TEST_AMOUNT);
    expect((await instance.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString());
    await instance.approve(other, TEST_AMOUNT);
    expect((await instance.allowance(owner, other)).toString()).to.eq(TEST_AMOUNT.toString());
    await instance.transferFrom(owner, other, TEST_AMOUNT, {from: other});
    expect((await instance.allowance(owner, other)).toString()).to.eq('0');
    expect((await instance.balanceOf(owner)).toString()).to.eq('0');
    expect((await instance.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString());
  });

  it('transferFrom: max allowance', async () => {
    await instance.mint(owner, TEST_AMOUNT);
    expect((await instance.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString());
    await instance.approve(other, TEST_AMOUNT);
    await instance.approve(other, MaxUint256);
    await instance.transferFrom(owner, other, TEST_AMOUNT, {from: other});
    expect((await instance.allowance(owner, other)).toString()).to.eq(MaxUint256.sub(TEST_AMOUNT));
    expect((await instance.balanceOf(owner)).toString()).to.eq('0');
    expect((await instance.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString());
  });

  it('setOwner', async () => {
    expect(await instance.owner()).to.eq(owner);
    await instance.setOwner(other);
    expect(await instance.owner()).to.eq(other);
  });

  it('setOwner:fail', async () => {
    expect(await instance.owner()).to.eq(owner);
    await reverts(instance.setOwner(other, {from: other}), 'eBTC: FORBIDDEN');
    expect(await instance.owner()).to.eq(owner);
  });

  it('setName', async () => {
    expect(await instance.name()).to.eq('eBTC');
    await instance.setName('eBTC Token');
    expect(await instance.name()).to.eq('eBTC Token');
  });

  it('setName:fail', async () => {
    expect(await instance.name()).to.eq('eBTC');
    await reverts(instance.setName('eBTC Token', {from: other}), 'eBTC: FORBIDDEN');
    expect(await instance.name()).to.eq('eBTC');
  });

  it('setSymbol', async () => {
    expect(await instance.symbol()).to.eq('eBTC');
    await instance.setSymbol('TEST');
    expect(await instance.symbol()).to.eq('TEST');
  });

  it('setSymbol:fail', async () => {
    expect(await instance.symbol()).to.eq('eBTC');
    await reverts(instance.setSymbol('TEST', {from: other}), 'eBTC: FORBIDDEN');
    expect(await instance.symbol()).to.eq('eBTC');
  });

  it('setVault', async () => {
    expect(await instance.vault()).to.eq(vault);
    await instance.setVault(other);
    expect(await instance.vault()).to.eq(other);
  });

  it('setVault: fail', async () => {
    expect(await instance.vault()).to.eq(vault);
    await reverts(instance.setVault(other, {from: other}), 'eBTC: FORBIDDEN');
    expect(await instance.vault()).to.eq(vault);
  });

  it('setMinRedemptionAmount', async () => {
    expect((await instance.minRedemptionAmount()).toString()).to.eq(MIN_REDEMPTION_AMOUNT.toString());
    await instance.setMinRedemptionAmount(TEST_AMOUNT);
    expect((await instance.minRedemptionAmount()).toString()).to.eq(TEST_AMOUNT.toString());
  });

  it('setMinRedemptionAmount: fail', async () => {
    expect((await instance.minRedemptionAmount()).toString()).to.eq(MIN_REDEMPTION_AMOUNT.toString());
    await reverts(instance.setMinRedemptionAmount(TEST_AMOUNT, {from: other}), 'eBTC: FORBIDDEN');
    expect((await instance.minRedemptionAmount()).toString()).to.eq(MIN_REDEMPTION_AMOUNT.toString());
  });

  it('mint', async () => {
    await instance.mint(other, TEST_AMOUNT);
    expect((await instance.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString());
    expect((await instance.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString());
  });

  it('mint: fail', async () => {
    await reverts(instance.mint(other, TEST_AMOUNT, {from: other}), 'eBTC: FORBIDDEN');
    expect((await instance.balanceOf(other)).toString()).to.eq('0');
    expect((await instance.totalSupply()).toString()).to.eq('0');
  });

  it('burn', async () => {
    await instance.mint(other, TEST_AMOUNT);
    expect((await instance.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString());
    expect((await instance.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString());
    await instance.burn(other, TEST_AMOUNT, {from: owner});
    expect((await instance.balanceOf(other)).toString()).to.eq('0');
    expect((await instance.totalSupply()).toString()).to.eq('0');
  });

  it('burn: amount too high', async () => {
    await instance.mint(other, TEST_AMOUNT);
    expect((await instance.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString());
    expect((await instance.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString());
    await reverts(
        instance.burn(other, LARGER_TEST_AMOUNT, {from: owner}), 'ERC20: burn amount exceeds balance');
    expect((await instance.balanceOf(other)).toString()).to.eq(TEST_AMOUNT.toString());
    expect((await instance.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString());
  });

  it('burn: forbidden', async () => {
    await instance.mint(owner, TEST_AMOUNT);
    await reverts(instance.burn(owner, TEST_AMOUNT, {from: other}), 'eBTC: FORBIDDEN');
    expect((await instance.balanceOf(owner)).toString()).to.eq(TEST_AMOUNT.toString());
    expect((await instance.totalSupply()).toString()).to.eq(TEST_AMOUNT.toString());
  });

  it('redeem', async () => {
    await instance.mint(wallet, LARGER_TEST_AMOUNT);
    expect((await instance.balanceOf(wallet)).toString()).to.eq(LARGER_TEST_AMOUNT.toString());
    await instance.transfer(vault, LARGER_TEST_AMOUNT, {from: wallet});
    expect((await instance.balanceOf(wallet)).toString()).to.eq('0');
    expect((await instance.balanceOf(vault)).toString()).to.eq(LARGER_TEST_AMOUNT.toString());
  });

  it('redeem: redemption amount too small', async () => {
    await instance.mint(wallet, TEST_AMOUNT);
    expect((await instance.balanceOf(wallet)).toString()).to.eq(TEST_AMOUNT.toString());
    await reverts(
        instance.transfer(vault, TEST_AMOUNT, {from: wallet}), 'eBTC: redemption amount too small');
  })

  it('redeem with transferFrom', async () => {
    await instance.mint(wallet, LARGER_TEST_AMOUNT);
    expect((await instance.balanceOf(wallet)).toString()).to.eq(LARGER_TEST_AMOUNT.toString());
    await instance.approve(other, LARGER_TEST_AMOUNT, {from: wallet});
    await instance.transferFrom(wallet, vault, LARGER_TEST_AMOUNT, {from: other});
    expect((await instance.allowance(wallet, other)).toString()).to.eq('0');
    expect((await instance.balanceOf(wallet)).toString()).to.eq('0');
    expect((await instance.balanceOf(vault)).toString()).to.eq(LARGER_TEST_AMOUNT.toString());
  })

  it('redeem with transferFrom: redemption amount too small', async () => {
    await instance.mint(wallet, TEST_AMOUNT);
    expect((await instance.balanceOf(wallet)).toString()).to.eq(TEST_AMOUNT.toString());
    await instance.approve(other, TEST_AMOUNT, {from: wallet});
    await reverts(
        instance.transferFrom(wallet, vault, TEST_AMOUNT, {from: other}), 'eBTC: redemption amount too small');
    expect((await instance.allowance(wallet, other)).toString()).to.eq(TEST_AMOUNT.toString());
    expect((await instance.balanceOf(wallet)).toString()).to.eq(TEST_AMOUNT.toString());
    expect((await instance.balanceOf(vault)).toString()).to.eq('0');
  });
});
