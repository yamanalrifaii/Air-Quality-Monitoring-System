function calculateFootprint() {
    var distance = document.getElementById('distance').value;
    var efficiency = document.getElementById('efficiency').value;
    var fuelType = document.getElementById('fuelType').value; // Add this line to get the selected fuel type

    if (distance && efficiency && fuelType) {
        var footprint = distance * efficiency;
        var resultElement = document.getElementById('result');
        resultElement.innerHTML = 'CARBON FOOTPRINT = ' + distance + ' MILES x ' + efficiency + ' KG CO2E/' + fuelType.toUpperCase() + ' = ' + footprint.toFixed(2) + ' KG CO2E (OR ' + (footprint / 1000).toFixed(2) + ' METRIC TONS CO2E)';
        resultElement.style.display = 'block';
    } else {
        alert('Please enter both distance, fuel efficiency, and select a fuel type.');
    }
}