// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Debounce Helper (Simple version) ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // --- Solid Color Picker ---
    const wheelPickerElement = document.getElementById('color-picker-wheel');
    const hexInput = document.getElementById('hex-input');
    const rgbInput = document.getElementById('rgb-input');
    const hsvInput = document.getElementById('hsv-input');
    const previewBox = document.getElementById('color-preview-box');

    if (!wheelPickerElement) {
        console.error("Color picker wheel element not found!");
        return; // Stop if essential element is missing
    }

    const colorPicker = new iro.ColorPicker(wheelPickerElement, {
        width: 250, // Match CSS
        color: "#039be5", // Initial color
        borderWidth: 1,
        borderColor: "#555",
        layout: [ // Configure layout (wheel + box slider)
            { component: iro.ui.Wheel },
            { component: iro.ui.Box }, // Saturation/Value box
            { component: iro.ui.Slider, options: { sliderType: 'hue' } }, // Hue slider
            { component: iro.ui.Slider, options: { sliderType: 'alpha' } } // Alpha slider (optional)
        ]
    });

    // Function to update input fields and preview
    function updateColorUI(color) {
        if (!hexInput || !rgbInput || !hsvInput || !previewBox) return;

        const hexString = color.hex8String; // Includes alpha
        const rgbString = color.rgbString;
        const hsvString = color.hsvString;

        hexInput.value = hexString;
        rgbInput.value = rgbString;
        hsvInput.value = hsvString;
        previewBox.style.backgroundColor = hexString;
    }

    // Initial UI update
    updateColorUI(colorPicker.color);

    // Update UI on color change
    colorPicker.on('color:change', updateColorUI);

    // --- Gradient Picker ---
    const gradientTypeSelect = document.getElementById('gradient-type');
    const gradientAngleInput = document.getElementById('gradient-angle');
    const gradientPreviewBox = document.getElementById('gradient-preview-box');
    const gradientStopsContainer = document.getElementById('gradient-stops-container');
    const addStopButton = document.createElement('button'); // Create add button dynamically
    const gradientCssOutput = document.getElementById('gradient-css-output');

    addStopButton.textContent = '+ Add Color Stop';
    addStopButton.className = 'add-stop-button';
    gradientStopsContainer.appendChild(addStopButton); // Add button to container

    let gradientStops = [
        { id: Date.now() + 1, color: '#039be5', position: 0 }, // Initial stop 1
        { id: Date.now() + 2, color: '#ffca28', position: 100 } // Initial stop 2
    ];
    let activeStopId = null; // Track which stop's color is being edited

    // Function to generate the gradient CSS string
    function generateGradientCSS() {
        const type = gradientTypeSelect.value;
        const angle = gradientAngleInput.value;
        const stopsString = gradientStops
            .sort((a, b) => a.position - b.position) // Ensure stops are ordered by position
            .map(stop => `${stop.color} ${stop.position}%`)
            .join(', ');

        let css = '';
        if (type === 'linear') {
            css = `linear-gradient(${angle}deg, ${stopsString})`;
        } else if (type === 'radial') {
            // Basic radial gradient, can be expanded
            css = `radial-gradient(circle, ${stopsString})`;
        }
        return css;
    }

    // Function to update the preview box and CSS output
    function updateGradientUI() {
        const css = generateGradientCSS();
        if (gradientPreviewBox) {
            gradientPreviewBox.style.background = css;
        }
        if (gradientCssOutput) {
            gradientCssOutput.value = css;
        }
    }

    // Function to render the color stops UI
    function renderGradientStops() {
        if (!gradientStopsContainer) return;

        // Clear existing stops (except the add button)
        while (gradientStopsContainer.firstChild && gradientStopsContainer.firstChild !== addStopButton) {
            gradientStopsContainer.removeChild(gradientStopsContainer.firstChild);
        }

        gradientStops.forEach((stop, index) => {
            const stopElement = document.createElement('div');
            stopElement.className = 'stop-item';
            stopElement.dataset.id = stop.id;

            // Color Preview (acts as button to select stop for color wheel)
            const colorPreview = document.createElement('div');
            colorPreview.className = 'stop-color-preview';
            colorPreview.style.backgroundColor = stop.color;
            colorPreview.title = "Click to edit this color";
            colorPreview.addEventListener('click', () => {
                activeStopId = stop.id;
                // Set the main color picker to this stop's color
                try { colorPicker.color.set(stop.color); } catch(e) { console.error("Error setting picker color:", e)}
                // Optional: Add visual indicator for active stop
                document.querySelectorAll('.stop-item').forEach(el => el.style.outline = 'none');
                stopElement.style.outline = '2px solid var(--accent-color, #ffca28)';
            });

            // Inputs (Range slider and Number input for position)
            const inputsDiv = document.createElement('div');
            inputsDiv.className = 'stop-inputs';

            const rangeLabel = document.createElement('label');
            rangeLabel.textContent = 'Pos:';
            const rangeInput = document.createElement('input');
            rangeInput.type = 'range';
            rangeInput.min = 0;
            rangeInput.max = 100;
            rangeInput.value = stop.position;
            rangeInput.addEventListener('input', (e) => {
                const newPos = parseInt(e.target.value, 10);
                stop.position = newPos;
                numberInput.value = newPos; // Sync number input
                updateGradientUI();
            });

            const numberInput = document.createElement('input');
            numberInput.type = 'number';
            numberInput.min = 0;
            numberInput.max = 100;
            numberInput.value = stop.position;
            numberInput.addEventListener('input', (e) => {
                 const newPos = parseInt(e.target.value, 10);
                 stop.position = Math.max(0, Math.min(100, newPos)); // Clamp value
                 rangeInput.value = stop.position; // Sync range input
                 numberInput.value = stop.position; // Update self in case clamped
                 updateGradientUI();
            });
            const percentLabel = document.createElement('span');
            percentLabel.textContent = '%';


            inputsDiv.appendChild(rangeLabel);
            inputsDiv.appendChild(rangeInput);
            inputsDiv.appendChild(numberInput);
            inputsDiv.appendChild(percentLabel);

            // Actions (Remove button)
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'stop-actions';
            const removeButton = document.createElement('button');
            removeButton.innerHTML = '×'; // Use HTML entity for 'x'
            removeButton.title = "Remove Stop";
            // Disable removing if only 2 stops left
            removeButton.disabled = gradientStops.length <= 2;
            removeButton.addEventListener('click', () => {
                gradientStops = gradientStops.filter(s => s.id !== stop.id);
                if(activeStopId === stop.id) activeStopId = null; // Clear active if removed
                renderGradientStops(); // Re-render stops
                updateGradientUI(); // Update preview/output
            });

            actionsDiv.appendChild(removeButton);

            // Assemble stop element
            stopElement.appendChild(colorPreview);
            stopElement.appendChild(inputsDiv);
            stopElement.appendChild(actionsDiv);

            // Insert before the add button
            gradientStopsContainer.insertBefore(stopElement, addStopButton);
        });

         // Update disable state of all remove buttons
         gradientStopsContainer.querySelectorAll('.stop-actions button').forEach(btn => {
             btn.disabled = gradientStops.length <= 2;
         });
    }

    // Add Stop Button Logic
    addStopButton.addEventListener('click', () => {
        // Add new stop roughly in the middle or end
        const newPosition = 50; // Or calculate based on existing stops
        const newColor = colorPicker.color.hex8String; // Use current picker color

        gradientStops.push({
            id: Date.now(),
            color: newColor,
            position: newPosition
        });
        renderGradientStops();
        updateGradientUI();
    });

    // Update gradient stop color when main picker changes AND a stop is active
    colorPicker.on('color:change', (color) => {
        if (activeStopId !== null) {
            const activeStop = gradientStops.find(s => s.id === activeStopId);
            if (activeStop) {
                activeStop.color = color.hex8String; // Update color (use hex8 for alpha)
                 // Update the preview circle for that stop
                const stopElement = gradientStopsContainer.querySelector(`.stop-item[data-id="${activeStopId}"] .stop-color-preview`);
                if(stopElement) stopElement.style.backgroundColor = activeStop.color;
                updateGradientUI(); // Update main preview and CSS
            }
        }
    });

    // Update gradient UI when type or angle changes
    gradientTypeSelect.addEventListener('change', updateGradientUI);
    // Debounce angle input slightly
    gradientAngleInput.addEventListener('input', debounce(updateGradientUI, 100));

    // Initial render
    renderGradientStops();
    updateGradientUI();


    // --- Copy Button Logic ---
    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                let valueToCopy = '';
                if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA') {
                    valueToCopy = targetElement.value;
                } else {
                    valueToCopy = targetElement.textContent;
                }

                navigator.clipboard.writeText(valueToCopy).then(() => {
                    // Optional: Show temporary feedback
                    const originalText = button.textContent;
                    button.textContent = 'Copied!';
                    setTimeout(() => { button.textContent = originalText; }, 1500);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    alert('Failed to copy text.');
                });
            }
        });
    });

}); // End DOMContentLoaded