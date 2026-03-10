import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { format } from 'date-fns';

const CalendarView = ({ habits, completions }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Adjust logic to get a 6-week grid or just month days
    // Logic: similar to script.js
    
    const changeMonth = (offset) => {
        setCurrentDate(new Date(year, month + offset, 1));
    };

    const getDayData = (day) => {
        // Create a local Date object for the current calendar day
        const calendarLocalDay = new Date(year, month, day);
        // Format this local Date object into a 'YYYY-MM-DD' string
        const formattedCalendarDay = format(calendarLocalDay, 'yyyy-MM-dd');

        if (habits.length === 0) return 0;

        const dayOfWeek = calendarLocalDay.getDay(); // Use calendarLocalDay instead of creating new Date
        const activeHabits = habits.filter(h => {
             if (h.frequency === 'daily') return true;
             if (h.frequency === 'weekly') return dayOfWeek === 1;
             if (h.frequency === 'custom') return h.customDays?.includes(dayOfWeek);
             return false;
        });

        if (activeHabits.length === 0) return 0;

        const completedCount = activeHabits.filter(h =>
            completions.some(c => {
                // Safely handle potentially invalid c.date
                let formattedCompletionDay = null;
                if (c.date) { // Check if c.date exists
                    const completionDateObject = new Date(c.date);
                    // Check if the date object is valid before formatting
                    if (!isNaN(completionDateObject.getTime())) {
                        formattedCompletionDay = format(completionDateObject, 'yyyy-MM-dd');
                    }
                }
                return c.habitId === h._id && formattedCompletionDay === formattedCalendarDay && c.completed;
            })
        ).length;

        return (completedCount / activeHabits.length) * 100;
    };

    const renderCalendarGrid = () => {
        const days = [];
        // Empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day other-month"></div>);
        }
        
        // Days of month
        for (let i = 1; i <= daysInMonth; i++) {
            const percentage = getDayData(i);
            const todayFormatted = format(new Date(), 'yyyy-MM-dd');
            const currentDayFormatted = format(new Date(year, month, i), 'yyyy-MM-dd');
            const isToday = todayFormatted === currentDayFormatted;
            
            days.push(
                <div key={i} className={`calendar-day ${isToday ? 'today' : ''} ${percentage > 0 ? 'has-progress' : ''}`}>
                    <div className="calendar-day-number">{i}</div>
                    <div className="calendar-progress">
                        <div className="calendar-progress-bar" style={{ width: `${percentage}%` }}></div>
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="tab-content active">
             <div className="calendar-header">
                <button onClick={() => changeMonth(-1)}><FaChevronLeft /></button>
                <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => changeMonth(1)}><FaChevronRight /></button>
            </div>
            <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="calendar-day header">{d}</div>
                ))}
                {renderCalendarGrid()}
            </div>
        </div>
    );
};

export default CalendarView;