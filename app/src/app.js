//import Web3 from "web3";
import marketArtifact from "../../build/contracts/Market.json";
import {renderOrders} from "./lib/render.js";
import $ from 'jquery';
import './css/style.css';

import { default as Web3} from 'web3';

const BN = require('bn.js');
  
var round = 0;

 const App = {
  web3: null,
  account: null,
  market: null,

  
  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = marketArtifact.networks[networkId];
      this.market = new web3.eth.Contract(
        marketArtifact.abi,
        deployedNetwork.address,
      );
      
      // get accounts    
      const accounts = await web3.eth.getAccounts();
      console.log(accounts);
      this.account = accounts[0];

    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
   //Load all Orders 
     
      App.loadOrders();
  //    App.period();
   // Every 15 minutes settlement functions are executed   
    setInterval(function(){
      App.allfunc()}, 900000); 
  },

 //Start Auction
  startAuction: async function () {

   
    const { startAuction } = this.market.methods;
    await startAuction().send({  from: web3.eth.defaultAccount   });

    this.updateState(0);
    this.setStatus("Auction has started");

  },


//Load all Orders and render them in Home page
  loadOrders: async function () {
      //Get How many orders are there > Orders Length as Number
      const {getOrdersCount} = this.market.methods;
    
      var count = Number(await getOrdersCount().call({from: web3.eth.defaultAccount}));

      var orders = [];
      var bid = "BID";
      var ask = "ASK";

      var matchedBids = [];
      var matchedAsks = [];
      const { getOrdersByIndex } = this.market.methods;


      for (var i = 1 ; i < count; i++){
             var order = await getOrdersByIndex(i).call({from: web3.eth.defaultAccount});  
          //This is temporary because somehow Web3HextoASCI() function didint work in web3js 1.00 BEta  version     
            if (order._type == '0x4249440000000000000000000000000000000000000000000000000000000000') {  
               
                order._type = bid;
              } 
              else {
                order._type = ask;
            }
         orders.push(order);     
               // console.log(order);
      }

        
       await renderOrders($('#orders'), orders);   

     
  },


  period: async function () {

     //Show the Trading time Interval
        const { biddingEnd } = this.market.methods;
            var biddingTime = await biddingEnd().call({from: web3.eth.defaultAccount});
            
            var myDate = new Date(biddingTime * 1000);
            console.log("TRADING PHASE FINISHES", myDate.toLocaleString());
              

            const tradingElement = document.getElementById('tradingPhase');
                tradingElement.innerHTML = myDate.toLocaleString();
                  console.log("DATE", myDate);
  },

  registerAuthority: async function() {
    //try {
      const _ca = document.getElementById("_a").value;
      //const accounts = await web3.eth.getAccounts();

      this.setStatus("Registering Authority... (please wait)");

      const { registerAuthority } = this.market.methods;
      await registernewAuthority(_a).send({ from: web3.eth.defaultAccount });
     //from: web3.eth.defaultAccount

     this.setStatus("Registration complete!");
    // }catch (error){ console.error("Registration Failed")};

    
  },
  //SettlementPhase function orchestration // Temporary solution for DEMO 
  allfunc: async function () {
  
       //first a send transaction because of state change in matching function in Blockchain
        App.matchedPrice();

        //the timeout for functions to be added in blockchain is just a quick solution for demo purposes
          function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
           };

           //wait some seconds for this transaction to be sigend by the user in UI via Metamask
         await timeout(7000);
         //call on pmatchingPrice public variable for price per period
          App.priceCall();

          //wait for other functions which can be executed
          //await timeout(1000);
         // App.totalBid();
         // App.totalAsk();
},

  //How much energy a Seller sold - can be checked in Sell.html
  energySold: async function () {
      

                const {getmatchedAskOrderMapping} = this.market.methods;
                 
                   //get the peirod at which the bids are sent
               const { period } = this.market.methods;
                round = Number(await period().call());
              

                                // get accounts    
               var matchedaskEnergy = Number(await getmatchedAskOrderMapping(round, (web3.eth.defaultAccount)).call({from: web3.eth.defaultAccount}));


                const energysellElement = document.getElementById('soldEnergy');
                energysellElement.innerHTML = matchedaskEnergy ;
  
                  console.log("MATCHED SELL", matchedaskEnergy );



  },


 /* totalAsk: async function() {

                  const { cumAskVol} = this.market.methods;

                  var cumAsks = Number(await cumAskVol().call({from: web3.eth.defaultAccount}));  

                  const cumAskElement = document.getElementById('cumAsk');
                  cumAskElement.innerHTML = cumAsks ;
  
                  console.log("AGGREGATED ASKS", cumAsks);

                                
  },

  totalBid: async function() {


                  const { cumBidVol} = this.market.methods;

                  var cumBids = Number(await cumBidVol().call({from: web3.eth.defaultAccount}));

                   const cumBidElement = document.getElementById('cumBid');
                   cumBidElement.innerHTML = cumBids ;
                  console.log("AGGREGATED BIDS", cumBids );
                   this.setStatus(" OBJECTIVE REACHED: All the aggregated demand is satisfied");

  },*/

  //How much energy a Buyer bought - can be checked in Buy.html
   energyBought: async function () {

                      //get the peirod at which the bids are sent
               const { period } = this.market.methods;
               round = Number(await period().call());
              

               const {getmatchedBidOrderMapping} = this.market.methods;               
               var matchedBuyEnergy = Number(await getmatchedBidOrderMapping(round, (web3.eth.defaultAccount)).call({from: web3.eth.defaultAccount}));

           
                const energybuyElement = document.getElementById('boughtEnergy');
                energybuyElement.innerHTML = matchedBuyEnergy;
  
                  console.log("MATCHED BUY", matchedBuyEnergy);


                var orders = [];
                for (var index in matchedBids){
                  let volume = await instance.getOrderVolume(index);
                  orders.push(volume.toNumber());
                }             
                console.log("VOLUME OF MATCHED BID ORDERS", orders);
                

},
  //The matching price call per period
  matchedPrice: async function() {

           const { period } = this.market.methods;
           const {matching} = this.market.methods;

          round = Number(await period().call());
          console.log("CURRENT PERIOD:", round);

          //changes states thus needs send function
          var match =  await matching().send({from: web3.eth.defaultAccount}); 
          
     },


//Get all the MATCHED ORDERS through ORDER ID's of the BIDS AND ASKS 
priceCall: async function() {

          const {matching} = this.market.methods;
          const UniformPrice = Number(await matching().call({from: web3.eth.defaultAccount})); 

          const priceElement = document.getElementById('matchingPrice');
          priceElement.innerHTML = UniformPrice;

          console.log("PRICE", UniformPrice);

               var matchedBids = [];
               var matchedAsks = [];

                //THE IDs OF MATCHED ORDERS
                const {matchedBidOrderListLength} = this.market.methods;
                const {matchedAskOrderListLength} = this.market.methods;
    

                let lengthMatchedBids = Number(await matchedBidOrderListLength().call({from: web3.eth.defaultAccount}));
                let lengthMatchedAsks = Number(await matchedAskOrderListLength().call({from: web3.eth.defaultAccount}));

                  console.log("BIDS LENGTH", lengthMatchedBids);
                  console.log("ASKS LENGTH",lengthMatchedAsks);
                for (let i = 0; i < lengthMatchedBids; i++) {
                
                   const {currMatchedBidOrderMapping} = this.market.methods;

                         let bid = Number(await currMatchedBidOrderMapping(i).call({from: web3.eth.defaultAccount}));
                        matchedBids.push(bid);
                  }                  
                  console.log("ORDER ID's OF MATCHED BIDS  ", matchedBids);


                for (let i = 0; i < lengthMatchedAsks; i++) {

                   const {currMatchedAskOrderMapping} = this.market.methods;
                    let ask = Number(await currMatchedAskOrderMapping(i).call({from: web3.eth.defaultAccount}));
                    matchedAsks.push(ask);
                }
                console.log("ORDER ID's of MATCHED AKS", matchedAsks);


},


  submitBid: async function() {

     this.$newBid = $('#new-bid'); 
        this.$priceBid = $('#price-bid'); 
        this.$volumeBid = $('#volume-bid');
        this.$btnBid = $('#btn1');

       

      this.$newBid.on('submit', (event) => {
          event.preventDefault();
              const {submitBid} = this.market.methods;
             submitBid(this.$priceBid.val(), this.$volumeBid.val()).send({from: web3.eth.defaultAccount})
             .then(() => {
            console.log('Order created!');
          })
          .catch((error) => {
            console.log(`Oops... There was an error: ${error}`);
          });
        });


  },

//FUNCTION for submitting an ASK and loading in the HOme Page

  submitAsk: async function () {

       this.$newAsk = $('#new-ask'); 
       this.$priceAsk = $('#price-ask'); 
       this.$volumeAsk = $('#volume-ask');



      this.$newAsk.on('submit', (event) => {
          event.preventDefault();
              const {submitAsk} = this.market.methods;
             submitAsk(this.$priceAsk.val(), this.$volumeAsk.val()).send({from: web3.eth.defaultAccount})
             .then(() => {
            console.log('Order created!');
          })
          .catch((error) => {
            console.log(`Oops... There was an error: ${error}`);
          });
        });

  },

  
//FUNCTION for submitting a Bid and loading in the HOme Page
  register: async function() {

    const _sm = document.getElementById("_sm").value;
    const _user = document.getElementById("_user").value;

    this.setStatus("Registering smart meter and a User");

    const { register } = this.market.methods;
    await register(_sm ,_user).send({  from: web3.eth.defaultAccount   });

    this.setStatus("Reigstration is complete");
    
  },



//Helper functions

  getOrdersByIndex: async function() {
    var orders = [];
  //  const index = parseInt(document.getElementById('_index').value);
    const { getOrdersByIndex } = this.market.methods;
    var order = await getStruct().call({from: web3.eth.defaultAccount});

    var orderElement = document.getElementsByClassName("order");
    orderElement.innerHTML = order;

    await renderOrders($('#orders'), [order]);

  },


  getStruct: async function() {

    var bids = []; 

    const { getStruct } = this.market.methods;
    var bid = await getStruct().call({from: web3.eth.defaultAccount});

    var bidElement = document.getElementsByClassName("bids");
    bidElement.innerHTML = bid;

     await renderOrders($('#bids'), [bid]);
  },



  updateState: async function () {

    const { updateState } = this.market.methods;
    await updateState().send({  from: web3.eth.defaultAccount   });

  },



  setStatus: function(message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  },


};


window.App = App;

window.addEventListener("load", function() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:7545"),
    );
  }
  
  App.start();
});
