import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';

import { MIDDLETIER_URL } from './Constants';

export default function ApolloClientAPI(middletierURL = null) {
  const cache = new InMemoryCache({ addTypename: false });
  const client = new ApolloClient({
      cache,
      link: new HttpLink({
          uri: middletierURL ? middletierURL : MIDDLETIER_URL,
          credentials: "include"
      })
  });

  return {
    client: client,
    cache: cache,
    // query: (query, params={}, callback = null)=>{
    //   let result = {
    //     query: query,
    //     variables: params
    //   }
    //   // if (callback != null) {
    //   //   result['onCompleted'] = callback;
    //   // }
    //   return client.query(result)
    // },
    // mutation: (query, params={}, callback = null)=>{
    //   let result = {
    //     mutation: query,
    //     variables: params
    //   }
    //   // if (callback != null) {
    //   //   result['onCompleted'] = callback;
    //   // }
    //   return client.mutate(result)
    // },
    query: async (query, params={})=>{
      return new Promise((resolve, reject) => {
        client.query({
          variables: params,
          query: query
        }).then(result=>{
          resolve(result);
        }).catch(err=>{
          reject(err);
        })
      })
    },
    mutation: async (query, params={})=>{
      return new Promise((resolve, reject) => {
        client.mutate({
          variables: params,
          mutation: query
        }).then(result=>{
          resolve(result);
        }).catch(err=>{
          reject(err);
        })
      })
    },
  }
}
