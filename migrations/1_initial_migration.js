var ChannelContract = artifacts.require("./ChannelContract.sol");
var MultiChannelContract = artifacts.require("./MultiChannelContract.sol");

module.exports = function(deployer) {
  deployer.deploy(ChannelContract);
  deployer.deploy(MultiChannelContract);
};
