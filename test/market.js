
const Market = artifacts.require("Market");
const truffleAssert = require('truffle-assertions');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
chai.use(chaiAsPromised);
const co = require('co');
const BN = require('bn.js');
const moment = require('moment');
var fs = require('fs');
/*
var increasetime = require("./helpers/increaseTime");
    const increaseTimeTo = increasetime.increaseTimeTo;
    var currTime = increasetime.currTime;*/
   // var timeInterval = increasetime.timeInterval;

let database = {
  estimatedGas: ""
};


const eth = web3.eth;

contract('Market', (accounts) => {

    var authorities = [];
    var producers = [];
    var consumers = [];
    var eventHandler;
    var otherEventHandler;
    const defaultAccount = accounts[0];
    var period = 0;


    beforeEach(async function() {

        //Splitted the Ganache accounts for different Roles
        accounts = accounts.slice(0, accounts.length);
        authorities = accounts.slice(0, 1);
        producers = accounts.slice(2, 8);
        consumers = accounts.slice(9, 17);
        instance = await Market.deployed();

    });

    describe('REGISTERY CHECKS ', async () => {
  
         it('The contract should be deployed to the blockchain', async () => {
            let gasCum = 0;
            let gasNo = 0;

            assert(instance);
            await instance.reset.call({from: accounts[0]});

            //Get the  Gas used in the every block, since every transaction is a new block in our blockchain. 
              let gas = await web3.eth.getBlock("latest");                       
              gasNo = Number(gas.gasUsed);
              gasCum += parseInt(gasNo);
           
            //save Gas cost data it as json file under test/data/output for Visualization purposese
               AppendJson("gasContractDeploy", gasCum);

        });


        it('registering administrator of the AUCTION  - should work', async () => {
            let gasCum = 0;
            let gasNo = 0;
            
            for (var i = 0; i < authorities.length; i++) {
              assert(authorities[i]);             
              await instance.registerAuthority(authorities[i], {from: accounts[0]});
                                  
              //Get the  Gas used in the every block, since every transaction is a new block in our blockchain. 
                let gas = await web3.eth.getBlock("latest");                       
                gasNo = Number(gas.gasUsed);
                gasCum += parseInt(gasNo);

            };
            //save Gas cost data it as json file under test/data/output for Visualization purposese
                    AppendJson("gasRegisterAdmin", gasCum);

        });


        it('registering smart meters and users by the administrator - should work', async () => {
                
                let gasCum = 0;
                let gasNo = 0;

            for (var i = 0; i <5 ; i++) {
                await instance.register(producers[i], consumers[i], {from: authorities[0]})
                
                //Get the  Gas used in the every block, since every transaction is a new block in our blockchain. 
                   let gas = await web3.eth.getBlock("latest");                       
                   gasNo = Number(gas.gasUsed);
                   gasCum += parseInt(gasNo);
                    

            }
            //save Gas cost data it as json file under test/data/output for Visualization purposese
            AppendJson("CumulativeRegisterSM", gasCum);
        });
    });


    //

// for(var i = 0; i < 95; i++){
   
    describe('AUCTION CONFIG', async () => {

        it('Auction SHOULD START ', async () => {


            console.log("---------------------------PRINT STATUS---------------------------------");
           
            period = Number(await instance.period());
            console.log("THIS IS ROUND: ", period);




            var auction = await instance.startAuction(period, {from: authorities[0]});



           /* //Show the Trading time Interval
            var biddingTime = await instance.biddingEnd();
            var myDate = new Date(biddingTime * 1000);
            console.log("TIME UNTIL BIDDING FINISH", myDate.toLocaleString());
            */

            //  var auction = await instance.startAuction({from: authorities[0]});

            //Uncomment for displaying the events triggered and values in Terminal
             truffleAssert.eventEmitted(auction, 'StartAuction');
             truffleAssert.eventEmitted(auction, 'UpdateState');
             truffleAssert.prettyPrintEmittedEvents(auction);
        });

        describe('Funcitonalities for Producers', async () => {
            var priceMultiplier = 1;
            var volumeMultiplier = 10;
            it('RANDOM ASKS ARE SENT ', async () => {
                assert(producers.length >= 5);
                var orderIds = [];
                var randomAsks = [];
                var len;
                let gasCum = 0;
                let gasNo = 0;


                // Generate random orders        
                while (randomAsks.length < 5) {
                    var random = Math.floor(Math.random() * (29 - 12 + 1)) + 12;
                        randomAsks.push(random);

                   /* for Test purposes if we want Orders with unique prices !! 
                    if (randomAsks.indexOf(random) === -1) {
                      randomAsks.push(random);
                    }
                    randomAsks.sort(function(a, b) {
                        return a - b
                    });*/
                }

                assert(producers.length >= 5);

                for (var i = 0, j = 0; i < 5, j < randomAsks.length; i++, j++) {
                    var tx = await instance.submitAsk(randomAsks[j] * priceMultiplier, randomAsks[j] * volumeMultiplier, {from: producers[i]});
                    var lastOrderId = await instance.getOrderIdLastOrder.call();
                    orderIds.push(lastOrderId.toNumber());

                    let gas = await web3.eth.getBlock("latest");                      
                    gasNo = Number(gas.gasUsed);
                    gasCum += parseInt(gasNo);  

                    //Uncomment for displaying the events triggered and values in Terminal
                    truffleAssert.eventEmitted(tx, 'LogNewAsk', (ev) => {
                        return (ev._price, ev._volume);
                    })
                    truffleAssert.prettyPrintEmittedEvents(tx);
                    //Uncomment this ONLY to check if the event was actually triggered"
                    //  truffleAssert.eventNotEmitted(tx, 'LogNewAsk');
                }
                    console.log("TOTAL ASK ORDERS:", orderIds.length);

                 AppendJson("CumulativeAskGasCost", gasCum);


           /*     for (var i = 0; i < orderIds.length; i++) {
                    var orderId = await instance.getOrderId.call(orderIds[i]);
                    assert(orderIds[i] === orderId.toNumber());
                    var nex = await instance.getOrderNext.call(orderIds[i]);
                    assert((i === (orderIds.length - 1) ? 0 : (orderId.toNumber() + 1)) === nex.toNumber());
                    var price = await instance.getOrderPrice.call(orderIds[i]);
                    assert(randomAsks[i] * priceMultiplier === price.toNumber());
                    var volume = await instance.getOrderVolume.call(orderIds[i]);
                    assert(randomAsks[i] * volumeMultiplier === volume.toNumber());
                }*/
            });
        });

        describe('Funcitonalities for Consumers', function() {

            var priceMultiplier = 1;
            var volumeMultiplier = 10;

            it('RANDOM BIDS ARE SENT', async () => {
                assert(consumers.length >= 5);
                var orderIds = [];
                var i, j, k, b;
                var randomBids = [];
                var length;
                let gasCum = 0;
                let gasNo = 0;

                // Generate random number for BID orders       
                while (randomBids.length < 5) {
                    var random = Math.floor(Math.random() * (29 - 12 + 1)) + 12;
                       randomBids.push(random); 
                    }

                    /*  for Test purposes if we want Orders with unique prices !! 
                    if (randomBids.indexOf(random) === -1) {
                      randomBids.push(random);
                    }
                    randomBids.sort(function(a, b) {
                        return b - a
                    });
                    }*/
                     //console.log(randomBids);

             
                    //   assert(consumers.length >= 50);

                for (i = 5, b = 0; i > 1, b < randomBids.length; i--, b++) {

                    var bids = await (instance.submitBid(randomBids[b] * priceMultiplier, randomBids[b] * volumeMultiplier, {from: consumers[i]}));
                    var lastOrderId = await (instance.getOrderIdLastOrder.call());
                    orderIds.push(lastOrderId.toNumber());

                    //Get the  Gas used in the every block, since every transaction is a new block in our blockchain. 
                    let gas = await web3.eth.getBlock("latest");                      
                    gasNo = Number(gas.gasUsed);
                    gasCum += parseInt(gasNo);  

                    //Uncomment for displaying the events triggered and values in Terminal
                    truffleAssert.eventEmitted(bids, 'LogNewBid', (ev) => {
                        return (ev._price, ev._volume);
                    })
                    truffleAssert.prettyPrintEmittedEvents(bids);
                };
                console.log("TOTAL BID ORDERS:", orderIds.length);

                //save Gas cost data it as json file under test/data/output for Visualization purposese
                 AppendJson("CumulativeBidsGasCost", gasCum);

                /*  for (k = 0; k < orderIds.length; k++) {
                    var orderId = await instance.getOrderId.call(orderIds[k]);
                    assert(orderIds[k] === orderId.toNumber());
                    var nex = await instance.getOrderNext.call(orderIds[k]);
                    assert((k === (orderIds.length - 1) ? 0 : (orderId.toNumber() + 1)) === nex.toNumber());
                    var price = await instance.getOrderPrice.call(orderIds[k]);
                    assert(((randomBids[k]) * priceMultiplier) === price.toNumber());
                    var volume = await instance.getOrderVolume.call(orderIds[k]);
                }*/
            });
        });
    });
  
        describe('SETTLMENT PHASE STARTS ', async () => {

            it('Matching price function should WORK', async () => {
                let gasCum = 0;
                let gasNo = 0;
                //var deadLine = Math.floor(Date.now() / 1000) + 3000;
                //  await timeout(1000);

             //Go 15 minutes into the future, since the settlement happnes every 15 minutes. CHECK BLOCK TIME on GANACHE !
               await increaseTime(900,{from: accounts[0]});   


                var settlement = await instance.settlement(period, {from: authorities[0]});

                //Get the  Gas used in the every block, since every transaction is a new block in our blockchain. 
                let gas = await web3.eth.getBlock("latest");                      
                gasNo = Number(gas.gasUsed);
                gasCum += parseInt(gasNo);  


                
                AppendJson("MatchingGasCost", gasCum);

               console.log("---------------------------PRINT STATUS---------------------------------");


                truffleAssert.eventEmitted(settlement, 'Settlement');
                truffleAssert.eventEmitted(settlement, 'UpdateState');
                truffleAssert.prettyPrintEmittedEvents(settlement);

                var matchedBids = [];
                var matchedAsks = [];

                var bidsMapping = [];
                var asksMapping = [];
                         
                //get the peirod at which the bids are sent
                period = Number(await instance.period());
                console.log("CURRENT PERIOD:", period);

                //THE IDs OF MATCHED ORDERS
                let lengthMatchedBids = Number(await instance.matchedBidOrderListLength());
                let lengthMatchedAsks = Number(await instance.matchedAskOrderListLength());

                for (let i = 0; i < lengthMatchedBids; i++) {
                      
                         let bid = await instance.currMatchedBidOrderMapping(i);
                        matchedBids.push(bid.toNumber());
                  }                  
                  console.log("ORDER ID's OF MATCHED BIDS  ", matchedBids);


                for (let i = 0; i < lengthMatchedAsks; i++) {
                  
                    let ask = await instance.currMatchedAskOrderMapping(i);
                  matchedAsks.push(ask.toNumber());
                }
                console.log("ORDER ID's of MATCHED AKS", matchedAsks);

                //share for the next interval if needed
              /*  let share = await instance.share();
                console.log("SHARE:", share.toNumber());*/

/*
                assert(producers.length > 0);
                for (let i = 0; i < producers.length; i++) {
                    let asks = await instance.getmatchedAskOrderMapping(period, producers[i]);
                    asksMapping.push(asks.toNumber());
                }
                console.log("EACH PRODUCERS' AKSING VOLUME:", asksMapping);
                 
                assert(consumers.length > 0);
                for (let i = 0; i < consumers.length; i++) {
                    let bids = await instance.getmatchedBidOrderMapping(period, consumers[i]);
                    bidsMapping.push(bids.toNumber());
                }
                console.log("EACH CONSUMER'S BIDING VOLUME:", bidsMapping);*/
        
                 /*var orders = [];
                for (var index in matchedBids){
                  let volume = await instance.getOrderVolume(index);
                  orders.push(volume.toNumber());
                }             
                console.log("VOLUME OF MATCHED BID ORDERS", orders);
                */

                var cumAsks = Number(await instance.cumAskVol());  
                  console.log("AGGREGATED ASKS", cumAsks);

                var cumBids = Number(await instance.cumBidVol());
                  console.log("AGGREGATED BIDS", cumBids );

                  if (cumAsks > cumBids){

                  console.log(" OBJECTIVE REACHED: THE AGGREGATED DEMAND IS SATISFIED");
                    }
                    else{ 
                        console.log("DEMAND IS NOT SATISFIED...SOMETHING IS WRONG WITH ALGORITHM")
                    }
            });


            it('IT SHOULD FETCH ALL ORDERS FOR THIS PERIOD', async () => {

                var orders = [];
                const numOrders = Number(await instance.getOrdersCount());
                console.log("ORDERS LENGTH", numOrders);

                let allorders = await instance.getStruct(); 
                orders.push(allorders);
               // console.log("ALL ORDERS:", orders);
            });
        });


//} 
    

});




//FUNCTIONS FOR Appending TO JSON (purpose of GAScost) 
function AppendJson(filename, database){
var json = JSON.stringify(database, null, 4);

return fs.appendFile('./test/data/output/' + filename + '.json', json + '\r\n', 'utf8', function(err)  {
  if (err) {
    console.log(err);
    // append failed
  } else {
       console.log("JSON saved");
  }
})
}

//TIMEOUTFUNCTION WAITING FOR BLOCKS (if needed)! 
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};



//Jump ahead in time

 async function currTime() {
  web3.eth.getBlock('latest').timestamp;
}


async function jumpTime(v1) {
    
     let currTime = await web3.eth.getBlock("latest").timestamp;   
    console.log(currTime);
     //increaseTime(currTime  + timeInterval.seconds(v1));
}

//ALLIAS for NOW in solidity

//specifying safe operations.
const timeInterval = {
  seconds: function(v1) { return v1},
  minutes: function(v1) { return v1 * this.seconds(60) },
  hours:   function(v1) { return v1 * this.minutes(60) },
  days:    function(v1) { return v1 * this.hours(24) },
  weeks:   function(v1) { return v1 * this.days(7) },
  years:   function(v1) { return v1 * this.days(365)}
};

//EVM method for jumping ahead //for testing purposes


function increaseTime(addSeconds) {
  const id = Date.now();

  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [addSeconds],
      id,
    }, (err1) => {
      if (err1) return reject(err1);

      web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: id + 1,
      }, (err2, res) => (err2 ? reject(err2) : resolve(res)));
    });
  });
}



