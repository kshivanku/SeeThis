var pageIDs = ["introPage"];
var database = firebase.database();
var allDataRef = database.ref('allData');
var allUsersRef = database.ref('allData/allUsers');
var allLinksRef = database.ref('allData/allLinks');
var allChatPairsRef = database.ref('allData/allChatPairs');
var allData;
var activeUser = undefined;

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
    var email = $(".email").val();
    var password = $(".password").val();
    var file = $("#dpFile").files[0];
    console.log(file);
    var newUser = {
      fullName: fullName,
      email: email,
      password: password
    }
    signUp(newUser);
  })
  $("#signInForm").submit(function(e){
    e.preventDefault();
    var email = $(".email").val();
    var password = $(".password").val();
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
    }
    else {
      $("#signUpForm").css("display", "none");
      $("#signInForm").css("display", "block");
      $("#signUpLabel").css("opacity", "0.54");
      $("#signInLabel").css("opacity", "1.0");
    }
  }

  function signUp(newUser){
    var allUsersRefIDs = Object.keys(allData.allUsers);
    var newUserAlreadyPresent = false;
    for(var i = 0 ; i < allUsersRefIDs.length ; i++) {
      if(allData.allUsers[allUsersRefIDs[i]].fullName == newUser.fullName) {
        newUserAlreadyPresent = true;
        alert("User already present. Please Sign In");
      }
    }
    if(!newUserAlreadyPresent) {
      allUsersRef.push(newUser);
      activeUser = newUser.fullName;
    }
  }
});
