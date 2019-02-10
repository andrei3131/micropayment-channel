var web3Provider = null;
var ChannelContract;
const nullAddress = '0x0000000000000000000000000000000000000000';
const vendor_address = '0xeB69331eE6C91C97FDE4B11ab0f8b69F6c7fCf2D';


//import {Personal} from 'web3-eth-personal';

//var Personal = require('../../node_modules/web3-eth-personal')

// Control flow
function showView(id) {
  $(".main_switch" + id).show();
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
  

  //var sock =  require.main.require('path');
  //console.log(require)
  
  // const wss = new WebSocketServer({ port: 8080 })
  // wss.on('connection', ((ws) => {
  // ws.on('message', (message) => {
  //       console.log(`received: ${message}`);
  //       });

  //       ws.on('end', () => {
  //       console.log('Connection ended...');
  //       });

  //       ws.send('Hello Client');
  // }));
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

  // we init the ChannelContract infos so we can interact with it
  initInterface();

}



function initInterface () {
  $.getJSON('ChannelContract.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with truffle-contract
    ChannelContract = TruffleContract(data);

    // Set the provider for our contract
    ChannelContract.setProvider(web3Provider);

    // listen to the events emitted by our smart contract
    getEvents();
    //getMyBalance();
 
    $('#vendor_address').val(vendor_address);

    showAccounts();


    //showViews();

    //signMessage("Test message");
  });
}

function getBalance() {
  var selectedAccountAddress = getSelectedAccount();

  if(selectedAccountAddress ==  "Select account connected to Metamask") return;
  web3.eth.getBalance(selectedAccountAddress, function(err, balance) {
    balance = web3.fromWei(balance, "ether") + " ETH"        
    if(selectedAccountAddress == "Select account connected to Metamask") {
      $('#token_balance').val(balance);
      console.log('YESZ');
    } else {
      console.log('YESZassas');
      $('#token_balance').val(balance);
    }
  });
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



function getEvents () {
  ChannelContract.deployed().then(function(instance) {
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

function showAlert(type, message) {
    $(`#${type}-alert`).show();
    $(`#${type}-alert #${type}-message`).text(message);
    sleep(1000).then(() => {
      $(`#${type}-alert`).hide();      
    });
}


function openChannel() {
  var channel_value = $('#channel_value').val();
  var timeout = $('#timeout').val();
  // Client side validation to avoid sending transaction to contract
  if(channel_value < 1) {
    showAlert('error', 'Invalid deposit value.');
    return;
  }
  
  if(timeout < 1) {
    showAlert('error', 'Invalid timeout value.');
    return;
  }
  

  ChannelContract
    .deployed()
    .then(instance => {
      var vendor_address =  $('#vendor_address').val();
      console.log(instance.address);
      var load_up = {
        from: getSelectedAccount(), 
        to: instance.address, 
        value: web3.toWei(channel_value, 'ether'),
      }

      instance.channel(vendor_address, timeout, load_up).then((result)=>  {
          console.log("Send transaction successful " + result)
          showAlert('opened', "Channel opened.");

          // update user balance
          getBalance();

      }).then( () =>  {
        // Log contract balance
        web3.eth.getBalance(instance.address, function (error, balance) {
          showView('#transfer-view');
          $(`#transfer-view #opened-message-transfer`).text(`Current channel balance is ${balance} wei`);
          
        });
      }); 
  })
}

// Buyer
function executePaymnent() {
   // take contract address and hash and send to client via file or web sockets
   ChannelContract
    .deployed()
    .then(instance => {
      var transferValue = $('#payment_value').val();
      console.log(transferValue);

      signMessage(instance.address, transferValue);
  })
}


//Seler
function closeChannel(msgHash, signature) {
    //var signature = 

   var pastSignatures = store.get('signatures');
   console.log('Past signatures');
   console.log(pastSignatures);
   if(pastSignatures.length == 0) {
      showAlert('error', 'No signatures registered');
      console.log('No signatures registered');
      return;
   }

   var totalValue = 0;
   for(var i = 0; i < pastSignatures.length; i++) {
      var historyEntry = pastSignatures[i]; 
      var instanceAddress = historyEntry[0];
      var transferValue = historyEntry[1];
      var receivedMsgHash = historyEntry[2];
      var buyerSignature = historyEntry[3];

      var message = "(" + instanceAddress + "," + transferValue + ")";
      var msgHash = '0x' + toHex(message);
      if(msgHash != receivedMsgHash) {
        showAlert('error', 'Message hashes do not match!');
        console.log('Message hashes do not match!');  // TODO: from here
        return;
      }
      totalValue += interface(transferValue);
   }
   console.log('Total value = ' + totalValue);
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}


// Message signature creation/verification
function toHex(str) {
  var hex = ''
  for(var i= 0; i < str.length; i++) {
      hex += '' + str.charCodeAt(i).toString(16)
  }
  return hex
}

function signMessage(instanceAddress, transferValue) {
   let address = web3.eth.accounts[0]; // web3.eth.defaultAccount
   console.log("I sign with "  + address)

   var message = "(" + instanceAddress + "," + transferValue + ")";
   var msgHash = '0x' + toHex(message);

   web3.personal.sign(msgHash, address, (err, signature) => {
      if(err)  {
        console.log("Error generating signature.");
        return;
      } 
      console.log('The message hash');
      console.log(msgHash);
      console.log('The signature');
      console.log(signature);

      var pastSignatures = store.get('signatures');
      pastSignatures.push([instanceAddress, transferValue, msgHash, signature]);
      store.set('signatures', pastSignatures);

      $("#signature-from-buyer").prepend('<li>' + 'Msg Hash: ' + msgHash + '\n' + 'sig: ' + signature  + '</li>');

      // should return the signature, transaction will execute on chain if the signature
      // of the message is valid
      //verifySignedMessage(message, signature);
    }
  );
}

function verifySignedMessage(message, signature) {
  ChannelContract
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