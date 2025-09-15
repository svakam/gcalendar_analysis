// Background handles auth + API fetch
function getCalendarEvents(callback) {
  chrome.identity.getAuthToken({ interactive: true }, function(token) {
    if (chrome.runtime.lastError) {
      console.error("Auth error:", chrome.runtime.lastError);
      callback(null);
      return;
    }

    console.log("Got token:", token);

    // Step 1: Get all calendars
    fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.items) {
          callback([]);
          return;
        }

        let allEvents = [];
        let pending = data.items.length;

        data.items.forEach(cal => {
          fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?maxResults=20&singleEvents=true&orderBy=startTime`,
            { headers: { Authorization: "Bearer " + token } }
          )
            .then(res => res.json())
            .then(events => {
              if (events.items) {
                allEvents.push({ calendar: cal.summary, events: events.items });
              }
            })
            .finally(() => {
              pending--;
              if (pending === 0) {
                callback(allEvents);
              }
            });
        });
      });
  });
}

// Listen for popup requests
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getEvents") {
    getCalendarEvents(events => {
      sendResponse({ events });
    });
    return true; // keep channel open for async
  }
});