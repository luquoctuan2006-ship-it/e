import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { eventsAPI, bookingsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/BookingPage.css";

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [useTicketTypes, setUseTicketTypes] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await eventsAPI.getById(id);
        if (!data || !data.event) {
          throw new Error("Không tìm thấy sự kiện");
        }
        setEvent(data.event);

        try {
          const ticketData = await eventsAPI.getTicketTypes(id);
          if (
            ticketData &&
            ticketData.ticket_types &&
            ticketData.ticket_types.length > 0
          ) {
            setTicketTypes(ticketData.ticket_types);
            setUseTicketTypes(true);
            const initial = {};
            ticketData.ticket_types.forEach((t) => {
              initial[t.id] = 0;
            });
            setSelectedTickets(initial);
          }
        } catch (err) {
          console.log("Ticket types not available:", err.message);
          setUseTicketTypes(false);
        }
      } catch (err) {
        setError(err.message || "Lỗi khi tải sự kiện");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleTicketQuantityChange = (ticketTypeId, value) => {
    setSelectedTickets((prev) => ({
      ...prev,
      [ticketTypeId]: Math.max(0, value),
    }));
  };

  const getTotalSelectedTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalCost = () => {
    if (useTicketTypes) {
      return ticketTypes.reduce((sum, ticketType) => {
        return sum + ticketType.price * (selectedTickets[ticketType.id] || 0);
      }, 0);
    }
    return Number(event?.price || 0) * quantity;
  };

  const handleBooking = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setBookingLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      let bookingData = {
        event_id: id,
        status: "pending",
      };

      if (useTicketTypes) {
        const totalTickets = getTotalSelectedTickets();
        if (totalTickets < 1) {
          setError("Vui lòng chọn ít nhất 1 vé");
          return;
        }

        for (const ticketType of ticketTypes) {
          const selected = selectedTickets[ticketType.id] || 0;
          if (selected > ticketType.available_quantity) {
            setError(
              `Hết vé hoặc không đủ vé khả dụng cho loại "${ticketType.name}"`,
            );
            return;
          }
        }

        const ticketDetails = Object.keys(selectedTickets)
          .filter((ticketTypeId) => selectedTickets[ticketTypeId] > 0)
          .map((ticketTypeId) => ({
            ticket_type_id: parseInt(ticketTypeId, 10) || 0,
            quantity: selectedTickets[ticketTypeId],
          }));

        bookingData.ticket_details = ticketDetails;
      } else {
        if (quantity < 1) {
          setError("Số lượng vé phải lớn hơn 0");
          return;
        }

        if (
          event.available_tickets !== undefined &&
          quantity > event.available_tickets
        ) {
          setError("Hết vé hoặc không đủ vé khả dụng");
          return;
        }

        bookingData.quantity = quantity;
      }

      await bookingsAPI.create(bookingData);
      const ticketData = await eventsAPI.getTicketTypes(id);
      setTicketTypes(ticketData.ticket_types);
      setSuccessMessage("Đặt vé thành công!");
      setTimeout(() => navigate("/bookings"), 1500);
    } catch (err) {
      const msg = err.message || "";
      if (
        msg.toLowerCase().includes("bán hết") ||
        msg.toLowerCase().includes("không đủ")
      ) {
        setError("Hết vé hoặc không đủ vé khả dụng");
      } else {
        setError(msg || "Đặt vé thất bại");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error && !event) return <div className="error-message">{error}</div>;
  if (!event) return <div className="error-message">Sự kiện không tồn tại</div>;

  const eventDate = new Date(event.event_date).toLocaleDateString("vi-VN");
  const eventPrice = Number(event.price || 0);
  const isPastEvent = new Date(event.event_date) < new Date();
  const isSoldOut =
    (event.available_tickets !== undefined && event.available_tickets <= 0) ||
    (useTicketTypes && ticketTypes.every((t) => t.available_quantity <= 0));
  return (
    <div className="booking-page">
      <h1>Đặt vé sự kiện</h1>

      <div className="booking-container">
        <div className="event-summary">
          <h2>{event.title}</h2>
          <p>
            <b>Ngày:</b> {eventDate}
          </p>
          {!useTicketTypes && (
            <p>
              <b>Giá:</b> {eventPrice.toLocaleString("vi-VN")} VNĐ
            </p>
          )}
          {event.available_tickets !== undefined && (
            <p>
              <b>Vé còn lại:</b> {event.available_tickets}
            </p>
          )}
        </div>

        {isPastEvent && (
          <div className="error-message">Sự kiện đã kết thúc</div>
        )}

        {isSoldOut && (
          <div className="error-message">Hết vé hoặc không đủ vé khả dụng</div>
        )}

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {!isPastEvent && !isSoldOut && !successMessage && (
          <div className="booking-form">
            {error && <div className="error-message">{error}</div>}

            {useTicketTypes ? (
              <div className="ticket-types-booking">
                <h3>Chọn Loại Vé</h3>
                {ticketTypes.map((ticketType) => (
                  <div key={ticketType.id} className="ticket-type-selection">
                    <div className="ticket-info">
                      <div className="ticket-header">
                        <h4>{ticketType.name}</h4>
                        <span className="ticket-price">
                          {ticketType.price.toLocaleString("vi-VN")} VNĐ
                        </span>
                      </div>
                      {ticketType.description && (
                        <p className="ticket-description">
                          {ticketType.description}
                        </p>
                      )}
                      <span className="available">
                        Còn lại: {ticketType.available_quantity}
                      </span>
                    </div>
                    <div className="ticket-selector">
                      <label>Số lượng:</label>
                      <input
                        type="number"
                        min="0"
                        max={ticketType.available_quantity}
                        value={selectedTickets[ticketType.id] || 0}
                        onChange={(e) =>
                          handleTicketQuantityChange(
                            ticketType.id,
                            parseInt(e.target.value, 10),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="form-group">
                <label>Số lượng vé</label>
                <input
                  type="number"
                  min="1"
                  max={event.available_tickets || 999}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                />
              </div>
            )}

            <div className="price-summary">
              {useTicketTypes && (
                <p>
                  <b>Tổng vé:</b> {getTotalSelectedTickets()}
                </p>
              )}
              <p>
                <b>Tổng tiền:</b> {getTotalCost().toLocaleString("vi-VN")} VNĐ
              </p>
            </div>

            <button
              onClick={handleBooking}
              disabled={bookingLoading}
              className="btn-booking"
            >
              {bookingLoading ? "Đang đặt vé..." : "Đặt vé ngay"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
