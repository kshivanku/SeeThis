var pageIDs = ["introPage", "landingPage", "chatDetail"];
var database = firebase.database();
var socket = undefined;
var allDataRef = database.ref('allData');
var allUsersRef = database.ref('allData/allUsers');
var allLinksRef = database.ref('allData/allLinks');
var allChatPairsRef = database.ref('allData/allChatPairs');
var allData;
var thisUserName = undefined;
var thisUsersocketID = null;
var profileColor;
// var serverUrl = "http://localhost:8000";
var serverUrl = "https://seethis.herokuapp.com/";
var currentPage = null;
//currentPage--> introPage, chatTab, publicFeedTab, [fullNameofChatPartner]

socket = io.connect(serverUrl);
socket.on('sessionID', function(data) {
    thisUsersocketID = data;
    console.log(data);
})

//Always keep allData updated in sync with the Firebase DB
allDataRef.on('value', function(data) {
    allData = data.val();
    console.log(allData);
})

$(document).ready(function() {

    /****************************
    INTRO PAGE
    *****************************/

    showPage("introPage");
    if (localStorage.registered) {
        showForm("signInForm");
    } else {
        showForm("signUpForm");
    }

    //INTROPAGE TAB SWITCH
    $("#signUpLabel").click(function() {
        showForm("signUpForm");
    })
    $("#signInLabel").click(function() {
        showForm("signInForm");
    })

    $("#signUpForm").submit(function(e) {
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

    $("#signInForm").submit(function(e) {
        e.preventDefault();
        var email = $("#signInForm .email").val();
        // var password = $("#signInForm .password").val();
        var userDetails = {
            email: email
            // password: password
        }
        signIn(userDetails);
    })

    function signUp(newUser) {
        localStorage.email = newUser.email;
        localStorage.registered = true;
        var newUserAlreadyPresent = false;
        if (allData) {
            var allUsersRefIDs = Object.keys(allData.allUsers);
            for (var i = 0; i < allUsersRefIDs.length; i++) {
                if (allData.allUsers[allUsersRefIDs[i]].fullName == newUser.fullName) {
                    newUserAlreadyPresent = true;
                    alert("User already present. Please Sign In");
                }
            }
        }
        if (!newUserAlreadyPresent) {
            allUsersRef.push(newUser);
            thisUserName = newUser.fullName;
            makeChatPairs();
            showPage("landingPage");
            showTab("chatTab");
        }
    }

    function signIn(userDetails) {
        var userFound = false;
        if (allData) {
            var allUsersRefIDs = Object.keys(allData.allUsers);
            for (var i = 0; i < allUsersRefIDs.length; i++) {
                if (allData.allUsers[allUsersRefIDs[i]].email == userDetails.email) {
                    userFound = true;
                    // if(allData.allUsers[allUsersRefIDs[i]].password == userDetails.password) {
                    thisUserName = allData.allUsers[allUsersRefIDs[i]].fullName;
                    localStorage.email = userDetails.email;
                    localStorage.registered = true;
                    showPage("landingPage");
                    showTab("chatTab");
                    // }
                    // else {
                    //   alert("Password is incorrect");
                    // }
                }
            }
        }
        if (!userFound) {
            alert("This user does not exist, please sign up");
        }
    }

    function makeChatPairs() {
        var allUsersRefIDs = Object.keys(allData.allUsers);
        if (allUsersRefIDs.length > 1) {
            for (var i = 0; i < allUsersRefIDs.length; i++) {
                var dbUserName = allData.allUsers[allUsersRefIDs[i]].fullName;
                if (dbUserName != thisUserName) {
                    var newPair = {
                        pairName: thisUserName + " - " + dbUserName,
                        messages: ["null"]
                    }
                    allChatPairsRef.push(newPair);
                }
            }
        }
    }

    /****************************
    LANDING PAGE  --> CHAT TAB
    *****************************/

    $("#chatTab").click(function() {
        showTab("chatTab");
    })

    function populateChatTabBody() {
        $("#chatTabBody").empty();
        var allUsersRefIDs = Object.keys(allData.allUsers);
        if (allUsersRefIDs.length > 1) {
            for (var i = 0; i < allUsersRefIDs.length; i++) {
                var dbUserName = allData.allUsers[allUsersRefIDs[i]].fullName;
                if (dbUserName != thisUserName) {
                    var profileColor = allData.allUsers[allUsersRefIDs[i]].profileColor;
                    var lastMessage = "";
                    var allChatPairsRefIDs = Object.keys(allData.allChatPairs);
                    for (var j = 0; j < allChatPairsRefIDs.length; j++) {
                        var pairName = allData.allChatPairs[allChatPairsRefIDs[j]].pairName;
                        if (pairName.indexOf(dbUserName) != -1 && pairName.indexOf(thisUserName) != -1) {
                            var messages = allData.allChatPairs[allChatPairsRefIDs[j]].messages;
                            if (messages[0] != "null") {
                                lastMessage = allData.allChatPairs[allChatPairsRefIDs[j]].messages[messages.length - 1].text;
                            } else {
                                lastMessage = "no chats yet"
                            }
                        }
                    }

                    //GENERATE A RANDOM CARD ID WITH FULL NAME OF THE USER
                    var subNameArray = dbUserName.split(" ");
                    var cardID = "";
                    for (var k = 0; k < subNameArray.length; k++) {
                        cardID += subNameArray[k] + "_";
                    }
                    cardID += String(Math.floor(Math.random() * 100));

                    $("#chatTabBody").append("<div class='chatCard padded' id=" + cardID + ">\
                                                <div class='connectionDP'></div><!--\
                                             --><div class='chatCardText'>\
                                                  <p class='connectionName'>" + dbUserName + "</p>\
                                                  <p class='lastMessage'>" + lastMessage + "</p>\
                                                </div>\
                                              </div>");
                    $("<style>").text("#" + cardID + " .connectionDP { background-color: " + profileColor + " }").appendTo("head");
                }
            }
        }
    }

    $("#chatTabBody").on('click', '.chatCard', function() {
        // console.log($(this)[0].childNodes[1].childNodes[0].innerHTML);
        console.log($(this)[0].id);
        var chatPartnerNameArray = $(this)[0].id.split("_");
        var chatPartnerFullName = ""
        for (var i = 0; i < chatPartnerNameArray.length - 1; i++) {
            chatPartnerFullName += chatPartnerNameArray[i];
            if (i != chatPartnerNameArray.length - 2) {
                chatPartnerFullName += " ";
            }
        }
        currentPage = chatPartnerFullName;
        showPage("chatDetail");
        fixHeader(chatPartnerFullName);
        showMessages(chatPartnerFullName);
    })

    /********************************************
    LANDING PAGE  --> CHAT TAB  --> CHAT DETAILS
    *********************************************/

    $("#chatDetail header").click(function() {
        showPage("landingPage");
        showTab("chatTab");
    })

    function fixHeader(chatPartnerFullName) {
        $("#chatDetail .connectionName").text(chatPartnerFullName);
        var connectionDPColor;
        var allUsersRef = Object.keys(allData.allUsers);
        for (var i = 0; i < allUsersRef.length; i++) {
            if (allData.allUsers[allUsersRef[i]].fullName == chatPartnerFullName) {
                connectionDPColor = allData.allUsers[allUsersRef[i]].profileColor;
            }
        }
        $("#chatDetail .connectionDP").css('background-color', connectionDPColor);
    }

    function showMessages(chatPartnerFullName) {
        $("#chatDetailBody").empty();
        var chatPairID = findChatPairRefID(chatPartnerFullName);
        var messages = allData.allChatPairs[chatPairID].messages;
        if (messages.length > 0 && messages[0] != "null") {
            for (var j = 0; j < messages.length; j++) {
                appendMessageToChatWindow(messages[j]);
            }
            if ($(document).height() / $(window).height() > 1.8) {
                window.scrollTo(0, document.body.scrollHeight);
            }
        } else {
            $("#chatDetailBody").append("<p class='emptyPageText'>No chats yet</p>");
        }

    }

    $("#sendTextButton").click(function() {
        var textInput = $("#chatInputField input").val();
        $("#chatInputField input").val('');
        $("#chatDetailBody .emptyPageText").empty();
        var newMessage = {
            sender: thisUserName,
            receiver: currentPage,
            text: textInput,
            isLink: false,
            headline: null,
            feature_image: null
        }
        textInput = textInput.toLowerCase();
        //In case there is something before the link. For example sometimes
        //title gets copied alond with the link
        var textInput = "http" + textInput.split("http")[1];
        if (validURL(textInput)) {
            newMessage.text = textInput;
            var urlData = {
                "linkURL": textInput,
                "thisUsersocketID": thisUsersocketID,
                "newMessage": newMessage
            }
            socket.emit('urlToScrape', urlData);
            // $.ajax({
            //   type: "POST",
            //   url: 'https://seethis.herokuapp.com/urlScraper',
            //   data: {"linkURL": textInput},
            //   success: gotScrapedData,
            //   dataType: "json"
            // });
        } else {
            appendMessageToChatWindow(newMessage);
            uploadMessageToDB(newMessage);
        }
    });

    socket.on('urlScrapedData', gotScrapedData);
    function gotScrapedData(data) {
        // if(err){console.log('err', err)};
        // console.log('data', data);
        var newMessage = data.newMessage;
        newMessage.isLink = true;
        newMessage.headline = data.pageHeading;
        //FINDING THE RIGHT IMAGE
        var final_image = null;
        var max_size = null;
        var aspectThreshold = 2.5;
        var areaThreshold = 80000;
        if (data.images.length > 0) {
            for (var i = 0; i < data.images.length; i++) {
                if (data.images[i].match(/\.(jpeg|jpg|gif|png)$/)) {
                    var img = new Image();
                    var imageurl = data.images[i];
                    if (imageurl.indexOf("https") == -1 && imageurl.indexOf("http") != -1) {
                        imageurl = "https" + imageurl.split("http")[1];
                    }
                    if (imageurl.indexOf("https") != -1) {
                        img.src = data.images[i];
                        img.onload = function() {
                            var width = this.width;
                            var height = this.height;
                            if (width && height) {
                                if (width / height < aspectThreshold && width / height > (1 / aspectThreshold) && width * height > areaThreshold) {
                                    if (max_size == null || width * height > max_size) {
                                        max_size = width * height;
                                        final_image = this.src;
                                    }
                                }
                            }
                            console.log(newMessage);
                            newMessage.feature_image = final_image;
                        }
                    }
                }
            }
        }
        //EXTREMELY HACKY, NEED A BETTER WAY TO WAIT FOR IMAGE INFORMATION TO PROCESS
        setTimeout(function() {
            console.log(newMessage);
            appendMessageToChatWindow(newMessage);
            uploadMessageToDB(newMessage);
        }, 1000)
    }

    function uploadMessageToDB(newMessage) {
        var chatPairID = findChatPairRefID(newMessage.receiver);

        var messages = allData.allChatPairs[chatPairID].messages;
        if (messages.length > 0 && messages[0] != "null") {
            messages.push(newMessage);
        } else {
            messages[0] = newMessage
        }
        database.ref("allData/allChatPairs/" + chatPairID + "/messages").set(messages);
        if (newMessage.isLink) {
            database.ref("allData/allLinks/").push(newMessage);
        }
        socket.emit('newChatText', newMessage);

    }

    socket.on('newChatText', function(data) {
        console.log('new chat recieved');
        console.log(data);
        if (data.receiver == thisUserName) {
            if (window.navigator && currentPage != "introPage") {
                window.navigator.vibrate(200);
            }
            console.log(currentPage);
            if (currentPage == data.sender) {
                appendMessageToChatWindow(data);
            } else if (currentPage == "chatTab") {
                populateChatTabBody();
            }
        }
    })

    function findChatPairRefID(chatPartnerFullName) {
        var allChatPairsRef = Object.keys(allData.allChatPairs);
        for (var i = 0; i < allChatPairsRef.length; i++) {
            var pairName = allData.allChatPairs[allChatPairsRef[i]].pairName;
            if (pairName.indexOf(thisUserName) != -1 && pairName.indexOf(chatPartnerFullName) != -1) {
                return allChatPairsRef[i];
            }
        }
    }

    function appendMessageToChatWindow(messageObj) {
        if (messageObj.sender == currentPage) {
            if (messageObj.isLink) {
                console.log("link found");
                console.log(messageObj.headline);
                console.log(messageObj.feature_image);
                if(messageObj.feature_image != null) {
                  $("#chatDetailBody").append('<div class="clearfix"><div class="chatPartnerText chatBox"> \
                                                   <div class="linkPreviewBox"> \
                                                   <div class="imagePreview"><img src="' + messageObj.feature_image + '"></div><!-- \
                                                   --><div class="headlinePreview">' + messageObj.headline + '</div> \
                                                   </div> \
                                                   <a href= ' + messageObj.text + ' class="linkText" target="_blank">' + messageObj.text + '</a></div></div>');
                }
                else {
                  $("#chatDetailBody").append('<div class="clearfix"><div class="chatPartnerText chatBox"> \
                                                   <div class="linkPreviewBox"> \
                                                   <div class="headlinePreview">' + messageObj.headline + '</div> \
                                                   </div> \
                                                   <a href= ' + messageObj.text + ' class="linkText" target="_blank">' + messageObj.text + '</a></div></div>');
                }
            } else {
                $("#chatDetailBody").append('<div class="clearfix"><div class="chatPartnerText chatBox"><p>' + messageObj.text + '</p></div></div>');
            }
        } else {
            if (messageObj.isLink) {
                if(messageObj.feature_image != null) {
                  $("#chatDetailBody").append('<div class="clearfix"><div class="thisUserText chatBox"> \
                                                   <div class="linkPreviewBox"> \
                                                   <div class="imagePreview"><img src="' + messageObj.feature_image + '"></div><!-- \
                                                   --><div class="headlinePreview">' + messageObj.headline + '</div> \
                                                   </div> \
                                                   <a href= ' + messageObj.text + ' class="linkText" target="_blank">' + messageObj.text + '</a></div></div>');
                }
                else {
                  $("#chatDetailBody").append('<div class="clearfix"><div class="chatPartnerText chatBox"> \
                                                   <div class="linkPreviewBox"> \
                                                   <div class="headlinePreview">' + messageObj.headline + '</div> \
                                                   </div> \
                                                   <a href= ' + messageObj.text + ' class="linkText" target="_blank">' + messageObj.text + '</a></div></div>');
                }
            } else {
                $("#chatDetailBody").append('<div class="clearfix"><div class="thisUserText chatBox"><p>' + messageObj.text + '</p></div></div>');
            }
        }
    }

    /**********************************
    LANDING PAGE  --> PUBLIC FEED TAB
    ***********************************/

    $("#publicFeedTab").click(function() {
        showTab("publicFeedTab");
    })

    function populatePublicFeedTabBody() {
        $("#publicFeedTabBody").empty();
        // var allLinksRef = Object.keys(allData.allLinks);
    }

    /****************************
    NAVIGATION
    *****************************/

    function showPage(pageID) {
        console.log("showing page: " + pageID);
        $("#" + pageID).css("display", "block");
        for (var i = 0; i < pageIDs.length; i++) {
            if (pageIDs[i] != pageID) {
                $("#" + pageIDs[i]).css("display", "none");
            }
        }
    }

    function showForm(formID) {
        currentPage = "introPage";
        if (formID == "signUpForm") {
            $("#signUpForm").css("display", "block");
            $("#signInForm").css("display", "none");
            $("#signUpLabel").css("opacity", "1.0");
            $("#signInLabel").css("opacity", "0.54");
            profileColor = getRandomColor();
            $("#profileColor").css("background-color", profileColor);
        } else {
            $("#signUpForm").css("display", "none");
            $("#signInForm").css("display", "block");
            $("#signUpLabel").css("opacity", "0.54");
            $("#signInLabel").css("opacity", "1.0");
            if (localStorage.email) {
                $("#signInForm .email").val(localStorage.email);
            }
        }
    }

    function showTab(tabID) {
        if (tabID == "chatTab") {
            currentPage = "chatTab";
            $("#chatTab").css("opacity", "1.0");
            $("#chatTab").css("border-bottom", "2px solid #fff");
            $("#publicFeedTab").css("opacity", "0.54");
            $("#publicFeedTab").css("border-bottom", "none");
            $("#chatTabBody").css("display", "block");
            $("#publicFeedTabBody").css("display", "none");
            populateChatTabBody();
        } else {
            currentPage = "publicFeedTab";
            $("#chatTab").css("opacity", "0.54");
            $("#chatTab").css("border-bottom", "none");
            $("#publicFeedTab").css("opacity", "1.0");
            $("#publicFeedTab").css("border-bottom", "2px solid #fff");
            $("#chatTabBody").css("display", "none");
            $("#publicFeedTabBody").css("display", "block");
            populatePublicFeedTabBody();
        }
    }
});

/****************************
HELPER FUNCTIONS
*****************************/

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function validURL(userInput) {
    var res = userInput.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    if (res == null)
        return false;
    else
        return true;
    }
