import React, {useState, useEffect} from 'react';
import { Form, Upload, Input, Button, InputNumber, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import gql from 'graphql-tag';
import { useLazyQuery, useMutation } from "@apollo/react-hooks";

import Page_01 from './component/Page_01';
import ImageUpload from './component/ImageUpload';
import qiniuAPI from '../../utils/qiniuAPI';
import { useConfigCache, setConfigCache } from '../../utils/customHook';
import { showMessage } from '../../utils/component/notification';
import Loading from '../../utils/component/Loading';

const UPDATE_CONFIG_QUERY = gql`
  mutation updateConfig($config: JSONObject, $configId: String!) {
    updateConfig(config: $config, configId: $configId) {
      success
      message
      data
    }
  }
`;

const Configuration = (props) => {
  const configCache = useConfigCache();
  const [ form ] = Form.useForm();
  const [ fileList, setFileList ] = useState([]);
  const [ logoFileList, setLogoFileList ] = useState([]);

  const [ updateConfig, { loading: updateLoading} ] = useMutation(UPDATE_CONFIG_QUERY,{
    onCompleted: (result) => {
      console.log('UPDATE_CONFIG_QUERY',result.updateConfig.data.value);
      setConfigCache(result.updateConfig.data.value)
      showMessage({type: 'success', message: 'Success: Configuration Updated'})
    },
    onError: (error) => {
      console.log('UPDATE_CONFIG_QUERY err',error)
      showMessage({type: 'success', message: 'Error: Error while updating Configuration'})

    }
  })

  useEffect(()=>{
    if (configCache != null) {
      if (configCache.paymentQRImage && configCache.paymentQRImage != '') {
        setFileList([{
          uid: configCache.paymentQRImage,
          url: configCache.imageSrc + configCache.paymentQRImage,
          thumbUrl: configCache.imageSrc + configCache.paymentQRImage
        }])
      }
      console.log('logoFileList',configCache.profile)

      if (configCache.profile && configCache.profile.logo && configCache.profile.logo != '') {
        setLogoFileList([{
          uid: configCache.profile.logo,
          url: configCache.imageSrc + configCache.profile.logo,
          thumbUrl: configCache.imageSrc + configCache.profile.logo
        }])
      }

      form.setFieldsValue({
        notice: configCache.profile.notice,
        delivery: configCache.delivery
      })
    }
  },[configCache]);

  const handleSubmit = async (values) => {
    console.log('handleSubmit',values)
    console.log('filelist',fileList)
    console.log('logoFileList',logoFileList)

    let setter = {
      'profile.notice': values.notice,
      'delivery': values.delivery
    }

    // handle payment image

    const handleImageInput = (fileList = [], defaultConfigValue, fieldName) => {
      let changed = false;
      let current = defaultConfigValue;
      let result = "";
      if (fileList.length > 0) {
        if (fileList[0].originFileObj && current != fileList[0].name) {
          let imageNameSplited = fileList[0].name.split('.');
          let newImageName = `saas_${fieldName}_${new Date().getTime()}_${imageNameSplited[imageNameSplited.length - 2]}.${imageNameSplited[imageNameSplited.length - 1]}`;
          result = newImageName;
          changed = true;
        }
      }
      else {
        if (current != "") {
          result = "";
          changed = true;
        }
      }

      return {
        changed: changed,
        current: current,
        result: result
      }
    }

    // let paymentQRChanged = false;
    // let currentPaymentQRImage = configCache.paymentQRImage;
    // let paymentQRImageResult = "";
    // if (fileList.length > 0) {
    //   if (fileList[0].originFileObj && currentPaymentQRImage != fileList[0].name) {
    //     let imageNameSplited = fileList[0].name.split('.');
    //     let newImageName = `saas_payment_${new Date().getTime()}_${imageNameSplited[imageNameSplited.length - 2]}.${imageNameSplited[imageNameSplited.length - 1]}`;
    //     paymentQRImageResult = newImageName;
    //     paymentQRChanged = true;
    //   }
    // }
    // else {
    //   if (currentPaymentQRImage != "") {
    //     paymentQRImageResult = "";
    //     paymentQRChanged = true;
    //   }
    // }

    // if (configCache && configCache.configId) {
    //   if (paymentQRChanged) {
    //     setter['paymentQRImage'] = paymentQRImageResult;

    //     const QiniuAPI = await qiniuAPI();

    //     if (paymentQRImageResult != "") {
    //       let newFileObject = {...fileList[0], name: paymentQRImageResult}
    //       await QiniuAPI.upload(newFileObject)
    //       if (currentPaymentQRImage != "") {
    //         await QiniuAPI.batchDelete([configCache.paymentQRImage])
    //       }
    //     }
    //     else {
    //       if (currentPaymentQRImage != "") {
    //         await QiniuAPI.batchDelete([configCache.paymentQRImage])
    //       }
    //     }
    //   }
    //   updateConfig({
    //     variables: {
    //       config: setter,
    //       configId: configCache.configId
    //     }
    //   })
    // }

    let paymentImage = handleImageInput(fileList, configCache.paymentQRImage, 'payment')
    let logoImage = handleImageInput(logoFileList, configCache.profile.logo, 'logo')

    if (configCache && configCache.configId) {
      if (paymentImage.changed || logoImage.changed) {
        const QiniuAPI = await qiniuAPI();
        if (paymentImage.changed) {
          setter['paymentQRImage'] = paymentImage.result;

          if (paymentImage.result != "") {
            let newFileObject = {...fileList[0], name: paymentImage.result}
            await QiniuAPI.upload(newFileObject)
            if (paymentImage.current != "") {
              await QiniuAPI.batchDelete([configCache.paymentQRImage])
            }
          }
          else {
            if (paymentImage.current != "") {
              await QiniuAPI.batchDelete([configCache.paymentQRImage])
            }
          }
        }
  
        if (logoImage.changed) {
          setter['profile.logo'] = logoImage.result;

          if (logoImage.result != "") {
            let newFileObject = {...logoFileList[0], name: logoImage.result}
            await QiniuAPI.upload(newFileObject)
            if (logoImage.current != "") {
              await QiniuAPI.batchDelete([configCache.profile.logo])
            }
          }
          else {
            if (logoImage.current != "") {
              await QiniuAPI.batchDelete([configCache.profile.logo])
            }
          }
        }

      }
      updateConfig({
        variables: {
          config: setter,
          configId: configCache.configId
        }
      })
    }


  }

  // additional charges to set in config
  // cart limitation to place order: total weight/price/quantity
  return (
    <Page_01
      title={"Configuration"}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item label="Notice" name="notice">
          <Input.TextArea/>
        </Form.Item>
        <Form.Item label="Delivery Fee (Fixed)" name="delivery">
          <InputNumber/>
        </Form.Item>
        <Form.Item label="Payment QR" name="paymentQRImage">
          <ImageUpload fileList={fileList} setFileList={setFileList} />
        </Form.Item>
        <Form.Item label="Logo" name="logo">
          <ImageUpload fileList={logoFileList} setFileList={setLogoFileList} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={()=>{form.submit()}}>Save</Button>
        </Form.Item>
      </Form>

      <Form>
        Shipping Section
        <Form.Item label="Type">
            <Select options={[
              {
                label: "Fixed",
                value: 'op1'
              },
              {
                label: "Ranged",
                value: 'op2'
              }
            ]}/>
        </Form.Item>
        <Form.Item label="fixed amount">
          <Input/>
        </Form.Item>
        <Form.Item label="ranged amount">
          <Input/>
        </Form.Item>
      </Form>
      {
        updateLoading ? <Loading/> : null
      }
    </Page_01>
  )
}

export default Configuration;