<script lang="ts">
    import { browser } from '$app/environment';
    
    export let value: Date | { from: Date | null; to: Date | null } | string | null = null;
    export let range: boolean = false;
    export let timeMode: boolean = false;
    export let use24Hour: boolean = false;
    export let placeholder: string = 'Select date';
    export let disabled: boolean = false;
    export let clearable: boolean = false;
    export let className: string = '';
    export let size: 'sm' | 'md' | 'lg' = 'md';
    export let minDate: Date | null = null;
    export let maxDate: Date | null = null;
    export let onSelect: ((date: Date | null) => void) | ((start: Date | null, end: Date | null) => void) | undefined = undefined;
    export let id: string = 'date-picker-' + Math.random().toString(36).substr(2, 9);

    // Size classes to match other form components
    const sizeClasses = {
        sm: 'siq-btn-sm',
        md: 'px-4 py-2 text-base',
        lg: 'siq-btn-lg'
    };

    let showCalendar = false;
    let currentMonth = new Date();
    let selectedStart: Date | null = null;
    let selectedEnd: Date | null = null;
    let isSelecting = false;
    let hoveredDate: Date | null = null;
    let forceUpdate = 0; // Force re-render trigger
    let datePickerElement: HTMLDivElement;
    let calendarPanel: HTMLDivElement;
    let showAbove = false;
    
    // Time selection state
    let startHour = 9;
    let startMinute = 0;
    let startAmPm = 'AM';
    let endHour = 17;
    let endMinute = 0;
    let endAmPm = 'PM';

    // Helper function to format date
    function formatDate(date: Date | undefined): string {
        if (!date) {
            return '';
        }

        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
        
        if(!timeMode) {
            return `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}, ${year}`;
        }
        
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        
        if(use24Hour) {
            return `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}, ${year} ${hours}:${minutes}`;
        }
        
        const hour12 = date.getUTCHours() % 12 || 12;
        const ampm = date.getUTCHours() >= 12 ? 'PM' : 'AM';
        return `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}, ${year} ${hour12}:${minutes} ${ampm}`;
    }

    // Update selected dates when value changes externally
    $: if (range && value && typeof value === 'object' && 'from' in value) {
        selectedStart = value.from;
        selectedEnd = value.to;
    }
    $: if (!range && value instanceof Date) {
        selectedStart = value;
        selectedEnd = null;
    }
    $: if (!value) {
        selectedStart = null;
        selectedEnd = null;
    }
    $: if (typeof value === 'string') {
        value = new Date(value);
    }

    // Get display text - Fix the complex logic
    $: displayText = (() => {
        if (range) {
            if (value && typeof value === 'object' && 'from' in value) {
                if (value.from && value.to) {
                    return `${formatDate(value.from)} - ${formatDate(value.to)}`;
                } else if (value.from) {
                    return formatDate(value.from);
                }
            }
            return placeholder;
        } else {
            if (value instanceof Date) {
                return formatDate(value);
            }
            return placeholder;
        }
    })();

    // Helper function to normalize date for comparison (start of day)
    function normalizeDate(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    // Helper function to check if two dates represent the same calendar day
    function isSameDay(date1: Date | null, date2: Date | null): boolean {
        if (!date1 || !date2) return false;
        return date1.getUTCFullYear() === date2.getUTCFullYear() &&
               date1.getUTCMonth() === date2.getUTCMonth() &&
               date1.getUTCDate() === date2.getUTCDate();
    }

    // Helper function to check if a calendar day matches a UTC date
    function calendarDayMatchesUTCDate(calendarDay: Date, utcDate: Date | null): boolean {
        if (!utcDate) return false;
        return calendarDay.getFullYear() === utcDate.getUTCFullYear() &&
               calendarDay.getMonth() === utcDate.getUTCMonth() &&
               calendarDay.getDate() === utcDate.getUTCDate();
    }

    // Helper function to check if a date is disabled
    function isDateDisabled(date: Date): boolean {
        const normalizedDate = normalizeDate(date);
        
        // Check global min/max constraints
        if (minDate && normalizedDate < normalizeDate(minDate)) return true;
        if (maxDate && normalizedDate > normalizeDate(maxDate)) return true;
        
        // For range selection, add dynamic constraints
        if (range && isSelecting && selectedStart) {
            // When selecting end date, it must be >= start date
            if (normalizedDate < normalizeDate(selectedStart)) return true;
        }
        
        return false;
    }

    // Get calendar days
    $: calendarDays = (() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const days = [];
        
        // Add days from previous month
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const prevMonthDate = new Date(year, month, 0 - i);
            days.push({ date: prevMonthDate, isCurrentMonth: false });
        }
        
        // Add days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentMonthDate = new Date(year, month, day);
            days.push({ date: currentMonthDate, isCurrentMonth: true });
        }
        
        // Add days from next month to fill the grid (only if needed)
        const totalCells = days.length;
        const rowsNeeded = Math.ceil(totalCells / 7);
        const cellsNeeded = rowsNeeded * 7;
        const remainingCells = cellsNeeded - totalCells;
        
        for (let day = 1; day <= remainingCells; day++) {
            const nextMonthDate = new Date(year, month + 1, day);
            days.push({ date: nextMonthDate, isCurrentMonth: false });
        }
        
        return days;
    })();


    // Handle date hover for range preview
    function handleDateHover(date: Date) {
        if (disabled || !range || !isSelecting) return;
        hoveredDate = date;
    }

    // Handle date click
    function handleDateClick(date: Date) {
        if (disabled || isDateDisabled(date)) return;

        if (range) {
            if (!isSelecting) {
                // Start selecting
                selectedStart = createDateWithTime(date, startHour, startMinute, startAmPm, false);
                selectedEnd = null;
                isSelecting = true;
                value = { from: selectedStart, to: null };
            } else {
                // Complete selection
                const endDate = createDateWithTime(date, endHour, endMinute, endAmPm, true);
                if (endDate < selectedStart!) {
                    selectedEnd = selectedStart;
                    selectedStart = endDate;
                } else {
                    selectedEnd = endDate;
                }
                isSelecting = false;
                value = { from: selectedStart, to: selectedEnd };
                if (!timeMode) showCalendar = false; // Close calendar when range is complete (unless in time mode)
                
                if (onSelect) {
                    (onSelect as (start: Date | null, end: Date | null) => void)(selectedStart, selectedEnd);
                }
            }
        } else {
            // Single date selection
            const finalDate = createDateWithTime(date, startHour, startMinute, startAmPm, false);
            value = finalDate;
            if (!timeMode) showCalendar = false;
            
            if (onSelect) {
                (onSelect as (date: Date | null) => void)(finalDate);
            }
        }
        
        forceUpdate++;
    }

    // Convert 12-hour to 24-hour format
    function convertTo24Hour(hour: number, amPm: string): number {
        if (amPm === 'AM') {
            return hour === 12 ? 0 : hour;
        } else {
            return hour === 12 ? 12 : hour + 12;
        }
    }

    // Convert 24-hour to 12-hour format
    function convertTo12Hour(hour: number): { hour: number; amPm: string } {
        if (hour === 0) return { hour: 12, amPm: 'AM' };
        if (hour < 12) return { hour, amPm: 'AM' };
        if (hour === 12) return { hour: 12, amPm: 'PM' };
        return { hour: hour - 12, amPm: 'PM' };
    }

    function createDateWithTime(date: Date, hour: number, minute: number, amPm?: string, isEndDate: boolean = false): Date {
        if (timeMode) {
            const newDate = new Date(date);
            const finalHour = use24Hour ? hour : convertTo24Hour(hour, amPm!);
            newDate.setHours(finalHour, minute, 0, 0);
            return newDate;
        } else {
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            if (isEndDate && range) {
                return new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
            } else {
                return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
            }
        }
    }

    $: if (timeMode && selectedStart) {
        const { hour: h, amPm } = use24Hour 
            ? { hour: selectedStart.getHours(), amPm: 'AM' }
            : convertTo12Hour(selectedStart.getHours());
        startHour = use24Hour ? h : h;
        startMinute = selectedStart.getMinutes();
        if (!use24Hour) startAmPm = amPm;
    }

    $: if (timeMode && selectedEnd) {
        const { hour: h, amPm } = use24Hour 
            ? { hour: selectedEnd.getHours(), amPm: 'AM' }
            : convertTo12Hour(selectedEnd.getHours());
        endHour = use24Hour ? h : h;
        endMinute = selectedEnd.getMinutes();
        if (!use24Hour) endAmPm = amPm;
    }

    function updateStartTime() {
        if (selectedStart && timeMode) {
            selectedStart = createDateWithTime(selectedStart, startHour, startMinute, startAmPm);
            if (range) {
                value = { from: selectedStart, to: selectedEnd };
            } else {
                value = selectedStart;
            }
            
            if (onSelect) {
                if (range) {
                    (onSelect as (start: Date | null, end: Date | null) => void)(selectedStart, selectedEnd);
                } else {
                    (onSelect as (date: Date | null) => void)(selectedStart);
                }
            }
        }
    }

    function updateEndTime() {
        if (selectedEnd && timeMode && range) {
            selectedEnd = createDateWithTime(selectedEnd, endHour, endMinute, endAmPm);
            value = { from: selectedStart, to: selectedEnd };
            
            if (onSelect) {
                (onSelect as (start: Date | null, end: Date | null) => void)(selectedStart, selectedEnd);
            }
        }
    }

    function clearSelection() {
        selectedStart = null;
        selectedEnd = null;
        isSelecting = false;
        hoveredDate = null;
        value = range ? { from: null, to: null } : null;
        
        if (onSelect) {
            if (range) {
                (onSelect as (start: Date | null, end: Date | null) => void)(null, null);
            } else {
                (onSelect as (date: Date | null) => void)(null);
            }
        }
    }

    // Navigate months
    function previousMonth() {
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    }

    function nextMonth() {
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }

    // Calculate optimal panel position
    function calculatePanelPosition() {
        if (!datePickerElement || !browser) return;
        
        const rect = datePickerElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const panelHeight = 350; // Approximate panel height
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Show above if there's not enough space below but enough space above
        showAbove = spaceBelow < panelHeight && spaceAbove > panelHeight;
    }

    // Toggle calendar
    function toggleCalendar() {
        if (disabled) return;
        if (!showCalendar) {
            calculatePanelPosition();
        }
        showCalendar = !showCalendar;
    }

    // Close calendar when clicking outside
    function handleClickOutside(event: MouseEvent) {
        if (datePickerElement && !datePickerElement.contains(event.target as Node)) {
            if (range && isSelecting && selectedStart && !selectedEnd) {
                // Clear incomplete range selection
                selectedStart = null;
                selectedEnd = null;
                value = { from: null, to: null };
                if (onSelect) {
                    (onSelect as (start: Date | null, end: Date | null) => void)(null, null);
                }
            }
            showCalendar = false;
            isSelecting = false; // Reset selection state
        }
    }

    // Handle keyboard events
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            if (range && isSelecting && selectedStart && !selectedEnd) {
                // Clear incomplete range selection
                selectedStart = null;
                selectedEnd = null;
                value = { from: null, to: null };
                if (onSelect) {
                    (onSelect as (start: Date | null, end: Date | null) => void)(null, null);
                }
            }
            showCalendar = false;
            isSelecting = false;
        }
    }

    // Handle window resize to recalculate position
    function handleResize() {
        if (showCalendar) {
            calculatePanelPosition();
        }
    }
</script>

<svelte:window on:click={handleClickOutside} on:keydown={handleKeydown} on:resize={handleResize} />

<div class="relative w-full {className}" bind:this={datePickerElement}>
    <button {id}
        type="button"
        class="
            siq-form-control w-full text-left flex items-center justify-between
            {sizeClasses[size]}
            {className}
        "
        class:cursor-not-allowed={disabled}
        on:click={toggleCalendar}
        {disabled}
        >
        <span class="block truncate {displayText === placeholder ? 'text-surface-500 dark:text-surface-400' : ''}">{displayText}</span>
        <div class="flex items-center gap-2">
            {#if clearable && ((range && value && typeof value === 'object' && 'from' in value && (value.from || value.to)) || (!range && value))}
                <span
                    role="button"
                    tabindex="0"
                    on:click={(e) => {
                        e.stopPropagation();
                        clearSelection();
                    }}
                    on:keydown={(e) => e.key === 'Enter' && clearSelection()}
                    class="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors cursor-pointer"
                    aria-label="Clear selection"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </span>
            {/if}
            <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
        </div>
    </button>

    {#if showCalendar}
        <div 
            bind:this={calendarPanel}
            class="absolute left-0 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg p-4 z-50 w-full {showAbove ? 'bottom-full mb-1' : 'top-full mt-1'}"
        >
            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
                <button
                    type="button"
                    on:click={previousMonth}
                    class="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded transition-colors"
                    aria-label="Previous month"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                
                <h3 class="text-sm font-medium text-surface-900 dark:text-surface-100">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                
                <button
                    type="button"
                    on:click={nextMonth}
                    class="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded transition-colors"
                    aria-label="Next month"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>
            </div>

            <!-- Calendar Grid -->
            <div class="grid grid-cols-7 gap-1 mb-2">
                <!-- Day headers -->
                {#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as day}
                    <div class="text-xs font-medium text-surface-500 dark:text-surface-400 text-center py-2">
                        {day}
                    </div>
                {/each}

                <!-- Calendar days -->
                {#each calendarDays as dayObj}
                    {@const day = dayObj.date}
                    {@const isCurrentMonth = dayObj.isCurrentMonth}
                    {@const isSelected = range 
                        ? (calendarDayMatchesUTCDate(day, selectedStart) || calendarDayMatchesUTCDate(day, selectedEnd))
                        : calendarDayMatchesUTCDate(day, selectedStart)}
                    {@const isInRange = range && selectedStart && selectedEnd && (() => {
                        const dayUTC = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));
                        const startUTC = new Date(Date.UTC(selectedStart.getUTCFullYear(), selectedStart.getUTCMonth(), selectedStart.getUTCDate()));
                        const endUTC = new Date(Date.UTC(selectedEnd.getUTCFullYear(), selectedEnd.getUTCMonth(), selectedEnd.getUTCDate()));
                        return dayUTC > startUTC && dayUTC < endUTC;
                    })()}
                    {@const isInPartialRange = range && selectedStart && !selectedEnd && hoveredDate && isSelecting && (() => {
                        const dayUTC = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));
                        const startUTC = new Date(Date.UTC(selectedStart.getUTCFullYear(), selectedStart.getUTCMonth(), selectedStart.getUTCDate()));
                        const hoverUTC = new Date(Date.UTC(hoveredDate.getFullYear(), hoveredDate.getMonth(), hoveredDate.getDate()));
                        const minDate = startUTC < hoverUTC ? startUTC : hoverUTC;
                        const maxDate = startUTC < hoverUTC ? hoverUTC : startUTC;
                        return dayUTC >= minDate && dayUTC <= maxDate;
                    })()}
                    {@const isDisabled = isDateDisabled(day)}
                    
                    <button
                        type="button"
                        disabled={isDisabled}
                        class="
                            w-8 h-8 text-sm rounded transition-colors
                            {isDisabled
                                ? 'text-surface-300 dark:text-surface-600 cursor-not-allowed'
                                : isSelected 
                                ? 'bg-primary-600 text-white font-semibold' 
                                : isInRange
                                ? 'bg-primary-500/30 text-primary-200'
                                : isInPartialRange
                                ? 'bg-primary-500/20 text-primary-300'
                                : isCurrentMonth
                                ? 'text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-100'
                                : 'text-surface-500 dark:text-surface-400 hover:bg-surface-200/50 dark:hover:bg-surface-700/50 hover:text-surface-600 dark:hover:text-surface-300'
                            }
                        "
                        on:click={() => handleDateClick(day)}
                        on:mouseenter={() => handleDateHover(day)}
                    >
                        {day.getDate()}
                    </button>
                {/each}
            </div>

            <!-- Time Selection (only show if timeMode is enabled) -->
            {#if timeMode}
                <div class="border-t border-surface-200 dark:border-surface-700 pt-4 mt-4">
                    <div class="space-y-4">
                        <!-- Start Time (or single date time) -->
                        <div>
                            <label for="start-hour" class="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-2">
                                {range ? 'Start Time' : 'Time'}
                            </label>
                            <div class="flex items-center space-x-2">
                                <!-- Hour -->
                                <select 
                                    id="start-hour"
                                    bind:value={startHour}
                                    on:change={updateStartTime}
                                    class="siq-form-control text-sm py-1 px-2 w-16"
                                >
                                    {#if use24Hour}
                                        {#each Array(24) as _, i}
                                            <option value={i}>{i.toString().padStart(2, '0')}</option>
                                        {/each}
                                    {:else}
                                        {#each Array(12) as _, i}
                                            <option value={i + 1}>{i + 1}</option>
                                        {/each}
                                    {/if}
                                </select>
                                
                                <span class="text-surface-500">:</span>
                                
                                <!-- Minute -->
                                <select 
                                    bind:value={startMinute}
                                    on:change={updateStartTime}
                                    class="siq-form-control text-sm py-1 px-2 w-16"
                                >
                                    {#each Array(60) as _, i}
                                        <option value={i}>{i.toString().padStart(2, '0')}</option>
                                    {/each}
                                </select>
                                
                                <!-- AM/PM -->
                                {#if !use24Hour}
                                    <select 
                                        bind:value={startAmPm}
                                        on:change={updateStartTime}
                                        class="siq-form-control text-sm py-1 px-2 w-16"
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                {/if}
                            </div>
                        </div>

                        <!-- End Time (only for range mode) -->
                        {#if range}
                            <div>
                                <label for="end-hour" class="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    End Time
                                </label>
                                <div class="flex items-center space-x-2">
                                    <!-- Hour -->
                                    <select 
                                        id="end-hour"
                                        bind:value={endHour}
                                        on:change={updateEndTime}
                                        class="siq-form-control text-sm py-1 px-2 w-16"
                                    >
                                        {#if use24Hour}
                                            {#each Array(24) as _, i}
                                                <option value={i}>{i.toString().padStart(2, '0')}</option>
                                            {/each}
                                        {:else}
                                            {#each Array(12) as _, i}
                                                <option value={i + 1}>{i + 1}</option>
                                            {/each}
                                        {/if}
                                    </select>
                                    
                                    <span class="text-surface-500">:</span>
                                    
                                    <!-- Minute -->
                                    <select 
                                        bind:value={endMinute}
                                        on:change={updateEndTime}
                                        class="siq-form-control text-sm py-1 px-2 w-16"
                                    >
                                        {#each Array(60) as _, i}
                                            <option value={i}>{i.toString().padStart(2, '0')}</option>
                                        {/each}
                                    </select>
                                    
                                    <!-- AM/PM -->
                                    {#if !use24Hour}
                                        <select 
                                            bind:value={endAmPm}
                                            on:change={updateEndTime}
                                            class="siq-form-control text-sm py-1 px-2 w-16"
                                        >
                                            <option value="AM">AM</option>
                                            <option value="PM">PM</option>
                                        </select>
                                    {/if}
                                </div>
                            </div>
                        {/if}
                    </div>

                    <!-- Apply button for time mode -->
                    <div class="flex justify-end mt-4 pt-3 border-t border-surface-200 dark:border-surface-700">
                        <button
                            type="button"
                            class="siq-btn siq-btn-primary text-sm px-4 py-2"
                            on:click={() => showCalendar = false}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            {/if}

            <!-- Today button -->
            {#if !range && !timeMode}
                <div class="flex justify-center mt-4">
                    <button
                        type="button"
                        class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        on:click={() => {
                            const today = new Date();
                            handleDateClick(today);
                        }}>
                        Today
                    </button>
                </div>
            {/if}
        </div>
    {/if}
</div>
