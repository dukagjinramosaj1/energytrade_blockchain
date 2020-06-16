//pragma solidity >=0.4.21 <0.6.0;

pragma experimental ABIEncoderV2;

import "./Registry.sol";


contract Market is Registry{

  
  
     ////////////////////////////////
    // AUCTION CONFIG & FUNCTIONS //
    //////////////////////////////// 


    uint public biddingEnd = 0;
    
    struct OrderStruct {
        uint256 id;
        bytes32 _type;
        uint256 next;
        address owner;
        uint256 volume;
        int256 price;
    }
    

    struct Matching{
        uint256 orderId;
        uint256 volume;
    }

    int256 public matchingPrice; 
    uint256 public share;
    uint256 public cumAskVol;
    uint256 public cumBidVol;

    bool DEBUG = true;

    // maps order id to order objects
  
    OrderStruct[] public orders;


    //Public Variables

    uint256 idCounter;
    uint256 public period = 0;
    uint256 public minAsk = 0;
    uint256 public maxBid = 0;
    uint8 currState;
    bool isMatchingDone = false;


    // stores matching results    
    mapping(uint256 => mapping(address => uint256))  public matchedAskOrderMapping;
    mapping(uint256 => mapping(address => uint256))  public matchedBidOrderMapping;
    mapping(uint256 => int256) public matchingPriceMapping;

    uint256[] public currMatchedAskOrderMapping;
    uint256[] public currMatchedBidOrderMapping;

    
    //EVENTS
    event StartAuction (bool);   
    event LogNewBid (int256 _price, uint256 _volume); 
    event PRICE(int256);
    event LogNewAsk (int256 _price, uint256 _volume);
    event MatchedPrice (int256);
    event isMatch(bool);



      constructor() public {
        identity[msg.sender] = 1;
        startAuction(period);
    }



    // Auction can only be started by the Administrator authority 
    // The auction starts with the state 0 which is the Trading Phase
    function startAuction (uint256 period) public /*onlyAuthorities*/ returns (bool) {
        if(period != 0) {
            require(now >= biddingEnd, "Trading phase still running");    
        }
        reset();
        emit StartAuction(true);
        return true;
    }  

    event Settlement(bool);

    // settlement can only be started by the Administrator authority 
    // The settlement starts only after the Trading Phase is completed (state 1: which is the Settlement Phase)
    function settlement (uint256 period) public /*onlyAuthorities*/ returns (bool){
     updateState(1);
     emit Settlement(true);
     return true;
 }

/*     // Set a new period to start only after the previous Trading and settlement phase are finished 
    function newTradingPeriod() public onlyAuthorities {
         // require(owner == msg.sender);
        require(now >= biddingEnd, "Trading phase still running");
        
        
        //only if the current phase is on state 1 - Settlement phase the new trading phase can start
        
        biddingEnd = now + _biddingTime;
        // Call reset function to start everything new (all bids and asks) for the new trading period
        reset();
    }*/


    // reset function to reset bids and asks 
    function reset() public {
        isMatchingDone = false;
        delete orders;
        // insert blank order into orders because idx=0 is a placeholder
        OrderStruct memory blank_order = OrderStruct(0,0, 0, address(0), 0, 0);
        orders.push(blank_order);
        idCounter = 1;
        minAsk = 0;
        maxBid = 0;
        updateState(0);
    }

     // Auction state function execution
    modifier onlyInState(uint8 _state) {
        updateState(_state);
        if(_state != currState && !DEBUG) revert();
        _;
    }


    event UpdateState (uint8 _state);

    /*
    State 0: Trading phase (bid and ask orders are accepted)
    State 1: Settlement Phase (Market price: matching function executed)
    */
    function updateState(uint8 _state) internal {
        if (_state == 0) {
            emit UpdateState(_state);
            if (tradingState(15 minutes) && currState != 0) {
                currState = 0;    
            }
        }
        else if (_state == 1){
            emit UpdateState(_state);
            if (settlementState() && currState != 1 ) {
                currState = 1;
                matching();
            }
        }   
        else {
            reset();
        }
    }

    function tradingState(uint _biddingTime) internal returns (bool rv) {
        biddingEnd = now + _biddingTime;
        if (now < biddingEnd) {
            return true;
        }
        return false;
    }


    function settlementState() internal view returns (bool rv) {
        if (now >= biddingEnd) {
            return true;
        } revert ();

    }



    /////////////////////////////////////
    // ORDER BOOK - BID AND ASK ORDERS //
    /////////////////////////////////////  

    //Bids can only be send by users 
    function submitBid(int256 _price, uint256 _volume) public /*onlyUsers*/ {
     //   require(now <= biddingEnd,"Trading phase already ended or did not start yet!");
   save_Bid_Orders("BID", _price, _volume);
   emit LogNewBid(_price, _volume);
}

   //Asks can only be send by SM addresses
   function submitAsk(int256 _price, uint256 _volume) public /*onlySmartMeters*/ {
     //   require(now <= biddingEnd,"Trading phase already ended or did not start yet!");
   save_Ask_Orders("ASK", _price, _volume);
   emit LogNewAsk(_price,_volume);
} 


    // process order saving
    function save_Ask_Orders(bytes32 _type, int256 _price, uint256 _volume) internal {
        // allocate new order
        OrderStruct memory curr_order = OrderStruct(idCounter++, _type, 0, msg.sender, _volume, _price);
        

        uint256 best_order;
        int8 ascending = 1;

        best_order = minAsk;
        ascending = 1;  


        // save and return if this the first bid
        if (best_order == 0) {
            orders.push(curr_order);
            best_order = curr_order.id;
            
        } else {
            // iterate over list till same price encountered
            uint256 curr = best_order;
            uint256 prev = 0;
            while ((ascending * curr_order.price) > (ascending * orders[curr].price) && curr != 0) {
                prev = curr;
                curr = orders[curr].next;
            }
            
            
            // update pointer 
            curr_order.next = curr;

            // insert order
            orders.push(curr_order);

            // curr_order added at the end
            if (curr_order.next == best_order) {
                best_order = curr_order.id;
                
            // at least one prev order exists
        } else {
            orders[prev].next = curr_order.id;
        }
    }
    minAsk = best_order;  
}

    function save_Bid_Orders(bytes32 _type, int256 _price, uint256 _volume) internal {
        // allocate new order
        OrderStruct memory curr_order = OrderStruct(idCounter++, _type, 0, msg.sender, _volume, _price);
        

        uint256 best_order;

        int8 ascending = -1;

        best_order = maxBid;


        // save and return if this the first bid
        if (best_order == 0) {
            orders.push(curr_order);
            best_order = curr_order.id;
            
        } else {
            // iterate over list till same price encountered
            uint256 curr = best_order;
            uint256 prev = 0;
            while ((ascending * curr_order.price) > (ascending * orders[curr].price) && curr != 0) {
                prev = curr;
                curr = orders[curr].next;
            }
            
            
            // update pointer 
            curr_order.next = curr;

            // insert order
            orders.push(curr_order);

            // curr_order added at the end
            if (curr_order.next == best_order) {
                best_order = curr_order.id;
                
            // at least one prev order exists
        } else {
            orders[prev].next = curr_order.id;
        }
    }
    maxBid = best_order;
    }



  
    // match bid and ask orders
    function matching() public /*onlyAuthorities*/ /*onlyInState(1)*/ returns (int256) {
       if (orders.length == 1) {
        reset();
        revert();
    }
     cumAskVol = 0;
     cumBidVol = 0;

    matchingPrice = orders[minAsk].price;
    bool isMatched = false;
    bool outOfAskOrders = false;

    uint256 currAsk = minAsk;
    uint256 currBid = maxBid;
    period++;

    uint256 next;
      //  uint256 share;

      delete currMatchedAskOrderMapping;
      delete currMatchedBidOrderMapping;

      while (!isMatched) {
           // cumulates ask volume for fixed price level
           while (currAsk != 0 && orders[currAsk].price == matchingPrice) {
               
                // uint256 volume = orders[currAsk].volume;
                 address owner = orders[currAsk].owner;
                
                 cumAskVol += orders[currAsk].volume;
                 
                matchedAskOrderMapping[period][owner] = orders[currAsk].volume;
                currMatchedAskOrderMapping.push(orders[currAsk].id);
                
                next = orders[currAsk].next;
                if (next != 0) {
                    currAsk = next;
                } else {
                    outOfAskOrders = true;
                    break;
                }
            }

            // cumulates ask volume for order price greater then or equal to matching price
            while (orders[currBid].price >= matchingPrice) {
               
                // uint256 volume = orders[currBid].volume;
                 address owner = orders[currBid].owner;

                 cumBidVol += orders[currBid].volume;
                 
                matchedBidOrderMapping[period][owner] = orders[currBid].volume;
                currMatchedBidOrderMapping.push(orders[currBid].id);
            
                currBid = orders[currBid].next;
                if (currBid == 0) {
                    break;
                }
            }

        if (cumAskVol >= cumBidVol || outOfAskOrders) {
            isMatched = true;
            emit isMatch(true);
        } else {
            matchingPrice = orders[currAsk].price;
            currBid = maxBid;
            cumBidVol = 0;
            delete currMatchedBidOrderMapping;
        }
    }

/*        // calculates how much volume each producer can release into 
        // the grid within the next interval
        if (cumBidVol < cumAskVol) {
        //FLOATING DATA TYPEPES PROBLEM: Division with precsion to 2 decimals!!!     
    //        share = cumBidVol / cumAskVol;
    
   // share = cumBidVol*(10**5)/cumAskVol;
         share =  div(cumBidVol,cumAskVol);
         for (uint256 i=0; i<currMatchedAskOrderMapping.length; i++) {
            matchedAskOrderMapping[period][orders[currMatchedAskOrderMapping[i]].owner] = orders[currMatchedAskOrderMapping[i]].volume * share;
        }
    } else {
      //  share = cumAskVol*(10**5)/cumBidVol;
                   share = div(cumAskVol,cumBidVol);
         for (uint256 j=0; j<currMatchedBidOrderMapping.length; j++) {
            matchedBidOrderMapping[period][orders[currMatchedBidOrderMapping[j]].owner] = orders[currMatchedBidOrderMapping[j]].volume * share;
        }
        }*/

        matchingPriceMapping[period] = matchingPrice;
        emit MatchedPrice(matchingPrice);
        return matchingPrice;
    }
/*
    function getNextIntervalShare(uint256 _period, address _owner) public returns (uint256){
                return matchedAskOrderMapping[_period][_owner];

    }*/


        // DEBUGGING FUNCTIONS
    // ==========================
    
    function getOrderIdLastOrder() public view returns(uint256) {
        if (idCounter == 1) {
            return 0;
        }
        return idCounter-1;
    }

    //Returns ordered list of bid orders 

    int256[] bidQuotes;
    uint256[] bidAmounts;
    function getBidOrder() public returns (int256[] memory rv1, uint256[] memory rv2) {
        uint256 id_iter_bid = maxBid;
        bidQuotes = rv1;
        bidAmounts = rv2;
        while (orders[id_iter_bid].volume != 0) {
            bidAmounts.push(orders[id_iter_bid].volume);
            bidQuotes.push(orders[id_iter_bid].price);
            id_iter_bid = orders[id_iter_bid].next;
        }
        return (bidQuotes, bidAmounts);
    }

   // Returns ordered list of ask orders 

   int256[] askQuotes;
   uint256[] askAmounts;
   function getAskOrder() public payable returns (int256[] memory rv1, uint256[] memory rv2) {
    uint256 id_iter_ask = minAsk;
    askQuotes = rv1;
    askAmounts = rv2;
    while (orders[id_iter_ask].volume != 0) {
        askQuotes.push(orders[id_iter_ask].price);
        askAmounts.push(orders[id_iter_ask].volume);
        id_iter_ask = orders[id_iter_ask].next;
    }
    return (askQuotes, askAmounts);
}

    //HELPER FUNCTIONS 

     function getStruct()public view returns(OrderStruct[] memory){
        return orders;
    }

    function getOrderId(uint256 _orderId) public view returns(uint256) {
        return orders[_orderId].id;
    }

    function getOrdersLength() public view returns(uint){
        return orders.length -1;
    }

    function getOrderNext(uint256 _orderId) public view returns(uint256) {
        return orders[_orderId].next;
    }

    function getOrderPrice(uint256 _orderId)public view returns(int256) {
        return orders[_orderId].price;
    }

    function getOrderVolume(uint256 _orderId) public view returns(uint256) {
        return orders[_orderId].volume;
    }

    function getOrdersByIndex(uint index) external view  returns (uint256 id, bytes32 _type, uint256 next, address owner,  uint256 volume, int256 price)
    {
      return (orders[index].id,  orders[index]._type, orders[index].next, orders[index].owner, orders[index].volume, orders[index].price);
    }

    function getmatchedAskOrderMapping (uint256 _period, address _owner) public view returns (uint256){
        return matchedAskOrderMapping[_period][_owner];
    }

      function getmatchedBidOrderMapping (uint256 _period, address _owner) public view returns (uint256){
        return matchedBidOrderMapping[_period][_owner];
    }

    function matchedBidOrderListLength() external view returns (uint) {
        return currMatchedBidOrderMapping.length;
    }

    function matchedAskOrderListLength() external view returns (uint) {
        return currMatchedAskOrderMapping.length;
    }

    function getMatchingPricePeriod(uint256 _period) public view returns (int256){
        return matchingPriceMapping[_period];
        
    }


    function getOrdersCount() external view  returns(uint) {
        return orders.length;
    }


   
        ///Safe Math Checks for number overflow

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }
        
        
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;
        return c;
    }
        
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
            if (a == 0) {
                return 0;
            }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }
        
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        return c;
        }
        
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "SafeMath: modulo by zero");
        return a % b;
    }

               // MODIFIERS
    // ==========================

    modifier onlyAuthorities() {
        if (identity[msg.sender] != 1) revert();
        _;
    }
    

  modifier onlySmartMeters() {
    if (identity[msg.sender] != 2) revert();
    _;
}
    modifier onlyUsers() {
        if (identity[msg.sender] == 0) revert();
        _;
    }


}

