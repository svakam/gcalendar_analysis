// popup.js
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
const CLIENT_ID = "<YOUR_CLIENT_ID>.apps.googleusercontent.com";
const API_KEY = "<YOUR_API_KEY>";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

document.getElementById("authorize").addEventListener("click", handleAuthClick);

function handleAuthClick() {
  gapi.load("client:auth2", initClient);
}

function initClient() {
  gapi.client
    .init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    })
    .then(() => {
      const authInstance = gapi.auth2.getAuthInstance();

      if (!authInstance.isSignedIn.get()) {
        authInstance.signIn();
      }

      listCalendars();
    });
}

async function listCalendars() {
  const response = await gapi.client.calendar.calendarList.list();
  const calendars = response.result.items;

  let allEvents = [];

  for (const cal of calendars) {
    const eventsResponse = await gapi.client.calendar.events.list({
      calendarId: cal.id,
      timeMin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // last 7 days
      timeMax: new Date().toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = eventsResponse.result.items;

    allEvents.push({
      calendar: cal.summary,
      events: events.map((e) => ({
        summary: e.summary,
        start: e.start.dateTime || e.start.date,
        end: e.end.dateTime || e.end.date,
      })),
    });
  }

  document.getElementById("output").textContent = JSON.stringify(allEvents, null, 2);
}