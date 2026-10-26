
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const message = document.getElementById("message");
const weatherInfo = document.getElementById("weatherInfo");
const forecastSection = document.getElementById("forecastSection");

searchBtn.addEventListener("click", getWeather);

cityInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") getWeather();
});

async function getWeather() {
    const city = cityInput.value.trim();

    if (!city) {
        showMessage("Please enter a city name.");
        return;
    }

    showMessage("Loading weather...");
    weatherInfo.classList.add("hidden");
    forecastSection.classList.add("hidden");

    try {
        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        if (!geoResponse.ok) throw new Error();

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            showMessage("City not found. Try another city.");
            return;
        }

        const place = geoData.results[0];

        const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}` +
            `&longitude=${place.longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m` +
            `&hourly=temperature_2m,weather_code` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max` +
            `&timezone=auto&forecast_days=7`;

        const response = await fetch(url);
        if (!response.ok) throw new Error();

        const data = await response.json();
        const current = data.current;

        document.getElementById("cityName").textContent =
            `${place.name}, ${place.country}`;
        document.getElementById("temperature").textContent =
            `${Math.round(current.temperature_2m)}°C`;
        document.getElementById("humidity").textContent =
            `${current.relative_humidity_2m}%`;
        document.getElementById("wind").textContent =
            `${current.wind_speed_10m} km/h`;
        document.getElementById("description").textContent =
            getDescription(current.weather_code);
        document.getElementById("weatherIcon").textContent =
            getIcon(current.weather_code, current.is_day);

        document.getElementById("feelsLike").textContent =
            `${Math.round(current.apparent_temperature)}°C`;
        document.getElementById("sunrise").textContent =
            formatTime(data.daily.sunrise[0]);
        document.getElementById("sunset").textContent =
            formatTime(data.daily.sunset[0]);
        document.getElementById("uvIndex").textContent =
            data.daily.uv_index_max[0];

        displayHourly(data.hourly);
        displayDaily(data.daily);

        weatherInfo.classList.remove("hidden");
        forecastSection.classList.remove("hidden");
        showMessage("Weather information loaded successfully.");

    } catch (error) {
        showMessage("Could not load weather. Check your internet and try again.");
    }
}

function displayHourly(hourly) {
    const container = document.getElementById("hourlyForecast");
    container.replaceChildren();

    const currentHour = new Date();
    const currentIndex = hourly.time.findIndex(
        time => new Date(time).getTime() >= currentHour.getTime()
    );

    const start = currentIndex === -1 ? 0 : currentIndex;

    for (let i = start; i < Math.min(start + 12, hourly.time.length); i++) {
        const card = document.createElement("div");
        card.className = "hourly-card";

        const time = new Date(hourly.time[i]).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        });

        const icon = getIcon(hourly.weather_code[i], 1);

        card.innerHTML = `
            <p>${time}</p>
            <div class="hour-icon">${icon}</div>
            <p><strong>${Math.round(hourly.temperature_2m[i])}°C</strong></p>
        `;

        container.appendChild(card);
    }
}

function displayDaily(daily) {
    const container = document.getElementById("dailyForecast");
    container.replaceChildren();

    daily.time.forEach((date, i) => {
        const card = document.createElement("div");
        card.className = "daily-card";

        const day = i === 0
            ? "Today"
            : new Date(date + "T12:00:00").toLocaleDateString(
                "en-US", { weekday: "short" }
            );

        const icon = getIcon(daily.weather_code[i], 1);
        const high = Math.round(daily.temperature_2m_max[i]);
        const low = Math.round(daily.temperature_2m_min[i]);

        const dayName = document.createElement("span");
        dayName.className = "day-name";
        dayName.textContent = day;

        const dayIcon = document.createElement("span");
        dayIcon.className = "day-icon";
        dayIcon.textContent = icon;

        const dayTemp = document.createElement("span");
        dayTemp.className = "day-temp";
        dayTemp.textContent = `${high}° / ${low}°C`;

        card.append(dayName, dayIcon, dayTemp);
        container.appendChild(card);
    });
}

function formatTime(value) {
    return new Date(value).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });
}

function getDescription(code) {
    if (code === 0) return "Clear sky";
    if ([1, 2, 3].includes(code)) return "Partly cloudy";
    if ([45, 48].includes(code)) return "Foggy";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
    if ([71, 73, 75, 77].includes(code)) return "Snow";
    if ([80, 81, 82].includes(code)) return "Rain showers";
    if ([85, 86].includes(code)) return "Snow showers";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";
    return "Weather information unavailable";
}

function getIcon(code, isDay) {
    if (code === 0) return isDay ? "☀️" : "🌙";
    if ([1, 2].includes(code)) return isDay ? "🌤️" : "☁️";
    if ([3, 45, 48].includes(code)) return "☁️";
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
    if ([95, 96, 99].includes(code)) return "⛈️";
    return "🌡️";
}

function showMessage(text) {
    message.textContent = text;
}
