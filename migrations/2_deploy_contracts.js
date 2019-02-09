var ChannelContract = artifacts.require("./ChannelContract.sol");

module.exports = function(deployer) {
  deployer.deploy(ChannelContract);
};
