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
var profilePicBase64;
// var serverUrl = "http://localhost:8000";
var serverUrl = "https://seethis.herokuapp.com/";
var currentPage = null;
//currentPage--> introPage, chatTab, publicFeedTab, [fullNameofChatPartner]

socket = io.connect(serverUrl);
socket.on('sessionID', function(data) {
    thisUsersocketID = data;
})

//Always keep allData updated in sync with the Firebase DB
allDataRef.on('value', function(data) {
    allData = data.val();
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
            profilePicBase64: profilePicBase64
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
            fixHeader("landingPage");
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
                    profilePicBase64 = allData.allUsers[allUsersRefIDs[i]].profilePicBase64;
                    localStorage.email = userDetails.email;
                    localStorage.registered = true;
                    showPage("landingPage");
                    fixHeader("landingPage");
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

    /******************
    LANDING PAGE SCROLL
    *******************/

    $(window).scroll(function() {
        if ($(this).scrollTop() > $("#landingPage header").height()) {
            $("#landingNav").addClass("main_nav_scrolled");
        } else {
            $("#landingNav").removeClass("main_nav_scrolled");
        }
    })

    /****************************
    LANDING PAGE  --> CHAT TAB
    *****************************/

    $("#chatTab").click(function() {
        showTab("chatTab");
    })

    function populateChatTabBody() {
        $("#chatTabBody").empty();
        window.scrollTo(0, 0);
        var allUsersRefIDs = Object.keys(allData.allUsers);
        if (allUsersRefIDs.length > 1) {
            var allChatCards = [];
            for (var i = 0; i < allUsersRefIDs.length; i++) {
                var dbUserName = allData.allUsers[allUsersRefIDs[i]].fullName;
                if (dbUserName != thisUserName) {
                    var infoOnChatCard = {
                        dbUserName: dbUserName,
                        dbUserProfilePicBase64: allData.allUsers[allUsersRefIDs[i]].profilePicBase64,
                        lastMessage: "",
                        lastMessageDate: null,
                        lastMessageTimeInMS: 0,
                        lastMessageRead: true,
                        numOfUnreadMessages: 0
                    }
                    var chatPairID = findChatPairRefID(dbUserName);
                    var messages = allData.allChatPairs[chatPairID].messages;
                    if (messages[0] != "null") {
                        infoOnChatCard.lastMessage = messages[messages.length - 1].text;
                        infoOnChatCard.lastMessageDate = messages[messages.length - 1].date;
                        infoOnChatCard.lastMessageTimeInMS = messages[messages.length - 1].timeInMS;
                        infoOnChatCard.numOfUnreadMessages = getNumOfUnreadMessages(messages);
                        if (infoOnChatCard.numOfUnreadMessages > 0) {
                            infoOnChatCard.lastMessageRead = false
                        };
                    } else {
                        infoOnChatCard.lastMessage = "no chats yet";
                        infoOnChatCard.lastMessageDate = " ";
                        infoOnChatCard.lastMessageRead = true;
                        infoOnChatCard.lastMessageTimeInMS = 0;
                    }
                    allChatCards.push(infoOnChatCard);
                }
            }
            allChatCards.sort(function(a, b) {
                return b.lastMessageTimeInMS - a.lastMessageTimeInMS
            })
            showChatCardsOnChatBody(allChatCards);
        }
    }

    function showChatCardsOnChatBody(allChatCards) {

        for (var i = 0; i < allChatCards.length; i++) {

            //GENERATE A RANDOM CARD ID WITH FULL NAME OF THE USER
            var subNameArray = allChatCards[i].dbUserName.split(" ");
            var cardID = "";
            for (var k = 0; k < subNameArray.length; k++) {
                cardID += subNameArray[k] + "_";
            }
            cardID += String(Math.floor(Math.random() * 100));

        }

        if (!allChatCards[i].lastMessageRead) {
            $("#chatTabBody").append("<div class='chatCard padded clearfix' id=" + cardID + ">\
                                    <div class='connectionDP' style='background-image: url(" + allChatCards[i].dbUserProfilePicBase64 + ");'></div>\
                                    <div class='chatCardText'>\
                                      <p class='connectionName'>" + allChatCards[i].dbUserName + "</p>\
                                      <p class='lastMessage'>" + allChatCards[i].lastMessage + "</p>\
                                    </div>\
                                    <div class='lastChatMetaInfo'>\
                                      <div class='lastMessageDate lastMessageTimeWithUnread'>" + allChatCards[i].lastMessageDate + "</div>\
                                      <div class='unread_count'>" + allChatCards[i].numOfUnreadMessages + "</div>\
                                    </div>\
                                  </div>");
        } else {
            $("#chatTabBody").append("<div class='chatCard padded clearfix' id=" + cardID + ">\
                                    <div class='connectionDP' style='background-image: url(" + allChatCards[i].dbUserProfilePicBase64 + ");'></div>\
                                    <div class='chatCardText'>\
                                      <p class='connectionName'>" + allChatCards[i].dbUserName + "</p>\
                                      <p class='lastMessage'>" + allChatCards[i].lastMessage + "</p>\
                                    </div>\
                                    <div class='lastChatMetaInfo'>\
                                      <div class='lastMessageDate lastMessageDateNoUnread'>" + allChatCards[i].lastMessageDate + "</div>\
                                    </div>\
                                  </div>");
        }
    }

    function getNumOfUnreadMessages(messages) {
        var numOfUnreadMessages = 0;
        for (var i = 0; i < messages.length; i++) {
            if (!messages[i].isRead && messages[i].receiver == thisUserName) {
                numOfUnreadMessages += 1;
            }
        }
        return numOfUnreadMessages;
    }

    $("#chatTabBody").on('click', '.chatCard', function() {
        // console.log($(this)[0].childNodes[1].childNodes[0].innerHTML);
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
        fixHeader('chatDetail', chatPartnerFullName);
        showMessages(chatPartnerFullName);
        markAllAsRead(chatPartnerFullName)
    })

    /********************************************
    LANDING PAGE  --> CHAT TAB  --> CHAT DETAILS
    *********************************************/

    $("#chatDetail header").click(function() {
        showPage("landingPage");
        fixHeader("landingPage");
        showTab("chatTab");
    })

    function fixHeader(pageID, chatPartnerFullName) {
        if (pageID == 'chatDetail') {
            $("#chatDetail .connectionName").text(chatPartnerFullName);
            var connectionProfilePicBase64;
            var allUsersRef = Object.keys(allData.allUsers);
            for (var i = 0; i < allUsersRef.length; i++) {
                if (allData.allUsers[allUsersRef[i]].fullName == chatPartnerFullName) {
                    connectionProfilePicBase64 = allData.allUsers[allUsersRef[i]].profilePicBase64;
                }
            }
            $("#chatDetail .connectionDP").css('background-image', 'url(' + connectionProfilePicBase64 + ')');
        } else if (pageID = 'landingPage') {
            $('#userDP').css('background-image', 'url(' + profilePicBase64 + ')');
        }
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
            $("#chatDetailBody").append("<p class='emptyPageText'>This is the begining of your chat</p>");
        }

    }

    $("#chatInputField input").click(function() {
        console.log("input field clicked");
        window.scrollTo(0, document.body.scrollHeight); //DOES NOT WORK
    });

    $("#sendTextButton").click(function() {
        var textInput = $("#chatInputField input").val();
        $("#chatInputField input").val('');
        var newMessage = {
            sender: thisUserName,
            receiver: currentPage,
            text: textInput,
            isLink: false,
            headline: null,
            feature_image: null,
            date: getDate(),
            timeInMS: Date.now(),
            isRead: false
        }
        textInput = textInput.toLowerCase();
        //In case there is something before the link. For example sometimes
        //title gets copied alond with the link
        var textInput = "http" + textInput.split("http")[1];
        if (validURL(textInput)) {
            newMessage.text = textInput;
            newMessage.isLink = true;
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
    function gotScrapedData(newMessage) {
        appendMessageToChatWindow(newMessage);
        uploadMessageToDB(newMessage);
    }

    socket.on('newChatText', function(data) {
        if (data.receiver == thisUserName) {
            if (window.navigator && currentPage != "introPage") {
                window.navigator.vibrate(200);
            }
            if (currentPage == data.sender) {
                data.isRead = true;
                appendMessageToChatWindow(data);
                markAllAsRead(data.sender);
            } else if (currentPage == "chatTab") {
                console.log("on chat tab");
                showPage("landingPage");
                fixHeader("landingPage");
                showTab("chatTab");
            }
        }
    })

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
        //Wait 1/2 sec for DB to get updated
        setTimeout(function() {
            socket.emit('newChatText', newMessage);
        }, 500);
    }

    function markAllAsRead(chatPartnerFullName) {
        var chatPairID = findChatPairRefID(chatPartnerFullName);
        var messages = allData.allChatPairs[chatPairID].messages;
        if (messages.length > 0 && messages[0] != "null") {
            for (var i = messages.length - 1; i >= 0; i--) {
                if (messages[i].sender == chatPartnerFullName) {
                    messages[i].isRead = true;
                }
            }
        }
        database.ref("allData/allChatPairs/" + chatPairID + "/messages").set(messages);
    }

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
                if (messageObj.feature_image != null) {
                    $("#chatDetailBody").append('<div class="clearfix"><div class="chatPartnerText chatBox"> \
                                                   <div class="linkPreviewBox clearfix"> \
                                                   <div class="imagePreview" style="background-image: url(' + messageObj.feature_image + ');"></div> \
                                                   <div class="headlinePreview">' + messageObj.headline + '</div> \
                                                   </div> \
                                                   <a href= ' + messageObj.text + ' class="linkText" target="_blank">' + messageObj.text + '</a></div></div>');
                } else {
                    $("#chatDetailBody").append('<div class="clearfix"><div class="chatPartnerText chatBox"> \
                                                   <div class="linkPreviewBox clearfix"> \
                                                   <div class="headlinePreview">' + messageObj.headline + '</div> \
                                                   </div> \
                                                   <a href= ' + messageObj.text + ' class="linkText" target="_blank">' + messageObj.text + '</a></div></div>');
                }
            } else {
                $("#chatDetailBody").append('<div class="clearfix"><div class="chatPartnerText chatBox"><p>' + messageObj.text + '</p></div></div>');
            }
        } else {
            if (messageObj.isLink) {
                if (messageObj.feature_image != null) {
                    $("#chatDetailBody").append('<div class="clearfix"><div class="thisUserText chatBox"> \
                                                   <div class="linkPreviewBox clearfix"> \
                                                   <div class="imagePreview" style="background-image: url(' + messageObj.feature_image + ');"></div> \
                                                   <div class="headlinePreview">' + messageObj.headline + '</div> \
                                                   </div> \
                                                   <a href= ' + messageObj.text + ' class="linkText" target="_blank">' + messageObj.text + '</a></div></div>');
                } else {
                    $("#chatDetailBody").append('<div class="clearfix"><div class="thisUserText chatBox"> \
                                                   <div class="linkPreviewBox clearfix"> \
                                                   <div class="headlinePreview">' + messageObj.headline + '</div> \
                                                   </div> \
                                                   <a href= ' + messageObj.text + ' class="linkText" target="_blank">' + messageObj.text + '</a></div></div>');
                }
            } else {
                $("#chatDetailBody").append('<div class="clearfix"><div class="thisUserText chatBox"><p>' + messageObj.text + '</p></div></div>');
            }
        }
        window.scrollTo(0, document.body.scrollHeight);
    }

    /**********************************
    LANDING PAGE  --> PUBLIC FEED TAB
    ***********************************/

    $("#publicFeedTab").click(function() {
        showTab("publicFeedTab");
    })

    function populatePublicFeedTabBody() {
        $("#publicFeedTabBody").empty();
        var allLinksRef = Object.keys(allData.allLinks);
        for (var i = allLinksRef.length - 1; i >= 0; i--) {
            var linkEntry = allData.allLinks[allLinksRef[i]];
            var feature_image = "";
            if (linkEntry.feature_image) {
                feature_image = linkEntry.feature_image;
            } else {
                feature_image = "../css/test.png";
            }
            $("#publicFeedTabBody").append('<div class="publicFeedCard clearfix">\
                                              <div class="senderProfilePicBase64" style="background-image: url(' + findProfilePic(linkEntry.sender) + ');"></div>\
                                              <div class="linkSection">\
                                                <p class="chatPairText"><span class="userNames">' + linkEntry.sender + '</span> shared with <span class="userNames">' + linkEntry.receiver + '</span ></p>\
                                                <div class="linkDetails">\
                                                  <div class="linkPicture" style="background-image: url(' + feature_image + ');"></div>\
                                                  <div class="linkHeadline">' + linkEntry.headline + '</div>\
                                                  <div class="linkURL"><a href="' + linkEntry.text + '" target="_blank">' + linkEntry.text + '</a></div>\
                                                </div>\
                                              </div>\
                                            </div>');
        }
    }

    function findProfilePic(userName) {
        var allUsersRef = Object.keys(allData.allUsers);
        for (var i = 0; i < allUsersRef.length; i++) {
            if (allData.allUsers[allUsersRef[i]].fullName == userName) {
                return allData.allUsers[allUsersRef[i]].profilePicBase64;
            }
        }
    }

    /****************************
    NAVIGATION
    *****************************/

    function showPage(pageID) {
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
        window.scrollTo(0, 0);
    }
});

/****************************
HELPER FUNCTIONS
*****************************/

// function getRandomColor() {
//     var letters = '0123456789ABCDEF';
//     var color = '#';
//     for (var i = 0; i < 6; i++) {
//         color += letters[Math.floor(Math.random() * 16)];
//     }
//     return color;
// }

function validURL(userInput) {
    var res = userInput.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    if (res == null)
        return false;
    else
        return true;
    }

function PreviewImage() {
    var oFReader = new FileReader();
    oFReader.readAsDataURL(document.getElementById("uploadImageButton").files[0]);

    oFReader.onload = function(oFREvent) {
        // console.log(oFREvent.target.result);
        profilePicBase64 = oFREvent.target.result;
        // document.getElementById("uploadPreview").src = oFREvent.target.result;
        document.getElementById("uploadPreview").style.backgroundImage = 'url(' + oFREvent.target.result + ')';
    };
};

function getDate() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd
    }
    if (mm < 10) {
        mm = '0' + mm
    }
    // today = mm + '/' + dd + '/' + yyyy;
    today = mm + '/' + dd;
    return today;
}
