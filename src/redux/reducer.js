const initialState = {
    orders: [],
    sku: [],
    countries: [],
    loading: false,
    error: null,
  };
  
  const Reducer = (state = initialState, action) => {
    switch (action.type) {
      case 'FETCH_ORDERS_REQUEST':
        return { ...state, loading: true };
  
      case 'FETCH_ORDERS_SUCCESS':
        return {
          ...state,
          loading: false,
          orders: action.payload,
          sku: action.payload.map(order => order.sku),
          countries: action.payload.map(order => order.customer_country),
          cities : action.payload.map(order => order.customer_city)
        };
  
      case 'FETCH_ORDERS_ERROR':
        return { ...state, loading: false, error: action.payload };
  
      default:
        return state;
    }
  };
  
  export default Reducer;
  