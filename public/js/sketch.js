var pageIDs = ["introPage"];

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
});
