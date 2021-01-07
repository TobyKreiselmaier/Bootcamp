const EnergiToken = artifacts.require("EnergiToken");
const EnergiTokenProxy = artifacts.require("EnergiTokenProxy");
const EnergiTokenUpgrade = artifacts.require("EnergiTokenUpgrade");
const EnergiTokenUpgrade2 = artifacts.require("EnergiTokenUpgrade2");


module.exports = function (deployer, network, accounts) {
  const owner = accounts[0]
  console.log('\nOwner address: ' + owner + '\n')
  console.log('\nDeploying EnergiToken contract\n')

  deployer.deploy(EnergiToken).then(function(token) {
    console.log('\nEnergi ERC20 token address: ' + token.address + '\n')
    console.log('\nDeploying EnergiTokenProxy contract\n')

    return deployer.deploy(EnergiTokenProxy, owner, token.address).then(async function(proxy) {
      const proxyOwner = await proxy.proxyOwner();
      const delegate = await proxy.delegate();
      console.log('\nProxy address: ' + proxy.address)
      console.log('\n Owner: ' + proxyOwner)
      console.log('\n Delegate: ' + delegate)

      console.log('\n\nInitializing Energi ERC20 token implementation through proxy\n')

      return EnergiToken.at(proxy.address).then(async function(impl) {
        await impl.initialize(owner, 'Energi', 'NRGT', 18);
        const initialized = await impl.initialized();
        const tokenOwner = await impl.owner();
        const name = await impl.name();
        const symbol = await impl.symbol();
        const decimals = await impl.decimals();

        console.log('\n Initialized: ' + initialized)
        console.log('\n Owner: ' + tokenOwner)
        console.log('\n Name: ' + name)
        console.log('\n Symbol: ' + symbol)
        console.log('\n Decimals: ' + decimals)

        console.log('\nDeploying EnergiTokenUpgrade contract\n')

        return deployer.deploy(EnergiTokenUpgrade).then(async function(tokenUpgrade) {

          console.log('\nEnergi ERC20 token upgrade address: ' + tokenUpgrade.address + '\n')

          console.log('\nUpgrading Energi ERC20 token implementation\n')

          await proxy.upgradeDelegate(tokenUpgrade.address);

          const newDelegate = await proxy.delegate();

          console.log('\n New Delegate: ' + newDelegate)

          console.log('\n\nInitializing Energi ERC20 token upgrade implementation through proxy\n')

          const vault = accounts[1]

          const MIN_REDEMPTION_AMOUNT = '1000000000000000000000'

          return EnergiTokenUpgrade.at(proxy.address).then(async function (implUpgrade) {
            await implUpgrade.initializeUpgrade(vault, MIN_REDEMPTION_AMOUNT);
            const upgradeInitialized = await implUpgrade.upgradeInitialized();

            const redemptionVault = await implUpgrade.vault();
            const minRedemptionAmount = await implUpgrade.minRedemptionAmount();

            console.log('\n Initialized Upgrade: ' + upgradeInitialized)
            console.log('\n Min Redemption Amount: ' + minRedemptionAmount)
            console.log('\n vault: ' + redemptionVault)


            console.log('\nDeploying EnergiTokenUpgrade2 contract\n')

            return deployer.deploy(EnergiTokenUpgrade2).then(async function(tokenUpgrade2) {

              console.log('\nEnergi ERC20 token upgrade 2 address: ' + tokenUpgrade2.address + '\n')

              console.log('\nUpgrading Energi ERC20 token implementation\n')

              await proxy.upgradeDelegate(tokenUpgrade2.address);

              const newDelegate = await proxy.delegate();

              console.log('\n New Delegate: ' + newDelegate)

              console.log('\n\nSetting Energi ERC20 token upgrade 2 name and symbol through proxy\n')
              const NAME = 'Energi Token';
              const SYMBOL = 'NRGE';

              return EnergiTokenUpgrade2.at(proxy.address).then(async function (implUpgrade2) {

                await implUpgrade2.setName(NAME);
                await implUpgrade2.setSymbol(SYMBOL);

                const name = await implUpgrade2.name();
                console.log('\n Name: ' + name)

                const symbol = await implUpgrade2.symbol();
                console.log('\n Symbol: ' + symbol)

                console.log('\n\nMigrations completed successfully\n')

                const initialized = await implUpgrade2.initialized();
                const tokenOwner = await implUpgrade2.owner();
                const decimals = await implUpgrade2.decimals();
                const upgradeInitialized = await implUpgrade2.upgradeInitialized();
                const redemptionVault = await implUpgrade2.vault();
                const minRedemptionAmount = await implUpgrade2.minRedemptionAmount();

                console.log('\n Initialized: ' + initialized)
                console.log('\n Owner: ' + tokenOwner)
                console.log('\n Decimals: ' + decimals)
                console.log('\n Initialized Upgrade: ' + upgradeInitialized)
                console.log('\n Min Redemption Amount: ' + minRedemptionAmount)
                console.log('\n vault: ' + redemptionVault)
                console.log('\n Name: ' + name)
                console.log('\n Symbol: ' + symbol)
              })
            })
          })
        })
      })
    });
  });
};
