self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  // Allow requests to the asset bundle server to pass through
  if (url.hostname === 'prod-alchemy.web.stumbleguys.com') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Intercept the main configuration request and provide the correct data
  if (url.href === 'https://fenrir-resolver-spacetime.aprod.scopely.io/v1/apps/a048f939-8c5d-4bf2-8a11-bedeade637ed/configuration') {
    const configData = [
      {
        "id": "8aa21441-7457-4b23-aff2-695cb7deb5a3",
        "key": "playtime_timeperiod_in_days",
        "value": "3",
        "configType": "AnalyticsConfig",
        "tags": [],
        "version": 1,
        "description": "Playtime 3 days"
      },
      {
        "id": "f5612a13-ba2f-453a-a88e-761d3f1fb29b",
        "key": "explicit_context_sampling",
        "value": "0.0",
        "configType": "AnalyticsConfig",
        "tags": [],
        "version": 1,
        "description": "Explicit Context disabled"
      },
      {
        "id": "4d85acb0-f680-4840-81e8-f6901294b03f",
        "key": "gcp_collector_sampling",
        "value": "0.0",
        "configType": "AnalyticsConfig",
        "tags": [],
        "version": 0,
        "description": "GCP Collector disabled"
      },
      {
        "id": "816aabec-6f33-4d09-bf69-6eaa254243d3",
        "key": "playtime_thresholds_in_minutes",
        "value": "[30,60,72]",
        "configType": "AnalyticsConfig",
        "tags": [],
        "version": 2,
        "description": "Thresholds at 30, 60 & 72 minutes"
      },
      {
        "id": "41bec0a3-efcf-403a-b76b-554bcf0d1961",
        "key": "track_device_properties_sampling",
        "value": "1.0",
        "configType": "AnalyticsConfig",
        "tags": [],
        "version": 0,
        "description": "Track device properties enabled"
      }
    ];

    event.respondWith(new Response(JSON.stringify(configData), {
      headers: { 'Content-Type': 'application/json' }
    }));
    return;
  }

  // Continue to provide empty responses for other API calls
  if (url.hostname.endsWith('scopely.io') || url.hostname.endsWith('stumbleguys.com')) {
    event.respondWith(new Response('{}', {
      headers: { 'Content-Type': 'application/json' }
    }));
    return;
  }

  // Let all other requests pass through
  event.respondWith(fetch(event.request));
});