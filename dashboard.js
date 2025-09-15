// Load events from storage and render charts
chrome.storage.local.get("events", ({ events }) => {
  if (!events || events.length === 0) {
    document.body.insertAdjacentHTML("beforeend", "<p>No events found. Fetch from popup first.</p>");
    return;
  }

  const eventsByCalendar = {};
  const hoursByCalendar = {};

  events.forEach(e => {
    eventsByCalendar[e.calendar] = (eventsByCalendar[e.calendar] || 0) + 1;
    if (e.duration) {
      hoursByCalendar[e.calendar] = (hoursByCalendar[e.calendar] || 0) + e.duration;
    }
  });

  new Chart(document.getElementById("eventsByCalendar"), {
    type: "bar",
    data: {
      labels: Object.keys(eventsByCalendar),
      datasets: [{
        label: "Events by Calendar",
        data: Object.values(eventsByCalendar),
        backgroundColor: "rgba(75, 192, 192, 0.6)"
      }]
    }
  });

  new Chart(document.getElementById("hoursByCalendar"), {
    type: "pie",
    data: {
      labels: Object.keys(hoursByCalendar),
      datasets: [{
        label: "Hours by Calendar",
        data: Object.values(hoursByCalendar),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"]
      }]
    }
  });
});

// Export CSV from dashboard
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