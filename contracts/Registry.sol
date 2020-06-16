pragma experimental ABIEncoderV2;

contract Registry {
    
   

      //////////////////////
    // REGISTRY FUNCTIONS //
    ///////////////////////// 
    
  //  address internal owner; //operator

    //Each smart meter has a user attached
    mapping(address => address) public registry;

    // 1: Certificate Authority
    // 2: Smart meter
    // 3: Users
    mapping(address => uint8) public identity;
    
    
    constructor() public {
        identity[msg.sender] = 1;
    }

   //Register a new administrator address
   function registerAuthority(address _a) public  {
    identity[_a] = 1;

}

    /*
    Register of a smart meter of an owner (account)
    Assumptions: 
        - One owner can have more than one smart meter.
    Differet users are idetified with unique ID.    
        - Smart meter have an id (identity 2)
        - Users have an ID (identity 3)
        */
        function register(address _sm, address _user) onlyAuthorities public {
    //Check if the entered smart meter exists. 
    require(!registered(_sm), "Smart Meter already registered");
         //  registry[smartMeter] = owner; 

         identity[_sm] = 2;
         identity[_user] = 3;
         registry[_sm] = _user; 

     }

    // Check if a specific address is mapped to the smart meter//
    function check_registry(address _sm, address _user) public view returns (bool) {
        if (registry[_sm] == _user) { return true; }
        return false;
    }
    

    // Check if the smart meter is registered.
    function registered(address _sm) public view returns (bool) {
        if (registry[_sm] == address(0)) { return false; }
        return true;
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
    if (identity[msg.sender] != 3) revert();
    _;
}

}