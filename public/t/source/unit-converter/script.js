// script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("Unit Converter script loaded.");

    // --- Data Structure for Units ---
    // Base units are chosen for convenience (often SI, but not strictly required)
    // Factor: How many base units make up 1 of the current unit.
    const unitsData = {
        Length: {
            baseUnit: 'meter',
            units: [
                { id: 'meter', name: 'Meter (m)', factor: 1 },
                { id: 'kilometer', name: 'Kilometer (km)', factor: 1000 },
                { id: 'centimeter', name: 'Centimeter (cm)', factor: 0.01 },
                { id: 'millimeter', name: 'Millimeter (mm)', factor: 0.001 },
                { id: 'mile', name: 'Mile (mi)', factor: 1609.34 },
                { id: 'yard', name: 'Yard (yd)', factor: 0.9144 },
                { id: 'foot', name: 'Foot (ft)', factor: 0.3048 },
                { id: 'inch', name: 'Inch (in)', factor: 0.0254 },
                { id: 'nautical-mile', name: 'Nautical Mile', factor: 1852 },
            ]
        },
        Mass: {
            baseUnit: 'kilogram',
            units: [
                { id: 'kilogram', name: 'Kilogram (kg)', factor: 1 },
                { id: 'gram', name: 'Gram (g)', factor: 0.001 },
                { id: 'milligram', name: 'Milligram (mg)', factor: 0.000001 },
                { id: 'metric-ton', name: 'Metric Ton (t)', factor: 1000 },
                { id: 'pound', name: 'Pound (lb)', factor: 0.453592 },
                { id: 'ounce', name: 'Ounce (oz)', factor: 0.0283495 },
                { id: 'stone', name: 'Stone (st)', factor: 6.35029 },
            ]
        },
        Temperature: {
            // Temperature is special, handled by specific formulas
            baseUnit: 'celsius', // Define conceptually, not used for factor calculation
            units: [
                { id: 'celsius', name: 'Celsius (°C)' },
                { id: 'fahrenheit', name: 'Fahrenheit (°F)' },
                { id: 'kelvin', name: 'Kelvin (K)' },
            ]
        },
        Volume: {
            baseUnit: 'liter',
            units: [
                { id: 'liter', name: 'Liter (L)', factor: 1 },
                { id: 'milliliter', name: 'Milliliter (mL)', factor: 0.001 },
                { id: 'cubic-meter', name: 'Cubic Meter (m³)', factor: 1000 },
                { id: 'us-gallon', name: 'US Gallon (gal)', factor: 3.78541 },
                { id: 'us-quart', name: 'US Quart (qt)', factor: 0.946353 },
                { id: 'us-pint', name: 'US Pint (pt)', factor: 0.473176 },
                { id: 'us-cup', name: 'US Cup', factor: 0.236588 }, // Approx
                { id: 'us-fluid-ounce', name: 'US Fluid Ounce (fl oz)', factor: 0.0295735 },
                { id: 'imperial-gallon', name: 'Imperial Gallon (gal)', factor: 4.54609 },
                { id: 'imperial-quart', name: 'Imperial Quart (qt)', factor: 1.13652 },
                { id: 'imperial-pint', name: 'Imperial Pint (pt)', factor: 0.568261 },
                { id: 'imperial-fluid-ounce', name: 'Imperial Fluid Ounce (fl oz)', factor: 0.0284131 },
            ]
        },
        Speed: {
            baseUnit: 'mps', // Meters per second
            units: [
                { id: 'mps', name: 'Meters per second (m/s)', factor: 1 },
                { id: 'kph', name: 'Kilometers per hour (km/h)', factor: 1 / 3.6 },
                { id: 'mph', name: 'Miles per hour (mph)', factor: 0.44704 },
                { id: 'knot', name: 'Knot (kn)', factor: 0.514444 },
                { id: 'fps', name: 'Feet per second (ft/s)', factor: 0.3048 },
            ]
        },
        Data: {
             baseUnit: 'byte',
             units: [
                { id: 'byte', name: 'Byte (B)', factor: 1 },
                { id: 'kilobyte', name: 'Kilobyte (kB)', factor: 1000 }, // Base 10 (common standard)
                { id: 'megabyte', name: 'Megabyte (MB)', factor: 1000**2 },
                { id: 'gigabyte', name: 'Gigabyte (GB)', factor: 1000**3 },
                { id: 'terabyte', name: 'Terabyte (TB)', factor: 1000**4 },
                { id: 'kibibyte', name: 'Kibibyte (KiB)', factor: 1024 }, // Base 2
                { id: 'mebibyte', name: 'Mebibyte (MiB)', factor: 1024**2 },
                { id: 'gibibyte', name: 'Gibibyte (GiB)', factor: 1024**3 },
                { id: 'tebibyte', name: 'Tebibyte (TiB)', factor: 1024**4 },
                { id: 'bit', name: 'Bit (b)', factor: 0.125 },
             ]
        },
        Time: {
             baseUnit: 'second',
             units: [
                { id: 'second', name: 'Second (s)', factor: 1 },
                { id: 'millisecond', name: 'Millisecond (ms)', factor: 0.001 },
                { id: 'minute', name: 'Minute (min)', factor: 60 },
                { id: 'hour', name: 'Hour (h)', factor: 3600 },
                { id: 'day', name: 'Day (d)', factor: 86400 },
                { id: 'week', name: 'Week', factor: 604800 },
                { id: 'month', name: 'Month (approx)', factor: 2628000 }, // Avg month
                { id: 'year', name: 'Year (approx)', factor: 31536000 }, // Avg year
             ]
        },
         Energy: {
            baseUnit: 'joule',
            units: [
                { id: 'joule', name: 'Joule (J)', factor: 1 },
                { id: 'kilojoule', name: 'Kilojoule (kJ)', factor: 1000 },
                { id: 'calorie', name: 'Calorie (cal)', factor: 4.184 },
                { id: 'kilocalorie', name: 'Kilocalorie (kcal)', factor: 4184 },
                { id: 'watt-hour', name: 'Watt Hour (Wh)', factor: 3600 },
                { id: 'kilowatt-hour', name: 'Kilowatt Hour (kWh)', factor: 3600000 },
                { id: 'electronvolt', name: 'Electronvolt (eV)', factor: 1.60218e-19 },
                { id: 'btu', name: 'British Thermal Unit (BTU)', factor: 1055.06 },
            ]
        },
        // Add more categories: Pressure, Angle, Frequency, etc.
    };

    // --- DOM Elements ---
    const categorySelect = document.getElementById('category-select');
    const fromValueInput = document.getElementById('from-value');
    const fromUnitSelect = document.getElementById('from-unit-select');
    const toValueOutput = document.getElementById('to-value');
    const toUnitSelect = document.getElementById('to-unit-select');
    const swapButton = document.getElementById('swap-button');
    const formulaDisplay = document.getElementById('conversion-formula');

    // --- Populate Category Dropdown ---
    function populateCategories() {
        if (!categorySelect) return;
        Object.keys(unitsData).forEach(categoryName => {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            categorySelect.appendChild(option);
        });
        console.log("Categories populated.");
    }

    // --- Populate Unit Dropdowns based on Category ---
    function populateUnits(categoryName) {
        if (!fromUnitSelect || !toUnitSelect || !categoryName || !unitsData[categoryName]) {
            // Disable selects if no category or data
            fromUnitSelect.innerHTML = '<option value="">--</option>';
            toUnitSelect.innerHTML = '<option value="">--</option>';
            fromUnitSelect.disabled = true;
            toUnitSelect.disabled = true;
            if(swapButton) swapButton.disabled = true;
            console.log("Populate Units: Invalid category or elements missing.");
            return;
        }

        const category = unitsData[categoryName];
        const units = category.units;

        // Clear previous options
        fromUnitSelect.innerHTML = '';
        toUnitSelect.innerHTML = '';

        // Populate with new units
        units.forEach(unit => {
            const optionFrom = document.createElement('option');
            optionFrom.value = unit.id;
            optionFrom.textContent = unit.name;
            fromUnitSelect.appendChild(optionFrom);

            const optionTo = document.createElement('option');
            optionTo.value = unit.id;
            optionTo.textContent = unit.name;
            toUnitSelect.appendChild(optionTo);
        });

        // Set default selections (e.g., first and second unit)
        if (units.length > 0) fromUnitSelect.value = units[0].id;
        if (units.length > 1) toUnitSelect.value = units[1].id;
        else if (units.length > 0) toUnitSelect.value = units[0].id; // Fallback if only one unit

        // Enable selects and swap button
        fromUnitSelect.disabled = false;
        toUnitSelect.disabled = false;
        if(swapButton) swapButton.disabled = categoryName === 'Temperature'; // Disable swap for temp? Or handle swap logic

        console.log(`Units populated for category: ${categoryName}`);
        performConversion(); // Perform initial conversion
    }

    // --- Temperature Conversion ---
    function convertTemperature(value, fromUnit, toUnit) {
        if (fromUnit === toUnit) return value;
        let celsius;
        // Convert input to Celsius first
        switch (fromUnit) {
            case 'celsius': celsius = value; break;
            case 'fahrenheit': celsius = (value - 32) * 5 / 9; break;
            case 'kelvin': celsius = value - 273.15; break;
            default: return NaN; // Unknown unit
        }
        // Convert Celsius to target unit
        switch (toUnit) {
            case 'celsius': return celsius;
            case 'fahrenheit': return (celsius * 9 / 5) + 32;
            case 'kelvin': return celsius + 273.15;
            default: return NaN;
        }
    }

    // --- General Unit Conversion ---
    function convertUnits(value, fromUnitId, toUnitId, categoryName) {
         const category = unitsData[categoryName];
         if (!category) return NaN;

         const fromUnit = category.units.find(u => u.id === fromUnitId);
         const toUnit = category.units.find(u => u.id === toUnitId);

         if (!fromUnit || !toUnit || !fromUnit.factor || !toUnit.factor) return NaN; // Factor missing

         // Convert 'fromValue' to the base unit
         const valueInBase = value * fromUnit.factor;

         // Convert from base unit to the 'toValue'
         if (toUnit.factor === 0) return NaN; // Avoid division by zero
         const result = valueInBase / toUnit.factor;

         return result;
    }

    // --- Perform and Display Conversion ---
    function performConversion() {
        if (!fromValueInput || !fromUnitSelect || !toUnitSelect || !toValueOutput || !categorySelect) return;

        const fromValue = parseFloat(fromValueInput.value);
        const fromUnitId = fromUnitSelect.value;
        const toUnitId = toUnitSelect.value;
        const categoryName = categorySelect.value;

        if (isNaN(fromValue) || !fromUnitId || !toUnitId || !categoryName) {
            toValueOutput.value = ''; // Clear output if input is invalid
            if (formulaDisplay) formulaDisplay.textContent = '';
            return;
        }

        let result;
        if (categoryName === 'Temperature') {
            result = convertTemperature(fromValue, fromUnitId, toUnitId);
        } else {
            result = convertUnits(fromValue, fromUnitId, toUnitId, categoryName);
        }

        if (isNaN(result)) {
            toValueOutput.value = 'Error';
            if (formulaDisplay) formulaDisplay.textContent = '';
        } else {
            // Format result (e.g., limit decimal places)
            // Use Number.toPrecision for significant figures or toFixed for decimal places
            let formattedResult = parseFloat(result.toPrecision(8)); // Use precision
            if (Math.abs(formattedResult) < 1e-6 && formattedResult !== 0) {
                formattedResult = result.toExponential(4); // Use exponential for very small numbers
            } else if (Math.abs(formattedResult) >= 1e9) {
                 formattedResult = result.toExponential(4); // Use exponential for very large numbers
            }

            toValueOutput.value = formattedResult;

            // Optional: Display formula (simplified)
            if (formulaDisplay) {
                 const fromUnitName = unitsData[categoryName]?.units.find(u=>u.id === fromUnitId)?.name || fromUnitId;
                 const toUnitName = unitsData[categoryName]?.units.find(u=>u.id === toUnitId)?.name || toUnitId;
                 // Basic display, doesn't show actual math for non-temp
                 formulaDisplay.textContent = `${fromValueInput.value} ${fromUnitName} ≈ ${formattedResult} ${toUnitName}`;
            }
        }
    }

    // --- Swap Units ---
    function swapUnits() {
         if (!fromUnitSelect || !toUnitSelect || categorySelect.value === 'Temperature') return; // Avoid swapping temp for now

         const fromVal = fromUnitSelect.value;
         const toVal = toUnitSelect.value;

         fromUnitSelect.value = toVal;
         toUnitSelect.value = fromVal;

         performConversion(); // Recalculate after swap
    }

    // --- Event Listeners ---
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            populateUnits(e.target.value);
        });
    }
    if (fromValueInput) {
        fromValueInput.addEventListener('input', performConversion);
    }
    if (fromUnitSelect) {
        fromUnitSelect.addEventListener('change', performConversion);
    }
    if (toUnitSelect) {
        toUnitSelect.addEventListener('change', performConversion);
    }
    if (swapButton) {
         swapButton.addEventListener('click', swapUnits);
    }


    // --- Initialization ---
    populateCategories();
    console.log("Converter initialized.");

}); // End DOMContentLoaded