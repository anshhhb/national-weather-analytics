const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getWeatherReports() {
  const response = await fetch(
    `${API_BASE_URL}/api/weather-reports?pageSize=100`
    );

  if (!response.ok) {
    throw new Error(`Weather API request failed: ${response.status}`);
  }

  return response.json();
}

export async function getEventTypes() {
  const response = await fetch(`${API_BASE_URL}/api/config/event-types`);

  if (!response.ok) {
    throw new Error(`Event types request failed: ${response.status}`);
  }

  return response.json();
}

export async function getTrustLevels() {
  const response = await fetch(`${API_BASE_URL}/api/config/trust-levels`);

  if (!response.ok) {
    throw new Error(`Trust levels request failed: ${response.status}`);
  }

  return response.json();
}