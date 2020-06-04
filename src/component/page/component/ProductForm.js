import React, {useState, useEffect} from 'react';
import { Button, Form, Input, Upload, Modal, Switch, Collapse, Select, Divider } from 'antd';
import { useLazyQuery, useMutation } from "@apollo/react-hooks";
import { PlusOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import gql from "graphql-tag";

import confirmation from '../../../utils/component/confirmation';
import { showMessage } from '../../../utils/component/notification';
import InventoryFormTable from './InventoryFormTable';

import qiniuAPI from '../../../utils/qiniuAPI';
import { useConfigCache } from '../../../utils/Constants';
// import ApolloClientAPI from '../../../utils/ApolloClientAPI';

const { Panel } = Collapse;
const { Option } = Select;

const READ_PRODUCT_INVENTORY_QUERY = gql`
  query inventory($filter: JSONObject, $configId: String) {
    inventory(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      price
      stock
      variants
      published
      productId
    }
  }
`;

const CREATE_NEW_PRODUCT_QUERY = gql`
  mutation createProduct($product: JSONObject!) {
    createProduct(product: $product) {
      success
      message
      data
    }
  }
`;

const DELETE_PRODUCT_QUERY = gql`
  mutation deleteProduct($_id: String!) {
    deleteProduct(_id: $_id) {
      success
      message
      data
    }
  }
`;

const UPDATE_PRODUCT_QUERY = gql`
  mutation updateProduct($product: JSONObject!, $inventory: [JSONObject!]) {
    updateProduct(product: $product, inventory: $inventory) {
      success
      message
      data
    }
  }
`;

// convert db image obj to match Upload Component format
const getDefaultImageArray = (array, config) => {
  let imageSrc = config.imageSrc;
  return array.map((anImage)=>{
    anImage['uid'] = anImage.name;
    anImage['url'] = imageSrc + anImage.name;
    anImage['thumbUrl'] = imageSrc + anImage.name;
    if (anImage.fav) {
      //anImage['status'] = 'done';
    }
    return anImage;
  })
}

// mainly for image upload/delete in qiniu
const getImageFilesToModify = (defaultArray = [], newArray = []) => {
  let newImageToUpload = [];
  let currentUploadedImages = [];
  let imagesToDelete = []
  let allImages = []

  newArray.map((anImage,index)=>{
    // new image to be uploaded
    let newImageName = anImage.name;
    if (anImage.originFileObj) {
      let imageNameSplited = newImageName.split('.');
      newImageName = `saas_${index}_${new Date().getTime()}_${imageNameSplited[imageNameSplited.length - 2]}.${imageNameSplited[imageNameSplited.length - 1]}`;
      anImage['name'] = newImageName;
      newImageToUpload.push(anImage)
    }
    // uploaded images
    else {
      currentUploadedImages.push(anImage)
    }
    // convert Upload Component image obj to match db format
    allImages.push({
      name: newImageName,
      fav: anImage.fav ? anImage.fav : false
    })
  });

  defaultArray.map((anImage)=>{
    let foundIndex = currentUploadedImages.map((anUploadedImage)=>anUploadedImage.name).indexOf(anImage.name);
    if (foundIndex < 0) {
      imagesToDelete.push(anImage);
    }
  })

  return {
    upload: newImageToUpload,
    delete: imagesToDelete,
    allImages: allImages,
    uploaded: defaultArray
  };
}

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

const ProductInfoForm = (props) => {
  const {product = null, categories, refetch, ...modalProps} = props;
  const configCache = useConfigCache();
  const fileLimit = 6;

  const [ form ] = Form.useForm();
  const [ fileList, setFileList ] = useState([]);
  const [ previewVisible, setPreviewVisible ] = useState(false);
  const [ previewImage, setPreviewImage ] = useState(null);

  // inventory
  const [ inventoryData, setInventoryData ] = useState([]);
  const [ productCategory, setProductCategory ] = useState([]);
  const [ newCategoryName, setNewCategoryName ] = useState('');
  const [ productVariants, setProductVariants ] = useState({'sku': 'SKU'});

  useEffect(() => {
    if (modalProps.modalVisible) {
      setProductCategory(categories)

      if (product) {
        let productObj = Object.assign({},product);
        if (product.category && product.category.length > 0) {
          let newCategoryFormat = product.category.map((aCategory)=>{
            return {
              key: aCategory._id,
              label: aCategory.name
            }
          })
          productObj['category'] = newCategoryFormat[0];
        }
        form.setFieldsValue(productObj);
        if (product.variants) {
          setProductVariants(product.variants)
        }
  
        readInventory({
          variables: {
            filter: {
              filter: { productId: product._id }
            },
            configId: configCache.configId
          }
        });
        if (product.images && product.images.length > 0) {
          setFileList(getDefaultImageArray(product.images, configCache));
        }
      }
    }
    else {
      form.resetFields();
    }
    modalProps.setModalFooter(getModalFooter());
    
  }, [modalProps.modalVisible]);

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div className="ant-upload-text">Upload</div>
    </div>
  );

  const handleFileListChange = ({ fileList, ...rest }) => {
    let result = fileList.map((aFile)=>{
      if (aFile.fav) {
        //aFile['status'] = 'done';
      }
      return aFile;
    });
    if (fileList.length > fileLimit) {
      result = fileList.slice(0, fileLimit-1);
    }
    if (result.length > 0) {
      let foundFavImage = result.find((anImage)=>anImage.fav);
      if (!foundFavImage) {
        result[0]['fav'] = true;
      }
    }
    setFileList(result)
  };

  const handleFavImageChange = () => {
    let newFileList = [].concat(fileList)
    newFileList.map((aFile)=>{
      if (aFile.name == previewImage.name) {
        aFile['fav'] = true;
      }
      else {
        aFile['fav'] = false;
      }
      return aFile;
    });
    setFileList(newFileList);
  }

  const handlePreviewOpen = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewVisible(true);
    setPreviewImage(file);
  };

  const handlePreviewClose = () => {
    setPreviewVisible(false);
  }

  const [ readInventory, readInventoryResult ] = useLazyQuery(READ_PRODUCT_INVENTORY_QUERY,{
    fetchPolicy: "cache-and-network",
    onCompleted: (result) => {
      if (result && result.inventory) {
        let flattenedInventory = [];
        result.inventory.map((anInventory,index)=>{
          const { variants, ...restInventory } = anInventory;
          let newInventory = {...restInventory, ...variants, key: restInventory._id};
          flattenedInventory.push(newInventory);
        })
        setInventoryData(flattenedInventory);
      }

    }
  })

  const [createProduct, createProductResult ] = useMutation(CREATE_NEW_PRODUCT_QUERY,{
    onCompleted: (result) => {
      // console.log("createProduct result",result)
      modalProps.onCancel();
      refetch();
      showMessage({type: 'success', message: 'Success: Product Created'});

    }
  })
  const [deleteProduct] = useMutation(DELETE_PRODUCT_QUERY,{
    onCompleted: (result) => {
      // console.log("deleteProduct result",result)
      modalProps.onCancel();
      showMessage({type: 'success', message: 'Success: Product deleted'});
      refetch();
    }
  })
  const [updateProduct, updateProductResult ] = useMutation(UPDATE_PRODUCT_QUERY,{
    onCompleted: (result) => {
      // console.log("updateProduct result",result)
      modalProps.onCancel();
      refetch();
      showMessage({type: 'success', message: 'Success: Product Updated'});
    }
  })

  const onFinish = async (values) => {
// console.log('onFinish',values)
    const { images, category, ...restValues } = values;
    let finalProductValue = {
      ...restValues,
      category: [],
      images: [], 
      variants: productVariants
    }

    if (!values._id) {
      delete finalProductValue._id;
    }

    // handle category
    if (values.category) {
      let foundSelectedCategory = productCategory.find(aCategory=>aCategory._id == values.category.key);
      if (foundSelectedCategory && foundSelectedCategory._id) {
        finalProductValue['category'] = [foundSelectedCategory];
      }
    }

    // handle images
    let imagesToBeModified = getImageFilesToModify(product && product.images ? product.images : [], fileList);
    // if (imagesToBeModified.upload.length > 0 || imagesToBeModified.delete.length > 0) {
    finalProductValue['images'] = imagesToBeModified.allImages;
    // }

    const QiniuAPI = await qiniuAPI();

    if (imagesToBeModified.upload.length > 0) {
      imagesToBeModified.upload.map(async (aNewImage)=>{
        await QiniuAPI.upload(aNewImage)
      })
    }
    if (imagesToBeModified.delete.length > 0) {
      await QiniuAPI.batchDelete(imagesToBeModified.delete.map(anImage=>anImage.name))
    }


    if (!product) {
      createProduct({
        variables: {
          product: finalProductValue
        }
      })
    }
    else {

      let newInventory = [...inventoryData];

      // handle variant
      newInventory = newInventory.map((anInventory)=>{
        const { key, ...restInventory} = anInventory;

        //delete anInventory.key;
        let variantObj = {}
        Object.keys(productVariants).map((aKey)=>{
          if (restInventory.hasOwnProperty(aKey)) {
            variantObj[aKey] = restInventory[aKey];
            delete restInventory[aKey];
          }
        });
        restInventory['variants'] = variantObj;
        return restInventory;
      });

      // handle deleted inventory
      let deletedInventory = []
      if (readInventoryResult.data && readInventoryResult.data.inventory) {
        readInventoryResult.data.inventory.map((anInventory)=>{
          let foundInventory = newInventory.map((aNewInventory)=>{return aNewInventory._id}).indexOf(anInventory._id);
          if (foundInventory < 0) {
            deletedInventory.push({...anInventory, deleted: true});
          }
        })
      } 

      updateProduct({
        variables: {
          product: {...finalProductValue, _id: product._id},
          inventory: newInventory.concat(deletedInventory)
        }
      })

    }
  }

  const onDeleteProduct = () => {
    confirmation('confirm',"Confirm delete?",async ()=>{
      if (product.images && product.images.length > 0) {
        const QiniuAPI = await qiniuAPI();
        await QiniuAPI.batchDelete(product.images.map(anImage=>anImage.name))
      }
      deleteProduct({variables:{_id: product._id}})
    })
  }

  // const checkFormTouched = () => {
  //   console.log('isFieldsTouched',form.isFieldTouched('name'));
  // }

  const onCategoryNameChange = (e) => {
    setNewCategoryName(e.target.value);
  }

  const addNewCategory = () => {
    if (newCategoryName && newCategoryName != "") {
      setProductCategory([...productCategory, {
        _id: `category_${newCategoryName}_${new Date().getTime()}`,
        name: newCategoryName
      }]);
      setNewCategoryName('')
    }
  }

  const getModalFooter = () => {
    const modalFooter = [
      <Button key={'cancel'} onClick={modalProps.onCancel}>
        Cancel
      </Button>,
      <Button key={'submit'} type="primary" onClick={()=>{form.submit()}}>
        {product ? "Save" : "Save"}
      </Button>
    ]
  
    if (product) {
      modalFooter.unshift(
        <Button key={'delete'} type="danger" onClick={onDeleteProduct}>
          Delete
        </Button>
      )
    }
    return modalFooter;
  }

  const getPreviewModalFooter = () => {
    let isFav = previewImage && previewImage.fav;
    return (
      <Button 
        type={isFav ? 'primary': 'default'} 
        icon={isFav ? (<StarFilled style={{color: 'gold'}}/>) : (<StarOutlined/>) } 
        onClick={handleFavImageChange}
      >
        Favourite
      </Button>
    )
  } 

  // const editImageOutput = (image) => {
  //   if (image) {
  //     const QiniuAPI = qiniuAPI();
  //     let imageSrc = configCache.imageSrc;
  //     var imgLink = QiniuAPI.imageMogr2({
  //       "auto-orient": true,      // 布尔值，是否根据原图EXIF信息自动旋正，便于后续处理，建议放在首位。
  //       strip: true,              // 布尔值，是否去除图片中的元信息
  //       thumbnail: '1000x1000',    // 缩放操作参数
  //       crop: '!300x400a10a10',    // 裁剪锚点参数
  //       quality: 40,              // 图片质量，取值范围1-100
  //       rotate: 20,               // 旋转角度，取值范围1-360，缺省为不旋转。
  //       blur: '3x5'               // 高斯模糊参数
  //     }, image.name, domain)
  //   }
  // }
  return (
    <div id="productForm">
    {/* <Button onClick={()=>{
      console.log('category',categories)
      console.log('inv',inventoryData)
      console.log('productVariants',productVariants)
      }}>inventoryData</Button> */}

      <Collapse 
        defaultActiveKey={['1','2']} 
        //bordered={false}
        expandIconPosition="right"
      >
        <Panel header="Product Information" key="1">
          <Form 
            name="complex-form" 
            form={form} 
            onFinish={onFinish} 
            labelCol={{ span: 5 }} 
            wrapperCol={{ span: 16 }} 
          >
            {
              !product ? (
                <Form.Item name={'_id'} label="ID">
                  <Input />
                </Form.Item> 
              ) : null
            }
            <Form.Item name={'name'} label="Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name={'description'} label="Description">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name={'category'} label="Category">
              <Select
                style={{ width: 240 }}
                placeholder="Select a category"
                labelInValue={true}
                allowClear={true}
                dropdownRender={menu => (
                  <div>
                    {menu}
                    <Divider style={{ margin: '4px 0' }} />
                    <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
                      <Input style={{ flex: 'auto' }} value={newCategoryName} onChange={onCategoryNameChange} required={true}/>
                      <Button
                        type="link"
                        icon={<PlusOutlined />}
                        onClick={addNewCategory}
                        disabled={newCategoryName.trim() != "" ? false : true}
                      >
                        New
                      </Button>
                    </div>
                  </div>
                )}
              >
                {productCategory.map((item, index) => (
                  <Option key={index} value={item._id}>{item.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name={'published'} label="Published" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>

            <Form.Item name={'images'} label={`Images (max: ${fileLimit})`}>
              <React.Fragment>
                <Upload
                  accept="image/*"
                  beforeUpload={ (file) => {
                    return false;
                  }}
                  listType="picture-card"
                  multiple={true}
                  fileList={fileList}
                  onPreview={handlePreviewOpen}
                  onChange={handleFileListChange}
                  //showUploadList={{
                  //  showDownloadIcon: true,
                  //  downloadIcon: <StarFilled style={{color: 'yellow'}}/>
                  //}}
                  className={'productForm-upload'}
                >
                  {fileList.length < fileLimit ? uploadButton : null}
                </Upload>
                <Modal 
                  visible={previewVisible} 
                  footer={getPreviewModalFooter()} 
                  onCancel={handlePreviewClose}>
                {/* <Modal visible={previewVisible} footer={null} onCancel={handlePreviewClose}> */}
                  <img alt={`preview: ${previewImage ? previewImage.name : ""}`} style={{ width: '100%' }} src={previewImage ? previewImage.url || previewImage.thumbUrl : ''} />
                  {/* <img alt="example" style={{ width: '100%' }} src={()=>{editImageOutput(previewImage)}} /> */}
                </Modal>
              </React.Fragment>
            </Form.Item>
          </Form> 

        </Panel>
        {
          product ? (
            <Panel header="Pricing & Variants" key="2">
              <InventoryFormTable
                productId={product._id}
                inventoryData={inventoryData}
                setInventoryData={setInventoryData}
                productVariants={productVariants}
                setProductVariants={setProductVariants}
              />
            </Panel>
          ) : null
        }
        {/* {
          product ? (
            <Panel header="Related Products" key="3">
              
            </Panel>
          ) : null
        } */}
      </Collapse>
    </div>
  )
}

const ProductForm = (props) => {
  const { product, categories = [], modalVisible, refetch, closeModal } = props;
  const [ modalFooter, setModalFooter ] = useState([]);

  let modalProps = {}
  if (modalFooter) {
    modalProps['footer'] = modalFooter;
  }

  return (
    <Modal
      title={product ? product.name : "New Product"}
      width={'95%'}
      visible={modalVisible}
      onCancel={closeModal}
      destroyOnClose
      wrapClassName={'products-modalWrapper'}
      //bodyStyle={{paddingLeft:'0'}} //for left tab
      style={{overflow:"hidden"}}
      //bodyStyle={{paddingTop:'0'}}
      {...modalProps}
    >
      <ProductInfoForm
        // product props
        product={product} 
        categories={categories}
        refetch={refetch}

        // modal props
        modalVisible={modalVisible}
        onCancel={closeModal}
        setModalFooter={setModalFooter}
      />
    </Modal>
  )
}
export default ProductForm;