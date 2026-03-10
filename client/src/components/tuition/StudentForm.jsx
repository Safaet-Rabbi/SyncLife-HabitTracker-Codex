import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addStudent, updateStudent } from '../../features/tuition/tuitionSlice'; // Added updateStudent
import { X } from 'lucide-react'; // Kept X from lucide-react for now. Could be replaced with FaTimes.
import { FaSave, FaPlus } from 'react-icons/fa'; // Added FaSave and FaPlus
import { toast } from 'react-toastify';

const StudentForm = ({ isOpen, onClose, studentToEdit }) => { // Added studentToEdit prop
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.tuition);

  const [formData, setFormData] = useState({
    name: '',
    className: '',
    subjectCount: '',
    location: '',
    monthlyFee: '',
    joinedDate: new Date().toISOString().split('T')[0], // Default to today
  });

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        name: studentToEdit.name || '',
        className: studentToEdit.className || '',
        subjectCount: studentToEdit.subjectCount || '',
        location: studentToEdit.location || '',
        monthlyFee: studentToEdit.monthlyFee || '',
        joinedDate: studentToEdit.joinedDate ? new Date(studentToEdit.joinedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({ // Reset for add mode
        name: '',
        className: '',
        subjectCount: '',
        location: '',
        monthlyFee: '',
        joinedDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [studentToEdit, isOpen]); // Rerun when studentToEdit changes or modal opens

  useEffect(() => {
    if (error) {
      toast.error(`Error processing student: ${error}`); // More generic error message
    }
  }, [error]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.className || !formData.subjectCount || !formData.location) {
      toast.error('Please fill in all required fields (Name, Class, Subject Count, Location).');
      return;
    }

    const studentDataToSave = {
      ...formData,
      subjectCount: Number(formData.subjectCount),
      monthlyFee: formData.monthlyFee ? Number(formData.monthlyFee) : undefined,
    };

    try {
      if (studentToEdit) {
        await dispatch(updateStudent({ ...studentDataToSave, _id: studentToEdit._id })).unwrap();
        toast.success(`${formData.name} updated successfully!`);
      } else {
        await dispatch(addStudent(studentDataToSave)).unwrap();
        toast.success('Student added successfully!');
      }

      setFormData({ // Reset form
        name: '',
        className: '',
        subjectCount: '',
        location: '',
        monthlyFee: '',
        joinedDate: new Date().toISOString().split('T')[0],
      });
      onClose(); // Close modal on success
    } catch (err) {
      // Error handled by useEffect and toast already
      console.error(`Failed to ${studentToEdit ? 'update' : 'add'} student:`, err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            {studentToEdit ? 'Edit Student Details' : 'Add New Student'}
          </h2>
          <button
            onClick={onClose}
            className="close-btn"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="className">Class</label>
            <input
              type="text"
              id="className"
              name="className"
              value={formData.className}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="subjectCount">Subject Count</label>
            <input
              type="number"
              id="subjectCount"
              name="subjectCount"
              value={formData.subjectCount}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="monthlyFee">Monthly Fee (Optional)</label>
            <input
              type="number"
              id="monthlyFee"
              name="monthlyFee"
              value={formData.monthlyFee}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="joinedDate">Joined Date</label>
            <input
              type="date"
              id="joinedDate"
              name="joinedDate"
              value={formData.joinedDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  {studentToEdit ? <FaSave className="h-5 w-5 mr-2" /> : <FaPlus className="h-5 w-5 mr-2" />}
                  {studentToEdit ? 'Update Student' : 'Add Student'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
