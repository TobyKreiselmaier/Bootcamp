const ERC20 = artifacts.require("ERC20");

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(ERC20, "AngryBirdCoin", "ABCX", 4);
  const instance = await ERC20.deployed();
  await instance.mint(accounts[1], 100);
  var bal = await instance.balanceOf(accounts[1]);
  var sym = await instance.symbol();
  console.log(`Account ${accounts[1]} has a balance of ${bal} ${sym}.`);
};