/// <reference path="Utilities.ts" />
/// <reference path="HttpRequest.ts" />
/**
    * Namespace for All RoKA operations.
    * @namespace RoKA
*/
module RoKA {
    /**
        * Starts a new instance of the Localisation Manager, for handling language.
        * @class LocalisationManager
        * @param [callback] a callback method to be called after the localisation files has been loaded.
    */
    "use strict";
    export class LocalisationManager {
        private localisationData: any;
        private supportedLocalisations = [
            'en',
            'en-US',
            'no',
            'es',
            'fr'
        ];

        constructor(callback?) {
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
        public get(key: string, placeholders?: Array<string>) {
            switch (Utilities.getCurrentBrowser()) {
                case Browser.CHROME:
                    if (placeholders) {
                        return chrome.i18n.getMessage(key, placeholders);
                    } else {
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
        public getWithLocalisedPluralisation(key : string, value : number) {
            if (value > 1 || value === 0) {
                return this.get(`${key}_plural`);
            } else {
                return this.get(key);
            }
        }
    }
}
