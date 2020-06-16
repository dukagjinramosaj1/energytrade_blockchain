var Market = artifacts.require("Market");
//var Registry = artifacts.require("Registry");


module.exports = function(deployer) {
 // deployer.deploy(ConvertLib);
  //deployer.link(ConvertLib, MetaCoin);
 // deployer.deploy(MetaCoin);
// var owner = "0x6830d87B72B942a543DFd525f179167feDb5753c"
  /*deployer.deploy(Registry);*/
  deployer.deploy(Market);
};

/*const Migrations = artifacts.require("Migrations");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};
*/