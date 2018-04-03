var pageIDs = ["introPage", "chatPage"];
var database = firebase.database();
var allDataRef = database.ref('allData');
var allUsersRef = database.ref('allData/allUsers');
var allLinksRef = database.ref('allData/allLinks');
var allChatPairsRef = database.ref('allData/allChatPairs');
var allData;
var activeUser = undefined;
var profileColor;

allDataRef.on('value', function(data) {
  allData = data.val();
  console.log(allData);
})

$(document).ready(function(){
  showPage("introPage");
  showForm("signUpForm");
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
    var password = $("#signUpForm .password").val();
    var newUser = {
      fullName: fullName,
      email: email,
      password: password,
      profileColor: profileColor
    }
    signUp(newUser);
  })

  $("#signInForm").submit(function(e){
    e.preventDefault();
    var email = $("#signInForm .email").val();
    var password = $("#signInForm .password").val();
    var userDetails = {
      email: email,
      password: password
    }
    signIn(userDetails);
  })

  function showPage(pageID) {
    $("#" + pageID).css("display", "block");
    for(var i = 0 ; i < pageIDs.length ; i++) {
      if(pageIDs[i] != pageID) {
        $("#" + pageIDs[i]).css("display", "none");
      }
    }
  }

  function showForm(formID) {
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
    }
  }

  function signUp(newUser){
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
      activeUser = newUser.fullName;
      showPage("chatPage");
    }
  }

  function signIn(userDetails) {
    var userFound = false;
    if(allData) {
      var allUsersRefIDs = Object.keys(allData.allUsers);
      for(var i = 0 ; i < allUsersRefIDs.length ; i++) {
        if(allData.allUsers[allUsersRefIDs[i]].email == userDetails.email) {
          userFound = true;
          if(allData.allUsers[allUsersRefIDs[i]].password == userDetails.password) {
            activeUser = allData.allUsers[allUsersRefIDs[i]].fullName;
            showPage("chatPage");
          }
          else {
            alert("Password is incorrect");
          }
        }
      }
    }
    if(!userFound) {
      alert("This user does not exist, please sign up");
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
