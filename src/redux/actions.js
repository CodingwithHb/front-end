import axios from 'axios';

export const fetchOrders = () => {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_ORDERS_REQUEST' });

    try {
      const response = await axios.get('http://localhost:8000/api/orders');
      dispatch({ type: 'FETCH_ORDERS_SUCCESS', payload: response.data.data });
    } catch (error) {
      dispatch({ type: 'FETCH_ORDERS_ERROR', payload: error.message });
    }
  };
};
