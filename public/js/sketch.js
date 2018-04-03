var pageIDs = ["introPage", "landingPage"];
var database = firebase.database();
var socket;
var allDataRef = database.ref('allData');
var allUsersRef = database.ref('allData/allUsers');
var allLinksRef = database.ref('allData/allLinks');
var allChatPairsRef = database.ref('allData/allChatPairs');
var allData;
var thisUserName = undefined;
var profileColor;
var serverUrl = "http://localhost:8000";
// var serverUrl = "https://seethis.herokuapp.com/";
var currentPage = null;

allDataRef.on('value', function(data) {
  allData = data.val();
  console.log(allData);
})

$(document).ready(function(){
  showPage("introPage");
  if(localStorage.registered) {
    showForm("signInForm");
  }
  else {
    showForm("signUpForm");
  }

  //INTRO PAGE

      $("#signUpLabel").click(function(){
        showForm("signUpForm");
      })
      $("#signInLabel").click(function(){
        showForm("signInForm");
      })

      $("#signUpForm").submit(function(e){
        e.preventDefault();
        var fullName = $("#fullName").val();
        var email = $("#signUpForm .email").val();
        // var password = $("#signUpForm .password").val();
        var newUser = {
          fullName: fullName,
          email: email,
          // password: password,
          profileColor: profileColor
        }
        signUp(newUser);
      })

      $("#signInForm").submit(function(e){
        e.preventDefault();
        var email = $("#signInForm .email").val();
        // var password = $("#signInForm .password").val();
        var userDetails = {
          email: email
          // password: password
        }
        signIn(userDetails);
      })

      function signUp(newUser){
        localStorage.email = newUser.email;
        localStorage.registered = true;
        var newUserAlreadyPresent = false;
        if(allData) {
          var allUsersRefIDs = Object.keys(allData.allUsers);
          for(var i = 0 ; i < allUsersRefIDs.length ; i++) {
            if(allData.allUsers[allUsersRefIDs[i]].fullName == newUser.fullName) {
              newUserAlreadyPresent = true;
              alert("User already present. Please Sign In");
            }
          }
        }
        if(!newUserAlreadyPresent) {
          allUsersRef.push(newUser);
          thisUserName = newUser.fullName;
          makeChatPairs();
          showPage("landingPage");
          showTab("chatTab");
          socket = io.connect(serverUrl);
        }
      }

      function signIn(userDetails) {
        var userFound = false;
        if(allData) {
          var allUsersRefIDs = Object.keys(allData.allUsers);
          for(var i = 0 ; i < allUsersRefIDs.length ; i++) {
            if(allData.allUsers[allUsersRefIDs[i]].email == userDetails.email) {
              userFound = true;
              // if(allData.allUsers[allUsersRefIDs[i]].password == userDetails.password) {
                thisUserName = allData.allUsers[allUsersRefIDs[i]].fullName;
                localStorage.email = userDetails.email;
                localStorage.registered = true;
                showPage("landingPage");
                showTab("chatTab");
                socket = io.connect(serverUrl);
              // }
              // else {
              //   alert("Password is incorrect");
              // }
            }
          }
        }
        if(!userFound) {
          alert("This user does not exist, please sign up");
        }
      }

      function makeChatPairs() {
        var allUsersRefIDs = Object.keys(allData.allUsers);
        if(allUsersRefIDs.length > 1) {
          for (var i = 0 ; i < allUsersRefIDs.length ; i++) {
            var dbUserName = allData.allUsers[allUsersRefIDs[i]].fullName;
            if(dbUserName != thisUserName) {
              var newPair = {
                pairName: thisUserName + " - " + dbUserName,
                messages : ["null"]
              }
              allChatPairsRef.push(newPair);
            }
          }
        }
      }


  //LANDING PAGE

      $("#chatTab").click(function(){
        showTab("chatTab");
      })

      $("#publicFeedTab").click(function(){
        showTab("publicFeedTab");
      })

  //NAVIGATION

      function showPage(pageID) {
        $("#" + pageID).css("display", "block");
        for(var i = 0 ; i < pageIDs.length ; i++) {
          if(pageIDs[i] != pageID) {
            $("#" + pageIDs[i]).css("display", "none");
          }
        }
      }

      function showForm(formID) {
        currentPage = "introPage";
        if(formID == "signUpForm") {
          $("#signUpForm").css("display", "block");
          $("#signInForm").css("display", "none");
          $("#signUpLabel").css("opacity", "1.0");
          $("#signInLabel").css("opacity", "0.54");
          profileColor = getRandomColor();
          $("#profileColor").css("background-color", profileColor);
        }
        else {
          $("#signUpForm").css("display", "none");
          $("#signInForm").css("display", "block");
          $("#signUpLabel").css("opacity", "0.54");
          $("#signInLabel").css("opacity", "1.0");
          if(localStorage.email) {
            $("#signInForm .email").val(localStorage.email);
          }
        }
      }

      function showTab(tabID){
        if(tabID == "chatTab") {
          currentPage = "chatTab";
          $("#chatTab").css("opacity", "1.0");
          $("#chatTab").css("border-bottom", "2px solid #fff");
          $("#publicFeedTab").css("opacity", "0.54");
          $("#publicFeedTab").css("border-bottom", "none");
          $("#chatTabBody").css("display", "block");
          $("#publicFeedTabBody").css("display", "none");
          populateChatTabBody();
        }
        else {
          currentPage = "publicFeedTab";
          $("#chatTab").css("opacity", "0.54");
          $("#chatTab").css("border-bottom", "none");
          $("#publicFeedTab").css("opacity", "1.0");
          $("#publicFeedTab").css("border-bottom", "2px solid #fff");
          $("#chatTabBody").css("display", "none");
          $("#publicFeedTabBody").css("display", "block");
        }
      }

      function populateChatTabBody(){
        $("#chatTabBody").empty();
        var allUsersRefIDs = Object.keys(allData.allUsers);
        if(allUsersRefIDs.length > 1) {
          for (var i = 0 ; i < allUsersRefIDs.length ; i++) {
            var dbUserName = allData.allUsers[allUsersRefIDs[i]].fullName;
            if(dbUserName != thisUserName) {
              var profileColor = allData.allUsers[allUsersRefIDs[i]].profileColor;
              var lastMessage = "";
              var allChatPairsRefIDs = Object.keys(allData.allChatPairs);
              for(var j = 0 ; j < allChatPairsRefIDs.length; j++) {
                var pairName = allData.allChatPairs[allChatPairsRefIDs[j]].pairName;
                if(pairName.indexOf(dbUserName) != -1 && pairName.indexOf(thisUserName) != -1) {
                  if(allData.allChatPairs[allChatPairsRefIDs[j]].messages[0] != "null") {
                    lastMessage = allData.allChatPairs[allChatPairsRefIDs[j]].messages[0].text;
                  }
                  else {
                    lastMessage = "no chats yet"
                  }
                }
              }
              $("#chatTabBody").append("<div class='chatCard padded' id=" + dbUserName.split(" ")[0] + dbUserName.split(" ")[1] + "><div class='connectionDP'></div><div class='chatCardText'><p class='connectionName'>"+dbUserName+"</p><p class='lastMessage'>"+ lastMessage +"</p></div></div>");
              $("<style>").text("#" + dbUserName.split(" ")[0] + dbUserName.split(" ")[1] + " .connectionDP { background-color: "+ profileColor +" }").appendTo("head");
            }
          }
        }
      }


});

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
