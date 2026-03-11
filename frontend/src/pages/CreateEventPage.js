
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizerAPI } from '../services/api';
import '../styles/CreateEventPage.css';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    venue_id: '',
    total_tickets: '',
    price: '',
    image_url: '',
    category_id: '',
    organizer_id: user?.organizer_id || 4 // 
  });
  
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        organizer_id: 4
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    setLoading(true);
    try {
      const [venuesRes, categoriesRes] = await Promise.all([
        organizerAPI.getVenues(),
        organizerAPI.getCategories()
      ]);
      
      // Nếu API trả về lỗi, sử dụng dữ liệu tĩnh
      const venuesData = venuesRes?.venues || [
        { id: 1, name: 'Nhà hát Lớn Hà Nội', city: 'Hà Nội', capacity: 1000 },
        { id: 2, name: 'Sân vận động Mỹ Đình', city: 'Hà Nội', capacity: 5000 },
        { id: 3, name: 'Cà phê Sân Khấu', city: 'TP.HCM', capacity: 500 },
        { id: 4, name: 'Nhà Văn Hóa Thanh Niên TP.HCM', city: 'TP.HCM', capacity: 2000 }
      ];
      
      const categoriesData = categoriesRes?.categories || [
        { id: 1, name: 'Nhạc sống' },
        { id: 2, name: 'Festival' },
        { id: 3, name: 'Acoustic' },
        { id: 4, name: 'Nhạc trẻ' }
      ];
      
      setVenues(venuesData);
      setCategories(categoriesData);
    } catch (err) {
      // Fallback data nếu API bị lỗi
      setVenues([
        { id: 1, name: 'Nhà hát Lớn Hà Nội', city: 'Hà Nội', capacity: 1000 },
        { id: 2, name: 'Sân vận động Mỹ Đình', city: 'Hà Nội', capacity: 5000 },
        { id: 3, name: 'Cà phê Sân Khấu', city: 'TP.HCM', capacity: 500 },
        { id: 4, name: 'Nhà Văn Hóa Thanh Niên TP.HCM', city: 'TP.HCM', capacity: 2000 }
      ]);
      
      setCategories([
        { id: 1, name: 'Nhạc sống' },
        { id: 2, name: 'Festival' },
        { id: 3, name: 'Acoustic' },
        { id: 4, name: 'Nhạc trẻ' }
      ]);
      
      setError('Không thể tải dữ liệu từ server. Đang sử dụng dữ liệu mẫu.');
      console.error('Fetch form data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error('Vui lòng nhập tiêu đề sự kiện');
      }
      if (!formData.event_date) {
        throw new Error('Vui lòng chọn ngày và giờ sự kiện');
      }
      if (!formData.venue_id) {
        throw new Error('Vui lòng chọn địa điểm');
      }
      if (!formData.total_tickets || parseInt(formData.total_tickets) <= 0) {
        throw new Error('Số lượng vé phải lớn hơn 0');
      }
      if (!formData.price || parseFloat(formData.price) < 0) {
        throw new Error('Giá vé không hợp lệ');
      }

      // Format date for API
      const formattedData = {
      title: formData.title,
      description: formData.description,
      event_date: formData.event_date.replace('T', ' ') + ':00', // Format: YYYY-MM-DD HH:mm:ss
      venue_id: parseInt(formData.venue_id),
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      organizer_id: 4, // Hardcoded cho bạn
      total_tickets: parseInt(formData.total_tickets),
      price: parseFloat(formData.price),
      image_url: formData.image_url || ''
    };

    // LOG CHI TIẾT
    console.log('=== DEBUG CREATE EVENT ===');
    console.log('Formatted data:', formattedData);
    console.log('Stringified:', JSON.stringify(formattedData));

    // Gọi API
    const response = await organizerAPI.createEvent(formattedData);
    
    console.log('API Response:', response);
    
    if (response.message) {
      alert('✅ Tạo sự kiện thành công!\n\n📋 Sự kiện của bạn đang chờ quản trị viên phê duyệt.\n\nBạn sẽ được thông báo khi sự kiện được phê duyệt.');
      navigate('/organizer/events');
    }
  } catch (err) {
    const errorMsg = err.message || 'Có lỗi xảy ra khi tạo sự kiện';
    setError(errorMsg);
    console.error('❌ Create event error details:', {
      message: err.message,
      stack: err.stack,
      data: err.response?.data
    });
  } finally {
    setSubmitting(false);
  }
};

  const handleCancel = () => {
    if (window.confirm('Bạn có chắc muốn hủy? Dữ liệu chưa lưu sẽ bị mất.')) {
      navigate('/organizer/events');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="create-event-page">
      <div className="create-event-container">
        <div className="create-event-header">
          <h1>🎭 Tạo Sự Kiện Mới</h1>
          <p className="subtitle">Điền thông tin chi tiết về sự kiện của bạn</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Lỗi:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-event-form">
          {/* Tiêu đề */}
          <div className="form-group">
            <label htmlFor="title" className="required">
              Tiêu đề sự kiện
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ví dụ: Live Concert Mùa Hè 2025"
              maxLength="200"
              required
            />
            <small className="form-hint">Tối đa 200 ký tự</small>
          </div>

          {/* Mô tả */}
          <div className="form-group">
            <label htmlFor="description">
              Mô tả chi tiết
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả về sự kiện, chương trình, nghệ sĩ, v.v..."
              rows="5"
            />
          </div>

          <div className="form-row">
            {/* Ngày và giờ */}
            <div className="form-group">
              <label htmlFor="event_date" className="required">
                Ngày & Giờ sự kiện
              </label>
              <input
                type="datetime-local"
                id="event_date"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>

            {/* Địa điểm */}
            <div className="form-group">
              <label htmlFor="venue_id" className="required">
                Địa điểm tổ chức
              </label>
              <select
                id="venue_id"
                name="venue_id"
                value={formData.venue_id}
                onChange={handleChange}
                required
              >
                <option value="">-- Chọn địa điểm --</option>
                {venues.map(venue => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} - {venue.city} ({venue.capacity} chỗ)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            {/* Số lượng vé */}
            <div className="form-group">
              <label htmlFor="total_tickets" className="required">
                Số lượng vé
              </label>
              <input
                type="number"
                id="total_tickets"
                name="total_tickets"
                value={formData.total_tickets}
                onChange={handleChange}
                min="1"
                max="100000"
                placeholder="1000"
                required
              />
              <small className="form-hint">Số vé tối đa có thể bán</small>
            </div>

            {/* Giá vé */}
            <div className="form-group">
              <label htmlFor="price" className="required">
                Giá vé (VND)
              </label>
              <div className="price-input-wrapper">
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  placeholder="500000"
                  required
                />
                <span className="price-unit">VND</span>
              </div>
              <small className="form-hint">Nhập 0 nếu miễn phí</small>
            </div>
          </div>

          <div className="form-row">
            {/* Danh mục */}
            <div className="form-group">
              <label htmlFor="category_id">
                Danh mục
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="">-- Chọn danh mục (không bắt buộc) --</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Hình ảnh */}
            <div className="form-group">
              <label htmlFor="image_url">
                URL hình ảnh
              </label>
              <input
                type="url"
                id="image_url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/event-image.jpg"
              />
              <small className="form-hint">URL ảnh đại diện cho sự kiện</small>
            </div>
          </div>



          {/* Xem trước hình ảnh */}
          {formData.image_url && (
            <div className="form-group">
              <label>Xem trước hình ảnh:</label>
              <div className="image-preview">
                <img 
                  src={formData.image_url} 
                  alt="Preview" 
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            </div>
          )}

          {/* Nút hành động */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={submitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-small"></span>
                  Đang xử lý...
                </>
              ) : (
                '🎉 Tạo Sự Kiện'
              )}
            </button>
          </div>
        </form>

        
      </div>
    </div>
  );
};

export default CreateEventPage;