const ERC20 = artifacts.require("ERC20");

contract("Minting Test", async accounts => {
  it("should put 100 ABCX in the second account", async () => {
    var instance = await ERC20.deployed();
    var balance = await instance.balanceOf(accounts[1]);
    assert.equal(balance.valueOf(), 100, "Error: Minting function can not be trusted!");
  });
});