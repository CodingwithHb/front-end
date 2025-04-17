// reducer.js

const initialState = {
  orders: [],
  sku: [],
  countries: [],
  loading: false,
  error: null,

  // Champs pour vos filtres
  filterSku: 'All',
  filterGender: 'All',
  filterStatus: 'All',
  filterStartDate: '2023-01-01', // Par défaut, par exemple
  filterEndDate:   '2023-12-31'
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
      };

    case 'FETCH_ORDERS_ERROR':
      return { ...state, loading: false, error: action.payload };

    // Nouvelle action pour mettre à jour les filtres
    case 'SET_FILTERS':
      return {
        ...state,
        filterSku: action.payload.sku,     // ex. 'SKU123' ou 'All'
        filterGender: action.payload.gender, // ex. 'Male'/'Female'/'All'
        filterStatus: action.payload.status, // ex. 'Delivered'/'Return'/'All'
      };
      case 'SET_DATE_FILTER':
        return {
          ...state,
          filterStartDate: action.payload.startDate,
          filterEndDate: action.payload.endDate,
        };
    default:
      return state;
  }
};

export default Reducer;
