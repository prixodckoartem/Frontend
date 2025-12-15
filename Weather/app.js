class WeatherApp {
    constructor() {
        // ВАЖНО: Замените на ваш реальный API ключ от OpenWeatherMap
        this.apiKey = 'ВАШ_API_КЛЮЧ_ЗДЕСЬ';
        
        this.weatherService = new WeatherService(this.apiKey);
        this.currentCity = 'Москва';
        this.initializeElements();
        this.bindEvents();
        this.loadWeather();
    }

    initializeElements() {
        this.elements = {
            cityInput: document.getElementById('city-input'),
            searchBtn: document.getElementById('search-btn'),
            locationBtn: document.getElementById('location-btn'),
            weatherContainer: document.getElementById('weather-container'),
            forecastContainer: document.getElementById('forecast-container'),
            updateTime: document.getElementById('update-time'),
            errorModal: document.getElementById('error-modal'),
            errorMessage: document.getElementById('error-message'),
            modalOkBtn: document.getElementById('modal-ok-btn'),
            closeBtn: document.querySelector('.close-btn')
        };
    }

    bindEvents() {
        this.elements.searchBtn.addEventListener('click', () => this.searchWeather());
        this.elements.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchWeather();
        });
        
        this.elements.locationBtn.addEventListener('click', () => this.getLocationWeather());
        
        // Быстрый выбор городов
        document.querySelectorAll('.city-tag').forEach(button => {
            button.addEventListener('click', (e) => {
                const city = e.target.dataset.city;
                this.elements.cityInput.value = city;
                this.searchWeather();
            });
        });
        
        // Модальное окно
        this.elements.modalOkBtn.addEventListener('click', () => this.hideError());
        this.elements.closeBtn.addEventListener('click', () => this.hideError());
        
        // Закрытие модального окна при клике вне его
        window.addEventListener('click', (e) => {
            if (e.target === this.elements.errorModal) {
                this.hideError();
            }
        });
    }

    async loadWeather() {
        await this.updateCurrentWeather();
        await this.updateForecast();
    }

    async searchWeather() {
        const city = this.elements.cityInput.value.trim();
        
        if (!city) {
            this.showError('Пожалуйста, введите название города');
            return;
        }
        
        this.currentCity = city;
        await this.loadWeather();
    }

    async updateCurrentWeather() {
        this.showLoading(true);
        
        try {
            const result = await this.weatherService.getWeatherByCity(this.currentCity);
            
            if (result.success) {
                this.renderWeather(result.data);
                this.updateTimestamp();
            } else {
                this.showError(result.userMessage);
                // Показываем демо-данные при ошибке
                this.renderDemoWeather();
            }
        } catch (error) {
            console.error('Ошибка обновления погоды:', error);
            this.showError('Произошла непредвиденная ошибка');
            this.renderDemoWeather();
        }
        
        this.showLoading(false);
    }

    async updateForecast() {
        try {
            const result = await this.weatherService.getForecast(this.currentCity);
            
            if (result.success) {
                this.renderForecast(result.data);
            }
        } catch (error) {
            console.error('Ошибка обновления прогноза:', error);
            this.renderDemoForecast();
        }
    }

    renderWeather(weatherData) {
        const weatherHTML = `
            <div class="weather-card">
                <div class="weather-header">
                    <div class="weather-city">
                        <h2>${weatherData.location.city}, ${weatherData.location.country}</h2>
                        <div class="weather-country">${weatherData.conditions.description}</div>
                    </div>
                    <div class="weather-time">
                        Обновлено: ${weatherData.timestamp.toLocaleTimeString('ru-RU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                    </div>
                </div>
                
                <div class="weather-main">
                    <div class="weather-temp-section">
                        <div class="weather-temp">${weatherData.temperature.current}°C</div>
                        <div class="weather-feels-like">
                            Ощущается как: ${weatherData.temperature.feelsLike}°C
                        </div>
                    </div>
                    
                    <div class="weather-icon-section">
                        <img src="https://openweathermap.org/img/wn/${weatherData.conditions.icon}@4x.png" 
                             alt="${weatherData.conditions.description}" 
                             class="weather-icon">
                        <div class="weather-description">${weatherData.conditions.description}</div>
                    </div>
                </div>
                
                <div class="weather-details">
                    <div class="weather-detail">
                        <i class="fas fa-temperature-low"></i>
                        <div class="detail-value">${weatherData.temperature.min}°C</div>
                        <div class="detail-label">Минимальная</div>
                    </div>
                    
                    <div class="weather-detail">
                        <i class="fas fa-temperature-high"></i>
                        <div class="detail-value">${weatherData.temperature.max}°C</div>
                        <div class="detail-label">Максимальная</div>
                    </div>
                    
                    <div class="weather-detail">
                        <i class="fas fa-tint"></i>
                        <div class="detail-value">${weatherData.details.humidity}%</div>
                        <div class="detail-label">Влажность</div>
                    </div>
                    
                    <div class="weather-detail">
                        <i class="fas fa-wind"></i>
                        <div class="detail-value">${weatherData.details.windSpeed} м/с</div>
                        <div class="detail-label">Ветер</div>
                    </div>
                    
                    <div class="weather-detail">
                        <i class="fas fa-compress-arrows-alt"></i>
                        <div class="detail-value">${weatherData.details.pressure}</div>
                        <div class="detail-label">Давление (мм рт. ст.)</div>
                    </div>
                    
                    <div class="weather-detail">
                        <i class="fas fa-eye"></i>
                        <div class="detail-value">${weatherData.details.visibility} км</div>
                        <div class="detail-label">Видимость</div>
                    </div>
                    
                    <div class="weather-detail">
                        <i class="fas fa-sun"></i>
                        <div class="detail-value">${weatherData.sunrise.toLocaleTimeString('ru-RU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}</div>
                        <div class="detail-label">Восход</div>
                    </div>
                    
                    <div class="weather-detail">
                        <i class="fas fa-moon"></i>
                        <div class="detail-value">${weatherData.sunset.toLocaleTimeString('ru-RU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}</div>
                        <div class="detail-label">Закат</div>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.weatherContainer.innerHTML = weatherHTML;
    }

    renderForecast(forecastData) {
        if (!forecastData || forecastData.length === 0) {
            this.elements.forecastContainer.innerHTML = '<p>Прогноз временно недоступен</p>';
            return;
        }
        
        const today = new Date().toLocaleDateString('ru-RU');
        
        const forecastHTML = forecastData.map((day, index) => `
            <div class="forecast-day ${index === 0 ? 'today' : ''}">
                <div class="forecast-date">
                    ${index === 0 ? 'Сегодня' : day.dayOfWeek}, ${day.dateString}
                </div>
                <div class="forecast-icon">
                    <img src="https://openweathermap.org/img/wn/${day.icon}.png" 
                         alt="${day.condition}">
                </div>
                <div class="forecast-temp">${day.temperature}°C</div>
                <div class="forecast-condition">${day.condition}</div>
            </div>
        `).join('');
        
        this.elements.forecastContainer.innerHTML = forecastHTML;
    }

    renderDemoWeather() {
        const demoData = {
            location: {
                city: this.currentCity,
                country: 'RU'
            },
            temperature: {
                current: Math.floor(Math.random() * 10) + 10,
                feelsLike: Math.floor(Math.random() * 8) + 8,
                min: Math.floor(Math.random() * 5) + 5,
                max: Math.floor(Math.random() * 5) + 15
            },
            conditions: {
                description: 'демо-режим',
                icon: '01d'
            },
            details: {
                humidity: Math.floor(Math.random() * 30) + 50,
                pressure: 750,
                windSpeed: Math.floor(Math.random() * 5) + 2,
                visibility: (Math.random() * 10 + 5).toFixed(1)
            },
            sunrise: new Date(Date.now() - 6 * 60 * 60 * 1000),
            sunset: new Date(Date.now() + 6 * 60 * 60 * 1000),
            timestamp: new Date()
        };
        
        this.renderWeather(demoData);
    }

    renderDemoForecast() {
        const days = ['Сегодня', 'Завтра', 'Ср', 'Чт', 'Пт'];
        const conditions = ['Солнечно', 'Облачно', 'Небольшой дождь', 'Пасмурно', 'Ясно'];
        
        const forecastHTML = days.map((day, index) => `
            <div class="forecast-day ${index === 0 ? 'today' : ''}">
                <div class="forecast-date">${day}</div>
                <div class="forecast-icon">
                    <i class="fas fa-${index % 2 === 0 ? 'sun' : 'cloud'}"></i>
                </div>
                <div class="forecast-temp">${Math.floor(Math.random() * 10) + 10}°C</div>
                <div class="forecast-condition">${conditions[index]}</div>
            </div>
        `).join('');
        
        this.elements.forecastContainer.innerHTML = forecastHTML;
    }

    getLocationWeather() {
        if (!navigator.geolocation) {
            this.showError('Геолокация не поддерживается вашим браузером');
            return;
        }
        
        this.elements.locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Определение...';
        this.elements.locationBtn.disabled = true;
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const result = await this.weatherService.getWeatherByCoords(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    
                    if (result.success) {
                        this.currentCity = result.data.location.city;
                        this.elements.cityInput.value = this.currentCity;
                        await this.loadWeather();
                    } else {
                        this.showError(result.userMessage);
                    }
                } catch (error) {
                    this.showError('Не удалось получить погоду для вашего местоположения');
                } finally {
                    this.resetLocationButton();
                }
            },
            (error) => {
                let message = 'Не удалось определить ваше местоположение';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Информация о местоположении недоступна';
                        break;
                    case error.TIMEOUT:
                        message = 'Время ожидания определения местоположения истекло';
                        break;
                }
                
                this.showError(message);
                this.resetLocationButton();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    resetLocationButton() {
        this.elements.locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Мое местоположение';
        this.elements.locationBtn.disabled = false;
    }

    showLoading(show) {
        if (show) {
            this.elements.weatherContainer.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Загрузка данных о погоде...</p>
                </div>
            `;
        }
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorModal.classList.add('active');
    }

    hideError() {
        this.elements.errorModal.classList.remove('active');
    }

    updateTimestamp() {
        const now = new Date();
        this.elements.updateTime.textContent = `Последнее обновление: ${now.toLocaleString('ru-RU')}`;
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const app = new WeatherApp();
    
    // Для отладки: выводим объект приложения в глобальную область видимости
    window.weatherApp = app;
});