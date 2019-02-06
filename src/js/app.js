var web3Provider = null;
var WrestlingContract;
const nullAddress = "0x0000000000000000000000000000000000000000";


//import {Personal} from 'web3-eth-personal';

//var Personal = require('../../node_modules/web3-eth-personal')

// Control flow
function showView(id) {
  $(".main_switch"+id).show();
  $(".main_switch:not("+id+")").hide();
  $(".container").show();
}

// When the page loads, this will call the init() function
$(function() {
  $(window).load(function() {
    init();
  });
});

function init() {
  // We init web3 so we have access to the blockchain
  initWeb3();
}

function initWeb3() {
  if (typeof web3 !== 'undefined' && typeof web3.currentProvider !== 'undefined') {
    web3Provider = web3.currentProvider;
    web3 = new Web3(web3Provider);
   // personal = new Personal(Web3.currentProvider);
    web3Provider.enable()
  } else {
    console.error('No web3 provider found. Please install Metamask on your browser.');
    alert('No web3 provider found. Please install Metamask on your browser.');
  }

  // we init The Wrestling contract infos so we can interact with it
  initWrestlingContract();

}



function initWrestlingContract () {
  $.getJSON('TradeSyndication.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with truffle-contract
    WrestlingContract = TruffleContract(data);

    // Set the provider for our contract
    WrestlingContract.setProvider(web3Provider);

    // listen to the events emitted by our smart contract
    getEvents();
    //getMyBalance();
 
    $('#vendor_address').val('0xeB69331eE6C91C97FDE4B11ab0f8b69F6c7fCf2D');

    showAccounts();


    //showViews();

    //signMessage("Test message");
  });
}

function updateBalance() {
  WrestlingContract
  .deployed()
  .then(instance => {
    var selectedAccountAddress = getSelectedAccount();
    console.log(selectedAccountAddress);
    instance.getBalance.call(selectedAccountAddress).then(function(res) {
      console.log('ress');
      console.log(res);
      console.log("Select your testnet account" == "Select your testnet account");
      console.log('ress end');

      if(selectedAccountAddress == "Select your testnet account") {
        $('#token_balance').val(res.c[0]);
        console.log('YESZ');
      } else {
        console.log('YESZassas');
        $('#token_balance').val(res.c[0]);
      }
    });
  })
  .catch(e => {
    console.error(e)
})
}

function getSelectedAccount() {
  return $( "#accounts option:selected" ).text();
}

function getVendorAccount() {
  return $('#vendor_address').val();
}

function showAccounts() {
  var allAccounts = web3.eth.accounts;
  if(allAccounts.length == 0) {
     showView('#no_accounts');
     return;
  }
  console.log(allAccounts);
    var $accounts = $('#accounts');

    for(var i = 0; i < allAccounts.length; i++) {
      var o = $("<option></option>").attr("value", i).text(allAccounts[i]);
      $accounts.append(o);
    }
    $accounts.change();
}


function showViews() {
  //showView('#home');
}



function getEvents () {
  WrestlingContract.deployed().then(function(instance) {
    var events = instance.allEvents(function(error, log){
      if (!error) {
        $("#eventsList").prepend('<li>' + log.event + '</li>'); // Using JQuery, we will add new events to a list in our index.html
        console.log('*** Event intercepted: ***');
        console.log(log.event + ": ");
        for(var key in log.args) {
            console.log("- " + key + ": " + log.args[key]);
        }
      }
    });
    }).catch(function(err) {
      console.log(err.message);
  });
}


function getMyBalance () {
  WrestlingContract
  .deployed()
  .then(instance => {
    console.log("getting my balance")
    instance.getBalance().then(function(res) {
      $("#balance").text(res);
      console.log(res); // because you get a BigNumber
    });
  })
  .catch(e => {
    console.error(e)
})

  WrestlingContract
  .deployed()
  .then(instance => {
    console.log("getting my balance")
    instance.mata().then(function(res) {
      //$("#balance").text(res);
      console.log(res); // because you get a BigNumber
    });
  })
  .catch(e => {
    console.error(e)
})

}


// Message signature creation/verification
function toHex(str) {
  var hex = ''
  for(var i= 0; i < str.length; i++) {
      hex += '' + str.charCodeAt(i).toString(16)
  }
  return hex
}

function signMessage(message) {
   let address = web3.eth.accounts[0]; // web3.eth.defaultAccount
   console.log("I sign with "  + address)
   web3.personal.sign('0x' + toHex(message), address, (err, signature) => {
      if(err)  {
        console.log("Error generating signature.");
        return;
      } 
      // should return the signature, transaction will execute on chain if the signature
      // of the message is valid
      verifySignedMessage(message, signature);
    }
  );
}

function verifySignedMessage(message, signature) {
  WrestlingContract
    .deployed()
    .then(instance => {
      let eth_message = `\x19Ethereum Signed Message:\n${message.length}${message}`
      let message_sha = web3.sha3(eth_message);

      return instance.recoverSigner(message_sha, signature);
    })
    .then(data => {
      console.log('-----data------')
      console.log(`input addr ==> ${web3.eth.accounts[0]}`)
      console.log(`output addr => ${data}`)
    })
    .catch(e => {
      console.error(e)
  })
}