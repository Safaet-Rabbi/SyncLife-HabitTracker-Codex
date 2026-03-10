import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudents, fetchDashboardStats, setSelectedStudentId } from '../features/tuition/tuitionSlice'; // Added setSelectedStudentId
import StatsWidget from '../components/tuition/StatsWidget';
import StudentForm from '../components/tuition/StudentForm';
import StudentCard from '../components/tuition/StudentCard';
import AttendanceCalendar from '../components/tuition/AttendanceCalendar';
import { FaPlus } from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TuitionTracker = () => {
  const dispatch = useDispatch();
  const { students, isLoading, error, selectedStudentId } = useSelector((state) => state.tuition);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false); // New state for edit modal
  const [search, setSearch] = useState('');

  const selectedStudent = useSelector((state) =>
    state.tuition.students.find((student) => student._id === state.tuition.selectedStudentId)
  );

  const filteredStudents = students.filter((student) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      student.name.toLowerCase().includes(term) ||
      student.className.toLowerCase().includes(term) ||
      student.location.toLowerCase().includes(term)
    );
  });

  useEffect(() => {
    dispatch(fetchStudents());
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        Error loading data: {error}
      </div>
    );
  }

  // Function to open edit modal
  const handleOpenEditModal = () => setShowEditStudentModal(true);

  return (
    <main className="container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />

      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Tuition Tracker System</h2>

      {/* Stats Widget - Wrap in card style */}
      <div className="dashboard-card mb-6">
        <StatsWidget />
      </div>

      {/* Student List Section - Main Content Card */}
      <div className="tab-content active">
        <div className="habits-header mb-6">
          <h2>Students</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, class, location"
              style={{ minWidth: 240 }}
            />
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="btn-primary"
            >
              <FaPlus className="mr-2" /> Add Student
            </button>
          </div>
        </div>

        {selectedStudent && (
          <div className="dashboard-card mb-4">
            <h3 style={{ marginBottom: 8 }}>Selected Student</h3>
            <p>
              <strong>{selectedStudent.name}</strong> | Class: {selectedStudent.className} | Location: {selectedStudent.location}
            </p>
          </div>
        )}

        <div className="habits-list">
          {isLoading && students.length === 0 ? (
            <div className="empty-state">
              <h3>Loading students...</h3>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="empty-state">
              <h3>No matching students found.</h3>
              <p>Try another search or add a new student.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.map((student) => (
                <StudentCard key={student._id} student={student} onOpenEditModal={handleOpenEditModal} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Calendar - Wrap in card style */}
      <div className="dashboard-card mt-6">
        <AttendanceCalendar />
      </div>

      {/* StudentForm for adding */}
      <StudentForm isOpen={showAddStudentModal} onClose={() => setShowAddStudentModal(false)} />

      {/* StudentForm for editing */}
      {selectedStudent && (
        <StudentForm
          isOpen={showEditStudentModal}
          onClose={() => {
            setShowEditStudentModal(false);
            dispatch(setSelectedStudentId(null)); // Clear selected student when closing edit modal
          }}
          studentToEdit={selectedStudent}
        />
      )}
    </main>
  );
};

export default TuitionTracker;
