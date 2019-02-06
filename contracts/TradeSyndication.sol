pragma solidity ^0.5.0;

contract TradeSyndication {

    address public owner;
    mapping (address => uint256) balanceOf;
    mapping (address => address) channels;

    constructor(uint256 initialSupply) public {
        owner = msg.sender;
        balanceOf[msg.sender] = initialSupply;
    }

    /* Send coins */
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value);           // Check if the sender has enough
        require(balanceOf[_to] + _value >= balanceOf[_to]); // Check for overflows
        balanceOf[msg.sender] -= _value;                    // Subtract from the sender
        balanceOf[_to] += _value;                           // Add the same to the recipient
        return true;
    }


    function createChannel(address _sender, address _receiver) public {
        channels[_sender] = _receiver;
    }

    event Debug(address _addr, string _msg);
    event DebugValue(address _addr, string _msg, uint256 _val);

    function getBalance(address _addr) public returns (uint256) {
        //emit DebugValue(_addr, "The value of the message", balanceOf[_addr]);
        return balanceOf[_addr];
    }




    // Message signature verification
    function splitSignature(bytes memory sig) internal pure returns (uint8, bytes32, bytes32) {
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
    function recoverSigner(bytes32 msgHash, bytes memory sig) public pure returns (address) {
        uint8 v;
        bytes32 r;
        bytes32 s;

        (v, r, s) = splitSignature(sig);

        return ecrecover(msgHash, v, r, s);
    }
    
    function isSigned(address _addr, bytes32 msgHash, bytes memory sig) public pure returns (bool) {
        uint8 v;
        bytes32 r;
        bytes32 s;

        (v, r, s) = splitSignature(sig);

        return ecrecover(msgHash, v, r, s) == _addr;
}
}
