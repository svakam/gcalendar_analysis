// Handle Google login
document.getElementById("login").addEventListener("click", () => {
  chrome.identity.launchWebAuthFlow(
    {
      url: "https://accounts.google.com/o/oauth2/auth?" +
        new URLSearchParams({
          client_id: "YOUR_CLIENT_ID.apps.googleusercontent.com",
          response_type: "token",
          redirect_uri: chrome.identity.getRedirectURL(),
          scope: "https://www.googleapis.com/auth/calendar.readonly"
        }),
      interactive: true
    },
    (redirectUrl) => {
      if (chrome.runtime.lastError || !redirectUrl) {
        document.getElementById("status").innerText =
          "Login failed: " + chrome.runtime.lastError.message;
        return;
      }

      // Extract access token from redirectUrl
      const params = new URL(redirectUrl).hash.substring(1);
      const accessToken = new URLSearchParams(params).get("access_token");

      if (accessToken) {
        chrome.storage.local.set({ accessToken }, () => {
          document.getElementById("status").innerText = "Login successful!";
        });
      }
    }
  );
});

// Fetch events from Google Calendar
document.getElementById("fetch").addEventListener("click", async () => {
  chrome.storage.local.get("accessToken", async ({ accessToken }) => {
    if (!accessToken) {
      document.getElementById("status").innerText =
        "Please login first.";
      return;
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const timeMin = oneWeekAgo.toISOString();
    const timeMax = now.toISOString();

    try {
      // Get list of calendars
      const calendarRes = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
        { headers: { Authorization: "Bearer " + accessToken } }
      );
      const calendarData = await calendarRes.json();

      let allEvents = [];

      for (const cal of calendarData.items) {
        const eventsRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
            cal.id
          )}/events?` +
            new URLSearchParams({
              timeMin,
              timeMax,
              singleEvents: "true",
              orderBy: "startTime"
            }),
          { headers: { Authorization: "Bearer " + accessToken } }
        );

        const eventsData = await eventsRes.json();
        const events = eventsData.items || [];

        for (const event of events) {
          const start = event.start.dateTime || event.start.date;
          const end = event.end.dateTime || event.end.date;

          // Calculate duration
          let durationHours = null;
          try {
            const startDate = new Date(start);
            const endDate = new Date(end);
            durationHours = (endDate - startDate) / (1000 * 60 * 60);
          } catch (e) {
            durationHours = null;
          }

          allEvents.push({
            calendar: cal.summary,
            summary: event.summary || "(No title)",
            start,
            end,
            duration: durationHours
          });
        }
      }

      chrome.storage.local.set({ events: allEvents }, () => {
        document.getElementById("status").innerText =
          `Fetched ${allEvents.length} events.`;

        const eventsList = document.getElementById("events");
        eventsList.innerHTML = "";
        allEvents.forEach((e) => {
          const li = document.createElement("li");
          li.textContent = `[${e.calendar}] ${e.summary} (${e.start} → ${e.end})`;
          eventsList.appendChild(li);
        });
      });
    } catch (err) {
      document.getElementById("status").innerText =
        "Error fetching events: " + err.message;
    }
  });
});

// Export events as CSV
document.getElementById("export").addEventListener("click", () => {
  chrome.storage.local.get("events", ({ events }) => {
    if (!events || events.length === 0) {
      alert("No events to export!");
      return;
    }

    let csv = "Calendar,Summary,Start,End,Duration (hours)\n";
    events.forEach((event) => {
      csv += `"${event.calendar}","${event.summary}","${event.start}","${event.end}","${event.duration}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "calendar_events.csv";
    a.click();

    URL.revokeObjectURL(url);
  });
});