import AWS from 'aws-sdk';

const albumBucketName = "mananml";
const bucketRegion = 'ap-east-1';
const IdentityPoolId = 'ap-east-1:bcd5bb0f-792b-40fc-b8cb-20632b3453c1';
const accessKey = 'AKIA2MHRZXWFZKCVXX6S';
const secretAccessKey = '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';

const awsS3API = async () => {
  // AWS.config.region = bucketRegion; 
  // AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  //   IdentityPoolId: IdentityPoolId
  // });
  AWS.config.update({
    region: bucketRegion,
    // credentials: new AWS.CognitoIdentityCredentials({
    //   IdentityPoolId: IdentityPoolId
    // }),
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey
  });

  let s3 = new AWS.S3({
    region: bucketRegion,
    apiVersion: "2006-03-01",
    params: { Bucket: albumBucketName },
    //accessKeyId: accessKey,
    //secretAccessKey: secretAccessKey,
    maxRetries: 3
  });

  return {
    getImages: async () => {
      return new Promise((resolve, reject) => {
        s3.listBuckets(function(err, data) {
          if (err) {
            console.log("Error", err);
            reject(err);

          } else {
            console.log("Success", data.Buckets);
            resolve(data)
          }
        });
        // s3.listObjects({
        //   Bucket : albumBucketName,
        // }, function(err, data) {
        //   if (err) {
        //     console.log("Error", err);
        //     reject(err);
        //   } else {
        //     console.log("Success", data);
        //     resolve(data)
        //   }
        // });
      })
      
    },
    uploadOne: async (photoKey, file) => {
      return new Promise((resolve, reject) => {
        var upload = new AWS.S3.ManagedUpload({
          params: {
            Bucket: 'mananml',
            Key: photoKey,
            Body: file,
            ACL: "public-read"
          }
        });
        console.log('file',file)
        console.log('upload',upload)
        var promise = upload.promise();
        promise.then(
          function(data) {
            alert("Successfully uploaded photo.");
            resolve(data)
          },
          function(err) {
            alert("There was an error uploading your photo: ", err.message);
            reject(err)
          }
        );
      })
    },
    delete: () => {

    }
  }

}

export default awsS3API;