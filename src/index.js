import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from '@apollo/react-hooks';
import gql from "graphql-tag";

// import './css/base.css';
import App from './App';
import ApolloClientAPI from './utils/ApolloClientAPI';
import { DefaultClientAPI, setUserCache, setConfigCache } from './utils/customHook';
import * as serviceWorker from './serviceWorker';

const GET_LOGGED_IN_USER = gql`
  query loggedInUser{
    loggedInUser{
        success
        message
        data
    }
  }
`

const GET_USER_CONFIG = gql`
  query userConfig($configId: String!) {
    userConfig(configId: $configId) {
        success
        message
        data
    }
  }
`

const { client, cache, ...restClient } = DefaultClientAPI;

const run = () => {
  const doRender = (userData=null,configData=null) => {
    if (userData != null && configData != null) {
      setUserCache(userData, client)
      setConfigCache(configData, client)
    }
    // cache.writeData({
    //   data: {
    //     user: userData,
    //     config: configData
    //   },
    // })
    ReactDOM.render((
        <ApolloProvider client={client}>
            <App />
        </ApolloProvider>
    ),document.getElementById('root'));
  }

  restClient.query(GET_LOGGED_IN_USER).then(result=>{
    let userResult = result.data.loggedInUser;
    // console.log('userResult',userResult)
    restClient.query(GET_USER_CONFIG,{
      configId: userResult.data.configId
    }).then(result2=>{
      let configResult = result2.data.userConfig.data;
      // console.log('configResult',configResult)
      doRender(userResult, configResult)
    }).catch((error2)=>{
      console.log('error2',error2)
      doRender()
    })
  }).catch(error=>{
    console.log('error',error)
    doRender()
  })
  
}

const init = () => {
  run();
}

init();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
