// Global variables
let currentDate = new Date();
let currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
let habits = [];
let selectedIcon = 'fas fa-star';
let selectedColor = '#007bff';
let editingHabitId = null;
let editingEntryData = null;

// Available icons for habits
const availableIcons = [
    'fas fa-bed', 'fas fa-dumbbell', 'fas fa-glass-whiskey', 'fas fa-running',
    'fas fa-book', 'fas fa-meditation', 'fas fa-apple-alt', 'fas fa-water',
    'fas fa-heart', 'fas fa-smile', 'fas fa-sun', 'fas fa-moon',
    'fas fa-coffee', 'fas fa-utensils', 'fas fa-walking', 'fas fa-bicycle',
    'fas fa-swimming-pool', 'fas fa-yoga', 'fas fa-pills', 'fas fa-tooth',
    'fas fa-shower', 'fas fa-cut', 'fas fa-briefcase', 'fas fa-graduation-cap',
    'fas fa-music', 'fas fa-paint-brush', 'fas fa-camera', 'fas fa-gamepad',
    'fas fa-phone', 'fas fa-laptop', 'fas fa-tv', 'fas fa-newspaper',
    'fas fa-calendar-check', 'fas fa-check-circle', 'fas fa-times-circle',
    'fas fa-credit-card', 'fas fa-money-bill-wave', 'fas fa-piggy-bank',
    'fas fa-chart-line', 'fas fa-coins', 'fas fa-wallet', 'fas fa-receipt',
    'fas fa-hand-holding-usd', 'fas fa-university', 'fas fa-exchange-alt'
];

// Available colors for habits
const availableColors = [
    // Whites and light colors
    '#ffffff', '#f5f5dc', '#fffff0', '#f8f8ff', '#f0f0f0',
    // Light greys
    '#d3d3d3', '#c0c0c0', '#a9a9a9', '#808080', '#696969',
    // Dark greys and black
    '#2c3e50', '#000000',
    // Browns
    '#D2691E', '#8B4513',
    // Blues
    '#000080', '#007bff', '#17a2b8', '#45b7d1', '#4ecdc4', '#00d2d3', '#0abde3',
    // Greens
    '#28a745', '#20c997', '#10ac84', '#96ceb4',
    // Yellows and oranges
    '#feca57', '#ffc107', '#ff9f43', '#fd7e14', '#ee5a24',
    // Reds and pinks
    '#ff3838', '#dc3545', '#ff6b6b', '#e83e8c', '#ff9ff3',
    // Purples
    '#6f42c1', '#5f27cd', '#54a0ff'
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    updateTodayDate();
    updateCurrentMonth();
    loadHabits();
    populateIconGrid();
    populateColorGrid();
    setupEventListeners();
    initializeSortable();
    setupAutoRefresh();
});

// Update today's date display
function updateTodayDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('todayDate').textContent = today.toLocaleDateString('en-US', options);
}

// Update current month display
function updateCurrentMonth() {
    const options = { year: 'numeric', month: 'long' };
    document.getElementById('currentMonth').textContent = currentMonth.toLocaleDateString('en-US', options);
}

// Load habits from the server
async function loadHabits() {
    try {
        const response = await fetch('/api/habits');
        habits = await response.json();
        renderCalendar();
    } catch (error) {
        console.error('Error loading habits:', error);
    }
}

// Render the calendar
async function renderCalendar() {
    const calendarBody = document.getElementById('calendarBody');
    const calendarTable = document.getElementById('calendarTable');
    
    // Clear existing content
    calendarBody.innerHTML = '';
    
    // Get the first day of the month and number of days
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Clear existing header content
    const thead = calendarTable.querySelector('thead');
    thead.innerHTML = '';
    
    // Create day of week row
    const dayRow = document.createElement('tr');
    dayRow.innerHTML = '<th></th>'; // Empty cell for habit column
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dayOfWeek = date.getDay();
        const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        
        const th = document.createElement('th');
        th.textContent = dayNames[dayOfWeek];
        th.style.fontSize = '0.8rem';
        th.style.color = '#6c757d';
        dayRow.appendChild(th);
    }
    
    // Create the date numbers row
    const dateRow = document.createElement('tr');
    dateRow.innerHTML = '<th>Habit</th>';
    
    for (let day = 1; day <= daysInMonth; day++) {
        const th = document.createElement('th');
        th.textContent = day;
        dateRow.appendChild(th);
    }
    
    // Add both rows to thead
    thead.appendChild(dayRow);
    thead.appendChild(dateRow);

    // Load all entries for the month at once
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    let monthEntries = {};
    
    try {
        const response = await fetch(`/api/entries/month/${year}/${month}`);
        monthEntries = await response.json();
        console.log('Loaded month entries:', monthEntries);
    } catch (error) {
        console.error('Error loading month entries:', error);
    }

    // Create habit rows
    for (let habit of habits) {
        const row = document.createElement('tr');
        row.className = 'habit-row';
        row.setAttribute('data-habit-id', habit.id);

        // Habit name cell with drag handle
        const nameCell = document.createElement('td');
        nameCell.className = 'habit-name';
        nameCell.innerHTML = `
            <i class="fas fa-grip-vertical drag-handle"></i>
            <span>${habit.name}</span>
            <div class="edit-overlay" onclick="editHabit(${habit.id})">e</div>
            <div class="delete-overlay" onclick="deleteHabit(${habit.id})">×</div>
        `;
        row.appendChild(nameCell);

        // Create cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('td');
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateStr = date.toISOString().split('T')[0];
            
            // Get today's date in local timezone
            const today = new Date();
            const todayStr = today.getFullYear() + '-' + 
                           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(today.getDate()).padStart(2, '0');
            const isToday = dateStr === todayStr;
            
            // Debug logging for today highlighting
            if (isToday) {
                console.log('Today cell found:', dateStr, 'for day:', day);
            }
            
            cell.className = 'habit-cell';
            if (isToday) cell.classList.add('today');
            
            // Add weekend class for Saturday and Sunday
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) { // 0 = Sunday, 6 = Saturday
                cell.classList.add('weekend');
            }
            
            cell.innerHTML = `
                <div class="habit-value"></div>
            `;
            
            cell.onclick = () => toggleEntry(habit.id, dateStr, habit.icon, cell);
            
            // Populate cell with entry data if it exists
            populateCellWithEntry(habit.id, dateStr, cell, habit.icon, monthEntries);
            
            row.appendChild(cell);
        }
        
        calendarBody.appendChild(row);
    }
}

// Populate cell with entry data from the loaded month data
function populateCellWithEntry(habitId, date, cell, icon, monthEntries) {
    const habitEntries = monthEntries[habitId] || {};
    const entryValue = habitEntries[date];
    
    console.log(`Checking habit ${habitId}, date ${date}:`, { habitEntries, entryValue });
    
    if (entryValue) {
        const habit = habits.find(h => h.id === habitId);
        const iconColor = habit.color || '#007bff';
        cell.querySelector('.habit-value').innerHTML = `<i class="${icon} habit-icon" style="color: ${iconColor}"></i>`;
        if (entryValue !== '✓') {
            cell.querySelector('.habit-value').innerHTML += `<span class="value-text">${entryValue}</span>`;
        }
        cell.classList.add('completed');
        
        // Add edit overlay only for cells with entries
        const editOverlay = document.createElement('div');
        editOverlay.className = 'edit-overlay';
        editOverlay.textContent = 'e';
        editOverlay.onclick = (e) => {
            e.stopPropagation();
            editEntry(habitId, date);
        };
        cell.appendChild(editOverlay);
    }
}

// Toggle entry (mark as completed/uncompleted)
async function toggleEntry(habitId, date, icon, cell) {
    try {
        const hasEntry = cell.classList.contains('completed');
        
        if (hasEntry) {
            // Delete entry
            await fetch(`/api/entries/${habitId}/${date}`, { method: 'DELETE' });
            cell.classList.remove('completed');
            cell.querySelector('.habit-value').innerHTML = '';
        } else {
            // Create entry with default value
            await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habit_id: habitId, date: date, value: '✓' })
            });
            cell.classList.add('completed');
            const habit = habits.find(h => h.id === habitId);
            const iconColor = habit.color || '#007bff';
            cell.querySelector('.habit-value').innerHTML = `<i class="${icon} habit-icon" style="color: ${iconColor}"></i>`;
            
            // Add edit overlay for new entries
            const editOverlay = document.createElement('div');
            editOverlay.className = 'edit-overlay';
            editOverlay.textContent = 'e';
            editOverlay.onclick = (e) => {
                e.stopPropagation();
                editEntry(habitId, date);
            };
            cell.appendChild(editOverlay);
        }
    } catch (error) {
        console.error('Error toggling entry:', error);
    }
}

// Navigation functions
function previousMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    updateCurrentMonth();
    renderCalendar();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    updateCurrentMonth();
    renderCalendar();
}

// Modal functions
function showAddHabitModal() {
    editingHabitId = null;
    document.getElementById('habitModalTitle').textContent = 'Add New Habit';
    document.getElementById('habitName').value = '';
    selectedIcon = 'fas fa-star';
    selectedColor = '#007bff';
    updateIconSelection();
    updateColorSelection();
    document.getElementById('habitModal').style.display = 'block';
}

function closeHabitModal() {
    document.getElementById('habitModal').style.display = 'none';
}

function showImportModal() {
    document.getElementById('importModal').style.display = 'block';
}

function closeImportModal() {
    document.getElementById('importModal').style.display = 'none';
}

function closeEntryModal() {
    document.getElementById('entryModal').style.display = 'none';
    editingEntryData = null;
}

// Populate icon grid
function populateIconGrid() {
    const iconGrid = document.getElementById('iconGrid');
    iconGrid.innerHTML = '';
    
    availableIcons.forEach(icon => {
        const iconOption = document.createElement('div');
        iconOption.className = 'icon-option';
        iconOption.innerHTML = `<i class="${icon}"></i>`;
        iconOption.onclick = () => selectIcon(icon);
        iconGrid.appendChild(iconOption);
    });
}

// Populate color grid
function populateColorGrid() {
    const colorGrid = document.getElementById('colorGrid');
    colorGrid.innerHTML = '';
    
    availableColors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color;
        colorOption.onclick = () => selectColor(color);
        colorGrid.appendChild(colorOption);
    });
}

// Select icon
function selectIcon(icon) {
    selectedIcon = icon;
    updateIconSelection();
}

// Select color
function selectColor(color) {
    selectedColor = color;
    updateColorSelection();
}

// Update icon selection display
function updateIconSelection() {
    document.querySelectorAll('.icon-option').forEach(option => {
        option.classList.remove('selected');
        if (option.querySelector('i').className === selectedIcon) {
            option.classList.add('selected');
        }
    });
}

// Update color selection display
function updateColorSelection() {
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
        if (option.style.backgroundColor === selectedColor || 
            option.style.backgroundColor === `rgb(${hexToRgb(selectedColor).join(', ')})`) {
            option.classList.add('selected');
        }
    });
}

// Helper function to convert hex to rgb
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

// Edit habit
function editHabit(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
        editingHabitId = habitId;
        document.getElementById('habitModalTitle').textContent = 'Edit Habit';
        document.getElementById('habitName').value = habit.name;
        selectedIcon = habit.icon;
        selectedColor = habit.color || '#007bff';
        updateIconSelection();
        updateColorSelection();
        document.getElementById('habitModal').style.display = 'block';
    }
}

// Edit entry
function editEntry(habitId, date) {
    console.log('editEntry called with:', { habitId, date });
    editingEntryData = { habitId, date };
    console.log('editingEntryData set to:', editingEntryData);
    document.getElementById('entryValue').value = '';
    document.getElementById('entryModal').style.display = 'block';
}

// Delete habit
async function deleteHabit(habitId) {
    if (confirm('Are you sure you want to delete this habit?')) {
        try {
            await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
            await loadHabits();
        } catch (error) {
            console.error('Error deleting habit:', error);
        }
    }
}

// Delete entry
async function deleteEntry(habitId, date) {
    if (confirm('Are you sure you want to delete this entry?')) {
        try {
            await fetch(`/api/entries/${habitId}/${date}`, { method: 'DELETE' });
            renderCalendar();
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    }
}

// Export data
function exportData() {
    window.location.href = '/api/export';
}

// Setup event listeners
function setupEventListeners() {
    // Habit form submission
    document.getElementById('habitForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const habitName = document.getElementById('habitName').value.trim();
        if (!habitName) return;
        
        try {
            if (editingHabitId) {
                // Update existing habit
                await fetch(`/api/habits/${editingHabitId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: habitName, icon: selectedIcon, color: selectedColor })
                });
            } else {
                // Create new habit
                await fetch('/api/habits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: habitName, icon: selectedIcon, color: selectedColor })
                });
            }
            
            closeHabitModal();
            await loadHabits();
        } catch (error) {
            console.error('Error saving habit:', error);
        }
    });

    // Entry form submission
    document.getElementById('entryForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('Entry form submitted');
        console.log('editingEntryData:', editingEntryData);
        
        if (!editingEntryData) {
            console.log('No editingEntryData, returning');
            return;
        }
        
        const value = document.getElementById('entryValue').value.trim();
        console.log('Value to save:', value);
        
        const habit = habits.find(h => h.id === editingEntryData.habitId);
        console.log('Found habit:', habit);
        
        try {
            const requestBody = {
                habit_id: editingEntryData.habitId,
                date: editingEntryData.date,
                value: value || '✓'
            };
            console.log('Sending request:', requestBody);
            
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                throw new Error(`Server error: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Response result:', result);
            
            closeEntryModal();
            await renderCalendar();
        } catch (error) {
            console.error('Error saving entry:', error);
        }
    });

    // Import form submission
    document.getElementById('importForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];
        
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/import', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                closeImportModal();
                await loadHabits();
                alert('Data imported successfully!');
            } else {
                const error = await response.json();
                alert('Import failed: ' + error.error);
            }
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Import failed: ' + error.message);
        }
    });

    // Close modals when clicking outside
    window.onclick = function(event) {
        const habitModal = document.getElementById('habitModal');
        const entryModal = document.getElementById('entryModal');
        const importModal = document.getElementById('importModal');
        
        if (event.target === habitModal) {
            closeHabitModal();
        }
        if (event.target === entryModal) {
            closeEntryModal();
        }
        if (event.target === importModal) {
            closeImportModal();
        }
    };
}

// Initialize sortable functionality
function initializeSortable() {
    const calendarBody = document.getElementById('calendarBody');
    
    new Sortable(calendarBody, {
        handle: '.drag-handle',
        animation: 150,
        onEnd: function(evt) {
            // Update habit order in the array
            const habitId = evt.item.getAttribute('data-habit-id');
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;
            
            if (oldIndex !== newIndex) {
                const habit = habits.splice(oldIndex, 1)[0];
                habits.splice(newIndex, 0, habit);
            }
        }
    });
}

// Setup auto-refresh after midnight
function setupAutoRefresh() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Set to midnight
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Set timeout to refresh at midnight
    setTimeout(() => {
        // Refresh the calendar to update today's date
        updateTodayDate();
        renderCalendar();
        
        // Set up the next midnight refresh (24 hours later)
        setInterval(() => {
            updateTodayDate();
            renderCalendar();
        }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    }, timeUntilMidnight);
} 