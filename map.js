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

    // Add a "Save" button
    popupContent += `<button onclick="saveLocation('${city}', ${aqiData.lat}, ${aqiData.lon})">Save</button>`;

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


function saveLocation(name, lat, lon) {
    // Get existing saved locations from local storage
    const savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];

    // Check if the location is already saved
    const existingLocation = savedLocations.find(loc => loc.name === name);
    if (!existingLocation) {
        
        savedLocations.push({ name, lat, lon });
        localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
        alert(`Location '${name}' saved successfully!`);
    } else {
        alert(`Location '${name}' is already saved!`);
    }
} 
function showSaveLocationButton(city) {
    const saveLocationButton = document.getElementById('save-location-button');
    if (saveLocationButton) {
        saveLocationButton.style.display = 'block';
        saveLocationButton.onclick = () => saveLocation(city);
    }
}


document.getElementById('search-btn').addEventListener('click', function() {
    const location = document.getElementById('search-bar').value;
    searchLocation(location);
});


function init() {
    createMap();
}

init(); 

