import React, { useState } from 'react';
import '../styles/TicketTypeManager.css';

const TicketTypeManager = ({ ticketTypes, onTicketTypesChange, eventPrice, totalTickets }) => {
  const [showForm, setShowForm] = useState(false);
  const [newTicketType, setNewTicketType] = useState({
    name: '',
    description: '',
    price: eventPrice || 0,
    quantity: 0
  });
  const [errorMessage, setErrorMessage] = useState('');

  const validateForm = () => {
    if (!newTicketType.name.trim()) {
      setErrorMessage('Vui lòng nhập tên loại vé');
      return false;
    }
    if (newTicketType.price < 0) {
      setErrorMessage('Giá vé không thể âm');
      return false;
    }
    if (newTicketType.quantity <= 0) {
      setErrorMessage('Số lượng vé phải lớn hơn 0');
      return false;
    }

    const totalUsed = ticketTypes.reduce((sum, t) => sum + t.quantity, 0) + newTicketType.quantity;
    if (totalUsed > totalTickets) {
      setErrorMessage(`Tổng số vé không thể vượt quá ${totalTickets}`);
      return false;
    }

    return true;
  };

  const handleAddTicketType = () => {
    setErrorMessage('');
    if (!validateForm()) return;

    const ticketTypeWithId = {
      ...newTicketType,
      id: Date.now(),
      available_quantity: newTicketType.quantity
    };

    onTicketTypesChange([...ticketTypes, ticketTypeWithId]);

    setNewTicketType({
      name: '',
      description: '',
      price: eventPrice || 0,
      quantity: 0
    });

    setShowForm(false);
  };

  const handleRemoveTicketType = (id) => {
    onTicketTypesChange(ticketTypes.filter(t => t.id !== id));
  };

  const handleUpdateTicketType = (id, updatedType) => {
    const updated = ticketTypes.map(t =>
      t.id === id ? { ...t, ...updatedType } : t
    );

    const totalUsed = updated.reduce((sum, t) => sum + t.quantity, 0);
    if (totalUsed <= totalTickets) {
      onTicketTypesChange(updated);
    } else {
      setErrorMessage(`Tổng số vé không thể vượt quá ${totalTickets}`);
    }
  };

  const totalUsedTickets = ticketTypes.reduce((sum, t) => sum + t.quantity, 0);
  const remainingTickets = totalTickets - totalUsedTickets;

  return (
    <div className="ticket-type-manager">
      <div className="ticket-manager-header">
        <h3>Quản Lý Loại Vé</h3>
        <p className="ticket-info">
          Đã dùng: {totalUsedTickets} / {totalTickets} vé
        </p>
      </div>

      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}

      <div className="ticket-types-list">
        {ticketTypes.length === 0 ? (
          <p className="no-tickets">Chưa có loại vé nào. Thêm loại vé mới để bắt đầu!</p>
        ) : (
          ticketTypes.map(ticketType => (
            <div key={ticketType.id} className="ticket-type-card">
              <div className="ticket-type-info">
                <div className="ticket-type-header">
                  <h4>{ticketType.name}</h4>
                  <span className="ticket-price">
                    {ticketType.price.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>

                {ticketType.description && (
                  <p className="ticket-description">{ticketType.description}</p>
                )}

                <div className="ticket-type-details">
                  <span className="detail">
                    Số lượng: {ticketType.quantity}
                  </span>
                  <span className="detail divider">|</span>
                  <span className="detail">
                    Tổng tiền: {(ticketType.price * ticketType.quantity).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn-remove"
                onClick={() => handleRemoveTicketType(ticketType.id)}
                title="Xóa loại vé"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="add-ticket-form">
          <h4>Thêm Loại Vé Mới</h4>

          <div className="form-group">
            <label>Tên loại vé *</label>
            <input
              type="text"
              value={newTicketType.name}
              onChange={(e) =>
                setNewTicketType({ ...newTicketType, name: e.target.value })
              }
              placeholder="Ví dụ: Vé VIP, Vé thường, Vé sinh viên"
              maxLength="50"
            />
          </div>

          <div className="form-group">
            <label>Mô tả (không bắt buộc)</label>
            <input
              type="text"
              value={newTicketType.description}
              onChange={(e) =>
                setNewTicketType({ ...newTicketType, description: e.target.value })
              }
              placeholder="Ví dụ: Chỗ ngồi hàng trước, bao gồm đồ ăn"
              maxLength="100"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Giá (VNĐ) *</label>
              <input
                type="number"
                value={newTicketType.price}
                onChange={(e) =>
                  setNewTicketType({
                    ...newTicketType,
                    price: parseFloat(e.target.value) || 0
                  })
                }
                min="0"
                step="1000"
              />
            </div>

            <div className="form-group">
              <label>Số lượng *</label>
              <input
                type="number"
                value={newTicketType.quantity}
                onChange={(e) =>
                  setNewTicketType({
                    ...newTicketType,
                    quantity: parseInt(e.target.value) || 0
                  })
                }
                min="1"
                max={remainingTickets}
              />
              <small>Tối đa: {remainingTickets} vé</small>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setShowForm(false);
                setErrorMessage('');
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn-add"
              onClick={handleAddTicketType}
            >
              Thêm Loại Vé
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          type="button"
          className="btn-add-ticket-type"
          onClick={() => setShowForm(true)}
        >
          + Thêm Loại Vé Mới
        </button>
      )}
    </div>
  );
};

export default TicketTypeManager;
