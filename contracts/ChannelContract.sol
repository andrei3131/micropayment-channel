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


    function closeChannel(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s, uint value) public {

        address signer = ecrecover(msgHash, v, r, s);
        require(signer == channelSender || signer == channelReceiver);

        // signature valid

        // hash of contract address and amount claimed by receiver
        bytes32 proof = keccak256(abi.encodePacked(this, value)); // TODO: change to sha3 if it does not work
    
        // both sender and receiver must have sign the redeemable value (by sender)
        require(proof == msgHash);

        if(signatures[proof] == 0x0000000000000000000000000000000000000000) {
            signatures[proof] = signer;
        } else {
            bool success = channelReceiver.send(value);
            if(!success) {
                revert();
            }
            selfdestruct(channelSender);
        }
    }

    function channelTimeout() public {
        require(startDate + timeout <= now);
        // self-destruct if expired

        selfdestruct(channelSender);
    }

    // Message signature verification
    function splitSignature(bytes32 sig) internal pure returns (uint8, bytes32, bytes32) {
        require(sig.length == 65);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }
    
    // usage https://programtheblockchain.com/posts/2018/02/17/signing-and-verifying-messages-in-ethereum/
    function recoverSigner(bytes32 msgHash, bytes32 sig) public pure returns (address) {
        uint8 v;
        bytes32 r;
        bytes32 s;

        (v, r, s) = splitSignature(sig);

        return ecrecover(msgHash, v, r, s);
    }
}
