pragma solidity ^0.5.0;

contract ChannelContract {

    // private, not publicly accessible
    address payable private channelSender;   // make private
    address payable private channelReceiver; // make private
    uint private startDate;
    uint private timeout;
    uint private servicePrice = 1 ether;
    mapping (bytes32 => address) private signatures;
    bool private calledOnceGuard = false;

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

        require(!calledOnceGuard);

        // Ensure the channel is usable only once
        calledOnceGuard = true;

        channelReceiver = _to;
        channelSender = msg.sender;
        startDate = now;
        timeout = _timeout;
    }

    function closeChannel(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s, uint256 value) public {

        address signer = ecrecover(msgHash, v, r, s);
        require(signer == channelSender || signer == channelReceiver);

        // signature valid

        // hash of contract address and amount claimed by receiver
        bytes32 proof = keccak256(abi.encodePacked(this, value)); // TODO: change to sha3 if it does not work
    
        // both sender and receiver must have sign the redeemable value (by sender)
        require(proof == msgHash);

        if(signatures[proof] == address(0)) {
            signatures[proof] = signer;
        } else {
            // transfer function automatically reverts transaction on failure
            channelReceiver.transfer(value * 1 ether); /// value * oneWei);
            selfdestruct(channelSender);
        }
    }

    event ChannelDestructed(string message);

    function channelTimeout() public {
        require(startDate + timeout <= now);
        // self-destruct if expired

        emit ChannelDestructed("Channel expired. Destroying...");

        selfdestruct(channelSender);
    }
}
