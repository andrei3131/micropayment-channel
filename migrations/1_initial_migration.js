var TradeSyndication = artifacts.require("./TradeSyndication.sol");

module.exports = function(deployer) {
  deployer.deploy(TradeSyndication, 1000);
};
