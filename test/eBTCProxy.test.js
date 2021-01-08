const eBTC = artifacts.require('eBTC.sol');
const eBTCProxy = artifacts.require('eBTCProxy');
import { expect as _expect, use } from 'chai';
const expect = _expect;
import { reverts } from 'truffle-assertions';
import { bigNumberify } from 'ethers/utils';
import { solidity } from 'ethereum-waffle';

use(solidity);

function expandTo18Decimals(n) {
  return bigNumberify(n).mul(bigNumberify(10).pow(18));
}

const TEST_AMOUNT = expandTo18Decimals(10);

contract('eBTCProxy', accounts => {

  const owner = accounts[0];
  const other = accounts[1];
  let token, proxy, instance;

  beforeEach('Proxy setup', async() => {
    token = await eBTC.new();
    proxy = await eBTCProxy.new(owner, token.address);
    instance = await eBTC.at(proxy.address);
    await instance.initialize(owner, 'eBTC', 'eBTC', 18);
  });

  /**
   * Testing eBTCProxy contract
   */

  it('Proxy owner and delegate', async () => {
    expect(await proxy.proxyOwner()).to.eq(owner);
    expect(await proxy.delegate()).to.eq(token.address);
  });

  it('setProxyOwner', async () => {
    expect(await proxy.proxyOwner()).to.eq(owner);
    await proxy.setProxyOwner(other);
    expect(await proxy.proxyOwner()).to.eq(other);
  });

  it('setProxyOwner: fail', async () => {
    expect(await proxy.proxyOwner()).to.eq(owner);
    await reverts(proxy.setProxyOwner(other, {from: other}), 'eBTCProxy: FORBIDDEN');
    expect(await proxy.proxyOwner()).to.eq(owner);
  });

  it('setDelegate', async () => {
    expect(await proxy.delegate()).to.eq(token.address);
    await proxy.setDelegate(other);
    expect(await proxy.delegate()).to.eq(other);
  });

  it('setDelegate: fail', async () => {
    expect(await proxy.delegate()).to.eq(token.address);
    await reverts(proxy.setDelegate(other, {from: other}), 'eBTCProxy: FORBIDDEN.');
    expect(await proxy.delegate()).to.eq(token.address);
  });

  /**
   * Testing eBTC contract instance through eBTCProxy contract
   */

  it('initialize: fail', async () => {
    expect(await instance.initialized()).to.eq(true);
    await reverts(instance.initialize(other, 'Other', 'OTH', 15), 'eBTC: ALREADY_INITIALIZED');
  });
})
