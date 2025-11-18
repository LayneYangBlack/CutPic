// content_interceptor.js

console.log("Temu API Interceptor Injected.");

const originalFetch = window.fetch;

window.fetch = function (url, options) {
  // We only care about the specific API endpoint
  const targetUrl = 'https://agentseller.temu.com/mms/venom/api/supplier/purchase/manager/querySubOrderList';

  // Let all other fetch requests go through as normal
  if (typeof url !== 'string' || !url.includes(targetUrl)) {
    return originalFetch.apply(this, arguments);
  }

  // For the target request, we want to intercept the response
  console.log('Interceptor: Found target API call to', url);

  // Make the original fetch call and get the promise for the response
  const fetchPromise = originalFetch.apply(this, arguments);

  // Intercept the response
  fetchPromise.then(response => {
    // Clone the response because the body can only be read once
    const clonedResponse = response.clone();

    // Process the cloned response to get the data
    clonedResponse.json().then(data => {
      console.log('Interceptor: Captured data from API.', data);
      // Send the captured data to our extension's other parts (e.g., side panel)
      chrome.runtime.sendMessage({
        type: 'TEMU_API_DATA',
        payload: data
      });
    }).catch(err => {
      console.error('Interceptor: Error parsing JSON from response.', err);
    });
  }).catch(err => {
    console.error('Interceptor: Error in fetch promise.', err);
  });

  // Return the original, untouched promise to the web page's script
  // This is crucial for the page to function correctly.
  return fetchPromise;
};
