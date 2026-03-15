import { useState } from 'react';
import { X, Save } from 'lucide-react';
import './SchemeModal.css';

const SchemeModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        schemeName: '',
        description: '',
        budget: '',
        district: '',
        startDate: '',
        endDate: '',
        status: 'Active'
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
        // Reset form
        setFormData({
            schemeName: '',
            description: '',
            budget: '',
            district: '',
            startDate: '',
            endDate: '',
            status: 'Active'
        });
    };

    const handleBackdropClick = (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop fadeIn" onClick={handleBackdropClick}>
            <div className="modal-content glass-card slideUp">
                <div className="modal-header">
                    <h2 className="modal-title">Create New Scheme</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Scheme Name</label>
                                <input
                                    type="text"
                                    name="schemeName"
                                    value={formData.schemeName}
                                    onChange={handleChange}
                                    placeholder="Enter scheme name"
                                    required
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Brief description of the scheme"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Budget (in Rupees)</label>
                                <input
                                    type="number"
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleChange}
                                    placeholder="5000000"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Target District</label>
                                <select
                                    name="district"
                                    value={formData.district}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select District</option>
                                    <option value="Salem">Salem</option>
                                    <option value="Coimbatore">Coimbatore</option>
                                    <option value="Chennai">Chennai</option>
                                    <option value="Madurai">Madurai</option>
                                    <option value="All Districts">All Districts</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} /> Save Scheme
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SchemeModal;
