// Weather App - Main JavaScript File

// ===== Configuration =====
const CONFIG = {
    GEOCODING_API: 'https://geocoding-api.open-meteo.com/v1/search',
    WEATHER_API: 'https://api.open-meteo.com/v1/forecast',
    DEFAULT_CITY: 'Moscow',
    STORAGE_KEY: 'weather_history',
    THEME_KEY: 'weather_theme',
    MAX_HISTORY_ITEMS: 50,
    DEBOUNCE_DELAY: 300
};


// ===== State Management =====
const AppState = {
    currentLocation: null,
    currentWeatherData: null,
    searchTimeout: null,
    historyData: []
};

// ===== DOM Elements =====
const DOM = {
    // Theme
    themeToggle: document.getElementById('themeToggle'),
    
    
    // Search
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    locationBtn: document.getElementById('locationBtn'),
    suggestions: document.getElementById('suggestions'),
    searchBtnText: document.getElementById('searchBtnText'),
    
    // Header
    appTitle: document.getElementById('appTitle'),
    subtitle: document.getElementById('subtitle'),
    
    // Current Weather
    currentWeather: document.getElementById('currentWeather'),
    cityName: document.getElementById('cityName'),
    currentDate: document.getElementById('currentDate'),
    temperature: document.getElementById('temperature'),
    weatherIcon: document.getElementById('weatherIcon'),
    weatherDescription: document.getElementById('weatherDescription'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    feelsLike: document.getElementById('feelsLike'),
    visibility: document.getElementById('visibility'),
    pressure: document.getElementById('pressure'),
    cloudiness: document.getElementById('cloudiness'),
    
    // Forecast
    forecastTabs: document.getElementById('forecastTabs'),
    hourlyForecast: document.getElementById('hourlyForecast'),
    hourlyList: document.getElementById('hourlyList'),
    dailyForecast: document.getElementById('dailyForecast'),
    dailyList: document.getElementById('dailyList'),
    hourlyTab: document.getElementById('hourlyTab'),
    dailyTab: document.getElementById('dailyTab'),
    historyTab: document.getElementById('historyTab'),
    
    // History
    historySection: document.getElementById('historySection'),
    historyList: document.getElementById('historyList'),
    clearHistory: document.getElementById('clearHistory'),
    historyTitle: document.getElementById('historyTitle'),
    noHistoryText: document.getElementById('noHistoryText'),
    
    // Loading & Errors
    loadingIndicator: document.getElementById('loadingIndicator'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    loadingText: document.getElementById('loadingText'),
    
    // Footer
    copyrightText: document.getElementById('copyrightText')
};

// ===== Theme Management =====
function initTheme() {
    const savedTheme = localStorage.getItem(CONFIG.THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(CONFIG.THEME_KEY, newTheme);
}


// ===== Weather Code Mappings =====
const weatherCodes = {
    0: { description: 'Ясно', icon: '☀️' },
    1: { description: 'Преимущественно ясно', icon: '🌤️' },
    2: { description: 'Переменная облачность', icon: '⛅' },
    3: { description: 'Облачно', icon: '☁️' },
    45: { description: 'Туман', icon: '🌫️' },
    48: { description: 'Изморось', icon: '🌫️' },
    51: { description: 'Лёгкая морось', icon: '🌦️' },
    53: { description: 'Умеренная морось', icon: '🌦️' },
    55: { description: 'Сильная морось', icon: '🌦️' },
    61: { description: 'Небольшой дождь', icon: '🌧️' },
    63: { description: 'Умеренный дождь', icon: '🌧️' },
    65: { description: 'Сильный дождь', icon: '🌧️' },
    71: { description: 'Небольшой снег', icon: '🌨️' },
    73: { description: 'Умеренный снег', icon: '🌨️' },
    75: { description: 'Сильный снег', icon: '🌨️' },
    77: { description: 'Снежные зёрна', icon: '❄️' },
    80: { description: 'Небольшие ливни', icon: '🌦️' },
    81: { description: 'Умеренные ливни', icon: '🌦️' },
    82: { description: 'Сильные ливни', icon: '⛈️' },
    85: { description: 'Небольшой снегопад', icon: '🌨️' },
    86: { description: 'Сильный снегопад', icon: '🌨️' },
    95: { description: 'Гроза', icon: '⛈️' },
    96: { description: 'Гроза с градом', icon: '⛈️' },
    99: { description: 'Сильная гроза с градом', icon: '⛈️' }
};

// ===== Utility Functions =====
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('ru-RU', options);
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function getDayName(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Сегодня';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Завтра';
    } else {
        return date.toLocaleDateString('ru-RU', { weekday: 'long' });
    }
}

function getWindDirection(degrees) {
    const directions = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

function showLoading() {
    DOM.loadingIndicator.classList.remove('hidden');
    DOM.errorMessage.classList.add('hidden');
}

function hideLoading() {
    DOM.loadingIndicator.classList.add('hidden');
}

function showError(message) {
    DOM.errorText.textContent = message;
    DOM.errorMessage.classList.remove('hidden');
    hideLoading();
}

function hideError() {
    DOM.errorMessage.classList.add('hidden');
}

// ===== Geocoding Functions =====
async function searchCities(query) {
    if (query.length < 2) {
        DOM.suggestions.classList.remove('show');
        return;
    }
    
    try {
        const response = await fetch(
            `${CONFIG.GEOCODING_API}?name=${encodeURIComponent(query)}&count=5&language=ru`
        );
        
        if (!response.ok) throw new Error('Ошибка поиска городов');
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            displaySuggestions(data.results);
        } else {
            DOM.suggestions.classList.remove('show');
        }
    } catch (error) {
        console.error('Ошибка поиска городов:', error);
        DOM.suggestions.classList.remove('show');
    }
}

function displaySuggestions(cities) {
    DOM.suggestions.innerHTML = '';
    
    cities.forEach(city => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = `${city.name}, ${city.country || ''} ${city.admin1 || ''}`.trim();
        item.addEventListener('click', () => {
            selectCity(city);
        });
        DOM.suggestions.appendChild(item);
    });
    
    DOM.suggestions.classList.add('show');
}

function selectCity(city) {
    DOM.cityInput.value = city.name;
    DOM.suggestions.classList.remove('show');
    AppState.currentLocation = {
        name: city.name,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude
    };
    fetchWeatherData(city.latitude, city.longitude, city.name);
}

// ===== Geolocation Functions =====
async function getUserLocation() {
    if (!navigator.geolocation) {
        showError('Геолокация не поддерживается вашим браузером');
        return;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                // Reverse geocoding to get city name
                const response = await fetch(
                    `${CONFIG.GEOCODING_API}?latitude=${latitude}&longitude=${longitude}&count=1&language=ru`
                );
                
                if (!response.ok) throw new Error('Не удалось определить местоположение');
                
                const data = await response.json();
                const cityName = data.results && data.results[0] 
                    ? data.results[0].name 
                    : 'Текущее местоположение';
                
                fetchWeatherData(latitude, longitude, cityName);
            } catch (error) {
                fetchWeatherData(latitude, longitude, 'Текущее местоположение');
            }
        },
        (error) => {
            hideLoading();
            let errorMessage = 'Не удалось получить ваше местоположение';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Вы отклонили запрос на определение местоположения';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Информация о местоположении недоступна';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Истекло время ожидания запроса местоположения';
                    break;
            }
            
            showError(errorMessage);
        }
    );
}

// ===== Weather API Functions =====
async function fetchWeatherData(latitude, longitude, cityName) {
    showLoading();
    hideError();
    
    try {
        const params = new URLSearchParams({
            latitude: latitude,
            longitude: longitude,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m',
            hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
            timezone: 'Europe/Moscow'
        });
        
        const response = await fetch(`${CONFIG.WEATHER_API}?${params}`);
        
        if (!response.ok) {
            throw new Error('Не удалось получить данные о погоде');
        }
        
        const data = await response.json();
        AppState.currentWeatherData = data;
        
        displayCurrentWeather(data.current, cityName);
        displayHourlyForecast(data.hourly);
        displayDailyForecast(data.daily);
        
        // Save to history
        saveToHistory({
            city: cityName,
            latitude: latitude,
            longitude: longitude,
            temperature: data.current.temperature_2m,
            weather_code: data.current.weather_code,
            timestamp: new Date().toISOString()
        });
        
        // Show all sections
        DOM.currentWeather.classList.remove('hidden');
        DOM.forecastTabs.classList.remove('hidden');
        showActiveTab();
        
        hideLoading();
    } catch (error) {
        console.error('Ошибка получения данных о погоде:', error);
        showError('Не удалось загрузить данные о погоде. Попробуйте еще раз.');
    }
}

// ===== Display Functions =====
function displayCurrentWeather(current, cityName) {
    const weatherInfo = weatherCodes[current.weather_code] || { 
        description: 'Неизвестно', 
        icon: '❓' 
    };
    
    DOM.cityName.textContent = cityName;
    DOM.currentDate.textContent = formatDate(new Date());
    DOM.temperature.textContent = Math.round(current.temperature_2m);
    DOM.weatherIcon.textContent = weatherInfo.icon;
    DOM.weatherDescription.textContent = weatherInfo.description;
    
    DOM.humidity.textContent = `${current.relative_humidity_2m}%`;
    DOM.windSpeed.textContent = `${Math.round(current.wind_speed_10m)} км/ч ${getWindDirection(current.wind_direction_10m)}`;
    DOM.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
    DOM.pressure.textContent = `${Math.round(current.pressure_msl)} гПа`;
    DOM.cloudiness.textContent = `${current.cloud_cover}%`;
    
    // Calculate visibility based on weather conditions
    let visibility = '10+ км';
    if (current.weather_code >= 45 && current.weather_code <= 48) {
        visibility = '< 1 км';
    } else if (current.precipitation > 0) {
        visibility = '4-10 км';
    }
    DOM.visibility.textContent = visibility;
}

function displayHourlyForecast(hourly) {
    DOM.hourlyList.innerHTML = '';
    
    const now = new Date();
    const next24Hours = hourly.time.slice(0, 24).map((time, index) => ({
        time: time,
        temperature: hourly.temperature_2m[index],
        weather_code: hourly.weather_code[index],
        precipitation_probability: hourly.precipitation_probability[index],
        wind_speed: hourly.wind_speed_10m[index]
    }));
    
    next24Hours.forEach(hour => {
        const hourDate = new Date(hour.time);
        if (hourDate < now) return;
        
        const weatherInfo = weatherCodes[hour.weather_code] || { 
            description: 'Неизвестно', 
            icon: '❓' 
        };
        
        const hourItem = document.createElement('div');
        hourItem.className = 'hourly-item';
        hourItem.innerHTML = `
            <div class="hourly-time">${formatTime(hour.time)}</div>
            <div class="hourly-icon">${weatherInfo.icon}</div>
            <div class="hourly-temp">${Math.round(hour.temperature)}°</div>
            <div class="hourly-rain">💧 ${hour.precipitation_probability || 0}%</div>
        `;
        
        DOM.hourlyList.appendChild(hourItem);
    });
}

function displayDailyForecast(daily) {
    DOM.dailyList.innerHTML = '';
    
    daily.time.slice(0, 7).forEach((day, index) => {
        const weatherInfo = weatherCodes[daily.weather_code[index]] || { 
            description: 'Неизвестно', 
            icon: '❓' 
        };
        
        const dayItem = document.createElement('div');
        dayItem.className = 'daily-item';
        dayItem.innerHTML = `
            <div class="daily-day">${getDayName(day)}</div>
            <div class="daily-weather">
                <span class="daily-icon">${weatherInfo.icon}</span>
                <span class="daily-desc">${weatherInfo.description}</span>
            </div>
            <div class="daily-temps">
                <span class="temp-max">${Math.round(daily.temperature_2m_max[index])}°</span>
                <span class="temp-min">${Math.round(daily.temperature_2m_min[index])}°</span>
            </div>
            <div class="daily-rain">
                💧 ${daily.precipitation_probability_max[index] || 0}%
            </div>
        `;
        
        DOM.dailyList.appendChild(dayItem);
    });
}

// ===== History Management =====
function loadHistory() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
        try {
            AppState.historyData = JSON.parse(saved);
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
            AppState.historyData = [];
        }
    }
    displayHistory();
}

function saveToHistory(data) {
    AppState.historyData.unshift(data);
    
    // Keep only last MAX_HISTORY_ITEMS
    if (AppState.historyData.length > CONFIG.MAX_HISTORY_ITEMS) {
        AppState.historyData = AppState.historyData.slice(0, CONFIG.MAX_HISTORY_ITEMS);
    }
    
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(AppState.historyData));
    displayHistory();
}

function displayHistory() {
    if (AppState.historyData.length === 0) {
        DOM.historyList.innerHTML = '<p class="no-history">История погоды пока пуста</p>';
        return;
    }
    
    DOM.historyList.innerHTML = '';
    
    // Group by days for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentHistory = AppState.historyData.filter(item => {
        return new Date(item.timestamp) >= sevenDaysAgo;
    });
    
    recentHistory.forEach(item => {
        const weatherInfo = weatherCodes[item.weather_code] || { 
            description: 'Неизвестно', 
            icon: '❓' 
        };
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-date">
                ${new Date(item.timestamp).toLocaleDateString('ru-RU', { 
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
            <div class="history-location">
                <span>${weatherInfo.icon}</span>
                ${item.city}
            </div>
            <div class="history-temp">${Math.round(item.temperature)}°C</div>
        `;
        
        historyItem.addEventListener('click', () => {
            fetchWeatherData(item.latitude, item.longitude, item.city);
        });
        
        DOM.historyList.appendChild(historyItem);
    });
}

function clearHistory() {
    if (confirm('Вы уверены, что хотите очистить всю историю погоды?')) {
        AppState.historyData = [];
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        displayHistory();
    }
}

// ===== Tab Management =====
function initTabs() {
    const tabButtons = DOM.forecastTabs.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            showActiveTab();
        });
    });
}

function showActiveTab() {
    const activeTab = DOM.forecastTabs.querySelector('.tab-btn.active');
    if (!activeTab) return;
    
    const tabName = activeTab.dataset.tab;
    
    // Hide all sections
    DOM.hourlyForecast.classList.add('hidden');
    DOM.dailyForecast.classList.add('hidden');
    DOM.historySection.classList.add('hidden');
    
    // Show active section
    switch(tabName) {
        case 'hourly':
            DOM.hourlyForecast.classList.remove('hidden');
            break;
        case 'daily':
            DOM.dailyForecast.classList.remove('hidden');
            break;
        case 'history':
            DOM.historySection.classList.remove('hidden');
            break;
    }
}

// ===== Event Listeners =====
function initEventListeners() {
    // Theme toggle
    DOM.themeToggle.addEventListener('click', toggleTheme);
    
    // Search functionality
    const debouncedSearch = debounce(searchCities, CONFIG.DEBOUNCE_DELAY);
    DOM.cityInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
    
    DOM.searchBtn.addEventListener('click', () => {
        const query = DOM.cityInput.value.trim();
        if (query) {
            searchCities(query);
        }
    });
    
    DOM.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = DOM.cityInput.value.trim();
            if (query) {
                searchCities(query);
            }
        }
    });
    
    // Location button
    DOM.locationBtn.addEventListener('click', getUserLocation);
    
    // Clear history
    DOM.clearHistory.addEventListener('click', clearHistory);
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!DOM.cityInput.contains(e.target) && !DOM.suggestions.contains(e.target)) {
            DOM.suggestions.classList.remove('show');
        }
    });
    
    
    // Initialize tabs
    initTabs();
}

// ===== Application Initialization =====
async function initApp() {
    initTheme();
    // Set all UI elements to Russian
    DOM.appTitle.textContent = "Прогноз погоды";
    DOM.subtitle.textContent = "Актуальные данные и история за неделю";
    DOM.cityInput.placeholder = "Введите название города...";
    DOM.searchBtnText.textContent = "🔍 Найти";
    DOM.locationBtn.title = "📍";
    DOM.hourlyTab.textContent = "Почасовой прогноз";
    DOM.dailyTab.textContent = "На 7 дней";
    DOM.historyTab.textContent = "История";
    DOM.historyTitle.textContent = "История";
    DOM.clearHistory.textContent = "Очистить историю";
    DOM.loadingText.textContent = "Загрузка данных...";
    DOM.copyrightText.textContent = "Все права защищены";
    
    // Update weather detail labels
    const detailLabels = DOM.currentWeather.querySelectorAll('.detail-label');
    if (detailLabels.length >= 6) {
        detailLabels[0].textContent = "Влажность";
        detailLabels[1].textContent = "Ветер";
        detailLabels[2].textContent = "Ощущается";
        detailLabels[3].textContent = "Видимость";
        detailLabels[4].textContent = "Давление";
        detailLabels[5].textContent = "Облачность";
    }
    
    // Update no history text
    if (DOM.noHistoryText) {
        DOM.noHistoryText.textContent = "История погоды пока пуста";
    }
    initEventListeners();
    loadHistory();
    
    // Try to get user's location on load
    if (navigator.geolocation) {
        getUserLocation();
    } else {
        // Fallback to Moscow
        searchCities(CONFIG.DEFAULT_CITY);
    }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Service Worker Registration (for offline support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.log('Service Worker registration failed:', err);
        });
    });
}