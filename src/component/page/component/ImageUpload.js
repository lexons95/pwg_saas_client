import React, { useState, useEffect } from 'react';
import { Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import ImgCrop from 'antd-img-crop';


const ImageUpload = (props) => {
  const { fileList, setFileList } = props;
  const fileLimit = 1;

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div className="ant-upload-text">Upload</div>
    </div>
  );

  const handleFileListChange = ({ fileList: newFileList }) => {
    setFileList(newFileList)
  };

  return (
    <Upload
      accept="image/*"
      beforeUpload={ (file) => {
        console.log("beforeUpload",file)
        return false;
      }}
      //multiple={true}
      listType="picture-card"
      fileList={fileList}
      onChange={handleFileListChange}
    >
      {fileList.length < fileLimit ? uploadButton : null}
    </Upload>
  )
}

export default ImageUpload;