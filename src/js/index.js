// Change this to set the mode:
// unique unidirectional channel or multiple unidirectional channels
/********************************************************************/
var multiChannel = true;
var currentChannel = -1;
/**********************************************************************/

var ChannelContract;
var web3Provider     = null;
const nullAddress    = '0x0000000000000000000000000000000000000000';
const vendor_address = '0xeB69331eE6C91C97FDE4B11ab0f8b69F6c7fCf2D';
var paidSoFar        = 0;


// Control flow
function showView(id) {
  $(".main_switch" + id).show();
  $(".main_switch:not("+id+")").hide();
  $(".container").show();
}

function getSelectedAccount() {
  return $( "#accounts option:selected" ).text();
}

function getVendorAccount() {
  return $('#vendor_address').val();
}

function setCurrentChannel() {
   currentChannel = parseInt($('#current_channel').val());
}


// When the page loads, this will call the init() function
$(function() {
  $(window).load(function() {
    initWeb3();
  });
});

function initWeb3() {
  if (typeof web3 !== 'undefined' && typeof web3.currentProvider !== 'undefined') {
    web3Provider = web3.currentProvider;
    web3 = new Web3(web3Provider);
    web3Provider.enable()
  } else {
    console.error('No web3 provider found. Please install Metamask on your browser.');
    alert('No web3 provider found. Please install Metamask on your browser.');
  }

  if(multiChannel) {
    initInterfaceMultiChannel();
  } else {
    initInterfaceUniqueChannel();
  }
}

function initInterfaceUniqueChannel() {
  $.getJSON('ChannelContract.json', function(data) {
    ChannelContract = TruffleContract(data);
    ChannelContract.setProvider(web3Provider);

    getEvents();
    $('#vendor_address').val(vendor_address);
    showAccounts();
  });
}

function initInterfaceMultiChannel() {
  $.getJSON('MultiChannelContract.json', function(data) {
    ChannelContract = TruffleContract(data);
    ChannelContract.setProvider(web3Provider);
    getEvents();
    $('#vendor_address').val(vendor_address);
    showAccounts();
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
        if(log.event == "ChannelDestructed") {
           $("#channel-status").prepend('<li>' + 'Channel expired and destructed.' + '</li>');
        } else if(log.event == "OpenedChannel") {
           $("#channel-status").prepend('<li>&nbsp&nbsp' + 'Opened new channel with ID: ' + log.args['id'] + '</li>');
        } else if (log.event == "ClosedChannel") {   
           $("#channel-status").prepend('<li>&nbsp&nbsp' + 'Closed channel with ID: ' + log.args['id'] + '</li>');
        } else {
          console.log('*** Event intercepted: ***');
          console.log(log.event + ": ");
          for(var key in log.args) {
              console.log("- " + key + ": " + log.args[key]);
          }
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

function channelTimeout() {
  ChannelContract
  .deployed()
  .then(instance => {
       instance.channelTimeout(currentChannel);
  });
  getBalance();
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

      console.log('Sending to contract' +  web3.toWei(channel_value, 'ether'));
      instance.createChannel(vendor_address, timeout, load_up).then((result)=>  {
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
   ChannelContract
    .deployed()
    .then(instance => {
      var transferValue = parseInt($('#payment_value').val());
      paidSoFar += transferValue
      $('#paid_so_far').text('Paid so far: ' + paidSoFar + ' ETH' + '\n');

      console.log(transferValue);

      signMessage(instance.address, paidSoFar);
  });
}

//Seller
function closeChannel() {
   var pastSignatures = null; 
   if(multiChannel) {
     pastSignatures = store.get(currentChannel.toString());
   } else {
     pastSignatures = store.get('signatures');
   }
   console.log('Past signatures');
   console.log(pastSignatures);
   if(pastSignatures.length == 0 || pastSignatures == null) {
      showAlert('error', 'No signatures registered');
      console.log('No signatures registered');
      return;
   }

   if(multiChannel) {
      closeChannelWithSetID(pastSignatures);
   } else {
      closeChannelUnique(pastSignatures);
   }
}

function splitSignature(signature) {
  var r = signature.slice(0, 66);
  var s = '0x' + signature.slice(66, 130);
  var v = '0x' + signature.slice(130, 132);
  v = web3.toDecimal(v);
  console.log(v, r, s);
  return [ v, r, s ];
}

function closeChannelWithSetID(pastSignatures) {
  if(currentChannel == -1) {
    showAlert('error', 'Current channel is not set.');
    console.log('Error: current channel is not set');
    return;
  }
  var totalValue     = pastSignatures[pastSignatures.length - 1][1];
  var msgHash        = pastSignatures[pastSignatures.length - 1][2];
  var buyerSignature = pastSignatures[pastSignatures.length - 1][3];

  [v, r, s] = splitSignature(buyerSignature);

  ChannelContract
  .deployed()
  .then(instance => {
     instance.closeChannel(currentChannel, msgHash, v, r, s, totalValue).then( () =>  {
       console.log('First channel close')
     });
   });
    
    
   console.log('Ever hereeee');
   var vendor = web3.eth.accounts[0];
   console.log('Current should be venodr' + vendor);

   var msgHashSeller =  msgHash; // keccak256Equivalent(instance.address, totalValue);
   console.log('Msg hash SELLER' + msgHashSeller);
   console.log('Msg hash BUYER'  + msgHash);

   var sellerSig = null;
   web3.eth.sign(vendor_address, msgHashSeller, (err, sellerSignature) => {  
     sellerSig = sellerSignature
     console.log('Message hash when closing channel' + msgHashSeller);
     console.log('Buyer signature when closing channel' + buyerSignature);
     console.log('Seller signature when closing channel' + sellerSignature);

     ChannelContract
     .deployed()
     .then(instance => {
       [vSeller, rSeller, sSeller] = splitSignature(sellerSignature);
       instance.closeChannel(currentChannel, msgHashSeller, vSeller, rSeller, sSeller, totalValue).then( () => {
         console.log('This is after second close');
       });
      }); 
   });
}


function closeChannelUnique(pastSignatures) {
  var totalValue     = pastSignatures[pastSignatures.length - 1][1];
  var msgHash        = pastSignatures[pastSignatures.length - 1][2];
  var buyerSignature = pastSignatures[pastSignatures.length - 1][3];


  [v, r, s] = splitSignature(buyerSignature);

  ChannelContract
  .deployed()
  .then(instance => {
     instance.closeChannel(msgHash, v, r, s, totalValue).then( () =>  {
       console.log('First channel close')
     });
   });
    
   var msgHashSeller =  msgHash; // keccak256Equivalent(instance.address, totalValue);

   web3.eth.sign(vendor_address, msgHashSeller, (err, sellerSignature) => {  
     ChannelContract
     .deployed()
     .then(instance => {
 
       [vSeller, rSeller, sSeller] = splitSignature(sellerSignature);
       instance.closeChannel(msgHashSeller, vSeller, rSeller, sSeller, totalValue).then( () => {
         console.log('This is after second close');
       });
      }); 
   });
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
  return hex;
}


function keccak256Equivalent(...args) {
  args = args.map(arg => {
      if (typeof arg === 'string') {
          if (arg.substring(0, 2) === '0x') {
              return arg.slice(2);
          } else {
              return web3.toHex(arg).slice(2);
          }
      }

      if (typeof arg === 'number') {
          return (arg).toString(16).padStart(64, 0);
      } else {
        return '';
      }
  });

  args = args.join('');

  return web3.sha3(args, { encoding: 'hex' });
}

function signMessage(instanceAddress, transferValue) {
   let address = web3.eth.accounts[0]; // web3.eth.defaultAccount
   var msgHash = keccak256Equivalent(instanceAddress, transferValue)

   web3.eth.sign(address, msgHash, (err, signature) => {
      if(err)  {
        console.log("Error generating signature.");
        return;
      } 

      if(multiChannel) {
        var pastSignaturesForChannel = store.get(currentChannel.toString());
        pastSignaturesForChannel.push([instanceAddress, transferValue, msgHash, signature]);
        store.set(currentChannel.toString(), pastSignaturesForChannel);  
      } else {
        var pastSignatures = store.get('signatures');
        pastSignatures.push([instanceAddress, transferValue, msgHash, signature]);
        store.set('signatures', pastSignatures);
      }

      $("#signature-from-buyer").prepend('<li>' + 'Message Hash: ' + msgHash.substr(0, 10) + '...' + 
                                         ', Signature: ' + signature.substr(0, 10) + '...' + 
                                         ', Value: ' + transferValue + ' ETH'  + '</li>');
    }
  );
}

function verifySignedMessage(msgHash, signature) {
  ChannelContract
    .deployed()
    .then(instance => {
      //let eth_message = `\x19Ethereum Signed Message:\n${message.length}${message}`
      //let message_sha = web3.sha3(eth_message);

      return instance.recoverSigner(msgHash, signature);
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