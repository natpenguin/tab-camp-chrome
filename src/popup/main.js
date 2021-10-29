let debugConsole = document.querySelector('#debug-console');
function output_console(o) {
    let div = document.createElement('div');
    div.innerText = JSON.stringify(o);
    debugConsole.appendChild(div);
}

let listTabs = document.querySelector('#list-tabs');
let pushButton = document.querySelector('#push-stack');
let clearButton = document.querySelector('#clear-stack');

function openAllUrls(urls) {
    for (let url of urls) {
        chrome.tabs.create({url: url}, function () {});
    }
}

function removeTabs(tabs) {
    chrome.tabs.remove(tabs.map(t => t.id), function () {});
}

function addCurrentTabStackToStorage() {
    chrome.tabs.query({currentWindow: true}, function (tabs) {
        let titles = tabs.map(t => t.title);
        let key = titles.join(' / ');
        let urls = tabs.map(t => t.url);
        chrome.storage.local.get('stack', function (result) {
            var targetObj;
            if (result.stack) {
                targetObj = result.stack;
            } else {
                targetObj = {};
            }
            targetObj[key] = {
                titles: titles,
                urls: urls
            };
            chrome.storage.local.set({stack: targetObj}, function (result) {
                if (chrome.runtime.lastError) {
                    window.alert('Failure to set the tabs...');
                }
            });
        });
    });
}

function appendStackContent(title, urls) {
    if (title === null || urls === null) {
        return;
    }
    let contentButton = document.createElement("button");
    contentButton.innerText = title;
    contentButton.type = "button";
    contentButton.onclick = () => {
        let urls_inner = urls;
        chrome.tabs.query({}, function (tabs) {
            // To open all of urls selected.
            openAllUrls(urls_inner);
            removeTabs(tabs);
        });
    };
    contentButton.setAttribute("class", "list-group-item list-group-item-action");

    let buttonsContainer = document.createElement("div");
    let deleteButton = document.createElement("button");
    deleteButton.innerHTML = "<svg class=\"bi bi-x\" width=\"1em\" height=\"1em\" viewBox=\"0 0 16 16\" fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
        "  <path fill-rule=\"evenodd\" d=\"M11.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708-.708l7-7a.5.5 0 0 1 .708 0z\"/>\n" +
        "  <path fill-rule=\"evenodd\" d=\"M4.146 4.146a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708l-7-7a.5.5 0 0 0-.708 0z\"/>\n" +
        "</svg>"
    deleteButton.onclick = () => {
        if (window.confirm("Do you want to delete this item?")) {
            chrome.storage.local.get('stack', function (result) {
                if (result.stack) {
                    let targetObj = result.stack;
                    targetObj[title] = null;
                    chrome.storage.local.set({stack: targetObj}, function (result) {
                        if (chrome.runtime.lastError) {
                            window.alert('Failure to set the tabs...');
                        }
                    });
                }
            });
        }
    };
    deleteButton.setAttribute("class", "close");

    buttonsContainer.appendChild(contentButton);
    buttonsContainer.appendChild(deleteButton);
    listTabs.appendChild(buttonsContainer);
}

function displayStack() {
    Array.from(listTabs.children).forEach(e => e.remove());
    chrome.storage.local.get('stack', function (result) {
        for (let key in result.stack) {
            if (result.stack[key]) {
                appendStackContent(key, result.stack[key].urls);
            }
        }
    });
}
displayStack();
chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === "local") {
        displayStack();
    }
});

pushButton.onclick = function (e) {
    addCurrentTabStackToStorage();
};

clearButton.onclick = function (e) {
    if (window.confirm("Do you want to clear all of items on list of tabs?")) {
        chrome.storage.local.set({ stack: null });
        Array.from(debugConsole.children).forEach(e => e.remove());
    }
};
