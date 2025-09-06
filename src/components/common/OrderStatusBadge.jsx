import { getOrderStatusClass } from '../../utils/dashboardUtils';

const OrderStatusBadge = ({ status }) => {
  return (
    <span className={`status-badge ${getOrderStatusClass(status)}`}>
      {status}
    </span>
  );
};

export default OrderStatusBadge;
