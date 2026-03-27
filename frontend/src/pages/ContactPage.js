import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/ContactPage.css';

const ContactPage = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.full_name || user.username || '');
      setEmail(user.email || '');
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [user]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/contacts/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data.contacts || []);
    } catch (err) {
      console.error('Error fetching contact history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      alert('Vui lòng điền tên, email và nội dung');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/contacts',
        { name, email, subject, message },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.');
      setSubject('');
      setMessage('');
      if (user) fetchHistory();
    } catch (err) {
      console.error('Error sending contact message', err);
      alert('Gửi liên hệ thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <h1>Liên hệ</h1>
      <form className="contact-form" onSubmit={handleSubmit}>
        <label>
          Tên
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Chủ đề
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>
        <label>
          Nội dung
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? 'Đang gửi...' : 'Gửi'}
        </button>
      </form>

      {user && (
        <div className="history-section">
          <h2>Lịch sử liên hệ</h2>
          {historyLoading ? (
            <p>Đang tải...</p>
          ) : history.length === 0 ? (
            <p>Chưa có yêu cầu liên hệ nào.</p>
          ) : (
            <ul className="history-list">
              {history.map(h => (
                <li key={h.id} className={`history-item ${h.status}`}>
                  <div><strong>Chủ đề:</strong> {h.subject || 'Không có'}</div>
                  <div><strong>Nội dung:</strong> {h.message}</div>
                  <div><strong>Trạng thái:</strong> {h.status}</div>
                  {h.admin_response && (
                    <div><strong>Phản hồi:</strong> {h.admin_response}</div>
                  )}
                  <div><em>{new Date(h.created_at).toLocaleString('vi-VN')}</em></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactPage;
