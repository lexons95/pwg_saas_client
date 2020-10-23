import AWS from 'aws-sdk';
import ApolloClientAPI from './ApolloClientAPI';
import gql from 'graphql-tag';
// import dotenv from 'dotenv';
// dotenv.config();

const albumBucketName = "mananml";
const bucketRegion = 'ap-east-1';
// const IdentityPoolId = 'ap-east-1:bcd5bb0f-792b-40fc-b8cb-20632b3453c1';
const accessKey = process.env.AWSS3_ACCESSKEY;
const secretAccessKey = process.env.AWSS3_SECRETACCESSKEY;
  
const AWS_GET_SIGNED_URL = gql`
  query getS3SignedUrl($bucketName: String!, $Key: String!, $ContentType: String!) {
    getS3SignedUrl(bucketName: $bucketName, Key: $Key, ContentType: $ContentType) {
      success
      message
      data
    }
  }
`;

const AWS_DELETE_ONE = gql`
  mutation s3DeleteOne($bucketName: String!, $Key: String!) {
    s3DeleteOne(bucketName: $bucketName, Key: $Key) {
      success
      message
      data
    }
  }
`;


const awsS3API = (bucketName) => {
  // AWS.config.region = bucketRegion; 
  // AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  //   IdentityPoolId: IdentityPoolId
  // });
  const apolloClient = ApolloClientAPI();

  AWS.config.update({
    region: bucketRegion,
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey
  });

  let s3 = new AWS.S3({
    region: bucketRegion,
    apiVersion: "2006-03-01",
    //params: { Bucket: albumBucketName },
    maxRetries: 3
  });

  return {
    getImages: async () => {
      return new Promise((resolve, reject) => {
        var params = {
          Bucket: bucketName, 
          //MaxKeys: 2
         };
         s3.listObjects(params, function(err, data) {
          if (err) {
            console.log("Error", err);
            reject(err);

          } else {
            console.log("Success", data);
            resolve(data)
          }
        })
      })
    },

    getSignedUrl: async (Key, ContentType) => {
      return new Promise((resolve, reject) => {
        apolloClient.query(AWS_GET_SIGNED_URL,{
          bucketName, Key, ContentType
        })
        .then(result=>resolve(result))
        .catch(err=>{
          console.log(err);
          reject(err)
        });
      })
    },
    deleteOne: async (Key) => {
      return new Promise((resolve, reject) => {
        apolloClient.mutation(AWS_DELETE_ONE,{
          bucketName, Key
        })
        .then(result=>resolve(result))
        .catch(err=>{
          console.log(err);
          reject(err)
        });
      })
    },
  }

}

export default awsS3API;