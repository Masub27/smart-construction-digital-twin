# Smart Construction Site Fault-to-Decision Digital Twin

Browser-based Industry 5.0 TVET laboratory for hidden construction-fault investigation.

## Features

- Animated construction site
- Eight virtual ESP32-ready sensors
- Eight hidden fault scenarios
- Sequential Site Engineer, Safety Officer, and Sustainability & Cost consultations
- Human-led diagnosis and corrective action
- Competence scoring and event log
- Responsive GitHub Pages design
- Moving crane, trolley, load, mixer, excavator, workers, lift and inspection drone
- Visual fault effects, clickable sensor hotspots and rolling 60-second charts
- Engineering-impact forecast and fullscreen guided conference demonstration
- Live Magdeburg weather context with 15-minute automatic refresh and cached fallback
- Transparent separation of live external, derived, virtual and future ESP32 measurements

## UNESCO conference demonstration

1. Open the site in a modern browser.
2. Select **Conference Demo** in the header.
3. The guided story injects crane instability, shows changing telemetry and consults all three agents one by one.
4. Select **Stop Demo** at any time to return to manual laboratory use.

Impact figures are illustrative training estimates, not commercial engineering forecasts.

## Live data modes

The default hybrid mode retrieves regional Magdeburg temperature, humidity, precipitation, wind speed, gust and direction without an API key. Weather affects the normal virtual construction baseline. The interface clearly labels public weather as live external data; site strain, crane tilt, dust, concrete and electrical readings remain virtual or weather-derived until physical ESP32 channels are connected.

Select **Fully simulated laboratory** from the data-mode menu when an internet connection is unavailable. The application retains the last valid weather packet in the browser and refreshes live mode every 15 minutes.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Publish

Publish the repository root using GitHub Pages from the `main` branch.
