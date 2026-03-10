import React from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendar, FaTag } from 'react-icons/fa';

const HabitList = ({ habits, completions, onEdit, onDelete, onAdd }) => {
    
    const getCategoryColor = (category) => {
        const colors = {
            health: '#ff6b6b',
            productivity: '#4ecdc4',
            learning: '#45b7d1',
            mindfulness: '#96ceb4',
            social: '#feca57',
            creativity: '#ff9ff3',
            other: '#54a0ff'
        };
        return colors[category] || '#54a0ff';
    };

    return (
        <div className="tab-content active">
             <div className="habits-header">
                <h2>Manage Your Habits</h2>
                <button className="btn-primary" onClick={onAdd}>
                    <FaPlus /> Add New Habit
                </button>
            </div>
            <div className="habits-list">
                {habits.length === 0 ? (
                    <div className="empty-state">
                        <h3>No habits yet</h3>
                        <p>Start building better habits by adding your first one!</p>
                    </div>
                ) : (
                    habits.map(habit => (
                        <div key={habit._id} className="habit-item" style={{ borderLeftColor: getCategoryColor(habit.category) }}>
                            <div className="habit-info">
                                <h4>{habit.name}</h4>
                                <p>{habit.description || 'No description provided'}</p>
                                <div className="habit-meta">
                                    <span><FaCalendar /> {habit.frequency}</span>
                                    <span><FaTag /> {habit.category}</span>
                                </div>
                            </div>
                            <div className="habit-actions">
                                <button className="btn-small btn-edit" onClick={() => onEdit(habit)}>
                                    <FaEdit /> Edit
                                </button>
                                <button className="btn-small btn-delete" onClick={() => onDelete(habit._id)}>
                                    <FaTrash /> Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HabitList;