
import { useQuery, useLazyQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

import ApolloClientAPI from './ApolloClientAPI';

// import DefaultClientAPI from '../index';
// import { theClientAPI as DefaultClientAPI } from '../index';
import { defaultImage_system } from './Constants'; 

export const DefaultClientAPI = ApolloClientAPI();
DefaultClientAPI.client.writeData({
  data: {
    user: null,
    config: null
  },
})

const handleConfigOuput = (config = null) => {
  let result = null;
  if (config) {
    result = {...config}
    let newDefaultImage = defaultImage_system;
    if (result.defaultImage && result.defaultImage != "") {
      newDefaultImage = result.imageSrc + result.defaultImage;
    }
    result['defaultImage'] = newDefaultImage;
  }
  return result;
}

// User Cache ---------------------------- start
const GET_USER_CACHE_QUERY = gql`
  query user {
    user @client {
      success
      message
      data {
        _id
        username
        configId
        role
      } 
    }
  }
`
const SET_USER_CACHE_QUERY = gql`
  query user {
    user {
      success
      message
      data {
        _id
        username
        configId
        role
      } 
    }
  }
`

export const useUserCache = () => {
  const  { data, error, loading } = useQuery(GET_USER_CACHE_QUERY,{
    fetchPolicy: 'cache-only'
  });

  let result = null;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('useUserCache',error);
  }
  if (data && data.user) {
    result = data.user;
  }
  return result;
}

export const setUserCache = (data, client=null) => {
  let theClient = DefaultClientAPI.client;
  if (client != null) {
    theClient = client;
  }
  theClient.writeQuery({
    query: SET_USER_CACHE_QUERY,
    data: {
      user: data
    }
  });
  // theClient.writeData({
  //   data: {
  //     user: data
  //   }
  // });
}

// export const getUserCache = (client=null) => {
//   let result = null;
//   let theClient = DefaultClientAPI.client;
//   if (client != null) {
//     theClient = client;
//   }
//   try {
//     result = theClient.readQuery({
//       query: GET_USER_CACHE_QUERY
//     },true)
//   }
//   catch (e) {
//     result = null;
//   }

//   return result;
// }


// User Cache ---------------------------- end
// Config Cache ---------------------------- start
const GET_USER_CONFIG_QUERY = gql`
  query userConfig($configId: String!) {
    userConfig(configId: $configId) {
        success
        message
        data
    }
  }
`
const GET_CONFIG_CACHE_QUERY = gql`
  query config {
    config @client {
      _id
      configId
      defaultImage
      defaultImage_system
      imageSrc
      paymentQRImage
      server
      currencyUnit
      profile {
        name
        notice
        logo
      }
      delivery
      productImageLimit
      inventoryPerProductLimit
      productTypes
    }
  }
`
const SET_CONFIG_CACHE_QUERY = gql`
  query config {
    config {
      _id
      configId
      defaultImage
      defaultImage_system
      imageSrc
      paymentQRImage
      server
      currencyUnit
      profile {
        name
        notice
        logo
      }
      delivery
      productImageLimit
      inventoryPerProductLimit
    }
  }
`
export const useConfigCache = () => {
  const { data, error, loading } = useQuery(GET_CONFIG_CACHE_QUERY,{
    fetchPolicy: 'cache-only'
  });

  let result = null;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('useConfigCache',error);
  }
  if (data && data.config) {
    result = data.config;
  }
  return result;
}

export const setConfigCache = (data, client=null) => {
  let theClient = DefaultClientAPI.client;
  if (client != null) {
    theClient = client;
  }
  theClient.writeQuery({
    query: GET_CONFIG_CACHE_QUERY,
    data: {
      config: handleConfigOuput(data)
    }
  });
  // theClient.writeData({
  //   data: {
  //     config: handleConfigOuput(data)
  //   }
  // });
}

// export const getConfigCache = (client=null) => {
//   let result = null;
//   let theClient = DefaultClientAPI.client;
//   if (client != null) {
//     theClient = client;
//   }
//   try {
//     result = theClient.readQuery({
//       query: SET_CONFIG_CACHE_QUERY
//     },true) 
//   }
//   catch (e) {
//     result = null;
//   }

//   return result;
// }

export const useConfigQuery = (input) => {
  // const [ getConfig, { data, error, loading } ] = useLazyQuery(GET_USER_CONFIG_QUERY,{
  const { data, error, loading } = useQuery(GET_USER_CONFIG_QUERY,{
    fetchPolicy: 'cache-and-network',
    variables: {
      configId: input
    },
    onCompleted: (result) => {
      if (result && result.userConfig && result.userConfig.success) {
        setConfigCache(result.userConfig.data)
      }
    }
  });
  let result = null;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('useConfigQuery',error);
  }
  if (data && data.userConfig) {
    result = handleConfigOuput(data.userConfig);
  }
  return result;
}

export const getConfigCache = () => {
  const result = DefaultClientAPI.client.readQuery({
    query: GET_CONFIG_CACHE_QUERY,
    fetchPolicy: 'cache-only'
  });
  return result;
}

export const clearCache = () => {
  DefaultClientAPI.client.writeData({
    data: {
      user: null,
      config: null
    },
  })
}
// Config Cache ---------------------------- end


// const GET_LOGGED_IN_USER = gql`
//   query loggedInUser{
//     loggedInUser{
//         success
//         message
//         data
//     }
//   }
// `
// export const useUserQuery = () => {
//   const [getUser, { data, error, loading }] = useLazyQuery(GET_LOGGED_IN_USER,{
//     //fetchPolicy: 'cache-and-network'
//   });

//   let result = null;
//   if (loading) {
//     console.log('loading');
//   }
//   if (error) {
//     console.log(error);
//   }
//   if (data && data.user) {
//     result = data.user;
//   }
//   return result;
// }


// Orders ---------------------------- start

const GET_ORDERS_QUERY = gql`
  query orders($filter: JSONObject, $configId: String) {
    orders(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      items
      total
      type
      charges
      customer
      remark
      sellerRemark
      paid
      sentOut
      trackingNum
      deliveryFee
      status
    }
  }
`;

export const useOrdersQuery = (options) => {

  const ordersResult = useQuery(GET_ORDERS_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: options,
    onError: (error) => {
      console.log("orders error", error)
  
    },
    onCompleted: (result) => {
      // console.log('Orders', result.orders)
    }
  });

  const { loading, error } = ordersResult;

  let result = ordersResult;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('useOrdersQuery',error);
  }

  return result;
}


// Orders ---------------------------- end

// Inventory ---------------------------- start
const READ_PRODUCT_INVENTORY_QUERY = gql`
  query inventory($filter: JSONObject, $configId: String) {
    inventory(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      price
      stock
      weight
      onSale
      salePrice
      variants
      published
      productId
    }
  }
`;

export const useInventoryQuery = (options) => {

  const inventoryResult = useQuery(READ_PRODUCT_INVENTORY_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: options,
    onError: (error) => {
      console.log("inventory error", error)
  
    },
    onCompleted: (result) => {

    }
  });

  const { loading, error } = inventoryResult;

  let result = inventoryResult;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('useOrdersQuery',error);
  }

  return result;
}

// Inventory ---------------------------- end