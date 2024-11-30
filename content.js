const uiStyle = `
    #adblock-ui {
        display: none;
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: rgba(18, 18, 18, 0.9);
        color: #00BFFF;
        padding: 20px;
        border-radius: 15px;
        z-index: 9999;
        font-family: 'Arial', sans-serif;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.7);
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        width: 300px;
    }
    #adblock-ui.show {
        display: block;
    }
    #adblock-ui h3 {
        margin: 0;
        font-size: 22px;
        font-weight: bold;
        text-align: center;
        padding-bottom: 10px;
    }
    #adblock-ui p {
        margin: 5px 0;
        font-size: 16px;
        text-align: center;
        color: #B0C4DE;
    }
    #adblock-ui.clickable {
        cursor: pointer;
    }
`;

(() => {
    const uiDiv = document.createElement('div');
    uiDiv.id = 'adblock-ui';
    uiDiv.classList.add('clickable');
    uiDiv.innerHTML = `
        <h3>Toddys Adblock</h3>
        <p>Made by mushroom0162</p>
        <p>Universal adblock Disabled (WIP)</p>
        <p>Static filters enabled</p>
        <p>YouTube adblock enabled</p>
    `;
    document.head.insertAdjacentHTML('beforeend', `<style>${uiStyle}</style>`);
    document.body.appendChild(uiDiv);
    uiDiv.addEventListener('click', () => {
        uiDiv.classList.toggle('show');
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "toggleUI") {
            uiDiv.classList.toggle('show');
            sendResponse({ status: "success" });
        }
    });

    const selectors = new Set([
        '.ytp-ad-module',
        '.ytp-ad-overlay',
        '.ytp-ad-skip-button',
        '.ytp-large-ad-preview',
        '.ytp-ad-progress',
        '.ytp-popup-ad',
        'ytd-promoted-sparkles-web-renderer',
        'ytd-display-ad-renderer',
        'ytd-promoted-video-renderer',
        '[data-ad-type]',
        '#main #advertisement',
        '.ytp-ce-element-show',
        '.ytp-ce-element',
        '.ytp-cards-button-icon-default',
        '.ytp-sponsorship-banner',
        '.ad-container',
        '.sponsored-content',
        '.video-sponsor'
    ]);

    // Create a style tag to hide ads directly using CSS
    const adBlockStyle = document.createElement('style');
    document.head.appendChild(adBlockStyle);
    selectors.forEach(selector => {
        adBlockStyle.appendChild(document.createTextNode(`${selector} { display: none !important; }\n`));
    });

    // Function to remove ads efficiently
    const removeAds = (nodes) => {
        nodes.forEach(node => {
            if (node instanceof HTMLElement) {
                if (node.matches('.ytp-ad-module')) {
                    node.style.display = 'none';
                    node.classList.add('ytp-ad-module-hidden');
                } else if (node.matches('.ytp-ad-overlay')) {
                    node.style.display = 'none';
                    node.classList.add('ytp-ad-overlay-hidden');
                } else {
                    for (const selector of selectors) {
                        if (node.matches(selector)) {
                            node.remove(); // Remove the ad immediately
                            break;
                        }
                    }
                }
            }
        });
    };

    // Set up MutationObserver
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
                removeAds(Array.from(mutation.addedNodes)); // Check and remove any new nodes
            }
        });
    });

    // Start observing the body
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial cleanup of existing ads
    removeAds(Array.from(document.querySelectorAll(Array.from(selectors).join(', '))));

    // XHR filtering
    const filterXHRResponses = () => {
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        const originalXhrSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url) {
            this._url = url; 
            return originalXhrOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function() {
            const xhr = this;

            xhr.addEventListener('load', function() {
                try {
                    const urlPatterns = [
                        /youtube\.com\/(get_video_info|youtubei\/v1\/player)\?/,
                        /\/(playlist\?list=|\/player(?:\?.+)?|watch\?[tv]=)/
                    ];

                    if (urlPatterns.some(pattern => pattern.test(xhr._url))) {
                        const responseJSON = JSON.parse(xhr.responseText);
                        
                        // Remove ads from the response
                        const adProperties = ['adPlacements', 'playerAds', 'adSlots'];
                        adProperties.forEach(prop => {
                            if (responseJSON.playbackContext) {
                                delete responseJSON.playbackContext[prop];
                            }
                            if (responseJSON.playerResponse) {
                                delete responseJSON.playerResponse[prop];
                            }
                        });

                        // Filter adaptive formats for streaming data
                        if (responseJSON.streamingData) {
                            responseJSON.streamingData.adaptiveFormats = responseJSON.streamingData.adaptiveFormats.filter(format => !/^(?:audio|video)\//.test(format.mimeType));
                        }

                        xhr.responseText = JSON.stringify(responseJSON);
                    }
                } catch (e) {
                    console.error("Error processing response:", e);
                }
            });

            return originalXhrSend.apply(this, arguments);
        };
    }

    filterXHRResponses();

    const cleanup = () => {
        observer.disconnect(); 
        adBlockStyle.remove(); 
        uiDiv.remove(); 
    };

    window.addEventListener('unload', cleanup);
})();
