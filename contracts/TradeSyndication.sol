pragma solidity ^0.5.0;

contract TradeSyndication {

    address public owner;
    uint public totalNumberOfAssets;

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    struct Asset {
        string name;
        bool isSold;
    }



    mapping (address => mapping (uint256 => Asset)) public mapOwnerAssets;
    mapping (address => uint256) public mapOwnerAssetCount;

    event AssetAllocated(address indexed _verifiedOwner, uint256 indexed _totalAssetCount, string _assetName);
    event AssetTransferred(address indexed _from, address indexed _to, string _assetName);

    function getString() public pure returns (string memory) {
        return "A string";
    }

    function allocateAsset(address _verifiedOwner, string memory _assetName) public onlyOwner {
        uint assetIndex = mapOwnerAssetCount[_verifiedOwner];
        mapOwnerAssets[_verifiedOwner][assetIndex] = Asset({name : _assetName, isSold : false});
        mapOwnerAssetCount[_verifiedOwner]++;
        totalNumberOfAssets++;

        // Event
        emit AssetAllocated(_verifiedOwner, mapOwnerAssetCount[_verifiedOwner], _assetName);
    }

}
