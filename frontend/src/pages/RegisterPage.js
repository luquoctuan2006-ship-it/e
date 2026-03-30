import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    role: 'user',
    organizerData: {
      name: '',
      email: '',
      phone: '',
      description: '',
      website: '',
      logo_url: '',
    },
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('organizer_')) {
      const field = name.replace('organizer_', '');
      setFormData((prev) => ({
        ...prev,
        organizerData: {
          ...prev.organizerData,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleRoleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      role: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    if (formData.role === 'organizer' && !formData.organizerData.name.trim()) {
      setError('Vui lòng nhập tên tổ chức');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, organizerData, role, ...baseData } = formData;

      const payload = {
        ...baseData,
        role,
        ...(role === 'organizer' && { organizerData }),
      };

      await register(payload);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Đăng Ký</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Loại tài khoản</label>
            <div className="role-selection">
              <label>
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={formData.role === 'user'}
                  onChange={handleRoleChange}
                />
                Người dùng
              </label>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="organizer"
                  checked={formData.role === 'organizer'}
                  onChange={handleRoleChange}
                />
                Tổ chức sự kiện
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Tên đăng nhập *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Tên đầy đủ</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Số điện thoại</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          {formData.role === 'organizer' && (
            <>
              <div className="form-group">
                <label>Tên tổ chức *</label>
                <input
                  type="text"
                  name="organizer_name"
                  value={formData.organizerData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email tổ chức</label>
                <input
                  type="email"
                  name="organizer_email"
                  value={formData.organizerData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại tổ chức</label>
                <input
                  type="tel"
                  name="organizer_phone"
                  value={formData.organizerData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Mô tả tổ chức</label>
                <textarea
                  name="organizer_description"
                  value={formData.organizerData.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  name="organizer_website"
                  value={formData.organizerData.website}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Logo URL</label>
                <input
                  type="url"
                  name="organizer_logo_url"
                  value={formData.organizerData.logo_url}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Mật khẩu *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Xác nhận mật khẩu *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
          </button>
        </form>
        <p className="auth-link">
          Đã có tài khoản? <a href="/login">Đăng nhập</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;