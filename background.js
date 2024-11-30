const adBlockerRules = [
    /.*doubleclick\.net.*/,
    /.*googleadservices\.com.*/,
    /.*youtube\.com\/ads.*/,
    /.*ytimg\.com\/yts\/imgbin.*/,
    /.*amazon-adsystem\.com.*/,
    /.*aax\.amazon-adsystem\.com.*/,
    /.*adtago\.s3\.amazonaws\.com.*/,
    /.*analyticsengine\.s3\.amazonaws\.com.*/,
    /.*analytics\.s3\.amazonaws\.com.*/,
    /.*advice-ads\.s3\.amazonaws\.com.*/,
    /.*googlesyndication\.com.*/,
    /.*adcolony\.com.*/,
    /.*adc3\.com.*/,
    /.*media\.net.*/,
    /.*hotjar\.com.*/,
    /.*static\.hotjar\.com.*/,
    /.*google-analytics\.com.*/,
    /.*analytics\.google\.com.*/,
    /.*mouseflow\.com.*/,
    /.*luckyorange\.com.*/,
    /.*upload\.luckyorange\.net.*/,
    /.*cs\.luckyorange\.net.*/,
    /.*settings\.luckyorange\.net.*/,
    /.*fbcdn\.net.*/,
    /.*bugsnag\.com.*/,
    /.*sentry\.io.*/,
    /.*freshmarketer\.com.*/,
    /.*claritybt\.freshmarketer\.com.*/,
    /.*fwtracks\.freshmarketer\.com.*/,
    /.*ad\.js.*/,
    /.*pagead\.js.*/,
    /.*ads\.js.*/,
    /.*advertisement\.js.*/,
    /.*adloader\.js.*/,
    /.*adscript\.js.*/,
    /.*adsbygoogle\.js.*/,
    /.*adservice\.js.*/,
    /.*adservice\.google\.com.*/,
    /.*click\.googleanalytics\.com.*/,
    /.*stats\.wp\.com.*/,
    /.*browser\.sentry-cdn\.com.*/,
    /.*app\.getsentry\.com.*/,
    /.*log\.byteoversea\.com.*/,
    /.*events\.redditmedia\.com.*/,
    /.*ads\.linkedin\.com.*/,
    /.*analytics\.pointdrive\.linkedin\.com.*/,
    /.*extmaps-api\.yandex\.net.*/,
    /.*offerwall\.yandex\.net.*/,
    /.*adtech\.yahooinc\.com.*/,
    /.*static\.ads-twitter\.com.*/,
    /.*bdapi-ads\.realmemobile\.com.*/,
    /.*bdapi-in-ads\.realmemobile\.com.*/,
    /.*adsfs\.oppomobile\.com.*/,
    /.*adx\.ads\.oppomobile\.com.*/,
    /.*ck\.ads\.oppomobile\.com.*/,
    /.*data\.ads\.oppomobile\.com.*/,
    /.*tracking\.rus\.miui\.com.*/,
    /.*click\.oneplus\.cn.*/,
    /.*metrics\.data\.hicloud\.com.*/,
    /.*metrics2\.data\.hicloud\.com.*/,
    /.*grs\.hicloud\.com.*/,
    /.*logservice\.hicloud\.com.*/,
    /.*logservice1\.hicloud\.com.*/,
    /.*logbak\.hicloud\.com.*/,
    /.*metrics\.icloud\.com.*/,
    /.*metrics\.mzstatic\.com.*/,
    /.*samsung-com\.112\.2o7\.net.*/,
    /.*analytics-api\.samsunghealthcn\.com./,
];

// Auto-collect garbage every 5 minutes
setInterval(() => {
    if (typeof gc === 'function') gc(); // Only call gc if turned on
}, 5 * 60 * 1000); // Set to 5 minutes
// Register the web request listener to block ads
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        for (const regex of adBlockerRules) {
            if (regex.test(details.url)) {
                return { cancel: true }; // Cancel the request if it matches
            }
        }
        return { cancel: false };
    },
    { urls: ["<all_urls>"] }, // Listen to all URLs
    ["blocking"]
);

chrome.browserAction.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "toggleUI" });
});
