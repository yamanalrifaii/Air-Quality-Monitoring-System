var map; // Declare the map variable globally

function createMap() {
    map = L.map('map', {
        attributionControl: false,
        zoomSnap: 0.1,
    }).setView([51.505, -0.09], 13); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const aqiType = 'usepa-aqi';
    L.tileLayer(`https://tiles.aqicn.org/tiles/${aqiType}/{z}/{x}/{y}.png`, {
        maxZoom: 19,
        attribution: '© AQICN'
    }).addTo(map);

    map.on("moveend", () => {
        let bounds = map.getBounds();
        let boundsStr = bounds.getNorth() + "," + bounds.getWest() + "," + bounds.getSouth() + "," + bounds.getEast();
        populateMarkers(boundsStr);
    });
}

let allMarkers = {};

function token() {
    return '9d0ef0d97bd87fdd79900a44b92f48181783e46c'; 
}

function populateMarkers(bounds) {
    fetch(`https://api.waqi.info/map/bounds/?latlng=${bounds}&token=${token()}`)
        .then(response => response.json())
        .then(data => {
            if (data.status !== 'ok') {
                throw new Error('Error fetching data');
            }

            Object.values(allMarkers).forEach(marker => marker.remove());
            allMarkers = {};

            data.data.forEach(station => {
                let marker = L.marker([station.lat, station.lon]).addTo(map);
                marker.on("click", () => {
                    fetchCityAirQualityData(station.station.name, token()); // Fetch city data when marker is clicked
                });
                allMarkers[station.station.name] = marker; 
            });
        })
        .catch(error => console.error('Error fetching data:', error));
}

function fetchCityAirQualityData(city, token) {
    const url = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${encodeURIComponent(token)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'ok') {
                displayCityPopup(data.data, city);
            } else {
                // Handle the case where data is not available or an unknown station
                displayFallbackPopup(city, "Data not available or unknown station");
            }
        })
        .catch(error => {
            console.error('Error fetching city data:', city, error);
            displayFallbackPopup(city, "Error fetching data");
        });
}

function displayCityPopup(aqiData, city) {
    let popupContent = `<strong>${city}</strong><br>AQI: ${aqiData.aqi}<br>`;

    // Display PM2.5, PM10, and O3 data if available
    if (aqiData.iaqi?.pm25) {
        popupContent += `PM2.5: ${aqiData.iaqi.pm25.v} <br>`;
    }
    if (aqiData.iaqi?.pm10) {
        popupContent += `PM10: ${aqiData.iaqi.pm10.v} <br>`;
    }
    if (aqiData.iaqi?.o3) {
        popupContent += `O3: ${aqiData.iaqi.o3.v} <br>`;
    }

    // Bind popup to the corresponding marker
    if (allMarkers[city]) {
        allMarkers[city].bindPopup(popupContent).openPopup();
    } else {
        console.error('Marker not found for city:', city);
    }
}

function displayFallbackPopup(city, message) {
    if (allMarkers[city]) {
        allMarkers[city].bindPopup(`<strong>${city}</strong><br>${message}`).openPopup();
    } else {
        console.error('Marker not found for city:', city);
    }
}

function searchLocation(location) {
    const encodedLocation = encodeURIComponent(location);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                map.setView([lat, lon], 13); // Adjust the zoom level
                populateMarkers(`${lat},${lon},${lat},${lon}`);
            } else {
                alert("Location not found");
            }
        })
        .catch(error => console.error('Error:', error));
}
function compareCities() {
    // Get the values entered by the user
    var firstCity = document.getElementById('firstCity').value;
    var secondCity = document.getElementById('secondCity').value;

    // Search for the locations of the entered cities
    searchLocation(firstCity);
    searchLocation(secondCity);

    setTimeout(function () {
        var firstCityAirQuality = getAirQuality(firstCity);
        var secondCityAirQuality = getAirQuality(secondCity);

        // Display the air quality results or an error message
        if (firstCityAirQuality !== null && secondCityAirQuality !== null) {
            displayAirQualityResults(firstCity, secondCity, firstCityAirQuality, secondCityAirQuality);

            var firstCityCoords = getCoordinatesForCity(firstCity);
            var secondCityCoords = getCoordinatesForCity(secondCity);
            initMap(firstCityCoords, secondCityCoords);
        } else {
            
            displayErrorMessage();
        }
    }, 1000); 
}


document.getElementById('search-btn').addEventListener('click', function() {
    const location = document.getElementById('search-bar').value;
    searchLocation(location);
});


function init() {
    createMap();
}



init();


function initMap(firstCityCoords, secondCityCoords) {
    var map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 0, lng: 0 },
      zoom: 2 
    });

    // Add markers for the two cities
    var firstCityMarker = new google.maps.Marker({
      position: firstCityCoords,
      map: map,
      title: 'First City'
    });

    var secondCityMarker = new google.maps.Marker({
      position: secondCityCoords,
      map: map,
      title: 'Second City'
    });
}

function getAirQuality(city) {

    if (city.toLowerCase() === 'error') {
      return null;
    }

    // Simulated air quality data
    return {
      aqi: (Math.random() * 100).toFixed(2), // Simulated AQI value (0-100)
      pollutants: {
        pm25: (Math.random() * 50).toFixed(2), 
        pm10: (Math.random() * 50).toFixed(2), 
        no2: (Math.random() * 50).toFixed(2),  
        o3: (Math.random() * 50).toFixed(2),  
        so2: (Math.random() * 50).toFixed(2) 
      }
    };
}
  
function displayAirQualityResults(firstCity, secondCity, firstCityAirQuality, secondCityAirQuality) {
    // Display the air quality results on the page
    var firstCityText = document.getElementById('firstCityText');
    var secondCityText = document.getElementById('secondCityText');

     // Remove the 'hidden' attribute from the results containers
     document.getElementById('firstCityResult').removeAttribute('hidden');
     document.getElementById('secondCityResult').removeAttribute('hidden');
    
    firstCityText.innerHTML = `
      ${firstCity}<br>
      <br>
      AQI: ${firstCityAirQuality.aqi}<br>
      PM2.5: ${firstCityAirQuality.pollutants.pm25}<br>
      PM10: ${firstCityAirQuality.pollutants.pm10}<br>
      NO2: ${firstCityAirQuality.pollutants.no2}<br>
      O3: ${firstCityAirQuality.pollutants.o3}<br>
      SO2: ${firstCityAirQuality.pollutants.so2}
    `;
    
    secondCityText.innerHTML = `
      ${secondCity}<br>
      <br>
      AQI: ${secondCityAirQuality.aqi}<br>
      PM2.5: ${secondCityAirQuality.pollutants.pm25}<br>
      PM10: ${secondCityAirQuality.pollutants.pm10}<br>
      NO2: ${secondCityAirQuality.pollutants.no2}<br>
      O3: ${secondCityAirQuality.pollutants.o3}<br>
      SO2: ${secondCityAirQuality.pollutants.so2}
    `;
  }

  function displayErrorMessage() {
    // Display an error message on the page
    var firstCityText = document.getElementById('firstCityText');
    var secondCityText = document.getElementById('secondCityText');
    
    firstCityText.innerHTML = 'Error: Please enter valid cities.';
    secondCityText.innerHTML = 'Error: Please enter valid cities.';
  }