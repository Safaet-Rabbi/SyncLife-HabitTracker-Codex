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
  const [voiceError, setVoiceError] = useState('');
  const [voiceLang, setVoiceLang] = useState('en-US');
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
      setVoiceError('Voice input not supported in this browser.');
      return;
    }

    setVoiceSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = voiceLang;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript.trim()) {
        setTitle((prev) => `${prev} ${transcript}`.trim());
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      setIsListening(false);
      setVoiceError(event?.error ? `Voice error: ${event.error}` : 'Voice input failed.');
    };
    recognitionRef.current = recognition;
  }, [voiceLang]);

  const startVoice = () => {
    if (!recognitionRef.current) {
      setVoiceError('Voice input not initialized.');
      return;
    }
    setVoiceError('');
    setIsListening(true);
    try {
      recognitionRef.current.lang = voiceLang;
      recognitionRef.current.start();
    } catch (err) {
      setIsListening(false);
      setVoiceError('Voice input could not start. Try again.');
    }
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

  const sortedTasks = [...tasks].sort((a, b) => {
    const aPos = typeof a.position === 'number' ? a.position : 0;
    const bPos = typeof b.position === 'number' ? b.position : 0;
    return aPos - bPos;
  });

  const columns = {
    todo: sortedTasks.filter((t) => t.status === 'todo'),
    in_progress: sortedTasks.filter((t) => t.status === 'in_progress'),
    done: sortedTasks.filter((t) => t.status === 'done'),
  };

  const persistOrder = async (nextTasks) => {
    try {
      const orders = nextTasks.map((task, index) => ({ id: task._id, position: index }));
      await api.put('/v1/study/reorder', { orders });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reorder tasks');
      await loadTasks();
    }
  };

  const handleDropToColumn = async (status) => {
    if (!draggingId) return;
    const task = tasks.find((t) => t._id === draggingId);
    if (!task) return;

    let updatedTasks = tasks.map((t) =>
      t._id === task._id ? { ...t, status } : t
    );

    setTasks(updatedTasks);
    setDraggingId(null);

    if (task.status !== status) {
      await updateTaskField(task._id, { status });
    }

    const nextSorted = [
      ...updatedTasks.filter((t) => t.status === 'todo'),
      ...updatedTasks.filter((t) => t.status === 'in_progress'),
      ...updatedTasks.filter((t) => t.status === 'done'),
    ];
    await persistOrder(nextSorted);
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
        <div className="form-group">
          <label>Voice Language</label>
          <select value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)}>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="bn-BD">Bangla (BD)</option>
            <option value="hi-IN">Hindi (IN)</option>
            <option value="ar-SA">Arabic (SA)</option>
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
        {voiceError ? <p style={{ color: '#fc466b', marginTop: 8 }}>{voiceError}</p> : null}
      </div>

      <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
        <h3>Study Board (Drag Cards Across Columns)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(240px, 1fr))', gap: 12 }}>
          {['todo', 'in_progress', 'done'].map((status) => (
            <div
              key={status}
              style={{ background: '#f8fafc', borderRadius: 12, padding: 10, minHeight: 320 }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropToColumn(status)}
            >
              <h4 style={{ marginBottom: 8, textTransform: 'capitalize' }}>
                {status.replace('_', ' ')} ({columns[status].length})
              </h4>
              {columns[status].length ? columns[status].map((task) => (
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
              )) : <p style={{ fontSize: 12, color: '#666' }}>No tasks</p>}
            </div>
          ))}
        </div>
      </div>
      {error ? <p style={{ color: '#fc466b' }}>{error}</p> : null}
    </div>
  );
}

export default StudyPlanner;
