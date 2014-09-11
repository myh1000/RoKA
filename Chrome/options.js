/* jslint browser: true */
/* global chrome */
// Saves options to localStorage.

var preferenceKeys = [
    "hiddenPostsScoreThreshold",
    "hiddenCommentScoreThreshold",
    "showGooglePlusWhenNoPosts",
    "rememberTabsOnViewChange",
    "displayGooglePlusByDefault"
];

var hiddenPostsScoreThreshold = document.getElementById("hiddenPostsScoreThreshold");
var hiddenCommentScoreThreshold = document.getElementById("hiddenCommentScoreThreshold");
var showGooglePlusWhenNoPosts = document.getElementById("showGooglePlusWhenNoPosts");
var rememberTabsOnViewChange = document.getElementById("rememberTabsOnViewChange");
var displayGooglePlusByDefault = document.getElementById("displayGooglePlusByDefault");

function initialise() {
    window.title = getLocalisationText("options_label_title");
    document.getElementById("saveButton").innerText = getLocalisationText("options_button_save");
    document.getElementById("aboutButton").innerText = getLocalisationText("options_button_about");
    document.getElementById("closeButton").innerText = getLocalisationText("options_button_close");
    document.getElementById("versiontext").innerText = getLocalisationText("options_label_version");


    for (var i = 0, len = preferenceKeys.length; i < len; i++) {
        var label = document.querySelector("label[for='" + preferenceKeys[i] + "']");
        label.innerText = getLocalisationText("options_label_" + preferenceKeys[i]);
    }

    chrome.storage.sync.get(null, function (items) {
        console.log(items);
        hiddenPostsScoreThreshold.value     = items.hiddenPostsScoreThreshold || -4;
        hiddenCommentScoreThreshold.value   = items.hiddenCommentScoreThreshold || -4;
        showGooglePlusWhenNoPosts.checked     = items.showGooglePlusWhenNoPosts || true;
        rememberTabsOnViewChange.checked      = items.rememberTabsOnViewChange || true;
        displayGooglePlusByDefault.checked    = items.displayGooglePlusByDefault || false;
    });
}


function getLocalisationText(key, placeholders) {
    if (placeholders) {
        return chrome.i18n.getMessage(key, placeholders);
    } else {
        return chrome.i18n.getMessage(key);
    }
}

//Save options
function save_options() {
    if (!hiddenPostsScoreThreshold.value.match(/[0-9]+/)) {
        hiddenPostsScoreThreshold.value = -4;
    }
    if (!hiddenCommentScoreThreshold.value.match(/[0-9]+/)) {
        hiddenCommentScoreThreshold.value = -4;
    }
    chrome.storage.sync.set({
        'hiddenPostsScoreThreshold' :  hiddenPostsScoreThreshold.value,
        'hiddenCommentScoreThreshold': hiddenCommentScoreThreshold.value,
        'showGooglePlusWhenNoPosts': showGooglePlusWhenNoPosts.checked,
        'rememberTabsOnViewChange': rememberTabsOnViewChange.checked,
        'displayGooglePlusByDefault': displayGooglePlusByDefault.checked
    }, function() {
            var status = document.getElementById("status");
            status.innerHTML = getLocalisationText("options_label_saved");
            setTimeout(function() {
                status.innerHTML = "";
            }, 1000);
        });
}

// Show about dialog
function show_about() {
    document.getElementById('about').style.visibility="visible";
    document.getElementById('cover').style.visibility="visible";
}

// Hide about dialog
function close_about() {
    document.getElementById('about').style.visibility="collapse";
    document.getElementById('cover').style.visibility="collapse";
}

document.addEventListener('DOMContentLoaded', initialise, false);
document.getElementById("saveButton").addEventListener("click", save_options);
document.getElementById("aboutButton").addEventListener("click", show_about);
document.getElementById("closeButton").addEventListener("click", close_about);
document.getElementById("cover").addEventListener("click", close_about);
document.getElementById('version').innerHTML = chrome.app.getDetails().version;
