const API_KEY = "20d2dc38c27135e217a3a9daa667add1"; // Replace with a valid OpenWeatherMap API key.

const cityInput = document.getElementById("cityInput");
const weatherBox = document.getElementById("weather");
const historyBox = document.getElementById("history");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");

async function fetchWeather(url) {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
        if (data.cod === 401 || data.cod === "401") {
            throw new Error("Invalid API key. Please replace API_KEY with a valid OpenWeatherMap key.");
        }

        if (data.cod === "404") {
            throw new Error("City not found. Please check the spelling and try again.");
        }

        throw new Error(data.message || "Unable to fetch weather right now.");
    }

    return data;
}

async function getWeather(city) {
    const cityName = encodeURIComponent(city);
    return fetchWeather(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
    );
}

async function getWeatherByCoords(latitude, longitude) {
    return fetchWeather(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
    );
}

function renderWeather(d) {
    weatherBox.innerHTML = `
        <div class="weather-item"><label>City</label><span>${d.name}, ${d.sys.country}</span></div>
        <div class="weather-item"><label>Temperature</label><span>${d.main.temp} deg C</span></div>
        <div class="weather-item"><label>Weather</label><span>${d.weather[0].main}</span></div>
        <div class="weather-item"><label>Humidity</label><span>${d.main.humidity}%</span></div>
        <div class="weather-item"><label>Wind Speed</label><span>${d.wind.speed} m/s</span></div>
    `;
}

function saveHistory(city) {
    let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];

    history = history.filter(c => c.toLowerCase() !== city.toLowerCase());
    history.unshift(city);
    history = history.slice(0, 8);

    localStorage.setItem("weatherHistory", JSON.stringify(history));
    showHistory();
}

function showHistory() {
    const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
    historyBox.innerHTML = "";

    history.forEach(city => {
        const btn = document.createElement("button");
        btn.textContent = city;
        btn.onclick = () => search(city);
        historyBox.appendChild(btn);
    });
}

async function search(city) {
    weatherBox.innerHTML = "<p>Loading weather...</p>";

    try {
        const data = await getWeather(city);
        renderWeather(data);
        saveHistory(data.name);
    } catch (error) {
        weatherBox.innerHTML = `<p style="color:#ffb4a8">${error.message}</p>`;
    }
}

function searchCurrentLocation() {
    if (!navigator.geolocation) {
        weatherBox.innerHTML = `<p style="color:#ffb4a8">Geolocation is not supported by this browser.</p>`;
        return;
    }

    weatherBox.innerHTML = "<p>Finding your location...</p>";

    navigator.geolocation.getCurrentPosition(
        async position => {
            try {
                const { latitude, longitude } = position.coords;
                const data = await getWeatherByCoords(latitude, longitude);
                renderWeather(data);
                saveHistory(data.name);
            } catch (error) {
                weatherBox.innerHTML = `<p style="color:#ffb4a8">${error.message}</p>`;
            }
        },
        () => {
            weatherBox.innerHTML = `<p style="color:#ffb4a8">Location permission was denied.</p>`;
        }
    );
}

searchBtn.onclick = () => {
    const city = cityInput.value.trim();

    if (city) {
        search(city);
    }
};

locationBtn.onclick = searchCurrentLocation;

cityInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        const city = cityInput.value.trim();

        if (city) {
            search(city);
        }
    }
});

showHistory();
