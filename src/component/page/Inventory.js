import React, {useState, useEffect} from 'react';
import { useQuery, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { Button, Table, Tag, Select, Form } from 'antd';
import {
  PlusOutlined,
  RedoOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';

import Page_01 from './component/Page_01';
import Loading from '../../utils/component/Loading';
import ProductForm from './component/ProductForm';
import ProductForm2 from './component/ProductForm2';
import { getAllProductCategory, getAllProductTags } from '../../utils/Constants';
import { useConfigCache, getConfigCache } from '../../utils/customHook';
import qiniuAPI from '../../utils/qiniuAPI';

const { Option } = Select;

const GET_PRODUCTS_QUERY = gql`
  query products($filter: JSONObject, $configId: String) {
    products(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      name
      subName
      description
      category
      variants
      tags
      type
      published
      images
    }
  }
`;

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

const UPDATE_PRODUCT_PUBLISH = gql`
  mutation updateProductPublish($ids: [String!], $published: Boolean!) {
    updateProductPublish(ids: $ids, published: $published) {
      success
      message
      data
    }
  }
`;

const UPDATE_INVENTORY_PUBLISH = gql`
  mutation updateInventoryPublish($ids: [String!], $published: Boolean!) {
    updateInventoryPublish(ids: $ids, published: $published) {
      success
      message
      data
    }
  }
`;

const Inventory = (props) => {
  const [ productFormModal, setProductFormModal ] = useState(false);
  const [ selectedProduct, setSelectedProduct ] = useState(null);

  const [ selectedItems, setSelectedItems ] = useState([]);
  const [ displaySelectionPanel, setDisplaySelectionPanel ] = useState(false);

  const [ selectedTypeFilter, setSelectedTypeFilter ] = useState("");
  const [ selectedCategoryFilter, setSelectedCategoryFilter ] = useState("");

  const configCache = useConfigCache();
  let productTypeOptions = configCache.productTypes ? configCache.productTypes : [];

  const { data: productsData, loading: loadingProducts, error, refetch: refetchProducts } = useQuery(GET_PRODUCTS_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: {
      filter: {
        sorter: {
          createdAt: 1
        }
      },
      configId: configCache.configId
    },
    onError: (error) => {
      console.log("products error", error)

    },
    onCompleted: (result) => {
      // console.log('refetched products', result)
    }
  });

  const { data: inventoryData, loading: loadingInventory, error: inventoryError, refetch: refetchInventory } = useQuery(READ_PRODUCT_INVENTORY_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: {
      configId: configCache.configId
    },
    onError: (error) => {
      console.log("inventoryData error", error)
    },
    onCompleted: (result) => {
      // console.log('refetched inventory', result)
    }
  });

  const [updateProductPublish, updateProductPublishResult] = useMutation(UPDATE_PRODUCT_PUBLISH,{
    onCompleted: (result) => {
      refetchProducts();
    }
  });
  const [updateInventoryPublish, updateInventoryPublishResult] = useMutation(UPDATE_INVENTORY_PUBLISH,{
    onCompleted: (result) => {
      refetchInventory();
    }
  });


  useEffect(()=>{
    if (selectedItems.length > 0) {
      if (!displaySelectionPanel) setDisplaySelectionPanel(true);
    }
    else {
      if (displaySelectionPanel) setDisplaySelectionPanel(false)
    }
  },[selectedItems.length])

  let isLoading = loadingProducts || 
                  loadingInventory ||
                  updateProductPublishResult.loading ||
                  updateInventoryPublishResult.loading;

  const handleProductFormModalOpen = () => {
    setProductFormModal(true);
  }
  const handleProductFormModalClose = () => {
    setProductFormModal(false);
  }

  const handleOnClickProduct = (product) => {
    handleProductFormModalOpen();
    setSelectedProduct(product)
  }

  const refetchData = () => {
    refetchProducts();
    refetchInventory();
  }


  let columns = [
    {
      title: 'No.',
      dataIndex: 'index',
      width: 75,
      render: (text, record, index) => {
        return index + 1 + '.';
      }
    },
    {
      title: "Created At",
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (text, record) => {
        let dateTime = format(new Date(text), "MM/dd/yyyy hh:mm:ss aa")
        return dateTime;
      }
    },
    {
      title: 'Name',
      dataIndex: 'name',
      render: (text, record) => {
        let result = record.name ? (<Button type="link" onClick={()=>{handleOnClickProduct(record)}}>{record.name}</Button>) : null;
        if (!result) {
          let newName = "";
          if (record.variants) {
            
            let variantKeys = Object.keys(record.variants);
            variantKeys.map((aKey, index)=>{
              newName += `${record.variants[aKey]} ${index == variantKeys.length - 1 ? "" : "/ "}`
            })
          }
          else {
            newName = "-";
          }
          result = newName;
        }
        return result;
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      sorter: (a, b) => {
        if (a.type && b.type) {
          return a.type - b.type
        }
        return 0;
      },
      render: (text, record) => {
        let result = record.type;
        if (!result) {
          result = '-';
        }
        else {
          let foundOption = productTypeOptions.find((anOption)=>anOption.value == result);
          if (foundOption) {
            result = foundOption.name
          }
        }
        return result;
      }
    },
    {
      title: 'Price',
      dataIndex: 'price',
      render: (text, record) => {
        let result = record.price;
        if (!result) {
          result = '-';
        }
        return result;
      }
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      sorter: (a, b) => {
        if (a.stock && b.stock) {
          return a.stock - b.stock
        }
        return 0;
      },
      render: (text, record) => {
        let result = record.stock;
        if (!result) {
          if (record.children && record.children.length > 0) {
            let sum = 0;
            record.children.map((aChild)=>{sum += aChild.stock});
            result = sum;
          }
          else {
            result = '-';
          }
        }
        return result;
      }
    },
    {
      title: 'Published',
      dataIndex: 'published',
      render: (text, record) => {
        return (
          record.published ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>
        )
      } 
    }
  ]

  

  const selectionPanel = () => {
    let inventoryIds = [];
    let productIds = [];
    selectedItems.map((anItem)=>{
      if (anItem.productId && anItem.productId != "") {
        inventoryIds.push(anItem._id)
      }
      else {
        productIds.push(anItem._id)
      }
    });
  
    const updateToPublish = () => {
      if (inventoryIds.length > 0) {
        updateInventoryPublish({
          variables: {
            ids: inventoryIds,
            published: true
          }
        })
      }
      if (productIds.length > 0) {
        updateProductPublish({
          variables: {
            ids: productIds,
            published: true
          }
        })
      }
    }
    const updateToUnpublish = () => {
      if (inventoryIds.length > 0) {
        updateInventoryPublish({
          variables: {
            ids: inventoryIds,
            published: false
          }
        })
      }
      if (productIds.length > 0) {
        updateProductPublish({
          variables: {
            ids: productIds,
            published: false
          }
        })
      }
    }

    const clearSelection = () => {
      setSelectedItems([])
    }
    return (
      <div style={{display: 'flex', alignItems:'center'}}>
        <Button type="primary" size="small" onClick={updateToPublish} style={{marginRight: '5px'}} disabled={!displaySelectionPanel}>Publish</Button>
        <Button size="small" onClick={updateToUnpublish} style={{marginRight: '5px'}} disabled={!displaySelectionPanel}>Unpublish</Button>
        <Button size="small" onClick={clearSelection}>Cancel</Button>
        &nbsp;{selectedItems.length} Selected
      </div>
    )
  }

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedItems(selectedRows);
      // console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
    },
    onSelect: (record, selected, selectedRows) => {
      // console.log(record, selected, selectedRows);
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
      // console.log(selected, selectedRows, changeRows);
    },
    selectedRowKeys: selectedItems.map((anItem)=>anItem._id)
  };

  const filterProducts = (products) => {
    let result = [];

    let filteredType = [];

    if (selectedTypeFilter != "") {
      if (selectedCategoryFilter == 'none') {
        filteredType = products.filter((aProduct)=>{ return aProduct.type == null });
      }
      else {
        filteredType = products.filter((aProduct)=>{ return aProduct.type == selectedTypeFilter });
      }
    }
    else {
      filteredType = products;
    }

    if (filteredType.length > 0) {
      if (selectedCategoryFilter != "" && selectedCategoryFilter != 'none') {
        result = filteredType.filter((aProduct)=>{
          let found = aProduct.category.find((aCategory)=>{return aCategory._id == selectedCategoryFilter})
          if (found) {
            return true;
          }
          return false;
        })
      } 
      else if (selectedCategoryFilter == 'none') {
        result = filteredType.filter((aProduct)=>{
          return aProduct.category.length == 0;
        })
      }
      else {
        result = filteredType;
      }
    }

    return result;
  }

  const getTableData = () => {
    let result = [];
    if (productsData && inventoryData && !error && !inventoryError) {
      let inventoryWithKey = inventoryData.inventory.map((anInventory)=>{ return {...anInventory, key: anInventory._id} });
      filterProducts(productsData.products).map((aProduct,index)=>{
        let productInventory = inventoryWithKey.filter((anInventory)=>anInventory.productId == aProduct._id);
        aProduct['key'] = aProduct._id;
        if (productInventory.length > 0) {
          aProduct['children'] = productInventory;
        }
        result.push(aProduct)
      });
    }
    return result;
  }

  let hasSelected = selectedItems.length > 0 ? true : false;
  let allCategories = productsData && productsData.products ? getAllProductCategory(productsData.products) : []
  let allTags = productsData && productsData.products ? getAllProductTags(productsData.products) : []

  let tableData = getTableData()

  const getAllImagesName = async () => {
    let allImages = [];
    if (productsData && productsData.products && productsData.products.length > 0) {
      productsData.products.map((aProduct)=>{
        if (aProduct.images && aProduct.images.length > 0) {
          aProduct.images.map((anImage)=>{
            allImages.push(anImage.name)
          })
        }
      })
    }
    console.log('getAllImagesName',allImages)
    const QiniuAPI = await qiniuAPI();

    if (allImages.length > 0) {
      let x = await QiniuAPI.batchCopy(allImages);
      console.log('copy result', x)
    }


  }

  return (
    <Page_01
      title={"Inventory"}
      extra={[
        //<Button key="copy" onClick={getAllImagesName}>copy image</Button>,
        <Button key="refresh" type="primary" icon={<RedoOutlined />} onClick={()=>{refetchData()}}/>,
        <Button key="create" type="primary" icon={<PlusOutlined />} onClick={()=>{handleOnClickProduct(null)}} />
      ]}
    >
      <Form layout="inline">
        <Form.Item label={'Type'}>
          <Select
            placeholder="Type"
            onChange={(value)=>{
              setSelectedTypeFilter(value)
              setSelectedItems([])
            }}
            defaultValue={selectedTypeFilter}
            style={{
              width: '125px',
              //minWidth: '35%', 
              //marginBottom: '24px'
            }}
          >
            <Option key={'all'} value={""}>全部</Option>  
            {
              productTypeOptions.map((aType,index)=>{
                return (
                  <Option key={index} value={aType.value}>{aType.name}</Option>
                )
              })
            }
            <Option key={'none'} value={"none"}>其他</Option>  
          </Select>
        </Form.Item>
        <Form.Item label={'Category'}>
          <Select
            placeholder="Category"
            onChange={(value)=>{
              setSelectedCategoryFilter(value)
              setSelectedItems([])
            }}
            defaultValue={selectedCategoryFilter}
            style={{
              width: '150px',
              //minWidth: '35%', 
              //marginBottom: '24px'
            }}
          >
            <Option key={'all'} value={""}>全部</Option>  
            {
              allCategories.map((aCategory,index)=>{
                return (
                  <Option key={index} value={aCategory._id}>{aCategory.name}</Option>
                )
              })
            }
            <Option key={'none'} value={"none"}>其他</Option>  
          </Select>
        </Form.Item>
      </Form>
      <Table 
        columns={columns} 
        rowSelection={rowSelection} 
        dataSource={tableData} 
        pagination={{
          showSizeChanger: true,
          position: ['topRight'],
          showTotal: (total, range)=>{
            return `Showing ${range[0]}-${range[1]}/${total}`
          }
        }}
        scroll={{x: columns.length * 150}}
        size={'small'}
      />
      <div className={`inventory-selectionPanel ${displaySelectionPanel ? 'open' : 'close'}`}>
        {selectionPanel()}
      </div>

      <ProductForm
        // product props
        product={selectedProduct} 
        categories={allCategories}
        tags={allTags}
        refetch={refetchData}

        // modal props
        modalVisible={productFormModal}
        closeModal={handleProductFormModalClose}
      />

      {/* <ProductForm2
        // product props
        product={selectedProduct} 
        categories={allCategories}
        tags={allTags}
        refetch={refetchData}

        // modal props
        visible={productFormModal}
        onCancel={handleProductFormModalClose}
      /> */}

      {
        isLoading ? <Loading/> : null
      }
    </Page_01>
  )

//   {
//     "Version": "2012-10-17",
//     "Statement": [
//         {
//             "Sid": "PublicReadGetObject",
//             "Effect": "Allow",
//             "Principal": {
//                 "AWS": "*"
//             },
//             "Action": "s3:GetObject",
//             "Resource": "arn:aws:s3:::store.mananml.shop/*"
//         }
//     ]
// }
}

export default Inventory;
