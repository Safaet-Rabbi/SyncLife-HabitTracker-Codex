import React, { useEffect, useRef, useState } from 'react';
import api from '../api';

function StudyPlanner() {
  const [subject, setSubject] = useState('Economics Engineering');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [checklistDrafts, setChecklistDrafts] = useState({});
  const [draggingId, setDraggingId] = useState(null);
  const recognitionRef = useRef(null);

  const loadTasks = async () => {
    try {
      setError('');
      const res = await api.get('/v1/study/tasks?limit=20');
      setTasks(res.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load study tasks');
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    setVoiceSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript.trim()) {
        setTitle((prev) => `${prev} ${transcript}`.trim());
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const startVoice = () => {
    if (!recognitionRef.current) return;
    setIsListening(true);
    recognitionRef.current.start();
  };

  const createTask = async () => {
    if (!title.trim()) return;
    try {
      setError('');
      await api.post('/v1/study/tasks', {
        subject,
        title,
        priority,
        status: 'todo',
        checklist: [],
      });
      setTitle('');
      setPriority('medium');
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create task');
    }
  };

  const updateTaskField = async (taskId, payload) => {
    try {
      setError('');
      await api.put(`/v1/study/tasks/${taskId}`, payload);
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update task');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      setError('');
      await api.delete(`/v1/study/tasks/${taskId}`);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete task');
    }
  };

  const toggleChecklistItem = async (task, itemId) => {
    const checklist = (task.checklist || []).map((item) =>
      item._id === itemId ? { ...item, done: !item.done } : item
    );
    await updateTaskField(task._id, { checklist });
  };

  const addChecklistItem = async (task) => {
    const draft = (checklistDrafts[task._id] || '').trim();
    if (!draft) return;
    const checklist = [...(task.checklist || []), { text: draft, done: false }];
    await updateTaskField(task._id, { checklist });
    setChecklistDrafts((prev) => ({ ...prev, [task._id]: '' }));
  };

  const handleDragStart = (taskId) => {
    setDraggingId(taskId);
  };

  const handleDrop = async (targetId) => {
    if (!draggingId || draggingId === targetId) return;
    const sourceIndex = tasks.findIndex((task) => task._id === draggingId);
    const targetIndex = tasks.findIndex((task) => task._id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reordered = [...tasks];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setTasks(reordered);
    setDraggingId(null);

    try {
      const orders = reordered.map((task, index) => ({ id: task._id, position: index }));
      await api.put('/v1/study/reorder', { orders });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reorder tasks');
      await loadTasks();
    }
  };

  return (
    <div className="dashboard-grid">
      <div className="dashboard-card">
        <h3>Add Study Task</h3>
        <div className="form-group">
          <label>Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Task Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Finish sheet / Solve previous year questions" />
        </div>
        <div className="form-group">
          <label>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={createTask}>Add Task</button>
          <button
            className="btn-secondary"
            onClick={startVoice}
            disabled={!voiceSupported || isListening}
            type="button"
          >
            {isListening ? 'Listening...' : 'Voice Input'}
          </button>
        </div>
      </div>

      <div className="dashboard-card">
        <h3>Task List (Drag to Reorder)</h3>
        {tasks.length ? tasks.map((task) => (
          <div
            key={task._id}
            className="habit-item"
            draggable
            onDragStart={() => handleDragStart(task._id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(task._id)}
            style={{ marginBottom: 12, cursor: 'grab', display: 'block' }}
          >
            <p><strong>[{task.priority}]</strong> {task.subject} - {task.title}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 8 }}>
              <select
                value={task.status}
                onChange={(e) => updateTaskField(task._id, { status: e.target.value })}
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <button className="btn-small btn-delete" onClick={() => deleteTask(task._id)} type="button">Delete</button>
            </div>

            <div>
              {(task.checklist || []).map((item) => (
                <label key={item._id} style={{ display: 'block', marginBottom: 6 }}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleChecklistItem(task, item._id)}
                  /> {item.text}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                placeholder="Add checklist item"
                value={checklistDrafts[task._id] || ''}
                onChange={(e) => setChecklistDrafts((prev) => ({ ...prev, [task._id]: e.target.value }))}
              />
              <button className="btn-small btn-edit" type="button" onClick={() => addChecklistItem(task)}>
                Add
              </button>
            </div>
          </div>
        )) : <p>No tasks yet</p>}
      </div>
      {error ? <p style={{ color: '#fc466b' }}>{error}</p> : null}
    </div>
  );
}

export default StudyPlanner;
