pragma solidity ^0.5.0;

contract TradeSyndication {

    address public owner;
    mapping (address => uint256) balances;

    constructor() public {
        owner = msg.sender;
        balances[msg.sender] = 888;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function getString() public pure returns (string memory) {
        return "A string";
    }

    event DepositSuccess(string message);

    function deposit(uint256 amount) public {
        balances[msg.sender] += amount;
        emit DepositSuccess("Yesss");
    }

    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
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
