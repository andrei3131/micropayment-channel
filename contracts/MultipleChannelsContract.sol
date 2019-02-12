pragma solidity ^0.5.0;

contract ChannelContract {

    address payable public channelSender;   // make private
    address payable public channelReceiver; // make private
    uint public startDate;
    uint public timeout;
    uint public servicePrice = 1 ether;
    mapping (bytes32 => address) signatures;


    /* 
        The fallback function is necessary in case a user wants to interact with the contract
        from a wallet. In this case the function takes no arguments, but accepts funds, i.e. the user
        who knows the address of its channel with the vendor wants to top-up directly from his wallet.
        In this case, we assume the channel receiver has been set previously from the web interface.
        This is useful for online services, such as a mobile carrier top-up.    
    */
    function () external payable { }

    function createChannel(address payable _to, uint _timeout) public payable {
        require(msg.value >= servicePrice);

        channelReceiver = _to;
        channelSender = msg.sender;
        startDate = now;
        timeout = _timeout;
    }

    event FirstClose(string first);
    event SecondClose(string second);
    event AfterSend(string aftersend);
    event HereOne(string aftersend);
    event HereTwo(string aftersend);
    event HereThree(string aftersend);
    event CheckBalance(string checkBalance, uint balance);
    event Status(bool result);
    event PrintAddress(address printedAddress);

    function closeChannel(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s, uint256 value) public payable {

        address signer = ecrecover(msgHash, v, r, s);
        require(signer == channelSender || signer == channelReceiver);

        // signature valid

        // hash of contract address and amount claimed by receiver
        bytes32 proof = keccak256(abi.encodePacked(this, value)); // TODO: change to sha3 if it does not work
    
        // both sender and receiver must have sign the redeemable value (by sender)
        require(proof == msgHash);

        if(signatures[proof] == 0x0000000000000000000000000000000000000000) {
            signatures[proof] = signer;
            emit FirstClose("test first close");
        } else {
            emit CheckBalance("Check balance before send", address(this).balance);
            emit CheckBalance("Check amount before send", value * 1 ether);
            emit PrintAddress(channelReceiver);
            emit PrintAddress(channelSender);
            channelReceiver.transfer(value * 1 ether); /// value * oneWei);
            emit SecondClose("test second close");
            emit AfterSend("after send, self destruct");
            selfdestruct(channelSender);
        }
    }

    function channelTimeout() public {
        require(startDate + timeout <= now);
        // self-destruct if expired

        selfdestruct(channelSender);
    }
}
