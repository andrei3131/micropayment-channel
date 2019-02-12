var ChannelContract = artifacts.require("./ChannelContract.sol");
var MultiChannelContract = artifacts.require("./MultiChannelContract.sol");

const nullAddress = '0x0000000000000000000000000000000000000000';

module.exports = function(deployer) {
  deployer.deploy(ChannelContract);
  deployer.deploy(MultiChannelContract, nullAddress, 0);
};
