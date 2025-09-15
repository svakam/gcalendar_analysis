# Google Calendar Analysis (in development)

An analysis tool for personal Google Calendars. 

[workflow image]

## Workflow
1. Authentication and authorization
2. App makes API call to Google Calendar API
3. Collect returned response containing user calendar data 
4. Analyze data
5. Output data file
6. Interpret data file via embedded Tableau dashboard

### API call + user calendar analysis
- Get all calendars 
- Get all events in calendar 
- Count # of hours in each event per calendar

## Tools
- JavaScript/HTML
- Google Calendar API
- Google Chrome Extension API

## Libraries
- Google OAuth2
  - Credentials
- Google Auth
  - Request
  - Flow/InstalledAppFlow