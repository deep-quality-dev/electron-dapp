App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {
    if (typeof web3 != 'undefined') {
      // If a web3 instance is already provided by Meta Mask
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provider
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:9545');
      web3 = new Web3(App.web3Provider);
    }

    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Electron.json", function(electron) {
      // Instantiate a new truffle contract from artifacts
      App.contracts.Electron = Trufflecontract(electron);
      // connect provider to interact with contract
      App.contracts.Electron.setProvider(App.web3Provider);

      App.listenForEvents();
      
      return App.render();
    });
  },

  render: function() {
    var electronInstance;
    var loader = $('#loader');
    var content = $('#content');

    loader.show();
    loader.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err == null) {
        App.account = account;
        $('#accountAddress').html('Your account: ' + account);
      }
    });

    // Load contract data
    App.contracts.Electron.deployed().then(function(instance) {
      electronInstance = instance;
      return electronInstance.candidatesCount();
    }).then(function(candidateCount) {
      var candidateResults = $('#candidatesResults');
      candidateResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      for (var i = 1; i <= candidatesCount; i++) {
        electronInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          // Render candidate result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>";
          candidatesResults.append(candidateTemplate);

          // render candidate ballot option
          var candidateOption = "<option value='" + id + "'>" + name + "</option>";
          candidatesSelect.append(candidateOption);
        });
      }

      return electronInstance.voters(App.account);
    }).then(function(hasVoted) {
      // Do not allow a user to vote
      if (hasVoted) {
        $('form').hide();
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    })
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Electron.deployed().then(function(instance) {
      return instance.vote(candidateId, {from: App.account});
    }).then(function(result) {
      // wait for votes to update
      $('#content').hide();
      $('#loader').show();
    }).catch(function(err) {
      console.error(err);
    })
  },

  listenForEvents: function() {
    App.contracts.Electron.deployed().then(function(instance) {
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event);
        // reload when a new vote is recorded
        App.render();
      });
    })
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
