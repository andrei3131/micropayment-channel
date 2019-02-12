pragma solidity ^0.5.0;

contract MultiChannelContract {


    struct Channel {
        address payable channelSender;
        address payable channelReceiver;
        uint startDate;
        uint timeout;
        mapping (bytes32 => address) signatures;
    }
    
    uint lastChannelId = 0;
    mapping (uint => Channel) channelMap;
    mapping (uint => bool) openChannels;
    mapping (uint => bool) closedChannels;

    /* 
        The fallback function is necessary in case a user wants to interact with the contract
        from a wallet. In this case the function takes no arguments, but accepts funds, i.e. the user
        who knows the address of its channel with the vendor wants to top-up directly from his wallet.
        In this case, we assume the channel receiver has been set previously from the web interface.
        This is useful for online services, such as a mobile carrier top-up.    
    */
    function () external payable { }

    event OpenedChannel(uint id);

    function createChannel(address payable _to, uint _timeout) public payable {
        Channel memory ch; 
        ch.channelReceiver = _to;
        ch.channelSender   = msg.sender;
        ch.startDate       = now;
        ch.timeout         = _timeout; 

        openChannels[lastChannelId] = true;
        emit OpenedChannel(lastChannelId);
        channelMap[lastChannelId] = ch;
        lastChannelId++;
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

    event ClosedChannel(uint id);

    function closeChannel(uint channelId, bytes32 msgHash, uint8 v, bytes32 r, bytes32 s, uint256 value) public payable {
        address payable channelSender           = channelMap[channelId].channelSender;
        address payable channelReceiver         = channelMap[channelId].channelReceiver;
        mapping (bytes32 => address) storage signatures = channelMap[channelId].signatures;
        
        require(openChannels[channelId]); // channelId must be open

        address signer = ecrecover(msgHash, v, r, s);
        require(signer == channelSender || signer == channelReceiver);

        // signature valid

        // hash of contract address and amount claimed by receiver
        bytes32 proof = keccak256(abi.encodePacked(this, value)); // TODO: change to sha3 if it does not work
    
        // both sender and receiver must have sign the redeemable value (by sender)
        require(proof == msgHash);

        if(signatures[proof] == address(0)) {
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
            

            openChannels[channelId] = false;
            closedChannels[channelId] = true;
            emit ClosedChannel(channelId);
            channelSender.transfer(address(this).balance);
        }
    }

    function channelTimeout(uint channelId) public {
        require(openChannels[channelId]); // channelId must be open

        Channel memory ch = channelMap[channelId];

        require(ch.startDate + ch.timeout <= now);
        // self-destruct if expired

        openChannels[channelId] = false;
        closedChannels[channelId] = true;
        emit ClosedChannel(channelId);
        ch.channelSender.transfer(address(this).balance);
    }
}
