App = {
  web3Provider: null,
  contracts: {},
  //account:web3.eth.getCoinbase(),
  account:'0x0',
  //gets fixed by switching off privacy setting in metamask
  //web3.eth.getAccounts().then( function(s){FirstA=s[0]; return FirstA}),
  hasVoted: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("TheBESTElection.json", function(election) { 
    //this json file present in build/contracts 
      // Instantiate a new truffle contract from the artifact
      App.contracts.TheBESTElection = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.TheBESTElection.setProvider(App.web3Provider);

      //App.listenForEvents();
      //added after to start whenever new contract is made

      return App.render();
    });
  },

  

  render: function() {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("<br> Your Ethereum Account: " + account);
      }
    });

    // Load contract data
    App.contracts.TheBESTElection.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.playerCount();
    }).then(function(playerCount) {

      var playersResults = $("#playersResults");
      playersResults.empty();

      var playersSelect=$('#playersSelect');
      playersSelect.empty();

      for (var i = 1; i <= playerCount; i++) {
        electionInstance.players(i).then(function(player) {
          var id = player[0];
          var name = player[1];
          var voteCount = player[2];

          // Render player Result
          //var playerTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>";
          
          var labell;
          if (name === "Lionel Messi") labell = '<span class="label label-danger">Barcelona</span></td><td>';
          if (name === "Cristiano Ronaldo") labell = '<span class="label label-default">Juventus</span></td><td>';
          if (name === "Luka Modrić") labell = '<span class="label label-primary">Real Madrid</span></td><td>';
          //var lk='class="text-center">';
          
          var playerTemplate = "<tr><th><h6>" + name+ " "+ labell +'</h6></th>'+'<td><h6 class="text-center">' + voteCount + "</h6></td></tr>";
          playersResults.append(playerTemplate);

          var playerOption = "<option value='" + id + "' >" + name + "</ option>";
          playersSelect.append(playerOption);
        });
      }

      return electionInstance.voters(App.account);
      //add this instance to the voters 
    }).then(function(hasVoted){

      if(hasVoted){
        $('form').hide();
      }

      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  }, //from render function

 castVote: function(){
    var playerId=$('#playersSelect').val();
    App.contracts.TheBESTElection.deployed().then(function(instance){
      return instance.vote(playerId, {from: App.account });
    }).then( function(result){
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

//for listening to voting events
  listenForEvents: function(){
    App.contracts.TheBESTElection.deployed().then(function(i){
      i.votedEvent({},{
        fromBlock:'latest',
        toBlock: 'latest'
      }).watch(function(err, eve){
        console.log("event triggered", eve);
        //App.render(); //used to reload after voting recorded
        //commented to prevent double rendering after using events
      });
    });
  }//also updated initContract for this

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});