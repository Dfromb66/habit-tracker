// Global variables
let currentDate = new Date();
let currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
let habits = [];
let selectedIcon = 'fas fa-star';
let selectedColor = '#007bff';
let editingHabitId = null;
let editingEntryData = null;

const STORAGE_KEY = 'habitTrackerData';

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
    '#ffffff', '#f5f5dc', '#fffff0', '#f8f8ff', '#f0f0f0',
    '#d3d3d3', '#c0c0c0', '#a9a9a9', '#808080', '#696969',
    '#2c3e50', '#000000',
    '#D2691E', '#8B4513',
    '#000080', '#007bff', '#17a2b8', '#45b7d1', '#4ecdc4', '#00d2d3', '#0abde3',
    '#28a745', '#20c997', '#10ac84', '#96ceb4',
    '#feca57', '#ffc107', '#ff9f43', '#fd7e14', '#ee5a24',
    '#ff3838', '#dc3545', '#ff6b6b', '#e83e8c', '#ff9ff3',
    '#6f42c1', '#5f27cd', '#54a0ff'
];

// ---------- localStorage helpers ----------

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { habits: [], entries: {}, nextId: 1 };
        }
        const data = JSON.parse(raw);
        return {
            habits: Array.isArray(data.habits) ? data.habits : [],
            entries: data.entries && typeof data.entries === 'object' ? data.entries : {},
            nextId: typeof data.nextId === 'number' ? data.nextId : 1
        };
    } catch (error) {
        console.error('Error loading data from localStorage:', error);
        return { habits: [], entries: {}, nextId: 1 };
    }
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getSortedHabits(data) {
    return [...data.habits].sort((a, b) => {
        const orderA = a.sort_order ?? a.id;
        const orderB = b.sort_order ?? b.id;
        if (orderA !== orderB) return orderA - orderB;
        return a.id - b.id;
    });
}

function getMonthEntries(data, year, month) {
    const monthEntries = {};
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    let endYear = year;
    let endMonth = month + 1;
    if (endMonth > 12) {
        endMonth = 1;
        endYear += 1;
    }
    const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    for (const habit of data.habits) {
        const habitId = String(habit.id);
        monthEntries[habit.id] = {};
        const habitEntries = data.entries[habitId] || {};
        for (const [date, value] of Object.entries(habitEntries)) {
            if (date >= start && date < end) {
                monthEntries[habit.id][date] = value;
            }
        }
    }
    return monthEntries;
}

function formatLocalDate(date) {
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
}

function escapeCsvField(value) {
    const str = String(value ?? '');
    if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];

        if (inQuotes) {
            if (ch === '"' && next === '"') {
                field += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                field += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            row.push(field);
            field = '';
        } else if (ch === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else if (ch === '\r') {
            // ignore CR; handle CRLF via the following LF
        } else {
            field += ch;
        }
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    return rows.filter(r => r.some(cell => String(cell).trim() !== ''));
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    updateTodayDate();
    updateCurrentMonth();
    loadHabits();
    populateIconGrid();
    populateColorGrid();
    setupEventListeners();
    initializeSortable();
    setupAutoRefresh();
});

// Theme handling
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeSelect = document.getElementById('themeSelect');
    applyTheme(savedTheme);
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
}

function applyTheme(theme) {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('theme', theme);
}

function updateTodayDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('todayDate').textContent = today.toLocaleDateString('en-US', options);
}

function updateCurrentMonth() {
    const options = { year: 'numeric', month: 'long' };
    document.getElementById('currentMonth').textContent = currentMonth.toLocaleDateString('en-US', options);
}

function loadHabits() {
    const data = loadData();
    habits = getSortedHabits(data);
    renderCalendar();
}

function getScrollState() {
    const calendarContainer = document.querySelector('.calendar-container');
    return {
        windowY: window.scrollY,
        calendarX: calendarContainer ? calendarContainer.scrollLeft : 0
    };
}

function restoreScrollState(state) {
    requestAnimationFrame(() => {
        window.scrollTo(0, state.windowY);
        const calendarContainer = document.querySelector('.calendar-container');
        if (calendarContainer) {
            calendarContainer.scrollLeft = state.calendarX;
        }
    });
}

function getHabitCell(habitId, date) {
    const row = document.querySelector(`tr[data-habit-id="${habitId}"]`);
    if (!row) return null;
    const day = parseInt(date.split('-')[2], 10);
    return row.cells[day] || null;
}

function updateEntryCell(habitId, date, value) {
    const habit = habits.find(h => h.id === habitId);
    const cell = getHabitCell(habitId, date);
    if (!habit || !cell) return;

    const iconColor = habit.color || '#007bff';
    cell.classList.add('completed');
    let html = `<i class="${habit.icon} habit-icon" style="color: ${iconColor}"></i>`;
    if (value !== '✓') {
        html += `<span class="value-text">${value}</span>`;
    }
    cell.querySelector('.habit-value').innerHTML = html;

    if (!cell.querySelector('.edit-overlay')) {
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

function renderCalendar() {
    const scrollState = getScrollState();
    const calendarBody = document.getElementById('calendarBody');
    const calendarTable = document.getElementById('calendarTable');
    const data = loadData();

    calendarBody.innerHTML = '';

    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();

    const thead = calendarTable.querySelector('thead');
    thead.innerHTML = '';

    const dayRow = document.createElement('tr');
    dayRow.innerHTML = '<th></th>';

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

    const dateRow = document.createElement('tr');
    dateRow.innerHTML = '<th>Habit</th>';

    for (let day = 1; day <= daysInMonth; day++) {
        const th = document.createElement('th');
        th.textContent = day;
        dateRow.appendChild(th);
    }

    thead.appendChild(dayRow);
    thead.appendChild(dateRow);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const monthEntries = getMonthEntries(data, year, month);
    const todayStr = formatLocalDate(new Date());

    for (let habit of habits) {
        const row = document.createElement('tr');
        row.className = 'habit-row';
        row.setAttribute('data-habit-id', habit.id);

        const nameCell = document.createElement('td');
        nameCell.className = 'habit-name';
        nameCell.innerHTML = `
            <i class="fas fa-grip-vertical drag-handle"></i>
            <span>${habit.name}</span>
            <div class="edit-overlay" onclick="editHabit(${habit.id})">e</div>
            <div class="delete-overlay" onclick="deleteHabit(${habit.id})">×</div>
        `;
        row.appendChild(nameCell);

        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('td');
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateStr = formatLocalDate(date);
            const isToday = dateStr === todayStr;

            cell.className = 'habit-cell';
            if (isToday) cell.classList.add('today');

            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                cell.classList.add('weekend');
            }

            cell.innerHTML = `<div class="habit-value"></div>`;
            cell.onclick = () => toggleEntry(habit.id, dateStr, habit.icon, cell);
            populateCellWithEntry(habit.id, dateStr, cell, habit.icon, monthEntries);
            row.appendChild(cell);
        }

        calendarBody.appendChild(row);
    }

    restoreScrollState(scrollState);
}

function populateCellWithEntry(habitId, date, cell, icon, monthEntries) {
    const habitEntries = monthEntries[habitId] || {};
    const entryValue = habitEntries[date];

    if (entryValue) {
        const habit = habits.find(h => h.id === habitId);
        const iconColor = (habit && habit.color) || '#007bff';
        cell.querySelector('.habit-value').innerHTML = `<i class="${icon} habit-icon" style="color: ${iconColor}"></i>`;
        if (entryValue !== '✓') {
            cell.querySelector('.habit-value').innerHTML += `<span class="value-text">${entryValue}</span>`;
        }
        cell.classList.add('completed');

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

function toggleEntry(habitId, date, icon, cell) {
    const data = loadData();
    const habitKey = String(habitId);
    if (!data.entries[habitKey]) {
        data.entries[habitKey] = {};
    }

    const hasEntry = cell.classList.contains('completed');

    if (hasEntry) {
        delete data.entries[habitKey][date];
        saveData(data);
        cell.classList.remove('completed');
        cell.querySelector('.habit-value').innerHTML = '';
        const overlay = cell.querySelector('.edit-overlay');
        if (overlay) overlay.remove();
    } else {
        data.entries[habitKey][date] = '✓';
        saveData(data);
        cell.classList.add('completed');
        const habit = habits.find(h => h.id === habitId);
        const iconColor = (habit && habit.color) || '#007bff';
        cell.querySelector('.habit-value').innerHTML = `<i class="${icon} habit-icon" style="color: ${iconColor}"></i>`;

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

function selectIcon(icon) {
    selectedIcon = icon;
    updateIconSelection();
}

function selectColor(color) {
    selectedColor = color;
    updateColorSelection();
}

function updateIconSelection() {
    document.querySelectorAll('.icon-option').forEach(option => {
        option.classList.remove('selected');
        if (option.querySelector('i').className === selectedIcon) {
            option.classList.add('selected');
        }
    });
}

function updateColorSelection() {
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
        const rgb = hexToRgb(selectedColor);
        if (option.style.backgroundColor === selectedColor ||
            (rgb && option.style.backgroundColor === `rgb(${rgb.join(', ')})`)) {
            option.classList.add('selected');
        }
    });
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

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

function editEntry(habitId, date) {
    editingEntryData = { habitId, date };
    const data = loadData();
    const existing = (data.entries[String(habitId)] || {})[date] || '';
    document.getElementById('entryValue').value = existing === '✓' ? '' : existing;
    document.getElementById('entryModal').style.display = 'block';
}

function deleteHabit(habitId) {
    if (!confirm('Are you sure you want to delete this habit?')) return;

    const data = loadData();
    data.habits = data.habits.filter(h => h.id !== habitId);
    delete data.entries[String(habitId)];
    saveData(data);
    loadHabits();
}

function exportData() {
    const data = loadData();
    const sorted = getSortedHabits(data);
    const lines = [['Habit Name', 'Icon', 'Color', 'Sort Order', 'Date', 'Value']
        .map(escapeCsvField).join(',')];

    for (const habit of sorted) {
        const habitEntries = data.entries[String(habit.id)] || {};
        const dates = Object.keys(habitEntries).sort();

        if (dates.length === 0) {
            lines.push([
                habit.name,
                habit.icon,
                habit.color || '#007bff',
                habit.sort_order ?? '',
                '',
                ''
            ].map(escapeCsvField).join(','));
            continue;
        }

        for (const date of dates) {
            let value = habitEntries[date];
            if (value === '✓') value = 'COMPLETED';
            lines.push([
                habit.name,
                habit.icon,
                habit.color || '#007bff',
                habit.sort_order ?? '',
                date,
                value
            ].map(escapeCsvField).join(','));
        }
    }

    const bom = '\uFEFF';
    const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = formatLocalDate(new Date());
    link.href = url;
    link.download = `habits_export_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importCsvText(content) {
    const rows = parseCsv(content.replace(/^\uFEFF/, ''));
    if (rows.length === 0) {
        throw new Error('CSV file is empty');
    }

    const header = rows[0].map(col => String(col).trim().toLowerCase());
    const newFormat = header.includes('color');
    const dataRows = rows.slice(1);

    const habitCache = {};
    const habitsList = [];
    const entries = {};
    let nextSortOrder = 1;
    let nextId = 1;

    for (const row of dataRows) {
        let habitName, icon, color, sortOrder, entryDate, value;

        if (newFormat && row.length >= 6) {
            habitName = String(row[0] || '').trim();
            icon = String(row[1] || '').trim();
            color = String(row[2] || '').trim() || '#007bff';
            try {
                sortOrder = parseInt(row[3], 10);
                if (Number.isNaN(sortOrder)) sortOrder = nextSortOrder;
            } catch (e) {
                sortOrder = nextSortOrder;
            }
            entryDate = String(row[4] || '').trim();
            value = String(row[5] || '');
        } else if (row.length >= 4) {
            habitName = String(row[0] || '').trim();
            icon = String(row[1] || '').trim();
            color = '#007bff';
            sortOrder = nextSortOrder;
            entryDate = String(row[2] || '').trim();
            value = String(row[3] || '');
        } else {
            continue;
        }

        if (!habitName) continue;

        if (!(habitName in habitCache)) {
            const id = nextId++;
            habitCache[habitName] = id;
            habitsList.push({
                id,
                name: habitName,
                icon: icon || 'fas fa-star',
                color,
                sort_order: sortOrder
            });
            entries[String(id)] = {};
            if (!newFormat) nextSortOrder += 1;
        }

        const habitId = habitCache[habitName];
        if (entryDate) {
            if (value === 'COMPLETED') value = '✓';
            entries[String(habitId)][entryDate] = value;
        }
    }

    saveData({ habits: habitsList, entries, nextId });
}

function setupEventListeners() {
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', function(e) {
            applyTheme(e.target.value);
        });
    }

    document.getElementById('habitForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const habitName = document.getElementById('habitName').value.trim();
        if (!habitName) return;

        const data = loadData();

        if (editingHabitId) {
            const habit = data.habits.find(h => h.id === editingHabitId);
            if (habit) {
                habit.name = habitName;
                habit.icon = selectedIcon;
                habit.color = selectedColor;
            }
        } else {
            const maxSort = data.habits.reduce((max, h) => Math.max(max, h.sort_order ?? 0), 0);
            const id = data.nextId++;
            data.habits.push({
                id,
                name: habitName,
                icon: selectedIcon,
                color: selectedColor,
                sort_order: maxSort + 1
            });
            data.entries[String(id)] = {};
        }

        saveData(data);
        closeHabitModal();
        loadHabits();
    });

    document.getElementById('entryForm').addEventListener('submit', function(e) {
        e.preventDefault();

        if (!editingEntryData) return;

        const value = document.getElementById('entryValue').value.trim();
        const { habitId, date } = editingEntryData;
        const savedValue = value || '✓';
        const data = loadData();
        const habitKey = String(habitId);

        if (!data.entries[habitKey]) {
            data.entries[habitKey] = {};
        }
        data.entries[habitKey][date] = savedValue;
        saveData(data);

        const savedScroll = getScrollState();
        closeEntryModal();
        updateEntryCell(habitId, date, savedValue);
        restoreScrollState(savedScroll);
    });

    document.getElementById('importForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                importCsvText(String(event.target.result || ''));
                closeImportModal();
                fileInput.value = '';
                loadHabits();
                alert('Data imported successfully!');
            } catch (error) {
                console.error('Error importing data:', error);
                alert('Import failed: ' + error.message);
            }
        };
        reader.onerror = function() {
            alert('Import failed: could not read file');
        };
        reader.readAsText(file);
    });

    window.onclick = function(event) {
        const habitModal = document.getElementById('habitModal');
        const entryModal = document.getElementById('entryModal');
        const importModal = document.getElementById('importModal');

        if (event.target === habitModal) closeHabitModal();
        if (event.target === entryModal) closeEntryModal();
        if (event.target === importModal) closeImportModal();
    };
}

function initializeSortable() {
    const calendarBody = document.getElementById('calendarBody');

    new Sortable(calendarBody, {
        handle: '.drag-handle',
        animation: 150,
        onEnd: function(evt) {
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;

            if (oldIndex === newIndex) return;

            const habit = habits.splice(oldIndex, 1)[0];
            habits.splice(newIndex, 0, habit);

            const data = loadData();
            habits.forEach((h, index) => {
                const stored = data.habits.find(item => item.id === h.id);
                if (stored) {
                    stored.sort_order = index + 1;
                    h.sort_order = index + 1;
                }
            });
            saveData(data);
        }
    });
}

function setupAutoRefresh() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
        updateTodayDate();
        renderCalendar();

        setInterval(() => {
            updateTodayDate();
            renderCalendar();
        }, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
}
