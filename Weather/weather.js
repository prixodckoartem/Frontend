class WeatherService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.geoApiUrl = 'https://api.openweathermap.org/geo/1.0';
    }

    async getWeatherByCity(city) {
        try {
            const geoResponse = await fetch(
                `${this.geoApiUrl}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${this.apiKey}`
            );
            
            if (!geoResponse.ok) {
                throw new Error(`Геокодирование: ${geoResponse.status}`);
            }
            
            const geoData = await geoResponse.json();
            
            if (!geoData || geoData.length === 0) {
                throw new Error('Город не найден');
            }
            
            const { lat, lon, name, country } = geoData[0];
            
            const weatherResponse = await fetch(
                `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=ru`
            );
            
            if (!weatherResponse.ok) {
                throw new Error(`Погода: ${weatherResponse.status}`);
            }
            
            const weatherData = await weatherResponse.json();
            
            return {
                success: true,
                data: this.formatCurrentWeather(weatherData, { name, country })
            };
            
        } catch (error) {
            console.error('Ошибка получения погоды:', error);
            return {
                success: false,
                error: error.message,
                userMessage: this.getUserErrorMessage(error.message)
            };
        }
    }

    async getWeatherByCoords(lat, lon) {
        try {
            const response = await fetch(
                `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=ru`
            );
            
            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }
            
            const data = await response.json();
            
            const geoResponse = await fetch(
                `${this.geoApiUrl}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${this.apiKey}`
            );
            
            let cityName = data.name;
            let country = data.sys.country;
            
            if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                if (geoData && geoData.length > 0) {
                    cityName = geoData[0].name;
                    country = geoData[0].country;
                }
            }
            
            return {
                success: true,
                data: this.formatCurrentWeather(data, { name: cityName, country })
            };
            
        } catch (error) {
            console.error('Ошибка получения погоды по координатам:', error);
            return {
                success: false,
                error: error.message,
                userMessage: 'Не удалось определить погоду для вашего местоположения'
            };
        }
    }

    async getForecast(city) {
        try {
            const geoResponse = await fetch(
                `${this.geoApiUrl}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${this.apiKey}`
            );
            
            if (!geoResponse.ok) {
                throw new Error(`Геокодирование: ${geoResponse.status}`);
            }
            
            const geoData = await geoResponse.json();
            
            if (!geoData || geoData.length === 0) {
                throw new Error('Город не найден');
            }
            
            const { lat, lon } = geoData[0];
            
            const response = await fetch(
                `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=ru`
            );
            
            if (!response.ok) {
                throw new Error(`Прогноз: ${response.status}`);
            }
            
            const data = await response.json();
            
            return {
                success: true,
                data: this.formatForecastData(data)
            };
            
        } catch (error) {
            console.error('Ошибка получения прогноза:', error);
            return {
                success: false,
                error: error.message,
                userMessage: 'Не удалось загрузить прогноз погоды'
            };
        }
    }

    formatCurrentWeather(data, location) {
        return {
            location: {
                city: location.name,
                country: location.country
            },
            temperature: {
                current: Math.round(data.main.temp),
                feelsLike: Math.round(data.main.feels_like),
                min: Math.round(data.main.temp_min),
                max: Math.round(data.main.temp_max)
            },
            conditions: {
                main: data.weather[0].main,
                description: data.weather[0].description,
                icon: data.weather[0].icon
            },
            details: {
                humidity: data.main.humidity,
                pressure: Math.round(data.main.pressure * 0.750062), 
                windDirection: this.getWindDirection(data.wind.deg),
                visibility: (data.visibility / 1000).toFixed(1), 
                clouds: data.clouds.all
            },
            sunrise: new Date(data.sys.sunrise * 1000),
            sunset: new Date(data.sys.sunset * 1000),
            timestamp: new Date(data.dt * 1000)
        };
    }

    formatForecastData(data) {
        const dailyForecast = {};
        
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toLocaleDateString('ru-RU');
            
            if (!dailyForecast[dateKey]) {
                dailyForecast[dateKey] = {
                    date: date,
                    temps: [],
                    conditions: [],
                    icons: []
                };
            }
            
            dailyForecast[dateKey].temps.push(item.main.temp);
            dailyForecast[dateKey].conditions.push(item.weather[0].description);
            dailyForecast[dateKey].icons.push(item.weather[0].icon);
        });
        
        const formattedForecast = Object.keys(dailyForecast)
            .slice(0, 5) 
            .map(dateKey => {
                const dayData = dailyForecast[dateKey];
                const avgTemp = Math.round(dayData.temps.reduce((a, b) => a + b) / dayData.temps.length);
                
                const conditionCount = {};
                dayData.conditions.forEach(cond => {
                    conditionCount[cond] = (conditionCount[cond] || 0) + 1;
                });
                
                const mostCommonCondition = Object.keys(conditionCount).reduce((a, b) => 
                    conditionCount[a] > conditionCount[b] ? a : b
                );
                
                const noonIndex = dayData.temps.findIndex((temp, i) => {
                    const hour = dayData.date.getHours();
                    return hour >= 11 && hour <= 13;
                });
                
                return {
                    date: dayData.date,
                    dateString: this.formatDate(dayData.date),
                    dayOfWeek: this.getDayOfWeek(dayData.date),
                    temperature: avgTemp,
                    condition: mostCommonCondition,
                    icon: dayData.icons[noonIndex] || dayData.icons[0]
                };
            });
        
        return formattedForecast;
    }

    getWindDirection(degrees) {
        const directions = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    }

    formatDate(date) {
        const options = { day: 'numeric', month: 'long' };
        return date.toLocaleDateString('ru-RU', options);
    }

    getDayOfWeek(date) {
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return days[date.getDay()];
    }

    getUserErrorMessage(error) {
        if (error.includes('404') || error.includes('Город не найден')) {
            return 'Город не найден. Проверьте правильность написания.';
        } else if (error.includes('401')) {
            return 'Неверный API ключ. Пожалуйста, проверьте настройки.';
        } else if (error.includes('429')) {
            return 'Превышен лимит запросов. Попробуйте позже.';
        } else if (error.includes('NetworkError')) {
            return 'Проблемы с соединением. Проверьте интернет.';
        } else {
            return 'Произошла ошибка при загрузке данных о погоде.';
        }
    }
}