/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
var RoKA;
(function (RoKA) {
    /**
        Application class for RoKA
        @class Application
    */
    "use strict";
    class Application {
        constructor() {
            // Load preferences from disk.
            RoKA.Preferences.initialise(function () {
                // Check if a version migration is necessary.
                if (RoKA.Preferences.getString("lastRunVersion") !== Application.version()) {
                    new RoKA.Migration(RoKA.Preferences.getString("lastRunVersion"));
                    /* Update the last run version paramater with the current version so we'll know not to run this migration again. */
                    RoKA.Preferences.set("lastRunVersion", Application.version());
                }
            });
            // Load language files.
            Application.localisationManager = new RoKA.LocalisationManager(function () {
                // Load stylesheet
                if (Application.currentMediaService() === Service.YouTube) {
                    // Start observer to detect when a new video is loaded.
                    let observer = new MutationObserver(this.youtubeMutationObserver);
                    let config = { attributes: true, childList: true, characterData: true };
                    observer.observe(document.getElementById("content"), config);
                    // Start a new comment section.
                    this.currentVideoIdentifier = Application.getCurrentVideoId();
                    if (RoKA.Utilities.isVideoPage()) {
                        Application.commentSection = new RoKA.CommentSection(this.currentVideoIdentifier);
                    }
                }
                else if (Application.currentMediaService() === Service.KissAnime) {
                    // Start a new comment section.
                    this.currentVideoIdentifier = Application.getCurrentVideoId();
                    if (RoKA.Utilities.isVideoPage()) {
                        Application.commentSection = new RoKA.CommentSection(this.currentVideoIdentifier);
                    }
                }
                else if (Application.currentMediaService() === Service.KissManga) {
                    // Start a new comment section.
                    this.currentVideoIdentifier = Application.getCurrentVideoId();
                    if (RoKA.Utilities.isVideoPage()) {
                        Application.commentSection = new RoKA.CommentSection(this.currentVideoIdentifier);
                    }
                }
            }.bind(this));
        }
        /**
            * Mutation Observer for monitoring for whenver the user changes to a new "page" on YouTube
            * @param mutations A collection of mutation records
            * @private
        */
        youtubeMutationObserver(mutations) {
            mutations.forEach(function (mutation) {
                let target = mutation.target;
                if (target.classList.contains("yt-card") || target.id === "content") {
                    let reportedVideoId = Application.getCurrentVideoId();
                    if (reportedVideoId !== this.currentVideoIdentifier) {
                        this.currentVideoIdentifier = reportedVideoId;
                        if (RoKA.Utilities.isVideoPage()) {
                            Application.commentSection = new RoKA.CommentSection(this.currentVideoIdentifier);
                        }
                    }
                }
            }.bind(this));
        }
        /**
        * Get the current video identifier of the window.
        * @returns video identifier.
        */
        static getCurrentVideoId() {
            if (Application.currentMediaService() === Service.YouTube) {
                if (window.location.search.length > 0) {
                    let s = window.location.search.substring(1);
                    let requestObjects = s.split('&');
                    for (let i = 0, len = requestObjects.length; i < len; i += 1) {
                        let obj = requestObjects[i].split('=');
                        if (obj[0] === "v") {
                            return obj[1];
                        }
                    }
                }
            }
            else if (Application.currentMediaService() === Service.KissAnime) {
            /**    if ((window.location.pathname.match(/\//g) || []).length === 2) {
                    return document.getElementsByTagName("title")[0].innerText.split("\n", 3).join("\n").trim();
                }
                else*/ if ((window.location.pathname.match(/\//g) || []).length > 2) {
                    return (document.getElementsByTagName("title")[0].innerText.split("\n", 3).join("\n").trim() + " " + parseInt(document.getElementById("selectEpisode").options[document.getElementById("selectEpisode").selectedIndex].textContent.match(/(\d+(\.\d+)?)(?!.*\d)/g))).replace("(Sub) ", "").replace("(Dub) ", "")
                }
            }
            else if (Application.currentMediaService() === Service.KissManga) {
                /** if ((window.location.pathname.match(/\//g) || []).length === 2) {
                    return document.getElementsByTagName("title")[0].innerText.split("\n", 2).join("\n").trim();
                }
                else */if ((window.location.pathname.match(/\//g) || []).length > 2) {
                    //disgusting way to get Name + Chapter
                    if (document.getElementById("selectReadType").options[document.getElementById("selectReadType").selectedIndex].textContent.trim() === "One page") {
                        return document.getElementsByTagName("title")[0].innerText.split("\n", 3).join("\n").substring(12)+ " " + parseInt(document.getElementById("selectChapter").options[document.getElementById("selectChapter").selectedIndex].textContent.match(/(\d+(\.\d+)?)(?!.*\d)/g));
                    }
                    else {
                        return document.getElementsByTagName("title")[0].innerText.split("\n", 3).join("\n").substring(12) + " " + parseInt(document.querySelector(".selectChapter").options[document.querySelector(".selectChapter").selectedIndex].textContent.match(/(\d+(\.\d+)?)(?!.*\d)/g));
                    }
                }
            }
            return null;
        }
        /**
        * Get a Reddit-style "x time ago" Timestamp from a unix epoch time.
        * @param epochTime Epoch timestamp to calculate from.
        * @returns A string with a human readable time.
        */
        static getHumanReadableTimestamp(epochTime, localisationString = "timestamp_format") {
            let secs = Math.floor(((new Date()).getTime() / 1000) - epochTime);
            secs = Math.abs(secs);
            let timeUnits = {
                Year: Math.floor(secs / 60 / 60 / 24 / 365.27),
                Month: Math.floor(secs / 60 / 60 / 24 / 30),
                Day: Math.floor(secs / 60 / 60 / 24),
                Hour: Math.floor(secs / 60 / 60),
                Minute: Math.floor(secs / 60),
                Second: secs,
            };
            /* Retrieve the most relevant number by retrieving the first one that is "1" or more.
            Decide if it is plural and retrieve the correct localisation */
            for (let timeUnit in timeUnits) {
                if (timeUnits.hasOwnProperty(timeUnit) && timeUnits[timeUnit] >= 1) {
                    return Application.localisationManager.get(localisationString, [
                        timeUnits[timeUnit],
                        Application.localisationManager.getWithLocalisedPluralisation(`timestamp_format_${timeUnit.toLowerCase()}`, timeUnits[timeUnit])
                    ]);
                }
            }
            return Application.localisationManager.get(localisationString, [
                "0",
                Application.localisationManager.getWithLocalisedPluralisation('timestamp_format_second', 0)
            ]);
        }
        /**
        * Get the path to a ressource in the RoKA folder.
        * @param path Filename to the ressource.
        * @returns Ressource path (file://)
        */
        static getExtensionRessourcePath(path) {
            switch (Application.getCurrentBrowser()) {
                case Browser.CHROME:
                    return chrome.extension.getURL('res/' + path);
                default:
                    return null;
            }
        }
        /**
            * Get the HTML templates for the extension
            * @param callback A callback to be called when the extension templates has been loaded.
        */
        static getExtensionTemplates(callback) {
            switch (Application.getCurrentBrowser()) {
                case Browser.CHROME:
                    let templateLink = document.createElement("link");
                    templateLink.id = "RoKATemplate";
                    templateLink.onload = function () {
                        if (callback) {
                            callback(templateLink.import);
                        }
                    }.bind(this);
                    templateLink.setAttribute("rel", "import");
                    templateLink.setAttribute("href", Application.getExtensionRessourcePath("templates.html"));
                    document.head.appendChild(templateLink);
                    break;
            }
        }
        /**
         * Get the current version of the extension.
         * @public
         */
        static version() {
            let version = "";
            switch (Application.getCurrentBrowser()) {
                case Browser.CHROME:
                    version = chrome.runtime.getManifest()["version"];
                    break;
            }
            return version;
        }
        /**
         * Get an element from the template collection.
         * @param templateCollection The template collection to use.
         * @param id The id of the element you want to retreive.
         * @returns DOM node of a template section.
         */
        static getExtensionTemplateItem(templateCollection, id) {
            switch (Application.getCurrentBrowser()) {
                case Browser.CHROME:
                    return templateCollection.getElementById(id).content.cloneNode(true);
            }
        }
        /**
         * Get the current media website that RoKA is on
         * @returns A "Service" enum value representing a media service.
         */
        static currentMediaService() {
            if (window.location.host === "www.youtube.com") {
                return Service.YouTube;
            }
            else if (window.location.host === "kissanime.ru") {
                return Service.KissAnime;
            }
            else if (window.location.host === "kissmanga.com") {
                return Service.KissManga;
            }
            return null;
        }
        /**
         * Retrieve the current browser that RoKA is running on.
         * @returns A "Browser" enum value representing a web browser.
         */
        static getCurrentBrowser() {
            if (typeof (chrome) !== 'undefined')
                return Browser.CHROME;
            else {
                throw "Invalid Browser";
            }
        }
    }
    RoKA.Application = Application;
})(RoKA || (RoKA = {}));
var Service;
(function (Service) {
    Service[Service["YouTube"] = 0] = "YouTube";
    Service[Service["KissAnime"] = 1] = "KissAnime";
    Service[Service["KissManga"] = 2] = "KissManga";
})(Service || (Service = {}));
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
            Determine whether the current url of the tab is a a valid page.
        */
        static isVideoPage() {
            if (RoKA.Application.currentMediaService() === Service.YouTube) {
                return (window.location.pathname === "/watch")
            }
            else if (RoKA.Application.currentMediaService() === Service.KissAnime) {
                return (window.location.pathname.split('/')[1] === "Anime");
            }
            else if (RoKA.Application.currentMediaService() === Service.KissManga) {
                return (window.location.pathname.split('/')[1] === "Manga");
            }
            return false;
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
/// <reference path="index.ts" />
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
var RoKA;
(function (RoKA) {
    /**
        * Starts a new instance of the RoKA comment section and adds it to DOM.
        * @class CommentSection
        * @param currentVideoIdentifier YouTube Video query identifier.
    */
    "use strict";
    class CommentSection {
        constructor(currentVideoIdentifier) {
            this.threadCollection = new Array();
            this.storedTabCollection = new Array();
            // Make sure video identifier is not null. If it is null we are not on a video page so we will just time out.
            if (currentVideoIdentifier) {
                // Load the html5 template file from disk and wait for it to load.
                let templateLink = document.createElement("link");
                templateLink.id = "RoKATemplate";
                RoKA.Application.getExtensionTemplates(function (templateContainer) {
                    this.template = templateContainer;
                    // Set Loading Screen
                    let loadingScreen = new RoKA.LoadingScreen(this, RoKA.LoadingState.LOADING, RoKA.Application.localisationManager.get("loading_search_message"));
                    this.set(loadingScreen.HTMLElement);
                    // Open a search request to Reddit for the video identfiier
                    let videoSearchString = this.getVideoSearchString(currentVideoIdentifier);
                    // console.log("https://api.reddit.com/search.json?q=" + videoSearchString);
                    new RoKA.Reddit.Request("https://api.reddit.com/search.json?q=" + videoSearchString, RoKA.RequestType.GET, function (results) {
                        // There are a number of ways the Reddit API can arbitrarily explode, here are some of them.
                        // alert("res"+JSON.stringify(results, null, 2));
                        if (results === {} || results.kind !== 'Listing' || results.data.children.length === 0) {
                            this.returnNoResults();
                        }
                        else {
                            let searchResults = results.data.children;
                            let finalResultCollection = [];
                            /* Filter out Reddit threads that do not lead to the video. Additionally, remove ones that have passed the 6
                            month threshold for Reddit posts and are in preserved mode, but does not have any comments. */
                            searchResults.forEach(function (result) {
                                if (CommentSection.validateItemFromResultSet(result.data, currentVideoIdentifier)) {
                                    finalResultCollection.push(result.data);
                                }
                            });
                            let preferredPost, preferredSubreddit;
                            if (finalResultCollection.length > 0) {
                                if (RoKA.Application.currentMediaService() === Service.YouTube) {
                                    /* Scan the YouTube comment sections for references to subreddits or reddit threads.
                                    These will be prioritised and loaded first.  */
                                    let mRegex = /(?:http|https):\/\/(.[^/]+)\/r\/([A-Za-z0-9][A-Za-z0-9_]{2,20})(?:\/comments\/)?([A-Za-z0-9]*)/g;
                                    let commentLinks = document.querySelectorAll("#eow-description a");
                                    for (var b = 0, coLen = commentLinks.length; b < coLen; b += 1) {
                                        let linkElement = commentLinks[b];
                                        let url = linkElement.getAttribute("href");
                                        if (typeof (url) !== 'undefined') {
                                            let match = mRegex.exec(url);
                                            if (match) {
                                                preferredSubreddit = match[2];
                                                if (match[3].length > 0)
                                                    preferredPost = match[3];
                                                break;
                                            }
                                        }
                                    }
                                }
                                // Sort threads into array groups by what subreddit they are in.
                                let getExcludedSubreddits = RoKA.Preferences.enforcedExludedSubreddits.concat(RoKA.Preferences.getArray("excludedSubredditsSelectedByUser"));
                                let sortedResultCollection = {};
                                finalResultCollection.forEach(function (thread) {
                                    if (getExcludedSubreddits.indexOf(thread.subreddit.toLowerCase()) !== -1)
                                        return;
                                    if (thread.score < RoKA.Preferences.getNumber("hiddenPostScoreThreshold"))
                                        return;
                                    if (!sortedResultCollection.hasOwnProperty(thread.subreddit))
                                        sortedResultCollection[thread.subreddit] = [];
                                    sortedResultCollection[thread.subreddit].push(thread);
                                });
                                // Sort posts into collections by what subreddit they appear in.
                                this.threadCollection = [];
                                for (let subreddit in sortedResultCollection) {
                                    if (sortedResultCollection.hasOwnProperty(subreddit)) {
                                        this.threadCollection.push(sortedResultCollection[subreddit].reduce(function (a, b) {
                                            return ((this.getConfidenceForRedditThread(b) - this.getConfidenceForRedditThread(a)) || b.id === preferredPost) ? a : b;
                                        }.bind(this)));
                                    }
                                }
                                if (this.threadCollection.length > 0) {
                                    // Sort subreddits so there is only one post per subreddit, and that any subreddit or post that is linked to in the description appears first.
                                    this.threadCollection.sort(function (a, b) {
                                        return b.score > a.score;
                                    }.bind(this));
                                    for (let i = 0, len = this.threadCollection.length; i < len; i += 1) {
                                        if (this.threadCollection[i].subreddit === preferredSubreddit) {
                                            let threadDataForFirstTab = this.threadCollection[i];
                                            this.threadCollection.splice(i, 1);
                                            this.threadCollection.splice(0, 0, threadDataForFirstTab);
                                            break;
                                        }
                                    }
                                    // Generate tabs.
                                    let tabContainerTemplate = RoKA.Application.getExtensionTemplateItem(this.template, "tabcontainer");
                                    let tabContainer = tabContainerTemplate.querySelector("#at_tabcontainer");
                                    this.insertTabsIntoDocument(tabContainer, 0);
                                    window.addEventListener("resize", this.updateTabsToFitToBoundingContainer.bind(this), false);
                                    let ApplicationContainer = this.set(tabContainer);
                                    ApplicationContainer.appendChild(tabContainerTemplate.querySelector("#at_comments"));
                                    // If the selected post is prioritised, marked it as such
                                    if (this.threadCollection[0].id === preferredPost || this.threadCollection[0].subreddit === preferredSubreddit) {
                                        this.threadCollection[0].official = true;
                                    }
                                    // Load the first tab.
                                    this.downloadThread(this.threadCollection[0]);
                                    return;
                                }
                            }
                            this.returnNoResults();
                        }
                    }.bind(this), null, loadingScreen);
                }.bind(this));
            }
        }
        /**
            * Display a tab in the comment section, if it is locally cached, use that, if not, download it.
            * @param threadData Data about the thread to download from a Reddit search page.
            * @private
        */
        showTab(threadData) {
            let getTabById = this.storedTabCollection.filter(function (x) {
                return x[0].data.children[0].data.name === threadData.name;
            });
            if (getTabById.length > 0) {
                new RoKA.CommentThread(getTabById[0], this);
            }
            else {
                this.downloadThread(threadData);
            }
        }
        /**
            * Download a thread from Reddit.
            * @param threadData Data about the thread to download from a Reddit search page.
        */
        downloadThread(threadData) {
            let loadingScreen = new RoKA.LoadingScreen(this, RoKA.LoadingState.LOADING, RoKA.Application.localisationManager.get("loading_post_message"));
            let RoKACommentContainer = document.getElementById("at_comments");
            while (RoKACommentContainer.firstChild) {
                RoKACommentContainer.removeChild(RoKACommentContainer.firstChild);
            }
            RoKACommentContainer.appendChild(loadingScreen.HTMLElement);
            let requestUrl = `https://api.reddit.com/r/${threadData.subreddit}/comments/${threadData.id}.json?sort=${RoKA.Preferences.getString("threadSortType")}`;
            new RoKA.Reddit.Request(requestUrl, RoKA.RequestType.GET, function (responseObject) {
                // Remove previous tab from memory if preference is unchecked; will require a download on tab switch.
                responseObject[0].data.children[0].data.official = threadData.official;
                new RoKA.CommentThread(responseObject, this);
                this.storedTabCollection.push(responseObject);
            }.bind(this), null, loadingScreen);
        }
        /**
            * Sets the contents of the comment section.
            * @param contents HTML DOM node or element to use.
        */
        set(contents) {
            let redditContainer = document.createElement("section");
            redditContainer.id = "RoKA";
            let commentsContainer;
            let serviceCommentsContainer;
            if (RoKA.Application.currentMediaService() === Service.YouTube) {
                commentsContainer = document.getElementById("watch7-content");
                serviceCommentsContainer = document.getElementById("watch-discussion");
            }
            else if (RoKA.Application.currentMediaService() === Service.KissAnime) {
                commentsContainer = document.getElementById("disqus_thread").parentElement.parentElement
                serviceCommentsContainer = document.getElementById("disqus_thread")
            }
            else if (RoKA.Application.currentMediaService() === Service.KissManga) {
                commentsContainer = document.getElementById("disqus_thread").parentElement.parentElement
                serviceCommentsContainer = document.getElementById("disqus_thread")
            }
            // alert("this");
            // alert(commentsContainer.innerHTML);
            // alert("SAME"+serviceCommentsContainer.innerHTML);
            let previousRedditInstance = document.getElementById("RoKA");
            if (previousRedditInstance) {
                commentsContainer.removeChild(previousRedditInstance);
            }
            /* Check if Dark Mode is activated, and set RoKA to dark mode */
            this.checkEnvironmentDarkModestatus(redditContainer);
            /* Since there is no implicit event for a css property has changed, I have set a small transition on the body background colour.
               this transition will trigger the transitionend event and we can use that to check if the background colour has changed, thereby activating dark mode. */
            document.body.addEventListener("transitionend", function (e) {
                if (e.propertyName === "background-color" && e.srcElement.tagName === "BODY") {
                    this.checkEnvironmentDarkModestatus(document.getElementById("RoKA"));
                }
            }, false);
            if (serviceCommentsContainer) {
                /* Add the "switch to Reddit" button in the Disqus comment section */
                let redditButton = document.getElementById("at_switchtoreddit");
                if (!redditButton) {
                    let redditButtonTemplate = RoKA.Application.getExtensionTemplateItem(this.template, "switchtoreddit");
                    redditButton = redditButtonTemplate.querySelector("#at_switchtoreddit");
                    redditButton.addEventListener("click", this.onRedditClick, true);
                    serviceCommentsContainer.parentNode.insertBefore(redditButton, serviceCommentsContainer);
                }
                if (this.getDisplayActionForCurrentChannel() === "gplus") {
                    redditContainer.style.display = "none";
                    redditButton.style.display = "block";
                }
                else {
                    serviceCommentsContainer.style.display = "none";
                    serviceCommentsContainer.style.height = "0";
                }
            }
            /* Set the setting for whether or not RoKA should show itself on this YouTube channel */
            let allowOnChannelContainer = document.getElementById("allowOnChannelContainer");
            if (!allowOnChannelContainer) {
                let actionsContainer;
                // Only let Channel Preference load on YouTube for now
                if (RoKA.Application.currentMediaService() === Service.YouTube) {
                    actionsContainer = document.getElementById("watch7-user-header");
                    let allowOnChannel = RoKA.Application.getExtensionTemplateItem(this.template, "allowonchannel");
                    allowOnChannel.children[0].appendChild(document.createTextNode(RoKA.Application.localisationManager.get("options_label_showReddit")));
                    let allowOnChannelCheckbox = allowOnChannel.querySelector("#allowonchannel");
                    allowOnChannelCheckbox.checked = (this.getDisplayActionForCurrentChannel() === "RoKA");
                    allowOnChannelCheckbox.addEventListener("change", this.allowOnChannelChange, false);
                    actionsContainer.appendChild(allowOnChannel);
                }
            }
            /* Add RoKA contents */
            redditContainer.setAttribute("service", Service[RoKA.Application.currentMediaService()]);
            redditContainer.appendChild(contents);
            commentsContainer.appendChild(redditContainer);
            return redditContainer;
        }
        /**
            * Validate a Reddit search result set and ensure the link urls go to the correct address.
            * This is done due to the Reddit search result being extremely unrealiable, and providing mismatches.

            * Additionally, remove ones that have passed the 6 month threshold for Reddit posts and are in preserved mode,
            * but does not have any comments.

            * @param itemFromResultSet An object from the reddit search result array.
            * @param currentVideoIdentifier A YouTube video identifier to compare to.
            * @returns A boolean indicating whether the item is actually for the current video.
            * @private
        */
        static validateItemFromResultSet(itemFromResultSet, currentVideoIdentifier) {
            if (RoKA.Utilities.isRedditPreservedPost(itemFromResultSet) && itemFromResultSet.num_comments < 1) {
                return false;
            }
            if (itemFromResultSet.domain === "youtube.com") {
                // For urls based on the full youtube.com domain, retrieve the value of the "v" query parameter and compare it.
                let urlSearch = itemFromResultSet.url.substring(itemFromResultSet.url.indexOf("?") + 1);
                let requestItems = urlSearch.split('&');
                for (let i = 0, len = requestItems.length; i < len; i += 1) {
                    let requestPair = requestItems[i].split("=");
                    if (requestPair[0] === "v" && requestPair[1] === currentVideoIdentifier) {
                        return true;
                    }
                    if (requestPair[0] === "amp;u") {
                        let component = decodeURIComponent(requestPair[1]);
                        component = component.replace("/watch?", "");
                        let shareRequestItems = component.split('&');
                        for (let j = 0, slen = shareRequestItems.length; j < slen; j += 1) {
                            let shareRequestPair = shareRequestItems[j].split("=");
                            if (shareRequestPair[0] === "v" && shareRequestPair[1] === currentVideoIdentifier) {
                                return true;
                            }
                        }
                    }
                }
            }
            else if (RoKA.Application.currentMediaService() === Service.KissAnime) {
                /** if ((window.location.pathname.match(/\//g) || []).length === 2) {
                    if (itemFromResultSet.subreddit === "anime") {
                        return true;
                    }
                }
                else */ if (itemFromResultSet.subreddit === "anime" && (itemFromResultSet.title.indexOf(parseInt(document.getElementById("selectEpisode").options[document.getElementById("selectEpisode").selectedIndex].textContent.match(/(\d+(\.\d+)?)(?!.*\d)/g))) >= 0 && itemFromResultSet.title.toLowerCase().indexOf("episode") >= 0) || (itemFromResultSet.title.indexOf(parseInt(document.getElementById("selectEpisode").options[document.getElementById("selectEpisode").selectedIndex].textContent.match(/(\d+(\.\d+)?)(?!.*\d)/g))) >= 0 && itemFromResultSet.title.toLowerCase().indexOf("episode") >= 0)) {
                        return true;
                    }
                // }
            }
            else if (RoKA.Application.currentMediaService() === Service.KissManga) {
                /**if ((window.location.pathname.match(/\//g) || []).length === 2) {
                    if (itemFromResultSet.subreddit === "manga") {
                        return true;
                    }
                }
                else*/ if (document.getElementById("selectReadType").options[document.getElementById("selectReadType").selectedIndex].textContent.trim() === "One page") {
                    if (itemFromResultSet.subreddit === "manga" && itemFromResultSet.title.indexOf(parseInt(document.getElementById("selectChapter").options[document.getElementById("selectChapter").selectedIndex].textContent.match(/(\d+(\.\d+)?)(?!.*\d)/g))) >= 0) {
                        return true;
                    }
                }
                else {
                    if (itemFromResultSet.subreddit === "manga" && itemFromResultSet.title.indexOf(parseInt(document.querySelector(".selectChapter").options[document.querySelector(".selectChapter").selectedIndex].textContent.match(/(\d+(\.\d+)?)(?!.*\d)/g))) >= 0) {
                        return true;
                    }
                }
            }
            else if (itemFromResultSet.domain === "youtu.be") {
                // For urls based on the shortened youtu.be domain, retrieve everything the path after the domain and compare it.
                let urlSearch = itemFromResultSet.url.substring(itemFromResultSet.url.lastIndexOf("/") + 1);
                let obj = urlSearch.split('?');
                if (obj[0] === currentVideoIdentifier) {
                    return true;
                }
            }
            return false;
        }
        /**
            * Insert tabs to the document calculating the width of tabs and determine how many you can fit without breaking the
            * bounds of the comment section.

            * @param tabContainer The tab container to operate on.
            * @param [selectTabAtIndex] The tab to be in active / selected status.
        */
        insertTabsIntoDocument(tabContainer, selectTabAtIndex) {
            let overflowContainer = tabContainer.querySelector("#at_overflow");
            let len = this.threadCollection.length;
            let maxWidth;
            if (RoKA.Application.currentMediaService() === Service.YouTube) {
                maxWidth = document.getElementById("watch7-content").offsetWidth - 80;
            }
            else if (RoKA.Application.currentMediaService() === Service.KissAnime) {
                maxWidth = parseInt(window.getComputedStyle(document.getElementById("disqus_thread").parentElement.parentElement).getPropertyValue("width")) - 80;
            }
            else if (RoKA.Application.currentMediaService() === Service.KissManga) {
                maxWidth = document.getElementById("disqus_thread").parentElement.parentElement.offsetWidth - 80;
            }
            let width = (21 + this.threadCollection[0].subreddit.length * 7);
            let i = 0;
            /* Calculate the width of tabs and determine how many you can fit without breaking the bounds of the comment section. */
            if (len > 0) {
                for (i = 0; i < len; i += 1) {
                    width = width + (21 + (this.threadCollection[i].subreddit.length * 7));
                    if (width >= maxWidth) {
                        break;
                    }
                    let tab = document.createElement("button");
                    tab.className = "at_tab";
                    tab.setAttribute("data-value", this.threadCollection[i].subreddit);
                    let tabLink = document.createElement("a");
                    tabLink.textContent = this.threadCollection[i].subreddit;
                    tabLink.setAttribute("href", "http://reddit.com/r/" + this.threadCollection[i].subreddit);
                    tabLink.setAttribute("target", "_blank");
                    tab.addEventListener("click", this.onSubredditTabClick.bind(this), false);
                    tab.appendChild(tabLink);
                    tabContainer.insertBefore(tab, overflowContainer);
                }
                // We can't fit any more tabs. We will now start populating the overflow menu.
                if (i < len) {
                    overflowContainer.style.display = "block";
                    /* Click handler for the overflow menu button, displays the overflow menu. */
                    overflowContainer.addEventListener("click", function () {
                        let overflowContainerMenu = overflowContainer.querySelector("ul");
                        overflowContainer.classList.add("show");
                    }, false);
                    /* Document body click handler that closes the overflow menu when the user clicks outside of it.
                    by defining event bubbling in the third argument we are preventing clicks on the menu from triggering this event */
                    document.body.addEventListener("click", function () {
                        let overflowContainerMenu = overflowContainer.querySelector("ul");
                        overflowContainer.classList.remove("show");
                    }, true);
                    /* Continue iterating through the items we couldn't fit into tabs and populate the overflow menu. */
                    for (i = i; i < len; i += 1) {
                        let menuItem = document.createElement("li");
                        menuItem.setAttribute("data-value", this.threadCollection[i].subreddit);
                        menuItem.addEventListener("click", this.onSubredditOverflowItemClick.bind(this), false);
                        let itemName = document.createTextNode(this.threadCollection[i].subreddit);
                        menuItem.appendChild(itemName);
                        overflowContainer.children[1].appendChild(menuItem);
                    }
                }
                else {
                    /* If we didn't need the overflow menu there is no reason to show it. */
                    overflowContainer.style.display = "none";
                }
            }
            else {
                overflowContainer.style.display = "none";
            }
            // If there is only one thread available the container should be displayed differently.
            if (this.threadCollection[0].subreddit.length === 1) {
                tabContainer.classList.add("single");
            }
            else {
                tabContainer.classList.remove("single");
            }
            // Set the active tab if provided
            if (selectTabAtIndex != null) {
                let selectedTab = tabContainer.children[selectTabAtIndex];
                selectedTab.classList.add("active");
            }
        }
        /**
            * Set the comment section to the "No Results" page.
            * @private
        */
        returnNoResults() {
            let template = RoKA.Application.getExtensionTemplateItem(this.template, "noposts");
            let message = template.querySelector(".single_line");
            message.textContent = RoKA.Application.localisationManager.get("post_label_noresults");
            /* Set the icon, text, and event listener for the button to switch to the Disqus comments. */
            let googlePlusButton;
            let googlePlusContainer;
            if (RoKA.Application.currentMediaService() === Service.YouTube) {
                googlePlusButton = template.querySelector("#at_switchtogplus");
                template.querySelector("#at_switchtodisqus").style.display = "none";
                googlePlusButton.addEventListener("click", this.onGooglePlusClick, false);
                googlePlusContainer = document.getElementById("watch-discussion");
            }
            else if (RoKA.Application.currentMediaService() === Service.KissAnime) {
                googlePlusButton = template.querySelector("#at_switchtodisqus");
                template.querySelector("#at_switchtogplus").style.display = "none";
                googlePlusButton.addEventListener("click", this.onGooglePlusClick, false);
                googlePlusContainer = document.getElementById("disqus_thread");
            }
            else if (RoKA.Application.currentMediaService() === Service.KissManga) {
                googlePlusButton = template.querySelector("#at_switchtodisqus");
                template.querySelector("#at_switchtogplus").style.display = "none";
                googlePlusButton.addEventListener("click", this.onGooglePlusClick, false);
                googlePlusContainer = document.getElementById("disqus_thread");
            }
            if (RoKA.Preferences.getBoolean("showGooglePlusButton") === false || googlePlusContainer === null) {
                googlePlusButton.style.display = "none";
            }
            this.set(template);
            if (RoKA.Preferences.getBoolean("showGooglePlusWhenNoPosts") && googlePlusContainer) {
                googlePlusContainer.style.display = "";
                googlePlusContainer.style.height = "auto";
                document.getElementById("RoKA").style.display = "none";
                let redditButton = document.getElementById("at_switchtoreddit");
                if (redditButton) {
                    redditButton.classList.add("noresults");
                }
            }
        }
        /**
         * Switch to the Reddit comment section
         * @param eventObject The event object of the click of the Reddit button.
         * @private
         */
        onRedditClick(eventObject) {
            let googlePlusContainer;
            if (RoKA.Application.currentMediaService() === Service.YouTube) {
                googlePlusContainer = document.getElementById("watch-discussion");
            }
            else if (RoKA.Application.currentMediaService() === Service.KissAnime) {
                googlePlusContainer = document.getElementById("disqus_thread");
            }
            else if (RoKA.Application.currentMediaService() === Service.KissManga) {
                googlePlusContainer = document.getElementById("disqus_thread");
            }
            googlePlusContainer.style.display = "none";
            googlePlusContainer.style.height = "0";
            let RoKAContainer = document.getElementById("RoKA");
            RoKAContainer.style.display = "block";
            let redditButton = document.getElementById("at_switchtoreddit");
            redditButton.style.display = "none";
        }
        /**
            * Switch to the Disqus comment section.
            * @param eventObject The event object of the click of the Disqus button.
            * @private
         */
         onGooglePlusClick(eventObject) {
             let RoKAContainer = document.getElementById("RoKA");
             RoKAContainer.style.display = "none";
             let googlePlusContainer;
             if (RoKA.Application.currentMediaService() === Service.YouTube) {
                 googlePlusContainer = document.getElementById("watch-discussion");
             }
             else if (RoKA.Application.currentMediaService() === Service.KissAnime) {
                 googlePlusContainer = document.getElementById("disqus_thread");
             }
             else if (RoKA.Application.currentMediaService() === Service.KissManga) {
                 googlePlusContainer = document.getElementById("disqus_thread");
             }
             googlePlusContainer.style.display = "";
             googlePlusContainer.style.height = "auto";
             let redditButton = document.getElementById("at_switchtoreddit");
             redditButton.style.display = "block";
         }
        /**
            * Update the tabs to fit the new size of the document
            * @private
        */
        updateTabsToFitToBoundingContainer() {
            /* Only perform the resize operation when we have a new frame to work on by the browser, any animation beyond this will not
            be rendered and is pointless. */
            window.requestAnimationFrame(function () {
                let tabContainer = document.getElementById("at_tabcontainer");
                if (!tabContainer) {
                    return;
                }
                let overflowContainer = tabContainer.querySelector("#at_overflow");
                /* Iterate over the tabs until we find the one that is currently selected, and store its value. */
                for (let i = 0, len = tabContainer.children.length; i < len; i += 1) {
                    let tabElement = tabContainer.children[i];
                    if (tabElement.classList.contains("active")) {
                        let currentActiveTabIndex = i;
                        /* Remove all tabs and overflow ites, then render them over again using new size dimensions. */
                        this.clearTabsFromTabContainer();
                        this.insertTabsIntoDocument(tabContainer, currentActiveTabIndex);
                        break;
                    }
                }
            }.bind(this));
        }
        /**
            * Remove all tabs and overflow items from the DOM.
         */
        clearTabsFromTabContainer() {
            let tabContainer = document.getElementById("at_tabcontainer");
            let overflowContainer = tabContainer.querySelector("#at_overflow");
            /* Iterate over the tab elements and remove them all. Stopping short off the overflow button. */
            while (tabContainer.firstElementChild) {
                let childElement = tabContainer.firstElementChild;
                if (childElement.classList.contains("at_tab")) {
                    tabContainer.removeChild(tabContainer.firstElementChild);
                }
                else {
                    break;
                }
            }
            /* Iterate over the overflow items, removing them all. */
            let overflowListElement = overflowContainer.querySelector("ul");
            while (overflowListElement.firstElementChild) {
                overflowListElement.removeChild(overflowListElement.firstElementChild);
            }
        }
        /**
            * Select the new tab on click and load comment section.
            * @param eventObject the event object of the subreddit tab click.
            * @private
        */
        onSubredditTabClick(eventObject) {
            let tabElementClickedByUser = eventObject.target;
            /* Only continue if the user did not click a tab that is already selected. */
            if (!tabElementClickedByUser.classList.contains("active") && tabElementClickedByUser.tagName === "BUTTON") {
                let tabContainer = document.getElementById("at_tabcontainer");
                let currentIndexOfNewTab = 0;
                /* Iterate over the tabs to find the currently selected one and remove its selected status */
                for (let i = 0, len = tabContainer.children.length; i < len; i += 1) {
                    let tabElement = tabContainer.children[i];
                    if (tabElement === tabElementClickedByUser)
                        currentIndexOfNewTab = i;
                    tabElement.classList.remove("active");
                }
                /* Mark the new tab as selected and start downloading it. */
                tabElementClickedByUser.classList.add("active");
                this.showTab(this.threadCollection[currentIndexOfNewTab]);
            }
        }
        /**
            * Create a new tab and select it when an overflow menu item is clicked, load the comment section for it as well.
            * @param eventObject the event object of the subreddit menu item click.
            * @private
        */
        onSubredditOverflowItemClick(eventObject) {
            let tabContainer = document.getElementById("at_tabcontainer");
            let overflowItemClickedByUser = eventObject.target;
            let currentIndexOfNewTab = 0;
            /* Iterate over the current overflow items to find the index of the one that was just clicked. */
            let listOfExistingOverflowItems = overflowItemClickedByUser.parentNode;
            for (let i = 0, len = listOfExistingOverflowItems.children.length; i < len; i += 1) {
                let overflowElement = listOfExistingOverflowItems.children[i];
                if (overflowElement === overflowItemClickedByUser)
                    currentIndexOfNewTab = i;
            }
            /* Derive the total index of the item in the subreddit list from the number we just calculated added
             with the total length of the visible non overflow tabs */
            currentIndexOfNewTab = (tabContainer.children.length) + currentIndexOfNewTab - 1;
            let threadDataForNewTab = this.threadCollection[currentIndexOfNewTab];
            /* Move the new item frontmost in the array so it will be the first tab, and force a re-render of the tab control. */
            this.threadCollection.splice(currentIndexOfNewTab, 1);
            this.threadCollection.splice(0, 0, threadDataForNewTab);
            this.clearTabsFromTabContainer();
            this.insertTabsIntoDocument(tabContainer, 0);
            /* Start downloading the new tab. */
            this.showTab(this.threadCollection[0]);
            eventObject.stopPropagation();
        }
        /**
            * Triggered when the user has changed the value of the "Allow on this channel" checkbox.
            * @param eventObject the event object of the checkbox value change.
            * @private
         */
        allowOnChannelChange(eventObject) {
            let allowedOnChannel = eventObject.target.checked;
            let channelId = document.querySelector("meta[itemprop='channelId']").getAttribute("content");
            let channelDisplayActions = RoKA.Preferences.getObject("channelDisplayActions");
            channelDisplayActions[channelId] = allowedOnChannel ? "RoKA" : "gplus";
            RoKA.Preferences.set("channelDisplayActions", channelDisplayActions);
        }
        /**
         * Get the display action of the current channel.
         * @private
         */
        getDisplayActionForCurrentChannel() {
            let channelId;
            if (RoKA.Application.currentMediaService() === Service.YouTube) {
                channelId = document.querySelector("meta[itemprop='channelId']").getAttribute("content");
            }
            let displayActionByUser = RoKA.Preferences.getObject("channelDisplayActions")[channelId];
            if (displayActionByUser) {
                return displayActionByUser;
            }
            return RoKA.Preferences.getString("defaultDisplayAction");
        }
        /**
         * Get the confidence vote of a thread using Reddit's 'hot' sorting algorithm.
         * @param thread An object from the Reddit API containing thread information.
         * @private
         */
        getConfidenceForRedditThread(thread) {
            let order = Math.log(Math.max(Math.abs(thread.score), 1));
            let sign;
            if (thread.score > 0) {
                sign = 1;
            }
            else if (thread.score < 0) {
                sign = -1;
            }
            else {
                sign = 0;
            }
            let seconds = Math.floor(((new Date()).getTime() / 1000) - thread.created_utc) - 1134028003;
            return Math.round((order + sign * seconds / 4500) * 10000000) / 10000000;
        }
        /**
         * Check whether the website is currently using a "dark mode" plugin, and change RoKA's style to comply.
         * @param RoKAContainer DOM node of an RoKA section element to apply the style to.
         * @private
         */
        checkEnvironmentDarkModestatus(RoKAContainer) {
            let bodyBackgroundColour = window.getComputedStyle(document.body, null).getPropertyValue('background-color');
            let bodyBackgroundColourArray = bodyBackgroundColour.substring(4, bodyBackgroundColour.length - 1).replace(/ /g, '').split(',');
            let bodyBackgroundColourAverage = 0;
            for (let i = 0; i < 3; i += 1) {
                bodyBackgroundColourAverage = bodyBackgroundColourAverage + parseInt(bodyBackgroundColourArray[i], 10);
            }
            bodyBackgroundColourAverage = bodyBackgroundColourAverage / 3;
            if (bodyBackgroundColourAverage < 100) {
                RoKAContainer.classList.add("darkmode");
            }
            else {
                RoKAContainer.classList.remove("darkmode");
            }
        }
        /**
         * Get the Reddit search string to perform.
         * @param videoID The string to make a search for.
         * @returns A search string to send to the Reddit search API.
         * @private
         */
        getVideoSearchString(videoID) {
            if (RoKA.Application.currentMediaService() === Service.YouTube) {
                return encodeURI(`(url:3D${videoID} OR url:${videoID}) (site:youtube.com OR site:youtu.be)`);
            }
            else if (RoKA.Application.currentMediaService() === Service.KissAnime) {
                return (encodeURI(videoID));
            }
            else if (RoKA.Application.currentMediaService() === Service.KissManga) {
                return (encodeURI(videoID));
            }
        }
    }
    RoKA.CommentSection = CommentSection;
})(RoKA || (RoKA = {}));
/// <reference path="index.ts" />
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
var RoKA;
(function (RoKA) {
    /**
        * Creates a new instance of a Comment Thread and adds it to DOM.
        * @class CommentThread
        * @param threadData JavaScript object containing all information about the Reddit thread.
        * @param commentSection The comment section object the thread exists within.
    */
    "use strict";
    class CommentThread {
        constructor(threadData, commentSection) {
            this.sortingTypes = [
                "confidence",
                "top",
                "new",
                "controversial",
                "old",
                "qa"
            ];
            this.children = new Array();
            this.commentSection = commentSection;
            this.threadInformation = threadData[0].data.children[0].data;
            this.commentData = threadData[1].data.children;
            RoKA.Preferences.set("redditUserIdentifierHash", threadData[0].data.modhash);
            this.postIsInPreservedMode = RoKA.Utilities.isRedditPreservedPost(this.threadInformation);
            let template = RoKA.Application.getExtensionTemplateItem(this.commentSection.template, "threadcontainer");
            this.threadContainer = template.querySelector("#at_comments");
            if (threadData[0].data.modhash.length > 0) {
                this.commentSection.userIsSignedIn = true;
                if (!threadData[0].data.modhash || !RoKA.Preferences.getString("username")) {
                    new RoKA.Reddit.RetreiveUsernameRequest();
                }
            }
            else {
                this.commentSection.userIsSignedIn = false;
                RoKA.Preferences.set("username", "");
                this.threadContainer.classList.add("signedout");
            }
            /* Set the thread title and link to it, because Reddit for some reason encodes html entities in the title, we must use
            innerHTML. */
            let title = this.threadContainer.querySelector(".title");
            title.innerHTML = this.threadInformation.title;
            title.setAttribute("href", "http://reddit.com" + this.threadInformation.permalink);
            /* Set the username of the author and link to them */
            let username = this.threadContainer.querySelector(".at_author");
            username.textContent = this.threadInformation.author;
            username.setAttribute("href", "http://www.reddit.com/u/" + this.threadInformation.author);
            username.setAttribute("data-username", this.threadInformation.author);
            if (this.threadInformation.distinguished === "admin") {
                username.setAttribute("data-reddit-admin", "true");
            }
            else if (this.threadInformation.distinguished === "moderator") {
                username.setAttribute("data-reddit-mod", "true");
            }
            /* Add flair to the user */
            let flair = this.threadContainer.querySelector(".at_flair");
            if (this.threadInformation.author_flair_text) {
                flair.textContent = this.threadInformation.author_flair_text;
            }
            else {
                flair.style.display = "none";
            }
            /* Set the NSFW label on the post if applicable */
            if (this.threadInformation.over_18) {
                let optionsElement = this.threadContainer.querySelector(".options");
                let nsfwElement = document.createElement("acronym");
                nsfwElement.classList.add("nsfw");
                nsfwElement.setAttribute("title", RoKA.Application.localisationManager.get("post_badge_NSFW_message"));
                nsfwElement.textContent = RoKA.Application.localisationManager.get("post_badge_NSFW");
                optionsElement.insertBefore(nsfwElement, optionsElement.firstChild);
            }
            /* Set the gild (how many times the user has been given gold for this post) if any */
            if (this.threadInformation.gilded) {
                let gildCountElement = this.threadContainer.querySelector(".at_gilded");
                gildCountElement.setAttribute("data-count", this.threadInformation.gilded);
            }
            /* Set the the thread posted time */
            let timestamp = this.threadContainer.querySelector(".at_timestamp");
            timestamp.textContent = RoKA.Application.getHumanReadableTimestamp(this.threadInformation.created_utc);
            timestamp.setAttribute("timestamp", new Date(this.threadInformation.created_utc).toISOString());
            /* Set the localised text for "by {username}" */
            let submittedByUsernameText = this.threadContainer.querySelector(".templateSubmittedByUsernameText");
            submittedByUsernameText.textContent = RoKA.Application.localisationManager.get("post_submitted_preposition");
            /* Set the text for the comments button  */
            let openNewCommentBox = this.threadContainer.querySelector(".commentTo");
            openNewCommentBox.textContent = this.threadInformation.num_comments + " " + RoKA.Application.localisationManager.get("post_button_comments").toLowerCase();
            openNewCommentBox.addEventListener("click", this.onCommentButtonClick.bind(this), false);
            /* Set the button text and the event handler for the "save" button */
            let saveItemToRedditList = this.threadContainer.querySelector(".save");
            if (this.threadInformation.saved) {
                saveItemToRedditList.textContent = RoKA.Application.localisationManager.get("post_button_unsave");
                saveItemToRedditList.setAttribute("saved", "true");
            }
            else {
                saveItemToRedditList.textContent = RoKA.Application.localisationManager.get("post_button_save");
            }
            saveItemToRedditList.addEventListener("click", this.onSaveButtonClick.bind(this), false);
            /* Set the button text and the event handler for the "refresh" button */
            let refreshCommentThread = this.threadContainer.querySelector(".refresh");
            refreshCommentThread.addEventListener("click", function () {
                this.commentSection.threadCollection.forEach(function (item) {
                    if (item.id === this.threadInformation.id) {
                        this.commentSection.downloadThread(item);
                    }
                });
            }, false);
            refreshCommentThread.textContent = RoKA.Application.localisationManager.get("post_button_refresh");
            /* Set the button text and the link for the "give gold" button */
            let giveGoldToUser = this.threadContainer.querySelector(".giveGold");
            giveGoldToUser.setAttribute("href", "http://www.reddit.com/gold?goldtype=gift&months=1&thing=" + this.threadInformation.name);
            giveGoldToUser.textContent = RoKA.Application.localisationManager.get("post_button_gold");
            /* Set the button text and the event handler for the "report post" button */
            let reportToAdministrators = this.threadContainer.querySelector(".report");
            reportToAdministrators.textContent = RoKA.Application.localisationManager.get("post_button_report");
            reportToAdministrators.addEventListener("click", this.onReportButtonClicked.bind(this), false);
            /* Set the button text and event handler for the sort selector. */
            let sortController = this.threadContainer.querySelector(".sort");
            for (var sortIndex = 0, sortLength = this.sortingTypes.length; sortIndex < sortLength; sortIndex += 1) {
                sortController.children[sortIndex].textContent = RoKA.Application.localisationManager.get("post_sort_" + this.sortingTypes[sortIndex]);
            }
            sortController.selectedIndex = this.sortingTypes.indexOf(RoKA.Preferences.getString("threadSortType"));
            sortController.addEventListener("change", function () {
                RoKA.Preferences.set("threadSortType", sortController.children[sortController.selectedIndex].getAttribute("value"));
                commentSection.threadCollection.forEach(function (item) {
                    if (item.id === this.threadInformation.id) {
                        this.commentSection.downloadThread(item);
                    }
                });
            }, false);
            /* Set the state of the voting buttons */
            let voteController = this.threadContainer.querySelector(".vote");
            voteController.querySelector(".score").textContent = this.threadInformation.score;
            voteController.querySelector(".arrow.up").addEventListener("click", this.onUpvoteControllerClick.bind(this), false);
            voteController.querySelector(".arrow.down").addEventListener("click", this.onDownvoteControllerClick.bind(this), false);
            if (this.threadInformation.likes === true) {
                voteController.classList.add("liked");
            }
            else if (this.threadInformation.likes === false) {
                voteController.classList.add("disliked");
            }
            /* Set the icon, text, and event listener for the button to switch to the Disqus comments. */
            let googlePlusButton;
            let googlePlusContainer;
            if (RoKA.Application.currentMediaService() === Service.YouTube) {
                googlePlusButton = this.threadContainer.querySelector("#at_switchtogplus");
                this.threadContainer.querySelector("#at_switchtodisqus").style.display = "none";
                googlePlusButton.addEventListener("click", this.onGooglePlusClick, false);
                googlePlusContainer = document.getElementById("watch-discussion");
            }
            else if (RoKA.Application.currentMediaService() === Service.KissAnime) {
                googlePlusButton = template.querySelector("#at_switchtodisqus");
                template.querySelector("#at_switchtogplus").style.display = "none";
                googlePlusButton.addEventListener("click", this.onGooglePlusClick, false);
                googlePlusContainer = document.getElementById("disqus_thread");
            }
            else if (RoKA.Application.currentMediaService() === Service.KissManga) {
                googlePlusButton = this.threadContainer.querySelector("#at_switchtodisqus");
                this.threadContainer.querySelector("#at_switchtogplus").style.display = "none";
                googlePlusButton.addEventListener("click", this.onGooglePlusClick, false);
                googlePlusContainer = document.getElementById("disqus_thread");
            }
            if (RoKA.Preferences.getBoolean("showGooglePlusButton") === false || googlePlusContainer === null) {
                googlePlusButton.style.display = "none";
            }
            /* Mark the post as preserved if applicable */
            if (this.postIsInPreservedMode) {
                this.threadContainer.classList.add("preserved");
            }
            else {
                if (this.commentSection.userIsSignedIn) {
                    new RoKA.CommentField(this);
                }
            }
            /* If this post is prioritised (official) mark it as such in the header */
            if (this.threadInformation.official) {
                let officialLabel = this.threadContainer.querySelector(".at_official");
                officialLabel.textContent = RoKA.Application.localisationManager.get("post_message_official");
                officialLabel.style.display = "inline-block";
            }
            /* Start iterating the top level comments in the comment section */
            this.commentData.forEach(function (commentObject) {
                if (commentObject.kind === "more") {
                    let readmore = new RoKA.LoadMore(commentObject.data, this, this);
                    this.children.push(readmore);
                    this.threadContainer.appendChild(readmore.representedHTMLElement);
                }
                else {
                    let comment = new RoKA.Comment(commentObject.data, this);
                    this.children.push(comment);
                    this.threadContainer.appendChild(comment.representedHTMLElement);
                }
            }.bind(this));
            this.set(this.threadContainer);
        }
        /**
        * Sets the contents of the comment thread.
        * @param contents HTML DOM node or element to use.
        */
        set(contents) {
            let oldThread = document.getElementById("at_comments");
            let RoKA = document.getElementById("RoKA");
            if (RoKA && oldThread) {
                RoKA.removeChild(oldThread);
            }
            RoKA.appendChild(contents);
        }
        /**
         * Either save a post or unsave an already saved post.
         * @param eventObject The event object for the click of the save button.
         * @private
         */
        onSaveButtonClick(eventObject) {
            let saveButton = eventObject.target;
            let savedType = saveButton.getAttribute("saved") ? RoKA.Reddit.SaveType.UNSAVE : RoKA.Reddit.SaveType.SAVE;
            new RoKA.Reddit.SaveRequest(this.threadInformation.name, savedType, function () {
                if (savedType === RoKA.Reddit.SaveType.SAVE) {
                    saveButton.setAttribute("saved", "true");
                    saveButton.textContent = RoKA.Application.localisationManager.get("post_button_unsave");
                }
                else {
                    saveButton.removeAttribute("saved");
                    saveButton.textContent = RoKA.Application.localisationManager.get("post_button_save");
                }
            });
        }
        /**
         * Show the report post form.
         * @param eventObject The event object for the click of the report button.
         * @private
         */
        onReportButtonClicked(eventObject) {
            new RoKA.Reddit.Report(this.threadInformation.name, this, true);
        }
        /**
         * Handle the click of the Disqus Button to change to the Disqus comments.
         * @private
         */
         onGooglePlusClick(eventObject) {
             let RoKAContainer = document.getElementById("RoKA");
             RoKAContainer.style.display = "none";
             let googlePlusContainer;
             if (RoKA.Application.currentMediaService() === Service.YouTube) {
                 googlePlusContainer = document.getElementById("watch-discussion");
             }
             else if (RoKA.Application.currentMediaService() === Service.KissAnime) {
                 googlePlusContainer = document.getElementById("disqus_thread");
             }
             else if (RoKA.Application.currentMediaService() === Service.KissManga) {
                 googlePlusContainer = document.getElementById("disqus_thread");
             }
             googlePlusContainer.style.display = "";
             googlePlusContainer.style.height = "auto";
             let redditButton = document.getElementById("at_switchtoreddit");
             redditButton.style.display = "block";
         }
        /**
         * Upvote a post or remove an existing upvote.
         * @param eventObject The event object for the click of the upvote button.
         * @private
         */
        onUpvoteControllerClick(eventObject) {
            let upvoteController = eventObject.target;
            let voteController = upvoteController.parentNode;
            let scoreValue = voteController.querySelector(".score");
            if (this.threadInformation.likes === true) {
                /* The user already likes this post, so they wish to remove their current like. */
                voteController.classList.remove("liked");
                this.threadInformation.likes = null;
                this.threadInformation.score = this.threadInformation.score - 1;
                scoreValue.textContent = this.threadInformation.score;
                new RoKA.Reddit.VoteRequest(this.threadInformation.name, RoKA.Reddit.Vote.REMOVE);
            }
            else {
                /* The user wishes to like this post */
                if (this.threadInformation.likes === false) {
                    /* The user has previously disliked this post, we need to remove that status and add 2 to the score instead of 1*/
                    voteController.classList.remove("disliked");
                    this.threadInformation.score = this.threadInformation.score + 2;
                }
                else {
                    this.threadInformation.score = this.threadInformation.score + 1;
                }
                voteController.classList.add("liked");
                this.threadInformation.likes = true;
                scoreValue.textContent = this.threadInformation.score;
                new RoKA.Reddit.VoteRequest(this.threadInformation.name, RoKA.Reddit.Vote.UPVOTE);
            }
        }
        /**
         * Downvote a comment or remove an existing downvote
         * @param eventObject The event object for the click of the downvote button.
         * @private
         */
        onDownvoteControllerClick(eventObject) {
            let downvoteController = eventObject.target;
            let voteController = downvoteController.parentNode;
            let scoreValue = voteController.querySelector(".score");
            if (this.threadInformation.likes === false) {
                /* The user already dislikes this post, so they wish to remove their current dislike */
                voteController.classList.remove("disliked");
                this.threadInformation.likes = null;
                this.threadInformation.score = this.threadInformation.score + 1;
                scoreValue.textContent = this.threadInformation.score;
                new RoKA.Reddit.VoteRequest(this.threadInformation.name, RoKA.Reddit.Vote.REMOVE);
            }
            else {
                /* The user wishes to dislike this post */
                if (this.threadInformation.likes === true) {
                    /* The user has previously liked this post, we need to remove that status and subtract 2 from the score instead of 1*/
                    voteController.classList.remove("liked");
                    this.threadInformation.score = this.threadInformation.score - 2;
                }
                else {
                    this.threadInformation.score = this.threadInformation.score - 1;
                }
                voteController.classList.add("disliked");
                this.threadInformation.likes = false;
                scoreValue.textContent = this.threadInformation.score;
                new RoKA.Reddit.VoteRequest(this.threadInformation.name, RoKA.Reddit.Vote.DOWNVOTE);
            }
        }
        /**
         * Handle the click of the "comment" button, to show or hide the post comment box.
         * @private
         */
        onCommentButtonClick() {
            let header = document.querySelector(".at_thread");
            let previousCommentBox = header.querySelector(".at_commentfield");
            if (previousCommentBox) {
                previousCommentBox.parentNode.removeChild(previousCommentBox);
            }
            new RoKA.CommentField(this);
        }
    }
    RoKA.CommentThread = CommentThread;
})(RoKA || (RoKA = {}));
/// <reference path="index.ts" />
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
var RoKA;
(function (RoKA) {
    /**
        * The representation and management of an RoKA loading screen.
        * @class CommentField
        * @param commentSection The active CommentSection to retrieve data from.
        * @param insertionPoint The DOM element in which the loading screen should be appended to as a child.
        * @param [initialState] An optional initial state for the loading screen, the default is "Loading"
    */
    "use strict";
    class CommentField {
        constructor(parent, initialText, edit) {
            /* Check if the paramter is a Coment Thread and assign the correct parent HTML element .*/
            if (parent instanceof RoKA.CommentThread) {
                this.parentClass = parent;
                this.commentThread = this.parentClass;
                this.parentHTMLElement = this.parentClass.threadContainer.querySelector(".options");
            }
            else if (parent instanceof RoKA.Comment) {
                this.parentClass = parent;
                this.commentThread = this.parentClass.commentThread;
                this.parentHTMLElement = this.parentClass.representedHTMLElement.querySelector(".options");
            }
            else {
                new TypeError("parent needs to be type CommentThread or Type Comment");
            }
            this.edit = edit;
            let template = RoKA.Application.getExtensionTemplateItem(this.commentThread.commentSection.template, "commentfield");
            this.representedHTMLElement = template.querySelector(".at_commentfield");
            /* Set the "You are now commenting as" text under the comment field. */
            let authorName = this.representedHTMLElement.querySelector(".at_writingauthor");
            authorName.textContent = RoKA.Application.localisationManager.get("commentfield_label_author", [RoKA.Preferences.getString("username")]);
            /* Set the button text and event listener for the submit button */
            let submitButton = this.representedHTMLElement.querySelector(".at_submit");
            submitButton.textContent = RoKA.Application.localisationManager.get("commentfield_button_submit");
            submitButton.addEventListener("click", this.onSubmitButtonClick.bind(this), false);
            /* Set the button text and event listener for the cancel button */
            let cancelButton = this.representedHTMLElement.querySelector(".at_cancel");
            cancelButton.textContent = RoKA.Application.localisationManager.get("commentfield_button_cancel");
            cancelButton.addEventListener("click", this.onCancelButtonClick.bind(this), false);
            /* Set the text for the markdown preview header */
            let previewHeader = this.representedHTMLElement.querySelector(".at_preview_header");
            previewHeader.textContent = RoKA.Application.localisationManager.get("commentfield_label_preview");
            /* Check if we were initialised with some text (most likely from the show source button) and add event listener for input
            change */
            let inputField = this.representedHTMLElement.querySelector(".at_textarea");
            if (initialText) {
                inputField.value = initialText;
            }
            inputField.addEventListener("input", this.onInputFieldChange.bind(this), false);
            this.previewElement = this.representedHTMLElement.querySelector(".at_comment_preview");
            this.parentHTMLElement.appendChild(this.representedHTMLElement);
        }
        /**
         * Get the HTML element of the comment field.
         */
        get HTMLElement() {
            return this.representedHTMLElement;
        }
        /**
         * Handle the click of the submit button of the comment field.
         * @param eventObject The event object of the click of the submit button.
         * @private
         */
        onSubmitButtonClick(eventObject) {
            /* Disable the button on click so the user does not accidentally press it multiple times */
            let submitButton = eventObject.target;
            submitButton.disabled = true;
            let inputField = this.representedHTMLElement.querySelector(".at_textarea");
            let thing_id = (this.parentClass instanceof RoKA.CommentThread)
                ? this.parentClass.threadInformation.name : this.parentClass.commentObject.name;
            if (this.edit) {
                /* Send the edit comment request to reddit */
                new RoKA.Reddit.EditCommentRequest(thing_id, inputField.value, function (responseText) {
                    this.parentClass.commentObject.body = inputField.value;
                    let editedCommentBody = this.parentClass.representedHTMLElement.querySelector(".at_commentcontent");
                    editedCommentBody.innerHTML = SnuOwnd.getParser().render(inputField.value);
                    this.parentClass.representedHTMLElement.classList.add("edited");
                    /* The comment box is no longer needed, remove it and clear outselves out of memory */
                    this.representedHTMLElement.parentNode.removeChild(this.representedHTMLElement);
                });
            }
            else {
                /* Send the comment to Reddit */
                new RoKA.Reddit.CommentRequest(thing_id, inputField.value, function (responseText) {
                    let responseObject = JSON.parse(responseText);
                    let comment = new RoKA.Comment(responseObject.json.data.things[0].data, this.commentThread);
                    this.parentClass.children.push(comment);
                    /* Find the correct insert location and append the new comment to DOM */
                    if (this.parentClass instanceof RoKA.CommentThread) {
                        this.parentClass.threadContainer.appendChild(comment.representedHTMLElement);
                        new CommentField(this.parentClass);
                    }
                    else {
                        this.parentClass.representedHTMLElement.querySelector(".at_replies").appendChild(comment.representedHTMLElement);
                    }
                    this.parentClass.children.push(comment);
                    /* Scroll the new comment in to view */
                    comment.representedHTMLElement.scrollIntoView(false);
                    /* The comment box is no longer needed, remove it and clear outselves out of memory */
                    this.representedHTMLElement.parentNode.removeChild(this.representedHTMLElement);
                });
            }
        }
        /**
         * Cancel / Remove the comment field.
         * @private
         */
        onCancelButtonClick() {
            this.representedHTMLElement.parentNode.removeChild(this.representedHTMLElement);
        }
        /**
         * Handle the contents of the comment field changing.
         * @param eventObject The event object of the input field change.
         * @private
         */
        onInputFieldChange(eventObject) {
            let inputField = eventObject.target;
            /* If there is any contents of the input box, display the markdown preview and populate it. */
            if (inputField.value.length > 0) {
                this.previewElement.style.display = "block";
                let previewContents = this.previewElement.querySelector(".at_preview_contents");
                previewContents.innerHTML = SnuOwnd.getParser().render(inputField.value);
            }
            else {
                this.previewElement.style.display = "none";
            }
        }
    }
    RoKA.CommentField = CommentField;
})(RoKA || (RoKA = {}));
/// <reference path="index.ts" />
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
var RoKA;
(function (RoKA) {
    /**
        * A class representation and container of a single Reddit comment.
        * @class Comment
        * @param commentData Object containing the comment data from the Reddit API.
        * @param commentThread CommentThread object representing the container of the comment.
    */
    "use strict";
    class Comment {
        constructor(commentData, commentThread) {
            this.children = new Array();
            this.commentObject = commentData;
            this.commentThread = commentThread;
            var template = RoKA.Application.getExtensionTemplateItem(this.commentThread.commentSection.template, "comment");
            this.representedHTMLElement = template.querySelector(".at_comment");
            /* Set the id for the comment in question so it can be correlated with the Comment Object */
            this.representedHTMLElement.setAttribute("data-reddit-id", commentData.id);
            /* Show / collapse function for the comment */
            let toggleHide = this.representedHTMLElement.querySelector(".at_togglehide");
            toggleHide.addEventListener("click", function () {
                if (this.representedHTMLElement.classList.contains("hidden")) {
                    this.representedHTMLElement.classList.remove("hidden");
                }
                else {
                    this.representedHTMLElement.classList.add("hidden");
                }
            }.bind(this), false);
            /* Hide comments with a score less than the threshold set by the user  */
            if (this.commentObject.score < RoKA.Preferences.getNumber("hiddenCommentScoreThreshold")) {
                this.representedHTMLElement.classList.add("hidden");
            }
            /* Set the link and name of author, as well as whether they are the OP or not. */
            let author = this.representedHTMLElement.querySelector(".at_author");
            author.textContent = this.commentObject.author;
            author.setAttribute("href", "http://reddit.com/u/" + this.commentObject.author);
            author.setAttribute("data-username", this.commentObject.author);
            if (commentData.distinguished === "admin") {
                author.setAttribute("data-reddit-admin", "true");
            }
            else if (commentData.distinguished === "moderator") {
                author.setAttribute("data-reddit-mod", "true");
            }
            else if (commentData.author === commentThread.threadInformation.author) {
                author.setAttribute("data-reddit-op", "true");
            }
            /* Set the gild (how many times the user has been given gold for this post) if any */
            if (this.commentObject.gilded) {
                this.representedHTMLElement.querySelector(".at_gilded").setAttribute("data-count", this.commentObject.gilded);
            }
            /* Add flair to the user */
            let flair = this.representedHTMLElement.querySelector(".at_flair");
            if (this.commentObject.author_flair_text) {
                flair.textContent = this.commentObject.author_flair_text;
            }
            else {
                flair.style.display = "none";
            }
            /* Set the score of the comment next to the user tag */
            let score = this.representedHTMLElement.querySelector(".at_score");
            let scorePointsText = this.commentObject.score === 1 ? RoKA.Application.localisationManager.get("post_current_score") : RoKA.Application.localisationManager.get("post_current_score_plural");
            score.textContent = (this.commentObject.score + scorePointsText);
            /* Set the timestamp of the comment */
            let timestamp = this.representedHTMLElement.querySelector(".at_timestamp");
            timestamp.textContent = RoKA.Application.getHumanReadableTimestamp(this.commentObject.created_utc);
            timestamp.setAttribute("timestamp", new Date(this.commentObject.created_utc).toISOString());
            /* If the post has been edited, display the edit time next to the timestamp. */
            if (this.commentObject.edited) {
                timestamp.classList.add("edited");
                timestamp.title = `${RoKA.Application.getHumanReadableTimestamp(this.commentObject.edited, "edited_timestamp_format")}`;
            }
            /* Render the markdown and set the actual comement messsage of the comment */
            let contentTextOfComment = this.representedHTMLElement.querySelector(".at_commentcontent");
            let contentTextHolder = document.createElement("span");
            /* Terrible workaround: Reddit text is double encoded with html entities for some reason, so we have to insert it into the DOM
            twice to make the browser decode it. */
            let textParsingElement = document.createElement("span");
            textParsingElement.innerHTML = this.commentObject.body;
            /* Set the comment text */
            contentTextHolder.innerHTML = SnuOwnd.getParser().render(textParsingElement.textContent);
            contentTextOfComment.appendChild(contentTextHolder);
            if (this.commentObject.body === "[deleted]") {
                this.representedHTMLElement.classList.add("deleted");
            }
            /* Set the button text and event handler for the reply button. */
            let replyToComment = this.representedHTMLElement.querySelector(".at_reply");
            replyToComment.textContent = RoKA.Application.localisationManager.get("post_button_reply");
            replyToComment.addEventListener("click", this.onCommentButtonClick.bind(this), false);
            /* Set the button text and link for the "permalink" button */
            let permalinkElement = this.representedHTMLElement.querySelector(".at_permalink");
            permalinkElement.textContent = RoKA.Application.localisationManager.get("post_button_permalink");
            permalinkElement.setAttribute("href", `http://www.reddit.com${commentThread.threadInformation.permalink}${this.commentObject.id}`);
            /* Set the button text and link for the "parent" link button */
            let parentLinkElement = this.representedHTMLElement.querySelector(".at_parentlink");
            parentLinkElement.textContent = RoKA.Application.localisationManager.get("post_button_parent");
            parentLinkElement.setAttribute("href", `http://www.reddit.com${commentThread.threadInformation.permalink}#${this.commentObject.parent_id.substring(3)}`);
            /* Set the button text and the event handler for the "show source" button */
            let displaySourceForComment = this.representedHTMLElement.querySelector(".at_displaysource");
            displaySourceForComment.textContent = RoKA.Application.localisationManager.get("post_button_source");
            displaySourceForComment.addEventListener("click", this.onSourceButtonClick.bind(this), false);
            /* Set the button text and the event handler for the "save comment" button */
            let saveItemToRedditList = this.representedHTMLElement.querySelector(".save");
            if (this.commentObject.saved) {
                saveItemToRedditList.textContent = RoKA.Application.localisationManager.get("post_button_unsave");
                saveItemToRedditList.setAttribute("saved", "true");
            }
            else {
                saveItemToRedditList.textContent = RoKA.Application.localisationManager.get("post_button_save");
            }
            saveItemToRedditList.addEventListener("click", this.onSaveButtonClick.bind(this), false);
            /* Set the button text and the link for the "give gold" button */
            let giveGoldToUser = this.representedHTMLElement.querySelector(".giveGold");
            giveGoldToUser.setAttribute("href", "http://www.reddit.com/gold?goldtype=gift&months=1&thing=" + this.commentObject.name);
            giveGoldToUser.textContent = RoKA.Application.localisationManager.get("post_button_gold");
            let reportToAdministrators = this.representedHTMLElement.querySelector(".report");
            let editPost = this.representedHTMLElement.querySelector(".at_edit");
            let deletePost = this.representedHTMLElement.querySelector(".at_delete");
            if (this.commentObject.author === RoKA.Preferences.getString("username")) {
                /* Report button does not make sense on our own post, so let's get rid of it */
                reportToAdministrators.parentNode.removeChild(reportToAdministrators);
                /* Set the button text and the event handler for the "edit post" button */
                editPost.textContent = RoKA.Application.localisationManager.get("post_button_edit");
                editPost.addEventListener("click", this.onEditPostButtonClick.bind(this), false);
                /* Set the button text and the event handler for the "delete post" button */
                deletePost.textContent = RoKA.Application.localisationManager.get("post_button_delete");
                deletePost.addEventListener("click", this.onDeletePostButtonClick.bind(this), false);
            }
            else {
                /* Delete and edit buttons does not make sense if the post is not ours, so let's get rid of them. */
                editPost.parentNode.removeChild(editPost);
                deletePost.parentNode.removeChild(deletePost);
                /* Set the button text and the event handler for the "report comment" button */
                reportToAdministrators.textContent = RoKA.Application.localisationManager.get("post_button_report");
                reportToAdministrators.addEventListener("click", this.onReportButtonClicked.bind(this), false);
            }
            /* Set the state of the voting buttons */
            let voteController = this.representedHTMLElement.querySelector(".vote");
            voteController.querySelector(".arrow.up").addEventListener("click", this.onUpvoteControllerClick.bind(this), false);
            voteController.querySelector(".arrow.down").addEventListener("click", this.onDownvoteControllerClick.bind(this), false);
            if (this.commentObject.likes === true) {
                voteController.classList.add("liked");
            }
            else if (this.commentObject.likes === false) {
                voteController.classList.add("disliked");
            }
            /* Continue traversing down and populate the replies to this comment. */
            if (this.commentObject.replies) {
                let replyContainer = this.representedHTMLElement.querySelector(".at_replies");
                this.commentObject.replies.data.children.forEach(function (commentObject) {
                    if (commentObject.kind === "more") {
                        let readmore = new RoKA.LoadMore(commentObject.data, this, commentThread);
                        this.children.push(readmore);
                        replyContainer.appendChild(readmore.representedHTMLElement);
                    }
                    else {
                        let comment = new Comment(commentObject.data, commentThread);
                        this.children.push(comment);
                        replyContainer.appendChild(comment.representedHTMLElement);
                    }
                }.bind(this));
            }
        }
        /**
         * Either save a comment or unsave an already saved comment.
         * @param eventObject The event object for the click of the save button.
         * @private
         */
        onSaveButtonClick(eventObject) {
            let saveButton = eventObject.target;
            let savedType = saveButton.getAttribute("saved") ? RoKA.Reddit.SaveType.UNSAVE : RoKA.Reddit.SaveType.SAVE;
            new RoKA.Reddit.SaveRequest(this.commentObject.name, savedType, function () {
                if (savedType === RoKA.Reddit.SaveType.SAVE) {
                    saveButton.setAttribute("saved", "true");
                    saveButton.textContent = RoKA.Application.localisationManager.get("post_button_unsave");
                }
                else {
                    saveButton.removeAttribute("saved");
                    saveButton.textContent = RoKA.Application.localisationManager.get("post_button_save");
                }
            });
        }
        /**
         * Show the report comment form.
         * @param eventObject The event object for the click of the report button.
         * @private
         */
        onReportButtonClicked(eventObject) {
            new RoKA.Reddit.Report(this.commentObject.name, this.commentThread, false);
        }
        /**
         * Upvote a comment or remove an existing upvote.
         * @param eventObject The event object for the click of the upvote button.
         * @private
         */
        onUpvoteControllerClick(eventObject) {
            let upvoteController = eventObject.target;
            let voteController = upvoteController.parentNode;
            let parentNode = voteController.parentNode;
            let scoreValue = parentNode.querySelector(".at_score");
            if (this.commentObject.likes === true) {
                /* The user already likes this post, so they wish to remove their current like. */
                voteController.classList.remove("liked");
                this.commentObject.likes = null;
                this.commentObject.score = this.commentObject.score - 1;
                let scorePointsText = this.commentObject.score === 1 ? RoKA.Application.localisationManager.get("post_current_score") : RoKA.Application.localisationManager.get("post_current_score_plural");
                scoreValue.textContent = this.commentObject.score + scorePointsText;
                new RoKA.Reddit.VoteRequest(this.commentObject.name, RoKA.Reddit.Vote.REMOVE);
            }
            else {
                /* The user wishes to like this post */
                if (this.commentObject.likes === false) {
                    /* The user has previously disliked this post, we need to remove that status and add 2 to the score instead of 1*/
                    voteController.classList.remove("disliked");
                    this.commentObject.score = this.commentObject.score + 2;
                }
                else {
                    this.commentObject.score = this.commentObject.score + 1;
                }
                voteController.classList.add("liked");
                this.commentObject.likes = true;
                let scorePointsText = this.commentObject.score === 1 ? RoKA.Application.localisationManager.get("post_current_score") : RoKA.Application.localisationManager.get("post_current_score_plural");
                scoreValue.textContent = this.commentObject.score + scorePointsText;
                new RoKA.Reddit.VoteRequest(this.commentObject.name, RoKA.Reddit.Vote.UPVOTE);
            }
        }
        /**
         * Downvote a comment or remove an existing downvote
         * @param eventObject The event object for the click of the downvote button.
         * @private
         */
        onDownvoteControllerClick(eventObject) {
            let downvoteController = eventObject.target;
            let voteController = downvoteController.parentNode;
            let parentNode = voteController.parentNode;
            let scoreValue = parentNode.querySelector(".at_score");
            if (this.commentObject.likes === false) {
                /* The user already dislikes this post, so they wish to remove their current dislike */
                voteController.classList.remove("disliked");
                this.commentObject.likes = null;
                this.commentObject.score = this.commentObject.score + 1;
                let scorePointsText = this.commentObject.score === 1 ? RoKA.Application.localisationManager.get("post_current_score") : RoKA.Application.localisationManager.get("post_current_score_plural");
                scoreValue.textContent = this.commentObject.score + scorePointsText;
                new RoKA.Reddit.VoteRequest(this.commentObject.name, RoKA.Reddit.Vote.REMOVE);
            }
            else {
                /* The user wishes to dislike this post */
                if (this.commentObject.likes === true) {
                    /* The user has previously liked this post, we need to remove that status and subtract 2 from the score instead of 1*/
                    voteController.classList.remove("liked");
                    this.commentObject.score = this.commentObject.score - 2;
                }
                else {
                    this.commentObject.score = this.commentObject.score - 1;
                }
                voteController.classList.add("disliked");
                this.commentObject.likes = false;
                let scorePointsText = this.commentObject.score === 1 ? RoKA.Application.localisationManager.get("post_current_score") : RoKA.Application.localisationManager.get("post_current_score_plural");
                scoreValue.textContent = this.commentObject.score + scorePointsText;
                new RoKA.Reddit.VoteRequest(this.commentObject.name, RoKA.Reddit.Vote.DOWNVOTE);
            }
        }
        /**
         * Show or hide the comment/reply box.
         * @private
         */
        onCommentButtonClick() {
            let previousCommentBox = this.representedHTMLElement.querySelector(".at_commentfield");
            if (previousCommentBox) {
                previousCommentBox.parentNode.removeChild(previousCommentBox);
            }
            new RoKA.CommentField(this);
        }
        /**
         * Show the source of the comment.
         * @private
         */
        onSourceButtonClick() {
            let previousCommentBox = this.representedHTMLElement.querySelector(".at_commentfield");
            if (previousCommentBox) {
                previousCommentBox.parentNode.removeChild(previousCommentBox);
            }
            new RoKA.CommentField(this, this.commentObject.body);
        }
        /**
         * Edit a comment.
         * @private
         */
        onEditPostButtonClick() {
            let previousCommentBox = this.representedHTMLElement.querySelector(".at_commentfield");
            if (previousCommentBox) {
                previousCommentBox.parentNode.removeChild(previousCommentBox);
            }
            new RoKA.CommentField(this, this.commentObject.body, true);
        }
        /**
         * Delete a comment.
         * @private
         */
        onDeletePostButtonClick() {
            let confirmation = window.confirm(RoKA.Application.localisationManager.get("post_delete_confirm"));
            if (confirmation) {
                var url = "https://api.reddit.com/api/del";
                new RoKA.HttpRequest(url, RoKA.RequestType.POST, function () {
                    this.representedHTMLElement.parentNode.removeChild(this.representedHTMLElement);
                    let getIndexInParentList = this.commentThread.children.indexOf(this);
                    if (getIndexInParentList !== -1) {
                        this.commentThread.children.splice(getIndexInParentList, 1);
                    }
                }, {
                    "uh": RoKA.Preferences.getString("redditUserIdentifierHash"),
                    "id": this.commentObject.name,
                });
            }
        }
    }
    RoKA.Comment = Comment;
})(RoKA || (RoKA = {}));
/// <reference path="index.ts" />
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
var RoKA;
(function (RoKA) {
    /**
        * A class representation and container of a single Reddit comment.
        * @class ReadMore
        * @param data Object containing the "load more comments" links.
        * @param commentThread CommentThread object representing the container of the load more link.
    */
    "use strict";
    class LoadMore {
        constructor(data, referenceParent, commentThread) {
            this.data = data;
            this.commentThread = commentThread;
            this.referenceParent = referenceParent;
            this.representedHTMLElement = RoKA.Application.getExtensionTemplateItem(commentThread.commentSection.template, "loadmore");
            /* Display the amount of replies available to load */
            let replyCount = this.representedHTMLElement.querySelector(".at_replycount");
            let replyCountText = data.count > 1 ? RoKA.Application.localisationManager.get("post_label_reply_plural") : RoKA.Application.localisationManager.get("post_label_reply");
            replyCount.textContent = "(" + data.count + " " + replyCountText + ")";
            /* Set the localisation for the "load more" button, and the event listener. */
            let loadMoreText = this.representedHTMLElement.querySelector(".at_load");
            loadMoreText.textContent = RoKA.Application.localisationManager.get("post_button_load_more");
            loadMoreText.addEventListener("click", this.onLoadMoreClick.bind(this), false);
        }
        /**
         * Handle a click on the "load more" button.
         * @param eventObject The event object of the load more button click.
         * @private
         */
        onLoadMoreClick(eventObject) {
            /* Display "loading comments" text */
            let loadingText = eventObject.target;
            loadingText.classList.add("loading");
            loadingText.textContent = RoKA.Application.localisationManager.get("loading_generic_message");
            let generateRequestUrl = `https://api.reddit.com/r/${this.commentThread.threadInformation.subreddit}"/comments/${this.commentThread.threadInformation.id}/z/${this.data.id}.json`;
            new RoKA.HttpRequest(generateRequestUrl, RoKA.RequestType.GET, function (responseData) {
                /* Remove "loading comments" text */
                let getParentNode = loadingText.parentNode.parentNode;
                getParentNode.removeChild(loadingText.parentNode);
                /* Traverse the retrieved comments and append them to the comment section */
                let commentItems = JSON.parse(responseData)[1].data.children;
                if (commentItems.length > 0) {
                    commentItems.forEach(function (commentObject) {
                        var readmore, comment;
                        if (commentObject.kind === "more") {
                            readmore = new LoadMore(commentObject.data, this.referenceParent, this.commentThread);
                            this.referenceParent.children.push(readmore);
                            getParentNode.appendChild(readmore.representedHTMLElement);
                        }
                        else {
                            comment = new RoKA.Comment(commentObject.data, this.commentThread);
                            this.referenceParent.children.push(comment);
                            getParentNode.appendChild(comment.representedHTMLElement);
                        }
                    });
                }
            });
        }
    }
    RoKA.LoadMore = LoadMore;
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
/// <reference path="index.ts" />
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
var RoKA;
(function (RoKA) {
    /**
        * The representation and management of an RoKA loading screen.
        * @class LoadingScreen
        * @param commentSection The active CommentSection to retrieve data from.
        * @param insertionPoint The DOM element in which the loading screen should be appended to as a child.
        * @param [initialState] An optional initial state for the loading screen, the default is "Loading"
    */
    "use strict";
    class LoadingScreen {
        constructor(commentSection, initialState, alternativeText) {
            let loadingState = initialState || LoadingState.LOADING;
            this.representedHTMLElement = RoKA.Application.getExtensionTemplateItem(commentSection.template, "loading");
            this.updateProgress(loadingState, alternativeText);
        }
        /**
         * Get the HTML element of the loading screen container.
         */
        get HTMLElement() {
            return this.representedHTMLElement;
        }
        /**
         * Update the current progress of the loading screen.
         * @param state The new state of the loading screen.
         * @param [alternativeText] A custom message to put on the loading screen for the user.
         */
        updateProgress(state, alternativeText) {
            this.currentProgressState = state;
            var loadingText = this.representedHTMLElement.querySelector("#at_loadingtext");
            var loadingHeader = this.representedHTMLElement.querySelector("#at_loadingheader");
            switch (this.currentProgressState) {
                case LoadingState.LOADING:
                    this.loadingAttempts = 1;
                    loadingHeader.textContent = alternativeText || RoKA.Application.localisationManager.get("loading_generic_message");
                    loadingText.textContent = RoKA.Application.localisationManager.get("loading_generic_text") || "";
                    break;
                case LoadingState.RETRY:
                    this.loadingAttempts += 1;
                    loadingText.textContent = RoKA.Application.localisationManager.get("loading_retry_message", [
                        this.loadingAttempts.toString(),
                        "3"
                    ]);
                    break;
                case LoadingState.ERROR:
                case LoadingState.COMPLETE:
                    let parentNode = this.representedHTMLElement.parentNode;
                    if (parentNode) {
                        this.representedHTMLElement.parentNode.removeChild(this.representedHTMLElement);
                    }
                    delete this;
                    break;
            }
        }
    }
    RoKA.LoadingScreen = LoadingScreen;
    var LoadingState;
    (function (LoadingState) {
        LoadingState[LoadingState["LOADING"] = 0] = "LOADING";
        LoadingState[LoadingState["RETRY"] = 1] = "RETRY";
        LoadingState[LoadingState["ERROR"] = 2] = "ERROR";
        LoadingState[LoadingState["COMPLETE"] = 3] = "COMPLETE";
    })(LoadingState = RoKA.LoadingState || (RoKA.LoadingState = {}));
})(RoKA || (RoKA = {}));
/// <reference path="index.ts" />
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
var RoKA;
(function (RoKA) {
    /**
        * The representation and management of an RoKA loading screen.
        * @class ErrorScreen
        * @param commentSection The active CommentSection to retrieve data from.
        * @param errorState The error state of the error screen, defines what visuals and titles will be displayed.
        * @param [message] Optional message to be displayed if the error state is set to regular "ERROR"
    */
    "use strict";
    class ErrorScreen {
        constructor(commentSection, errorState, message) {
            this.representedHTMLElement = RoKA.Application.getExtensionTemplateItem(commentSection.template, "error");
            let errorImage = this.representedHTMLElement.querySelector("img");
            let errorHeader = this.representedHTMLElement.querySelector("#at_errorheader");
            let errorText = this.representedHTMLElement.querySelector("#at_errortext");
            /* Set the icon, text, and event listener for the button to switch to the Disqus comments. */
            let googlePlusButton;
            let googlePlusContainer;
            if (RoKA.Application.currentMediaService() === Service.YouTube) {
                googlePlusButton = this.representedHTMLElement.querySelector("#at_switchtogplus");
                this.representedHTMLElement.querySelector("#at_switchtodisqus").style.display = "none";
                googlePlusButton.addEventListener("click", this.onGooglePlusClick, false);
                googlePlusContainer = document.getElementById("watch-discussion");
            }
            else if (RoKA.Application.currentMediaService() === Service.KissAnime) {
                googlePlusButton = template.querySelector("#at_switchtodisqus");
                template.querySelector("#at_switchtogplus").style.display = "none";
                googlePlusButton.addEventListener("click", this.onGooglePlusClick, false);
                googlePlusContainer = document.getElementById("disqus_thread");
            }
            else if (RoKA.Application.currentMediaService() === Service.KissManga) {
                googlePlusButton = this.representedHTMLElement.querySelector("#at_switchtodisqus");
                this.representedHTMLElement.querySelector("#at_switchtogplus").style.display = "none";
                googlePlusButton.addEventListener("click", this.onGooglePlusClick, false);
                googlePlusContainer = document.getElementById("disqus_thread");
            }
            if (RoKA.Preferences.getBoolean("showGooglePlusButton") === false || googlePlusContainer === null) {
                googlePlusButton.style.display = "none";
            }
            switch (errorState) {
                case ErrorState.NOT_FOUND:
                    /* Reddit.com uses 5 different randomly selected visuals for their 404 graphic, their path consists of a letter from
                    "a" to "e" just like Reddit we are randomly choosing one of these letters and retrieving the image. */
                    let getRandom404Id = String.fromCharCode(97 + Math.floor(Math.random() * 5));
                    errorImage.setAttribute("src", `https://www.redditstatic.com/reddit404${getRandom404Id}.png`);
                    /* Set page not found localisation text */
                    errorHeader.textContent = RoKA.Application.localisationManager.get("error_header_not_found");
                    errorText.textContent = RoKA.Application.localisationManager.get("error_message_not_found");
                    break;
                case ErrorState.OVERLOAD:
                    /* Retrieve the Reddit overloaded svg graphic from the ressource directory. */
                    errorImage.setAttribute("src", RoKA.Application.getExtensionRessourcePath("redditoverload.svg"));
                    /* Set reddit overloaded localisation text */
                    errorHeader.textContent = RoKA.Application.localisationManager.get("error_header_overloaded");
                    errorText.textContent = RoKA.Application.localisationManager.get("error_message_overloaded");
                    break;
                case ErrorState.ERROR:
                case ErrorState.REDDITERROR:
                    /* Retrieve the generic "Reddit is broken" svg graphic from the ressource directory */
                    errorImage.setAttribute("src", RoKA.Application.getExtensionRessourcePath("redditbroken.svg"));
                    /* Set "you broke reddit" localisation text, and a custom message if provided */
                    errorHeader.textContent = RoKA.Application.localisationManager.get("error_header_generic");
                    if (message) {
                        errorText.textContent = message;
                    }
                    break;
                case ErrorState.CONNECTERROR:
                    /* Retrieve the generic "Reddit is broken" svg graphic from the ressource directory */
                    errorImage.setAttribute("src", RoKA.Application.getExtensionRessourcePath("redditbroken.svg"));
                    /* Set "connection timed out" localisation text */
                    errorHeader.textContent = RoKA.Application.localisationManager.get("error_header_timeout");
                    errorText.textContent = RoKA.Application.localisationManager.get("error_message_timeout");
                    break;
                case ErrorState.BLOCKED:
                    /* Retrieve the reddit blocked svg graphic from the ressource directory */
                    errorImage.setAttribute("src", RoKA.Application.getExtensionRessourcePath("redditblocked.svg"));
                    /* Set "connection is being interrupted" localisation text */
                    errorHeader.textContent = RoKA.Application.localisationManager.get("error_header_interrupted");
                    errorText.textContent = RoKA.Application.localisationManager.get("error_message_interrupted");
                    break;
            }
            /* Provide a retry button which reloads RoKA completely and tries again. */
            let retryButton = this.representedHTMLElement.querySelector(".at_retry");
            retryButton.textContent = RoKA.Application.localisationManager.get("error_button_retry");
            retryButton.addEventListener("click", this.reload, false);
            commentSection.set(this.representedHTMLElement);
        }
        /**
         * Reload the comment section.
         * @private
         */
        reload() {
            RoKA.Application.commentSection = new RoKA.CommentSection(RoKA.Application.getCurrentVideoId());
        }
        /**
         * Handle the click of the Disqus Button to change to the Disqus comments.
         * @private
         */
         onGooglePlusClick(eventObject) {
             let RoKAContainer = document.getElementById("RoKA");
             RoKAContainer.style.display = "none";
             let googlePlusContainer;
             if (RoKA.Application.currentMediaService() === Service.YouTube) {
                 googlePlusContainer = document.getElementById("watch-discussion");
             }
             else if (RoKA.Application.currentMediaService() === Service.KissAnime) {
                 googlePlusContainer = document.getElementById("disqus_thread");
             }
             else if (RoKA.Application.currentMediaService() === Service.KissManga) {
                 googlePlusContainer = document.getElementById("disqus_thread");
             }
             googlePlusContainer.style.display = "";
             googlePlusContainer.style.height = "auto";
             let redditButton = document.getElementById("at_switchtoreddit");
             redditButton.style.display = "block";
         }
    }
    RoKA.ErrorScreen = ErrorScreen;
    var ErrorState;
    (function (ErrorState) {
        ErrorState[ErrorState["NOT_FOUND"] = 0] = "NOT_FOUND";
        ErrorState[ErrorState["OVERLOAD"] = 1] = "OVERLOAD";
        ErrorState[ErrorState["REDDITERROR"] = 2] = "REDDITERROR";
        ErrorState[ErrorState["CONNECTERROR"] = 3] = "CONNECTERROR";
        ErrorState[ErrorState["BLOCKED"] = 4] = "BLOCKED";
        ErrorState[ErrorState["ERROR"] = 5] = "ERROR";
    })(ErrorState = RoKA.ErrorState || (RoKA.ErrorState = {}));
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
                    /* Migrate the previous "Display Disqus by default" setting into the "Default display action" setting. */
                    let displayGplusPreviousSetting = RoKA.Preferences.getBoolean("displayGooglePlusByDefault");
                    if (displayGplusPreviousSetting === true) {
                        RoKA.Preferences.set("defaultDisplayAction", "gplus");
                    }
                },
                "2.5": function () {
                    /* In 2.5 RoKA now uses the youtube channel ID not the display name for setting RoKA or Disqus as default per channel.
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
/// <reference path="../index.ts" />
/**
    * Namespace for requests to the Reddit API operations.
    * @namespace RoKA.Reddit
*/
var RoKA;
(function (RoKA) {
    var Reddit;
    (function (Reddit) {
        /**
            Perform a request to Reddit with embedded error handling.
            * @class Request
            * @param url The Reddit URL to make the request to.
            * @param type The type of request (POST or GET).
            * @param callback A callback handler for when the request is completed.
            * @param [postData] Eventual HTTP POST data to send with the request.
            * @param [loadingScreen] A LoadingScreen object to use for updating the progress of the request.
        */
        "use strict";
        class Request {
            constructor(url, type, callback, postData, loadingScreen) {
                this.loadTimer = 0;
                this.timeoutTimer = 0;
                /* Move the request parameters so they are accessible from anywhere within the class. */
                this.requestUrl = url;
                this.requestType = type;
                this.finalCallback = callback;
                this.postData = postData;
                this.loadingScreen = loadingScreen;
                /* Perform the request. */
                this.performRequest();
            }
            /**
             * Attempt to perform the request to the Reddit API.
             */
            performRequest() {
                this.attempts += 1;
                /* Kick of a 3 second timer that will confirm to the user that the loading process is taking unusually long, unless cancelled
                by a successful load (or an error) */
                this.loadTimer = setTimeout(function () {
                    let loadingText = document.getElementById("at_loadingtext");
                    loadingText.textContent = RoKA.Application.localisationManager.get("loading_slow_message");
                }, 3000);
                /* Kick of a 30 second timer that will cancel the connection attempt and display an error to the user letting them know
                something is probably blocking the connection. */
                this.timeoutTimer = setTimeout(function () {
                    new RoKA.ErrorScreen(RoKA.Application.commentSection, RoKA.ErrorState.CONNECTERROR);
                }, 30000);
                /* Perform the reddit api request */
                new RoKA.HttpRequest(this.requestUrl, this.requestType, this.onSuccess.bind(this), this.postData, this.onRequestError.bind(this));
            }
            /**
             * Called when a successful request has been made.
             * @param responseText the response from the Reddit API.
             */
            onSuccess(responseText) {
                /* Cancel the slow load timer */
                clearTimeout(this.loadTimer);
                /* Cancel the unsuccessful load timer */
                clearTimeout(this.timeoutTimer);
                /* Dismiss the loading screen, perform the callback and clear ourselves out of memory. */
                this.loadingScreen.updateProgress(RoKA.LoadingState.COMPLETE);
                try {
                    let responseObject = JSON.parse(responseText);
                    this.finalCallback(responseObject);
                }
                catch (e) {
                    if (e.toString().indexOf("SyntaxError: Unexpected end of input") !== -1) {
                        new RoKA.ErrorScreen(RoKA.Application.commentSection, RoKA.ErrorState.CONNECTERROR);
                    }
                    else {
                        new RoKA.ErrorScreen(RoKA.Application.commentSection, RoKA.ErrorState.ERROR, e.stack);
                    }
                }
            }
            /**
             * Called when a request was unsuccessful.
             * @param xhr the javascript XHR object of the request.
             * @param [response] An optional error message.
             */
            onRequestError(status, response) {
                /* Cancel the slow load timer */
                clearTimeout(this.loadTimer);
                clearTimeout(this.timeoutTimer);
                if (this.attempts <= 3 && status !== 404) {
                    /* Up to 3 attempts, retry the loading process automatically. */
                    this.loadingScreen.updateProgress(RoKA.LoadingState.RETRY);
                    this.performRequest();
                }
                else {
                    /* We have tried too many times without success, give up and display an error to the user. */
                    this.loadingScreen.updateProgress(RoKA.LoadingState.ERROR);
                    switch (status) {
                        case 0:
                            new RoKA.ErrorScreen(RoKA.Application.commentSection, RoKA.ErrorState.BLOCKED);
                            break;
                        case 404:
                            new RoKA.ErrorScreen(RoKA.Application.commentSection, RoKA.ErrorState.NOT_FOUND);
                            break;
                        case 503:
                        case 504:
                        case 520:
                        case 521:
                            new RoKA.ErrorScreen(RoKA.Application.commentSection, RoKA.ErrorState.OVERLOAD);
                            break;
                        default:
                            new RoKA.ErrorScreen(RoKA.Application.commentSection, RoKA.ErrorState.REDDITERROR, response);
                    }
                }
            }
        }
        Reddit.Request = Request;
    })(Reddit = RoKA.Reddit || (RoKA.Reddit = {}));
})(RoKA || (RoKA = {}));
/// <reference path="../index.ts" />
/**
    * Namespace for requests to the Reddit API operations.
    * @namespace RoKA.Reddit
*/
var RoKA;
(function (RoKA) {
    var Reddit;
    (function (Reddit) {
        /**
            * Perform a request to Reddit to submit a comment.
            * @class CommentRequest
            * @param thing The Reddit ID of the item the user wants to comment on.
            * @param comment A markdown string containing the user's comment
            * @param callback Callback handler for the event when loaded.
        */
        "use strict";
        class CommentRequest {
            constructor(thing, comment, callback) {
                let url = "https://api.reddit.com/api/comment";
                new RoKA.HttpRequest(url, RoKA.RequestType.POST, callback, {
                    "uh": RoKA.Preferences.getString("redditUserIdentifierHash"),
                    "thing_id": thing,
                    "text": comment,
                    "api_type": "json"
                });
            }
        }
        Reddit.CommentRequest = CommentRequest;
    })(Reddit = RoKA.Reddit || (RoKA.Reddit = {}));
})(RoKA || (RoKA = {}));
/// <reference path="../index.ts" />
/**
    * Namespace for requests to the Reddit API operations.
    * @namespace RoKA.Reddit
*/
var RoKA;
(function (RoKA) {
    var Reddit;
    (function (Reddit) {
        /**
            Perform a request to Reddit to edit an existing comment.
            @class EditCommentRequest
            @param thing The Reddit ID of the item the user wants edit.
            @param comment A markdown string containing the user's new comment
            @param callback Callback handler for the event when loaded.
        */
        "use strict";
        class EditCommentRequest {
            constructor(thing, comment, callback) {
                let url = "https://api.reddit.com/api/editusertext";
                new RoKA.HttpRequest(url, RoKA.RequestType.POST, callback, {
                    "uh": RoKA.Preferences.getString("redditUserIdentifierHash"),
                    "thing_id": thing,
                    "text": comment,
                    "api_type": "json"
                });
            }
        }
        Reddit.EditCommentRequest = EditCommentRequest;
    })(Reddit = RoKA.Reddit || (RoKA.Reddit = {}));
})(RoKA || (RoKA = {}));
/// <reference path="../index.ts" />
/**
    * Namespace for requests to the Reddit API operations.
    * @namespace RoKA.Reddit
*/
var RoKA;
(function (RoKA) {
    var Reddit;
    (function (Reddit) {
        /**
            Perform a request to Reddit to either save or unsave an item.
            @class RedditVoteRequest
            @param thing The Reddit ID of the item the user wants to vote on
            @param type Whether the user wants to upvote, downvote, or remove their vote.
            @param callback Callback handler for the event when loaded.
        */
        "use strict";
        class VoteRequest {
            constructor(thing, type, callback) {
                let url = "https://api.reddit.com/api/vote";
                new RoKA.HttpRequest(url, RoKA.RequestType.POST, callback, {
                    "uh": RoKA.Preferences.getString("redditUserIdentifierHash"),
                    "id": thing,
                    "dir": type
                });
            }
        }
        Reddit.VoteRequest = VoteRequest;
        var Vote;
        (function (Vote) {
            Vote[Vote["UPVOTE"] = 1] = "UPVOTE";
            Vote[Vote["DOWNVOTE"] = -1] = "DOWNVOTE";
            Vote[Vote["REMOVE"] = 0] = "REMOVE";
        })(Vote = Reddit.Vote || (Reddit.Vote = {}));
    })(Reddit = RoKA.Reddit || (RoKA.Reddit = {}));
})(RoKA || (RoKA = {}));
/// <reference path="../index.ts" />
/**
    * Namespace for requests to the Reddit API operations.
    * @namespace RoKA.Reddit
*/
var RoKA;
(function (RoKA) {
    var Reddit;
    (function (Reddit) {
        /**
            Report a post or comment to moderators.
            @class RedditReport
            @param thing The Reddit ID of the item you wish to report.
            @param commentThread CommentThread object representing the container of the comment.
            @param isThread Whether the thing being reported is an entire thread.
        */
        "use strict";
        class Report {
            constructor(thing, commentThread, isThread) {
                let reportTemplate = RoKA.Application.getExtensionTemplateItem(commentThread.commentSection.template, "report");
                this.reportContainer = reportTemplate.querySelector(".at_report");
                /* Set localisation text for the various report reasons */
                var report_options = [
                    "spam",
                    "vote_manipulation",
                    "personal_information",
                    "sexualising_minors",
                    "breaking_reddit",
                    "other"
                ];
                report_options.forEach(function (reportOption) {
                    document.querySelector(`label[for='report_${reportOption}']`).textContent = RoKA.Application.localisationManager.get("report_dialog_" + reportOption);
                });
                /* Set localisation text for the submit button */
                let submitButton = this.reportContainer.querySelector(".at_report_submit");
                submitButton.appendChild(document.createTextNode(RoKA.Application.localisationManager.get("report_dialog_button_submit")));
                /* Set localisation text for the cancel button */
                let cancelButton = this.reportContainer.querySelector(".at_report_cancel");
                cancelButton.appendChild(document.createTextNode(RoKA.Application.localisationManager.get("report_dialog_button_cancel")));
                /* Assign an event listener to all the buttons, checking if the one that is being selected is the "other" button.
                If so, re-enable the "other reason" text field, if not, disable it. */
                let reportOtherButton = this.reportContainer.querySelector("#report_other");
                let reportOtherField = this.reportContainer.querySelector("#report_otherfield");
                var radioButtonControllers = this.reportContainer.querySelectorAll("input[type=radio]");
                for (let i = 0, len = radioButtonControllers.length; i < len; i += 1) {
                    radioButtonControllers[i].addEventListener("change", function () {
                        if (reportOtherButton.checked) {
                            reportOtherField.disabled = false;
                        }
                        else {
                            reportOtherField.disabled = true;
                        }
                    }, false);
                }
                /* Submit button click event. Check if the currently selected radio button is the "other" button, if so retrieve it's text
                field value. If not, use the value from whatever radio button is selected.  */
                submitButton.addEventListener("click", function () {
                    let activeRadioButton = this.getCurrentSelectedRadioButton();
                    let reportReason = "";
                    let otherReason = "";
                    if (activeRadioButton) {
                        if (activeRadioButton === reportOtherButton) {
                            reportReason = "other";
                            otherReason = reportOtherField.value;
                        }
                        else {
                            reportReason = activeRadioButton.firstChild.innerHTML;
                        }
                    }
                    /* Send the report to Reddit*/
                    new RoKA.HttpRequest("https://api.reddit.com/api/report", RoKA.RequestType.POST, function () {
                        var threadCollection, i, len, tabContainer, comment;
                        if (isThread) {
                            /* If the "thing" that was reported was a thread, we will iterate through the thread collection to find it, and
                            delete it, effectively hiding it. We will then force a redraw of the tab container, selecting the first tab in
                            the list.  */
                            threadCollection = commentThread.commentSection.threadCollection;
                            for (i = 0, len = threadCollection.length; i < len; i += 1) {
                                if (threadCollection[i].name === commentThread.threadInformation.name) {
                                    threadCollection.splice(i, 1);
                                    commentThread.commentSection.clearTabsFromTabContainer();
                                    tabContainer = document.getElementById("at_tabcontainer");
                                    commentThread.commentSection.insertTabsIntoDocument(tabContainer, 0);
                                    commentThread.commentSection.downloadThread(threadCollection[0]);
                                    break;
                                }
                            }
                        }
                        else {
                            /* If the "thing" that was reported was a comment, we will locate it on the page and delete it from DOM,
                            effectively hiding it. */
                            comment = document.querySelector(`article[data-reddit-id='${thing.substring(3)}']`);
                            if (comment) {
                                comment.parentNode.removeChild(comment);
                            }
                        }
                    }, {
                        "api_type": "json",
                        "reason": reportReason,
                        "other_reason": otherReason,
                        "thing_id": thing,
                        "uh": RoKA.Preferences.getString("redditUserIdentifierHash")
                    });
                }, false);
                /* Cancel event listener, will merely just get rid of the report screen. */
                cancelButton.addEventListener("click", function () {
                    this.reportContainer.parentNode.removeChild(this.reportContainer);
                }, false);
                /* Append the report screen to the appropriate location. */
                if (isThread) {
                    let parentContainer = document.querySelector("header .info");
                    parentContainer.appendChild(this.reportContainer);
                }
                else {
                    let commentApplication = document.querySelector(`article[data-reddit-id='${thing.substring(3)}'] .at_commentApplication`);
                    commentApplication.appendChild(this.reportContainer);
                }
            }
            /* Method to iterate through the radio buttons and get the one with a selected (checked) status. */
            getCurrentSelectedRadioButton() {
                var radioButtonControllers = this.reportContainer.querySelectorAll("input[type=radio]");
                for (var i = 0, len = radioButtonControllers.length; i < len; i += 1) {
                    if (radioButtonControllers[i].checked) {
                        return radioButtonControllers[i];
                    }
                }
                return null;
            }
        }
        Reddit.Report = Report;
    })(Reddit = RoKA.Reddit || (RoKA.Reddit = {}));
})(RoKA || (RoKA = {}));
/// <reference path="../index.ts" />
/**
    * Namespace for requests to the Reddit API operations.
    * @namespace RoKA.Reddit
*/
var RoKA;
(function (RoKA) {
    var Reddit;
    (function (Reddit) {
        /**
            Perform a request to Reddit to either save or unsave an item.
            @class RedditSaveRequest
            @param thing The Reddit ID of the item to either save or unsave
            @param type Whether to save or unsave
            @param callback Callback handler for the event when loaded.
        */
        "use strict";
        class SaveRequest {
            constructor(thing, type, callback) {
                let url = "https://api.reddit.com/api/" + SaveType[type].toLowerCase();
                new RoKA.HttpRequest(url, RoKA.RequestType.POST, callback, {
                    "uh": RoKA.Preferences.getString("redditUserIdentifierHash"),
                    "id": thing
                });
            }
        }
        Reddit.SaveRequest = SaveRequest;
        var SaveType;
        (function (SaveType) {
            SaveType[SaveType["SAVE"] = 0] = "SAVE";
            SaveType[SaveType["UNSAVE"] = 1] = "UNSAVE";
        })(SaveType = Reddit.SaveType || (Reddit.SaveType = {}));
    })(Reddit = RoKA.Reddit || (RoKA.Reddit = {}));
})(RoKA || (RoKA = {}));
/// <reference path="../index.ts" />
/**
    * Namespace for requests to the Reddit API operations.
    * @namespace RoKA.Reddit
*/
var RoKA;
(function (RoKA) {
    var Reddit;
    (function (Reddit) {
        /**
            Perform a request to Reddit asking for the user's username so we can save and display it.
            @class RetreiveUsernameRequest
        */
        "use strict";
        class RetreiveUsernameRequest {
            constructor() {
                let url = "https://api.reddit.com/api/me.json";
                new RoKA.HttpRequest(url, RoKA.RequestType.GET, function (responseText) {
                    let responseData = JSON.parse(responseText);
                    RoKA.Preferences.set("username", responseData.data.name);
                    /* If possible we should set the username retroactively so the user doesn't need to reload the page */
                    let usernameField = document.querySelector(".at_writingauthor");
                    if (usernameField) {
                        usernameField.textContent = RoKA.Application.localisationManager.get("commentfield_label_author", [RoKA.Preferences.getString("username")]);
                    }
                });
            }
        }
        Reddit.RetreiveUsernameRequest = RetreiveUsernameRequest;
    })(Reddit = RoKA.Reddit || (RoKA.Reddit = {}));
})(RoKA || (RoKA = {}));
"use strict";
function at_initialise() {
    if (window.top === window) {
        new RoKA.Application();
    }
}
if (document.readyState === "complete" || document.readyState === "interactive") {
    at_initialise();
}
else {
    document.addEventListener("DOMContentLoaded", at_initialise, false);
}
