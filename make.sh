#!/bin/bash
bold=$(tput bold)
standout=$(tput smso)
normal=$(tput sgr0)
green=$(tput setaf 2)
red=$(tput setaf 1)

abort() {
    echo
    echo
    printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' \#
    echo
    echo ${red}Operation failed${normal}
    echo
    echo
    exit 1
}

trap 'abort' 0
set -e

echo
if [ "$1" == "--debug" ]; then
    echo Compiling RoKA in ${standout}debug${normal} mode.
else
    echo Compiling RoKA in ${standout}production${normal} mode.
fi
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' \#
echo

echo ${standout}Removing old files${normal}
echo Removing TypeScript mapping folders.
rm -rf Chrome/TypeScript
# rm -rf Safari.safariextension/TypeScript
# rm -rf Firefox/data/TypeScript

echo Removing TypeScript code-mapping file.
rm -f Chrome/js/script.js.map
# rm -f Safari.safariextension/js/script.js.map
# rm -f Firefox/data/script.js.map
rm -f lib/script.js.map
rm -f lib/script-es5.js.map

echo Removing options page TypeScript code-mapping file.
rm -f Chrome/js/options.js.map
# rm -f Safari.safariextension/js/options.js.map
# rm -f Firefox/data/options.js.map
rm -f lib/options.js.map
rm -f lib/options-es5.js.map

echo Removing SASS stylesheet code-mapping file.
rm -f Chrome/res/style.css.map
# rm -f Safari.safariextension/res/style.css.map
# rm -f Firefox/data/style.css.map
echo
echo

echo ${standout}Compiling SASS style files.${normal}
echo Compiling Main SASS stylesheet.
sass res/style.scss res/style.css
echo Compiling Options SASS stylesheet
sass res/options.scss res/options.css
echo
echo

echo ${standout}Copying static browser resources${normal}
echo Copying Chrome Resources
mkdir -p Chrome/res
mkdir -p Chrome/js
cp -fr res/redditbroken.svg Chrome/res
cp -fr res/redditoverload.svg Chrome/res
cp -fr res/redditblocked.svg Chrome/res
cp -fr res/icon128.png Chrome/res
cp -fr res/options.css Chrome/res
cp -fr lib/snuownd.js Chrome/js
echo
echo

echo ${standout}Updating Options HTML Page${normal}
cp -vf  options.html Chrome/res/options.html
echo
echo


echo ${standout}Compiling TypeScript Files.${normal}
if [ "$1" == "--debug" ]; then
    echo Compiling Options page TypeScript in ES5 compatibility mode without comments with source map.
    tsc --target ES5 --out lib/options-es5.js TypeScript/typings/es5-compatibility.ts TypeScript/Options/Options.ts --removeComments --sourcemap --allowUnreachableCode
    echo Compiling Application TypeScript in ES5 compatibility mode without comments with source map.
    tsc --target ES5 --out lib/script-es5.js TypeScript/typings/es5-compatibility.ts TypeScript/index.ts --removeComments --sourcemap --allowUnreachableCode

    echo Compiling Options page TypeScript file without comments with source map.
    tsc --target ES6 --out lib/options.js TypeScript/Options/Options.ts --removeComments --sourcemap --allowUnreachableCode
    echo Compiling Application TypeScript file without comments with source map.
    tsc --target ES6 --out lib/script.js TypeScript/index.ts --removeComments --sourcemap --allowUnreachableCode
else
    echo Compiling Options page TypeScript in ES5 compatibility mode with comments
    tsc --target ES5 --out lib/options-es5.js TypeScript/typings/es5-compatibility.ts TypeScript/Options/Options.ts --allowUnreachableCode
    echo Compiling Application page TypeScript in ES5 compatibility mode with comments.
    tsc --target ES5 --out lib/script-es5.js TypeScript/typings/es5-compatibility.ts TypeScript/index.ts --allowUnreachableCode

    echo Compiling Options page TypeScript file with comments.
    tsc --target ES6 --out lib/options.js TypeScript/Options/Options.ts --allowUnreachableCode
    echo Compiling Application page TypeScript file with comments.
    tsc --target ES6 --out lib/script.js TypeScript/index.ts --allowUnreachableCode
fi
echo
echo Copying TypeScript Files
cp -vf lib/options-es5.js Chrome/res/options.js
cp -vf lib/script-es5.js Chrome/js/script.js
echo
echo

echo ${standout}Copying Style Files${normal}
cp -vf res/style.css Chrome/res/style.css
echo

echo ${standout}Copying Template Files${normal}
cp -vf res/templates.html Chrome/res/templates.html
echo
echo

if [ "$1" == "--debug" ]; then
    echo ${standout}Copying Development Sourcemaps${normal}
    cp -vf lib/script.js.map Chrome/js/script.js.map
    cp -vf lib/options.js.map Chrome/js/options.js.map
    echo
    cp -vf res/style.css.map Chrome/res/style.css.map
    echo
    echo ${standout}Copying TypeScript source folders.${normal}
    cp -fr TypeScript Chrome/
    echo
    echo
fi

echo ${standout}Copying Localisation Files${normal}
echo Copying localisation files to Chrome
rsync -a --exclude=".*" _locales Chrome/

if [ "$1" == "--debug" ] && [[ "$OSTYPE" == "darwin"* ]]; then
    echo ${standout}Reloading Development Browsers${normal}
    osascript reload.scpt
fi

echo
echo
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' \#
echo
echo ${green}Operation completed sucessfully${normal}
echo
echo
trap : 0
