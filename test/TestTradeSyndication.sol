pragma solidity ^0.5.0;

import 'truffle/Assert.sol';
import '../contracts/TradeSyndication.sol';

contract TestTradeSyndication {
  TradeSyndication tis = new TradeSyndication();

  function testAllocateAsset() public {
    tis.allocateAsset(msg.sender, "test asset");
    uint result = tis.getOwnedAssetCountForAddress(msg.sender);
    uint expected = 1;
    Assert.equal(result, expected, "Asset has not been correctly allocated");
  }

  event TestEvent(bool indexed result, string message);
}
