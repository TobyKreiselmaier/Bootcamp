const chai = require('chai')
const expect = chai.expect
const truffleAssert = require('truffle-assertions');
const { MaxUint256 } = require('ethers/constants')
const { bigNumberify } = require('ethers/utils')
const { solidity, MockProvider, deployContract } = require('ethereum-waffle')
const EnergiToken = require('../build/contracts/EnergiToken.json')

chai.use(solidity)

function expandTo18Decimals(n) {
  return bigNumberify(n).mul(bigNumberify(10).pow(18))
}

const TEST_AMOUNT = expandTo18Decimals(10)

describe('EnergiToken', () => {
  const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999
  });

  const [wallet, other] = provider.getWallets()

  let token

  beforeEach(async () => {
    token = await deployContract(wallet, EnergiToken)
    await token.initialize(wallet.address, 'Energi', 'NRG', 18);
  })

  /**
   * Testing ERC20 contract
   */

  it('approve', async () => {
    await expect(token.approve(other.address, TEST_AMOUNT))
      .to.emit(token, 'Approval')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT)
  })

  it('transfer', async () => {
    await token.mint(wallet.address, TEST_AMOUNT)
    expect(await token.balanceOf(wallet.address)).to.eq(TEST_AMOUNT)
    await expect(token.transfer(other.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.balanceOf(wallet.address)).to.eq(0)
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
  })

  it('transfer: insufficient balance', async () => {
    await token.mint(wallet.address, TEST_AMOUNT)
    expect(await token.balanceOf(wallet.address)).to.eq(TEST_AMOUNT)
    expect(token.transfer.bind(other.address, TEST_AMOUNT * 2)).to.throw()
    expect(await token.balanceOf(wallet.address)).to.eq(TEST_AMOUNT)
    expect(await token.balanceOf(other.address)).to.eq(0)
  })

  it('transfer: fail', async () => {
    await expect(token.transfer(other.address, 1)).to.be.reverted // ds-math-sub-underflow
    await expect(token.connect(other).transfer(wallet.address, 1)).to.be.reverted // ds-math-sub-underflow
  })

  it('transferFrom', async () => {
    await token.mint(wallet.address, TEST_AMOUNT)
    expect(await token.balanceOf(wallet.address)).to.eq(TEST_AMOUNT)
    await token.approve(other.address, TEST_AMOUNT)
    await expect(token.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.allowance(wallet.address, other.address)).to.eq(0)
    expect(await token.balanceOf(wallet.address)).to.eq(0)
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
  })

  it('transferFrom: max allowance', async () => {
    await token.mint(wallet.address, TEST_AMOUNT)
    expect(await token.balanceOf(wallet.address)).to.eq(TEST_AMOUNT)
    await token.approve(other.address, TEST_AMOUNT)
    await token.approve(other.address, MaxUint256)
    await expect(token.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.allowance(wallet.address, other.address)).to.eq(MaxUint256.sub(TEST_AMOUNT))
    expect(await token.balanceOf(wallet.address)).to.eq(0)
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
  })

  /**
   * Testing EnergiToken contract
   */

  it('name, symbol, decimals, totalSupply, balanceOf', async () => {
    expect(await token.owner()).to.eq(wallet.address)
    expect(await token.name()).to.eq('Energi')
    expect(await token.symbol()).to.eq('NRG')
    expect(await token.decimals()).to.eq(18)
    expect(await token.totalSupply()).to.eq(0)
    expect(await token.balanceOf(wallet.address)).to.eq(0)
  })

  it('initialize: fail', async () => {
    expect(await token.initialized()).to.eq(true)
    await truffleAssert.reverts(
      token.initialize(other.address, 'Other', 'OTH', 15),
      "EnergiToken: ALREADY_INITIALIZED"
    );
    expect(await token.owner()).to.eq(wallet.address)
    expect(await token.name()).to.eq('Energi')
    expect(await token.symbol()).to.eq('NRG')
    expect(await token.decimals()).to.eq(18)
  })

  it('setOwner', async () => {
    expect(await token.owner()).to.eq(wallet.address)
    await token.setOwner(other.address)
    expect(await token.owner()).to.eq(other.address)
  })

  it('setOwner: fail', async () => {
    expect(await token.owner()).to.eq(wallet.address)
    await truffleAssert.reverts(
      token.connect(other).setOwner(other.address),
      "EnergiToken: FORBIDDEN"
    );
    expect(await token.owner()).to.eq(wallet.address)
  })

  it('mint', async () => {
    await expect(token.mint(other.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs('0x0000000000000000000000000000000000000000', other.address, TEST_AMOUNT)
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
    expect(await token.totalSupply()).to.eq(TEST_AMOUNT)
  })

  it('mint: forbidden', async () => {
    await truffleAssert.reverts(
      token.connect(other).mint(other.address, TEST_AMOUNT),
      "EnergiToken: FORBIDDEN"
    );
    expect(await token.balanceOf(other.address)).to.eq(0)
    expect(await token.totalSupply()).to.eq(0)
  })

  it('burn', async () => {
    await token.mint(other.address, TEST_AMOUNT)
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
    expect(await token.totalSupply()).to.eq(TEST_AMOUNT)
    await expect(token.burn(other.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(other.address, '0x0000000000000000000000000000000000000000', TEST_AMOUNT)
    expect(await token.balanceOf(other.address)).to.eq(0)
    expect(await token.totalSupply()).to.eq(0)
  })

  it('burn: insufficient balance', async () => {
    await token.mint(other.address, TEST_AMOUNT)
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
    expect(await token.totalSupply()).to.eq(TEST_AMOUNT)
    expect(token.connect(other).burn.bind(other.address, TEST_AMOUNT * 2)).to.throw()
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
    expect(await token.totalSupply()).to.eq(TEST_AMOUNT)
  })

  it('burn: forbidden', async () => {
    await token.mint(wallet.address, TEST_AMOUNT)
    await truffleAssert.reverts(
      token.connect(other).burn(wallet.address, TEST_AMOUNT),
      "EnergiToken: FORBIDDEN"
    );
    expect(await token.balanceOf(wallet.address)).to.eq(TEST_AMOUNT)
    expect(await token.totalSupply()).to.eq(TEST_AMOUNT)
  })
})
