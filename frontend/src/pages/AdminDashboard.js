import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [approvedOrganizers, setApprovedOrganizers] = useState([]);
  const [rejectedOrganizers, setRejectedOrganizers] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [pendingContacts, setPendingContacts] = useState([]);
  const [respondedContacts, setRespondedContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeSection, setActiveSection] = useState('organizers');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (user?.role !== 'admin') {
      window.location.href = '/';
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [
        pendingRes,
        approvedRes,
        rejectedRes,
        pendingEventsRes,
        statsRes,
        pendingContactsRes,
        respondedContactsRes
      ] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/organizers?status=pending', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/organizers?status=approved', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/organizers?status=rejected', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/events?status=pending', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/contacts?status=pending', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/contacts?status=responded', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setPendingOrganizers(pendingRes.data.organizers || []);
      setApprovedOrganizers(approvedRes.data.organizers || []);
      setRejectedOrganizers(rejectedRes.data.organizers || []);
      setPendingEvents(pendingEventsRes.data.events || []);
      setStats(statsRes.data.stats || {});
      setPendingContacts(pendingContactsRes.data.contacts || []);
      setRespondedContacts(respondedContactsRes.data.contacts || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const handleApproveOrganizer = async (organizerId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/admin/organizers/${organizerId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Organizer approved successfully!');
      fetchData();
      setSelectedOrganizer(null);
    } catch (err) {
      console.error('Error approving organizer:', err);
      alert('Failed to approve organizer');
    }
  };

  const handleRejectOrganizer = async (organizerId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/admin/organizers/${organizerId}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Organizer rejected successfully!');
      fetchData();
      setSelectedOrganizer(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Error rejecting organizer:', err);
      alert('Failed to reject organizer');
    }
  };

  const handleApproveEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/admin/events/${eventId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Event approved successfully!');
      fetchData();
      setSelectedEvent(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Error approving event:', err);
      alert('Failed to approve event');
    }
  };

  const handleRejectEvent = async (eventId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/admin/events/${eventId}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Event rejected successfully!');
      fetchData();
      setSelectedEvent(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Error rejecting event:', err);
      alert('Failed to reject event');
    }
  };

  const handleRespondContact = async (contactId) => {
    if (!adminResponse.trim()) {
      alert('Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/admin/contacts/${contactId}/respond`,
        { response: adminResponse },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Phản hồi đã được gửi');
      fetchData();
      setSelectedContact(null);
      setAdminResponse('');
    } catch (err) {
      console.error('Error responding to contact:', err);
      alert('Không thể gửi phản hồi');
    }
  };

  if (loading) return <div className="admin-loading">Đang tải dữ liệu...</div>;

  const getActiveOrganizers = () => {
    switch (activeTab) {
      case 'pending':
        return pendingOrganizers;
      case 'approved':
        return approvedOrganizers;
      case 'rejected':
        return rejectedOrganizers;
      default:
        return [];
    }
  };

  const getActiveContacts = () => {
    switch (activeTab) {
      case 'pending':
        return pendingContacts;
      case 'responded':
        return respondedContacts;
      default:
        return [];
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1> Bảng Điều Khiển Admin</h1>
        <p>Quản lý phê duyệt organizer và sự kiện</p>
      </div>

      {stats && (
        <div className="admin-stats">
          <div className="stat-card pending">
            <div className="stat-number">{stats.pendingOrganizers}</div>
            <div className="stat-label">Organizer Chờ</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-number">{stats.pendingEvents}</div>
            <div className="stat-label">Sự Kiện Chờ</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-number">{stats.approvedOrganizers}</div>
            <div className="stat-label">Organizer Duyệt</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.approvedEvents}</div>
            <div className="stat-label">Sự Kiện Duyệt</div>
          </div>
        </div>
      )}

      <div className="admin-content">
        <div className="section-tabs">
          <button
            className={`section-tab ${activeSection === 'organizers' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('organizers');
              setActiveTab('pending');
            }}
          >
             Organizer
          </button>
          <button
            className={`section-tab ${activeSection === 'events' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('events');
              setActiveTab('pending');
            }}
          >
             Sự Kiện
          </button>
          <button
            className={`section-tab ${activeSection === 'contacts' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('contacts');
              setActiveTab('pending');
            }}
          >
             Liên hệ
          </button>
        </div>

        {activeSection === 'organizers' ? (
          <>
            <div className="admin-tabs">
              <button
                className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                 Chờ Duyệt ({pendingOrganizers.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
                onClick={() => setActiveTab('approved')}
              >
                 Đã Duyệt ({approvedOrganizers.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
                onClick={() => setActiveTab('rejected')}
              >
                 Từ Chối ({rejectedOrganizers.length})
              </button>
            </div>

            <div className="organizers-list">
              {getActiveOrganizers().length === 0 ? (
                <div className="empty-state">
                  <p>Không có dữ liệu</p>
                </div>
              ) : (
                getActiveOrganizers().map(org => (
                  <div
                    key={org.id}
                    className={`organizer-card ${org.approval_status}`}
                    onClick={() => setSelectedOrganizer(org)}
                  >
                    <div className="org-header">
                      <h3>{org.name}</h3>
                      <span className={`status-badge ${org.approval_status}`}>
                        {org.approval_status === 'pending' && ' Chờ duyệt'}
                        {org.approval_status === 'approved' && ' Đã duyệt'}
                        {org.approval_status === 'rejected' && ' Từ chối'}
                      </span>
                    </div>
                    <p className="org-email"> {org.email}</p>
                    <p className="org-phone"> {org.phone || 'Không có'}</p>
                    <p className="org-created"> {new Date(org.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                ))
              )}
            </div>
          </>
        ) : activeSection === 'contacts' ? (
          <>
            <div className="admin-tabs">
              <button
                className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                 Chờ phản hồi ({pendingContacts.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'responded' ? 'active' : ''}`}
                onClick={() => setActiveTab('responded')}
              >
                 Đã phản hồi ({respondedContacts.length})
              </button>
            </div>

            <div className="organizers-list">
              {getActiveContacts().length === 0 ? (
                <div className="empty-state">
                  <p>Không có yêu cầu liên hệ</p>
                </div>
              ) : (
                getActiveContacts().map(ct => (
                  <div
                    key={ct.id}
                    className={`contact-card ${ct.status}`}
                    onClick={() => setSelectedContact(ct)}
                  >
                    <div className="org-header">
                      <h3>{ct.subject || 'Không có chủ đề'}</h3>
                      <span className={`status-badge ${ct.status}`}>
                        {ct.status === 'pending' && ' Chờ phản hồi'}
                        {ct.status === 'responded' && ' Đã phản hồi'}
                      </span>
                    </div>
                    <p className="org-email">{ct.email}</p>
                    <p className="org-created">{new Date(ct.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="organizers-list">
              {pendingEvents.length === 0 ? (
                <div className="empty-state">
                  <p>Không có sự kiện chờ duyệt</p>
                </div>
              ) : (
                pendingEvents.map(event => (
                  <div
                    key={event.id}
                    className="event-card pending"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="event-header">
                      <h3>{event.title}</h3>
                      <span className="status-badge pending">⏳ Chờ duyệt</span>
                    </div>
                    <p className="event-organizer"> {event.organizer_name}</p>
                    <p className="event-venue"> {event.venue_name} - {event.city}</p>
                    <p className="event-date"> {new Date(event.event_date).toLocaleString('vi-VN')}</p>
                    <p className="event-price"> {parseInt(event.price).toLocaleString('vi-VN')} VND</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {selectedOrganizer && (
        <div className="modal-overlay" onClick={() => setSelectedOrganizer(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedOrganizer(null)}
            >
              ✕
            </button>

            <h2>{selectedOrganizer.name}</h2>

            <div className="org-details">
              <div className="detail-row">
                <label>Email:</label>
                <span>{selectedOrganizer.email}</span>
              </div>
              <div className="detail-row">
                <label>Điện thoại:</label>
                <span>{selectedOrganizer.phone || 'Không có'}</span>
              </div>
              <div className="detail-row">
                <label>Website:</label>
                <span>{selectedOrganizer.website || 'Không có'}</span>
              </div>
              <div className="detail-row">
                <label>Mô tả:</label>
                <span>{selectedOrganizer.description || 'Không có'}</span>
              </div>
              <div className="detail-row">
                <label>Ngày tạo:</label>
                <span>{new Date(selectedOrganizer.created_at).toLocaleString('vi-VN')}</span>
              </div>

              {selectedOrganizer.approval_status === 'rejected' && selectedOrganizer.rejection_reason && (
                <div className="detail-row rejection-reason">
                  <label>Lý do từ chối:</label>
                  <span>{selectedOrganizer.rejection_reason}</span>
                </div>
              )}

              {selectedOrganizer.approval_status === 'approved' && (
                <div className="detail-row">
                  <label>Duyệt lúc:</label>
                  <span>{new Date(selectedOrganizer.approved_at).toLocaleString('vi-VN')}</span>
                </div>
              )}
            </div>

            <div className="modal-actions">
              {selectedOrganizer.approval_status === 'pending' && (
                <>
                  <button
                    className="btn btn-approve"
                    onClick={() => handleApproveOrganizer(selectedOrganizer.id)}
                  >
                     Phê Duyệt
                  </button>
                  <div className="rejection-form">
                    <label>Từ chối (tùy chọn):</label>
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Nhập lý do từ chối (nếu có)..."
                    />
                    <button
                      className="btn btn-reject"
                      onClick={() => handleRejectOrganizer(selectedOrganizer.id)}
                    >
                       Từ Chối
                    </button>
                  </div>
                </>
              )}
              {selectedOrganizer.approval_status === 'rejected' && (
                <button
                  className="btn btn-approve"
                  onClick={() => handleApproveOrganizer(selectedOrganizer.id)}
                >
                   Duyệt Lại
                </button>
              )}
              {selectedOrganizer.approval_status === 'approved' && (
                <button
                  className="btn btn-reject"
                  onClick={() => handleRejectOrganizer(selectedOrganizer.id)}
                >
                   Thu Hồi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedContact && (
        <div className="modal-overlay" onClick={() => setSelectedContact(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedContact(null)}
            >
              ✕
            </button>
            <h2>Yêu cầu liên hệ</h2>
            <div className="org-details">
              <div className="detail-row">
                <label>Người gửi:</label>
                <span>{selectedContact.name || 'Khách'}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <span>{selectedContact.email}</span>
              </div>
              <div className="detail-row">
                <label>Chủ đề:</label>
                <span>{selectedContact.subject || 'Không có'}</span>
              </div>
              <div className="detail-row">
                <label>Nội dung:</label>
                <span>{selectedContact.message}</span>
              </div>
              <div className="detail-row">
                <label>Gửi lúc:</label>
                <span>{new Date(selectedContact.created_at).toLocaleString('vi-VN')}</span>
              </div>
              {selectedContact.status === 'responded' && (
                <div className="detail-row">
                  <label>Phản hồi:</label>
                  <span>{selectedContact.admin_response}</span>
                </div>
              )}
            </div>
            {selectedContact.status === 'pending' && (
              <div className="modal-actions">
                <label>Phản hồi:</label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                />
                <button
                  className="btn btn-approve"
                  onClick={() => handleRespondContact(selectedContact.id)}
                >
                  Gửi phản hồi
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedEvent(null)}
            >
              ✕
            </button>

            <h2>{selectedEvent.title}</h2>

            <div className="event-details">
              <div className="detail-row">
                <label>Organizer:</label>
                <span>{selectedEvent.organizer_name}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <span>{selectedEvent.organizer_email}</span>
              </div>
              <div className="detail-row">
                <label>Địa điểm:</label>
                <span>{selectedEvent.venue_name} - {selectedEvent.city}</span>
              </div>
              <div className="detail-row">
                <label>Ngày & Giờ:</label>
                <span>{new Date(selectedEvent.event_date).toLocaleString('vi-VN')}</span>
              </div>
              <div className="detail-row">
                <label>Danh mục:</label>
                <span>{selectedEvent.category_name || 'Không có'}</span>
              </div>
              <div className="detail-row">
                <label>Giá vé:</label>
                <span>{parseInt(selectedEvent.price).toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="detail-row">
                <label>Số lượng vé:</label>
                <span>{selectedEvent.total_tickets}</span>
              </div>
              <div className="detail-row">
                <label>Mô tả:</label>
                <span>{selectedEvent.description || 'Không có'}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-approve"
                onClick={() => handleApproveEvent(selectedEvent.id)}
              >
                 Phê Duyệt
              </button>
              <div className="rejection-form">
                <label>Từ chối (tùy chọn):</label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                />
                <button
                  className="btn btn-reject"
                  onClick={() => handleRejectEvent(selectedEvent.id)}
                >
                   Từ Chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
