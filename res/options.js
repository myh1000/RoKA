/// <reference path="typings/chrome/chrome.d.ts" />
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
var RoKA;
(function (RoKA) {
    "use strict";
    class Utilities {
        /**
            * Determine a reddit post is more than 6 months old, and thereby in preserved status.
            * @param this The unix epoch time of the post.
            * @returns Boolean saying whether the post is preserved or not.
        */
        static isRedditPreservedPost(post) {
            if (!post) {
                return false;
            }
            var currentEpochTime = ((new Date()).getTime() / 1000);
            return ((currentEpochTime - post.created_utc) >= 15552000);
        }
        /**
            Determine whether the current url of the tab is a YouTube video page.
        */
        static isVideoPage() {
            return (window.location.pathname === "watch" || document.querySelector("meta[og:type]").getAttribute("content") === "video");
        }
        static parseBoolean(arg) {
            switch (typeof (arg)) {
                case "string":
                    return arg.trim().toLowerCase() === "true";
                    break;
                case "number":
                    return arg > 0;
                default:
                    return arg;
            }
        }
        static getCurrentBrowser() {
            if (typeof (chrome) !== 'undefined')
                return Browser.CHROME;
            else {
                throw "Invalid Browser";
            }
        }
    }
    RoKA.Utilities = Utilities;
})(RoKA || (RoKA = {}));
var Browser;
(function (Browser) {
    Browser[Browser["CHROME"] = 0] = "CHROME";
})(Browser || (Browser = {}));
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
var RoKA;
(function (RoKA) {
    /**
        * HttpRequest interface across Browsers.
        * @class HttpRequest
        * @param url URL to make the request to.
        * @param type Type of request to make (GET or POST)
        * @param callback Callback handler for the event when loaded.
        * @param [postdata] Key-Value object containing POST data.
    */
    "use strict";
    class HttpRequest {
        constructor(url, type, callback, postData, errorHandler) {
            let xhr = new XMLHttpRequest();
            xhr.open(RequestType[type], url, true);
            xhr.withCredentials = true;
            if (type === RequestType.POST) {
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            }
            xhr.onerror = function (e) {
                if (errorHandler)
                    errorHandler(xhr.status);
            }.bind(this);
            xhr.onload = function () {
                if (HttpRequest.acceptableResponseTypes.indexOf(xhr.status) !== -1) {
                    /* This is an acceptable response, we can now call the callback and end successfuly. */
                    if (callback) {
                        callback(xhr.responseText);
                    }
                }
                else {
                    /* There was an error */
                    if (errorHandler)
                        errorHandler(xhr.status);
                }
            }.bind(this);
            /* Convert the post data array to a query string. */
            if (type === RequestType.POST) {
                let query = [];
                for (let key in postData) {
                    query.push(encodeURIComponent(key) + '=' + encodeURIComponent(postData[key]));
                }
                xhr.send(query.join('&'));
            }
            else {
                xhr.send();
            }
        }
        /**
        * Generate a UUID 4 sequence.
        * @returns A UUID 4 sequence as string.
        * @private
        */
        static generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    }
    HttpRequest.acceptableResponseTypes = [200, 201, 202, 301, 302, 303, 0];
    RoKA.HttpRequest = HttpRequest;
    var RequestType;
    (function (RequestType) {
        RequestType[RequestType["GET"] = 0] = "GET";
        RequestType[RequestType["POST"] = 1] = "POST";
    })(RequestType = RoKA.RequestType || (RoKA.RequestType = {}));
})(RoKA || (RoKA = {}));
/// <reference path="Utilities.ts" />
/// <reference path="HttpRequest.ts" />
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
var RoKA;
(function (RoKA) {
    /**
        * Starts a new instance of the Localisation Manager, for handling language.
        * @class LocalisationManager
        * @param [callback] a callback method to be called after the localisation files has been loaded.
    */
    "use strict";
    class LocalisationManager {
        constructor(callback) {
            this.supportedLocalisations = [
                'en',
                'en-US',
                'no',
                'es',
                'fr'
            ];
            if (callback) {
                requestAnimationFrame(callback);
            }
        }
        /**
            * Retrieve a localised string by key
            * @param key The key in the localisation file representing a language string.
            * @param [placeholders] An array of values for the placeholders in the string.
            * @returns The requested language string.
        */
        get(key, placeholders) {
            switch (RoKA.Utilities.getCurrentBrowser()) {
                case Browser.CHROME:
                    if (placeholders) {
                        return chrome.i18n.getMessage(key, placeholders);
                    }
                    else {
                        return chrome.i18n.getMessage(key);
                    }
                    break;
            }
            return "";
        }
        /**
         * Retreive a localised string related to a number of items, localising plurality by language.
         * @param key The key for the non-plural version of the string.
         * @param value The number to localise by.
         * @returns The requested language string.
         */
        getWithLocalisedPluralisation(key, value) {
            if (value > 1 || value === 0) {
                return this.get(`${key}_plural`);
            }
            else {
                return this.get(key);
            }
        }
    }
    RoKA.LocalisationManager = LocalisationManager;
})(RoKA || (RoKA = {}));
/// <reference path="Utilities.ts" />
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
var RoKA;
(function (RoKA) {
    /**
        * Manages the Preferences across browsers.
        * @class Preferences
    */
    "use strict";
    class Preferences {
        /**
         * Load the preferences from the browser.
         * @param [callback] Callback for when the preferences has been loaded.
         * @constructor
         */
        static initialise(callback) {
            Preferences.preferenceCache = {};
            switch (RoKA.Utilities.getCurrentBrowser()) {
                case Browser.CHROME:
                    /* Get the Chrome cloud sync preferences stored for RoKA. */
                    chrome.storage.sync.get(null, function (settings) {
                        Preferences.preferenceCache = settings;
                        if (callback) {
                            callback();
                        }
                    });
                    break;
            }
        }
        /**
         * Retrieve a value from preferences, or the default value for that key.
         * @private
         * @warning Should not be used on its own, use getString, getNumber, etc, some browsers will not give the value in the correct type.
         * @param key The key of the preference item.
         * @returns An object for the key as stored by the browser.
         * @see getString getNumber getBoolean getArray getObject
         */
        static get(key) {
            if (Preferences.preferenceCache[key] !== null && typeof (Preferences.preferenceCache[key]) !== 'undefined') {
                return Preferences.preferenceCache[key];
            }
            return this.defaults[key];
        }
        /**
         * Retreive a string from preferences, or the default string value for that key.
         * @param key the Key of the preference item.
         * @returns A string for the key as stored by the browser.
         * @see getNumber getBoolean getArray getObject
         */
        static getString(key) {
            return Preferences.get(key);
        }
        /**
         * Retreive a number from preferences, or the default numeric value for that key.
         * @param key the Key of the preference item.
         * @returns A number for the key as stored by the browser.
         * @see getString getBoolean getArray getObject
         */
        static getNumber(key) {
            return parseInt(Preferences.get(key), 10);
        }
        /**
         * Retreive a boolean value from preferences, or the default boolean value for that key.
         * @param key the Key of the preference item.
         * @returns A boolean for the key as stored by the browser.
         * @see getString getNumber getArray getObject
         */
        static getBoolean(key) {
            return RoKA.Utilities.parseBoolean(Preferences.get(key));
        }
        /**
         * Retreive an array from preferences, or the default array list for that key.
         * @param key the Key of the preference item.
         * @returns An array for the key as stored by the browser.
         * @see getString getNumber getBoolean getObject
         */
        static getArray(key) {
            if (Array.isArray(Preferences.get(key))) {
                return Preferences.get(key);
            }
            return JSON.parse(Preferences.get(key));
        }
        /**
         * Retreive an object from preferences, or the value for that key.
         * @param key the Key of the preference item.
         * @returns An object for the key as stored by the browser.
         * @see getString getNumber getBoolean getArray
         * @throws SyntaxError
         */
        static getObject(key) {
            if (typeof Preferences.get(key) === 'object') {
                return Preferences.get(key);
            }
            return JSON.parse(Preferences.get(key));
        }
        /**
         * Insert or edit an item into preferences.
         * @param key The key of the preference item you wish to add or edit.
         * @param value The value you wish to insert.
         */
        static set(key, value) {
            Preferences.preferenceCache[key] = value;
            switch (RoKA.Utilities.getCurrentBrowser()) {
                case Browser.CHROME:
                    chrome.storage.sync.set(Preferences.preferenceCache);
                    break;
            }
        }
        /**
         * Reset all the settings for the extension.
         */
        static reset() {
            Preferences.preferenceCache = {};
            switch (RoKA.Utilities.getCurrentBrowser()) {
                case Browser.CHROME:
                    chrome.storage.sync.remove(Object.keys(Preferences.defaults));
                    break;
            }
        }
        /**
         * Get a list of subreddits that will not be displayed by RoKA, either because they are not meant to show up in searches (bot accunulation subreddits) or because they are deemed too unsettling.
         * @returns An array list of subreddit names as strings.
         */
        static get enforcedExludedSubreddits() {
            return [
                "theredpill",
                "redpillwomen",
                "whiterights",
                "whiterightsuk",
                "northwestfront",
                "gdnews",
                "polistan",
                "retardedcripples",
                "arandabottest"
            ];
        }
    }
    Preferences.defaults = {
        hiddenPostScoreThreshold: -4,
        hiddenCommentScoreThreshold: -4,
        showGooglePlusWhenNoPosts: true,
        showGooglePlusButton: true,
        threadSortType: "confidence",
        redditUserIdentifierHash: "",
        excludedSubredditsSelectedByUser: [],
        displayGooglePlusByDefault: false,
        defaultDisplayAction: "RoKA",
        channelDisplayActions: {}
    };
    RoKA.Preferences = Preferences;
})(RoKA || (RoKA = {}));
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
var RoKA;
(function (RoKA) {
    /**
        Class for managing API keys to third party APIs. This is seperated to easily exclude them in source control.
        @class APIKeys
    */
    "use strict";
    class APIKeys {
    }
    APIKeys.youtubeAPIKey = "";
    RoKA.APIKeys = APIKeys;
})(RoKA || (RoKA = {}));
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
var RoKA;
(function (RoKA) {
    /**
        * Version migration of preferences and other necessary conversions.
        * @class Migration
        * @param lastVersion The version of RoKA the last time the extension was run.
    */
    "use strict";
    class Migration {
        constructor(lastVersion) {
            this.migrations = {
                "2.3": function () {
                    /* Migrate the previous "Display Google+ by default" setting into the "Default display action" setting. */
                    let displayGplusPreviousSetting = RoKA.Preferences.getBoolean("displayGooglePlusByDefault");
                    if (displayGplusPreviousSetting === true) {
                        RoKA.Preferences.set("defaultDisplayAction", "gplus");
                    }
                },
                "2.5": function () {
                    /* In 2.5 RoKA now uses the youtube channel ID not the display name for setting RoKA or Google+ as default per channel.
                    We will attempt to migrate existing entries using the YouTube API  */
                    let previousDisplayActions = RoKA.Preferences.getObject("channelDisplayActions");
                    if (previousDisplayActions) {
                        let migratedDisplayActions = {};
                        let channelNameMigrationTasks = [];
                        /* Iterate over the collection of previous display actions. We have to perform an asynchronous web request to the YouTube API
                        for each channel, we will make each request a Promise so we can be informed when they have all been completed,
                        and work with the final result. */
                        Object.keys(previousDisplayActions).forEach(function (channelName) {
                            if (previousDisplayActions.hasOwnProperty(channelName)) {
                                let promise = new Promise(function (fulfill, reject) {
                                    let encodedChannelName = encodeURIComponent(channelName);
                                    let reqUrl = `https://www.googleapis.com/youtube/v3/search?part=id&q=${encodedChannelName}&type=channel&key=${RoKA.APIKeys.youtubeAPIKey}`;
                                    new RoKA.HttpRequest(reqUrl, RoKA.RequestType.GET, function (data) {
                                        let results = JSON.parse(data);
                                        if (results.items.length > 0) {
                                            /* We found a match for the display name. We will migrate the old value to the new channel id. */
                                            migratedDisplayActions[results.items[0].id.channelId] = previousDisplayActions[channelName];
                                        }
                                        fulfill();
                                    }, null, function (error) {
                                        /* The request could not be completed, we will fail the migration and try again next time. */
                                        reject(error);
                                    });
                                });
                                channelNameMigrationTasks.push(promise);
                            }
                        });
                        Promise.all(channelNameMigrationTasks).then(function () {
                            /* All requests were successful, we will save the resul and move on. */
                            RoKA.Preferences.set("channelDisplayActions", migratedDisplayActions);
                        }, function () {
                            /* One of the requests has failed, the transition will be discarded. We will set our last run version to the previous
                            version so RoKA will attempt the migration again next time. */
                            RoKA.Preferences.set("lastRunVersion", "2.4");
                        });
                    }
                }
            };
            /* If lastVersion is not set, we will assume the version is 2.2. */
            lastVersion = lastVersion || "2.2";
            /* Get an array of the different version migrations available. */
            let versions = Object.keys(this.migrations);
            /* If our previous version is not in the list, insert it so we will know our place in the version history. */
            versions.push(lastVersion);
            /* Run an alphanumerical string sort on the array, this will serve to organise the versions from old to new. */
            versions.sort();
            /* Get the index of the previous version, and remove it and all migrations before it, leaving migrations for newer versions behind */
            let positionOfPreviousVersion = versions.indexOf(lastVersion) + 1;
            versions.splice(0, positionOfPreviousVersion);
            /* Call the migrations to newer versions in sucession. */
            versions.forEach(function (version) {
                this.migrations[version].call(this, null);
            }.bind(this));
        }
    }
    RoKA.Migration = Migration;
})(RoKA || (RoKA = {}));
/// <reference path="../LocalisationManager.ts" />
/// <reference path="../Preferences.ts" />
/// <reference path="../APIKeys.ts" />
/// <reference path="../Migration.ts" />
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
"use strict";
var RoKA;
(function (RoKA) {
    /**
     * The extension ptions page for all browsers.
     * @class Options
     */
    class Options {
        constructor() {
            this.localisationManager = new RoKA.LocalisationManager(function () {
                /* Get the element for inputs we need to specifically modify. */
                this.defaultDisplayActionElement = document.getElementById("defaultDisplayAction");
                /* Get the various buttons for the page. */
                this.resetButtonElement = document.getElementById("reset");
                this.addToExcludeButton = document.getElementById("addSubredditToList");
                /* Set the localised text of the reset button. */
                this.resetButtonElement.textContent = this.localisationManager.get("options_label_reset");
                this.addToExcludeButton.textContent = this.localisationManager.get("options_button_add");
                /* Get the element for the exclude subreddits input field and the list container. */
                this.excludeSubredditsField = document.getElementById("addSubredditsForExclusion");
                this.excludeListContainer = document.getElementById("excludedSubreddits");
                /* Set the page title */
                window.document.title = this.localisationManager.get("options_label_title");
                RoKA.Preferences.initialise(function (preferences) {
                    // Check if a version migration is necessary.
                    if (RoKA.Preferences.getString("lastRunVersion") !== Options.getExtensionVersionNumber()) {
                        new RoKA.Migration(RoKA.Preferences.getString("lastRunVersion"));
                        /* Update the last run version paramater with the current version so we'll know not to run this migration again. */
                        RoKA.Preferences.set("lastRunVersion", Options.getExtensionVersionNumber());
                    }
                    /* Go over every setting in the options panel. */
                    for (let i = 0, len = Options.preferenceKeyList.length; i < len; i += 1) {
                        /* Set the localised text for every setting. */
                        let label = document.querySelector("label[for='" + Options.preferenceKeyList[i] + "']");
                        label.textContent = this.localisationManager.get("options_label_" + Options.preferenceKeyList[i]);
                        /* Get the control for the setting. */
                        let inputElement = document.getElementById(Options.preferenceKeyList[i]);
                        if (inputElement.tagName === "SELECT") {
                            /* This control is a select/dropdown element. Retreive the existing setting for this. */
                            var selectInputElement = inputElement;
                            var selectValue = RoKA.Preferences.getString(Options.preferenceKeyList[i]);
                            /* Go over every dropdown item to find the one we need to set as selected. Unfortunately NodeList does not inherit from
                               Array and does not have forEach. Therefor we will force an iteration over it by calling Array.prototype.forEach.call */
                            var optionElementIndex = 0;
                            Array.prototype.forEach.call(selectInputElement.options, function (optionElement) {
                                if (optionElement.value === selectValue) {
                                    selectInputElement.selectedIndex = optionElementIndex;
                                }
                                optionElementIndex += 1;
                            });
                            /* Call the settings changed event when the user has selected a different dropdown item.*/
                            inputElement.addEventListener("change", this.saveUpdatedSettings, false);
                        }
                        else if (inputElement.getAttribute("type") === "number") {
                            let numberInputElement = inputElement;
                            /* This control is a number input element. Retreive the existing setting for this. */
                            numberInputElement.value = RoKA.Preferences.getNumber(Options.preferenceKeyList[i]).toString();
                            /* Call the settings changed event when the user has pushed a key, cut to clipboard, or pasted, from clipboard */
                            inputElement.addEventListener("keyup", this.saveUpdatedSettings, false);
                            inputElement.addEventListener("cut", this.saveUpdatedSettings, false);
                            inputElement.addEventListener("paste", this.saveUpdatedSettings, false);
                        }
                        else if (inputElement.getAttribute("type") === "checkbox") {
                            let checkboxInputElement = inputElement;
                            /* This control is a checkbox. Retreive the existing setting for this. */
                            checkboxInputElement.checked = RoKA.Preferences.getBoolean(Options.preferenceKeyList[i]);
                            /* Call the settings changed event when the user has changed the state of the checkbox. */
                            checkboxInputElement.addEventListener("change", this.saveUpdatedSettings, false);
                        }
                    }
                    document.querySelector("label[for='addSubredditForExclusion']").textContent = this.localisationManager.get("options_label_hide_following");
                    /* Set event handler for the reset button. */
                    this.resetButtonElement.addEventListener("click", this.resetSettings, false);
                    /* Set the localised text for the "default display action" dropdown options. */
                    this.defaultDisplayActionElement.options[0].textContent = this.localisationManager.get("options_label_roka");
                    this.defaultDisplayActionElement.options[1].textContent = this.localisationManager.get("options_label_gplus");
                    this.excludedSubreddits = RoKA.Preferences.getArray("excludedSubredditsSelectedByUser");
                    /* Erase the current contents of the subreddit list, in case this is an update call on an existing page. */
                    while (this.excludeListContainer.firstChild !== null) {
                        this.excludeListContainer.removeChild(this.excludeListContainer.firstChild);
                    }
                    /* Populate the excluded subreddit list. */
                    for (let subreddit in this.excludedSubreddits) {
                        this.addSubredditExclusionItem(this.excludedSubreddits[subreddit]);
                    }
                    /* Validate the input to see if it is a valid subreddit on key press, cut, or paste, and aditionally check for an 'Enter' key press and process it as a submission. */
                    this.excludeSubredditsField.addEventListener("keyup", this.onExcludeFieldKeyUp.bind(this), false);
                    this.addToExcludeButton.addEventListener("click", this.addItemToExcludeList.bind(this), false);
                    this.excludeSubredditsField.addEventListener("cut", this.validateExcludeField.bind(this), false);
                    this.excludeSubredditsField.addEventListener("paste", this.validateExcludeField.bind(this), false);
                    /* Set the extension version label. */
                    document.getElementById("versiontext").textContent = this.localisationManager.get("options_label_version");
                    document.getElementById('version').textContent = Options.getExtensionVersionNumber();
                }.bind(this));
            }.bind(this));
        }
        /**
         * Trigger when a setting has been changed by the user, update the control, and save the setting.
         * @param event The event object.
         * @private
         */
        saveUpdatedSettings(event) {
            let inputElement = event.target;
            if (inputElement.getAttribute("type") === "number") {
                if (inputElement.value.match(/[0-9]+/)) {
                    inputElement.removeAttribute("invalidInput");
                }
                else {
                    inputElement.setAttribute("invalidInput", "true");
                    return;
                }
            }
            if (inputElement.getAttribute("type") === "checkbox") {
                RoKA.Preferences.set(inputElement.id, inputElement.checked);
            }
            else {
                RoKA.Preferences.set(inputElement.id, inputElement.value);
            }
        }
        /**
         * Reset all the settings to factory defaults.
         * @private
         */
        resetSettings() {
            RoKA.Preferences.reset();
            new RoKA.Options();
            RoKA.Preferences.set("lastRunVersion", Options.getExtensionVersionNumber());
        }
        /**
         * Add a subreddit item to the excluded subreddits list on the options page. This does not automatically add it to preferences.
         * @param subreddit The name of the subreddit to block, case insensitive.
         * @param [animate] Whether to visualise the submission as text animating from the input field into the list.
         * @private
         */
        addSubredditExclusionItem(subreddit, animate) {
            /* Create the list item and set the name of the subreddit. */
            let subredditElement = document.createElement("div");
            subredditElement.setAttribute("subreddit", subreddit);
            /* Create and populate the label that contains the name of the subreddit. */
            let subredditLabel = document.createElement("span");
            subredditLabel.textContent = subreddit;
            subredditElement.appendChild(subredditLabel);
            /* Create the remove item button and set the event handler. */
            let removeButton = document.createElement("button");
            removeButton.textContent = '╳';
            subredditElement.appendChild(removeButton);
            removeButton.addEventListener("click", this.removeSubredditFromExcludeList.bind(this), false);
            /* If requested, place the list item on top of the input field and css transition it to the top of the list. */
            if (animate) {
                subredditElement.classList.add("new");
                setTimeout(function () {
                    subredditElement.classList.remove("new");
                }, 100);
            }
            /* Add the item to the top of the list view. */
            this.excludeListContainer.insertBefore(subredditElement, this.excludeListContainer.firstChild);
        }
        /**
         * Validate keyboard input in the exclude subreddits text field, and if an enter press is detected, process it as a submission.
         * @param event A keyboard event object
         * @private
         */
        onExcludeFieldKeyUp(event) {
            if (!this.validateExcludeField(event))
                return;
            if (event.keyCode === 13) {
                this.addItemToExcludeList(event);
            }
        }
        /**
         * Validate the exclude subreddits text field after any input change event.
         * @param event Any input event with the exclude subreddits text field as a target.
         * @private
         */
        validateExcludeField(event) {
            let textfield = event.target;
            /* Check that the text field contents is a valid subreddit name. */
            if (textfield.value.match(/([A-Za-z0-9_]+|[reddit.com]){3}/) !== null) {
                this.addToExcludeButton.disabled = false;
                return true;
            }
            this.addToExcludeButton.disabled = true;
            return false;
        }
        /**
         * Add the contents of the exclude subreddits field to the exclude subreddits list in the options page and in the preferences.
         * @param event A button press or enter event.
         * @private
         */
        addItemToExcludeList(event) {
            /* Retrieve the subreddit name from the text field, and add it to the list. */
            let subredditName = this.excludeSubredditsField.value;
            this.addSubredditExclusionItem(subredditName, true);
            /* Add the subreddit name to the list in preferences. */
            this.excludedSubreddits.push(subredditName);
            RoKA.Preferences.set("excludedSubredditsSelectedByUser", this.excludedSubreddits);
            /* Remove the contents of the text field and reset the submit button state. */
            let option = this;
            setTimeout(function () {
                option.addToExcludeButton.disabled = true;
                option.excludeSubredditsField.value = "";
            }, 150);
        }
        /**
         * Remove a subreddit from the exclude list on the options page and in the preferences.
         * @param event An event from the click of a remove button on a subreddit list item.
         * @private
         */
        removeSubredditFromExcludeList(event) {
            /* Retrieve the subreddit item that will be removed. */
            let subredditElement = event.target.parentNode;
            /* Remove the item from the preferences file. */
            this.excludedSubreddits.splice(this.excludedSubreddits.indexOf(subredditElement.getAttribute("subreddit")), 1);
            RoKA.Preferences.set("excludedSubredditsSelectedByUser", this.excludedSubreddits);
            /* Remove the item from the list on the options page and animate its removal. */
            subredditElement.classList.add("removed");
            let option = this;
            setTimeout(function () {
                option.excludeListContainer.removeChild(subredditElement);
            }, 500);
        }
        /**
         * Get the current version of the extension running on this machine.
         * @private
         */
        static getExtensionVersionNumber() {
            let version = "";
            switch (RoKA.Utilities.getCurrentBrowser()) {
                case Browser.CHROME:
                    version = chrome.app.getDetails().version;
                    break;
            }
            return version || "";
        }
    }
    Options.preferenceKeyList = [
        "hiddenPostScoreThreshold",
        "hiddenCommentScoreThreshold",
        "showGooglePlusWhenNoPosts",
        "showGooglePlusButton",
        "defaultDisplayAction"
    ];
    RoKA.Options = Options;
})(RoKA || (RoKA = {}));
new RoKA.Options();
