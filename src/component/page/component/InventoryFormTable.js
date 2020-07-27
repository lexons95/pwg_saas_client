import React, { useContext, useState, useEffect, useRef } from 'react';
import { Table, Input, Button, Popconfirm, Form, InputNumber, Modal, Tooltip, Switch, Checkbox } from 'antd';
import { DeleteOutlined, PlusOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import update from 'immutability-helper';

import { useConfigCache } from '../../../utils/customHook';

const { Search } = Input;

const EditableContext = React.createContext();

const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell = ({
  title,
  editable,
  inputType = 'string',
  required = false,
  children,
  dataIndex,
  record,
  handleSave,
  isVariant = false,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef();
  const form = useContext(EditableContext);
  useEffect(() => {
    if (editing) {
      inputRef.current.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };

  const save = async e => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;
  if (isVariant) {
    childNode = editing ? (
      <Form.Item
        style={{
          margin: 0,
          width: '100%',
          height: '100%'
        }}
        name={dataIndex}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{
          paddingRight: 24,
        }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }
  else {
    if (editable) {
      if (dataIndex == 'onSale') {
        childNode = editing ? (   
          <Form.Item name={'onSale'} valuePropName={'checked'}>
            <Checkbox ref={inputRef} onPressEnter={save} onBlur={save}><span style={{userSelect: 'none'}}>on Sale</span></Checkbox>
          </Form.Item>
        ) : (
          <div
            className="editable-cell-value-wrap"
            style={{
              paddingRight: 24,
            }}
            onClick={toggleEdit}
          >
            {children}
          </div>
        );
      }
      else {
        childNode = editing ? (
          <Form.Item
            style={{
              margin: 0,
              width: '100%',
              height: '100%'
            }}
            name={dataIndex}
            rules={
              required ? [
                {
                  required: true,
                  message: `${title} is required.`,
                }
              ] : []
            }
          >
            {inputs[inputType](inputRef, save)}
          </Form.Item>
        ) : (
          <div
            className="editable-cell-value-wrap"
            style={{
              paddingRight: 24,
            }}
            onClick={toggleEdit}
          >
            {children}
          </div>
        );
      }
    }
  }


  return <td {...restProps}>{childNode}</td>;
};

const inputs = {
  decimal: (inputRef, save) => {
    return (
      <InputNumber 
        ref={inputRef} 
        min={0} 
        step={1} 
        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        parser={value => value.replace(/\$\s?|(,*)/g, '')}
        onPressEnter={save} 
        onBlur={save}
      /> 
    )
  },
  integer: (inputRef, save) => {
    return (
      <InputNumber 
        ref={inputRef} 
        min={0} 
        step={1} 
        onPressEnter={save} 
        onBlur={save}
      />
    )
  },
  string: (inputRef, save) => {
    return (
      <Input ref={inputRef} onPressEnter={save} onBlur={save} />
    )
  },
  boolean: (inputRef, save) => {
    return (
      <Checkbox ref={inputRef} onPressEnter={save} onBlur={save} />
    )
  }
}

const InventoryFormTable = (props) => {
  const { productId, inventoryData, setInventoryData, productVariants, setProductVariants } = props;
  
  const configCache = useConfigCache();
  const [ selectedRows, setSelectedRows ] = useState([]);

  const [ newColModal, setNewColModal ] = useState(false);
  const [ form ] = Form.useForm();

  const maxInventory = configCache.inventoryPerProductLimit ? configCache.inventoryPerProductLimit : 20;
  const maxCustomVariants = 4;

  const fixedVariants = [
    {
      name: 'Weight',
      value: 'weight',
      type: 'decimal',
      required: false
    },
    {
      name: 'Price' + (configCache && configCache.currencyUnit ? ` (${configCache.currencyUnit})` : ''),
      value: 'price',
      type: 'decimal',
      required: true
    },
    {
      name: 'Sale Price',
      value: 'salePrice',
      type: 'decimal',
      required: false
    },
    {
      name: 'Stock',
      value: 'stock',
      type: 'integer',
      required: true
    }

  ]

  const getColumns = () => {
    let result = [];
    let variantColKeys = Object.keys(productVariants);

    let fixedColumns = fixedVariants.map((aVariant)=>{
      return {
        title: aVariant.name,
        dataIndex: aVariant.value,
        editable: true,
        width: 110,
        //fixed: 'right',
        inputType: aVariant.type,
        required: aVariant.required,
        sorter: (a, b) => {
          return a[aVariant.value] - b[aVariant.value]
        },
      }
    });

    let defaultColumns = [
      {
        title: 'On Sale',
        dataIndex: 'onSale',
        width: 100,
        fixed: 'right',
        align: 'center',
        render: (text, record) => {
          return (
              <div style={{width: '100%', textAlign: 'center', cursor: 'pointer'}}>
                <Switch checkedChildren="On" unCheckedChildren="Off" checked={record.onSale} onChange={(checked, e)=>{handleUpdateOnSale(record, checked, e)}} />
              </div>
          )
        } 
      },
      {
        title: 'Published',
        dataIndex: 'published',
        width: 100,
        fixed: 'right',
        align: 'center',
        render: (text, record) => {
          return (
              <div style={{width: '100%', textAlign: 'center', cursor: 'pointer'}}>
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" checked={record.published} onChange={(checked, e)=>{handleUpdatePublished(record, checked, e)}} />
              </div>
          )
        } 
      },
      // {
      //   title: "Add Variant",
      //   dataIndex: 'operation',
      //   width: 50,
      //   align: 'center',
      //   fixed: 'right',
      //   filterIcon: (<PlusOutlined />),
      //   filterDropdown: (props) => {
      //     const editVariant = (value) => {
      //       props.confirm();
      //       if (value) {
      //         let newVariantId = 'v' + new Date().getTime();
      //         setProductVariants({...productVariants, [newVariantId]: value});
      //       }
      //     }
      //     return (
      //       <div style={{padding: '10px', display: 'flex'}}>
      //         {
      //           props.visible ? 
      //             <Search
      //               enterButton={(<CheckOutlined />)}
      //               onSearch={editVariant}
      //               //size="small"
      //             />
      //           : null
      //         }
      //       </div>
      //     )
      //   }, 
      //   render: (text, record) =>
      //     inventoryData.length >= 1 ? (
      //       <Popconfirm title="Sure to delete?" onConfirm={() => handleDeleteRow(record.key)}>
      //         <div style={{width: '100%', textAlign: 'center', cursor: 'pointer'}}><DeleteOutlined /></div>
      //       </Popconfirm>
      //     ) : null,
      // },
      {
        title: (
          <Tooltip title="New Variant">
            <Button
              onClick={()=>{setNewColModal(true)}}
              block
              type='link'
              icon={(<PlusOutlined/>)}
              disabled={variantColKeys.length < maxCustomVariants ? false : true}
            />
          </Tooltip>
        ),
        dataIndex: 'operation',
        width: 50,
        align: 'center',
        fixed: 'right',
        render: (text, record) =>
          inventoryData.length >= 1 ? (
            <Popconfirm title="Sure to delete?" onConfirm={() => handleDeleteRow(record.key)}>
              <div style={{width: '100%', textAlign: 'center', cursor: 'pointer'}}><DeleteOutlined /></div>
            </Popconfirm>
          ) : null,
      }
    ];



    // result.push(
    //   {
    //     title: 'SKU',
    //     dataIndex: 'sku',
    //     width: 150,
    //     editable: true,
    //   }
    // );

    if (variantColKeys && variantColKeys.length > 0) {
      variantColKeys.map((aColKey)=>{
        result.push(
          {
            title: productVariants[aColKey],
            dataIndex: aColKey,
            editable: true,
            isVariant: true,
            width: 150,
            ellipsis: true,
            sorter: (a, b) => {
              if (a[aColKey] > b[aColKey]) {
                  return -1;
              }
              if (b[aColKey] > a[aColKey]) {
                  return 1;
              }
              return 0;
              // return a[aColKey] > b[aColKey]
            },
            filterIcon: (<EditOutlined />),
            filterDropdown: (props) => {
              const editVariant = (value) => {
                props.confirm();
                setProductVariants({...productVariants, [aColKey]: value});
              }
              const removeVariant = () => {
                props.confirm();
                handleRemoveColumn(aColKey)
              }
              return (
                <div style={{padding: '10px', display: 'flex'}}>
                  {
                    props.visible ? 
                    <React.Fragment>
                      <Search
                        enterButton={(<CheckOutlined />)}
                        defaultValue={productVariants[aColKey]}
                        onSearch={value => editVariant(value)}
                        //size="small"
                      />
                      <Popconfirm title="Sure to delete?" onConfirm={removeVariant}>
                        <Button type="danger" icon={<DeleteOutlined/>} style={{marginLeft: '5px'}} />
                      </Popconfirm>
                    </React.Fragment>
                    : null
                  }
                </div>
              )
            }, 
            onFilter: () => {
              console.log("on filter ok")
            }
          }
        )
      })
    }
    
    return result.concat(fixedColumns).concat(defaultColumns);
  }

  const handleAddColumn = () => {
    let newVariantValue = form.getFieldValue();
    if (newVariantValue && newVariantValue.variantName) {
      let newVariantId = 'v' + new Date().getTime();
      setProductVariants({...productVariants, [newVariantId]: newVariantValue.variantName})
      form.resetFields()
    }
    setNewColModal(false);
  }

  const handleRemoveColumn = (selectedCol) => {
    const {[selectedCol]: removedCol, ...restVariant} = productVariants;
    setProductVariants(restVariant)
    
    let newInventory = inventoryData.map((anInventory)=>{
      delete anInventory[selectedCol];
      return anInventory;
    })
    setInventoryData(newInventory)
  }

  const handleUpdatePublished = (selectedRow, checked, e) => {
    e.preventDefault();
    let updateIndex = inventoryData.map((aData)=>aData.key).indexOf(selectedRow.key);
    setInventoryData(update(inventoryData, {[updateIndex]: {published: {$set: checked}}}));
  }

  const handleUpdateOnSale = (selectedRow, checked, e) => {
    e.preventDefault();
    let updateIndex = inventoryData.map((aData)=>aData.key).indexOf(selectedRow.key);
    setInventoryData(update(inventoryData, {[updateIndex]: {onSale: {$set: checked}}}));
  }

  const handleDeleteRow = key => {
    setInventoryData(inventoryData.filter(item => item.key !== key))
  };

  const handleAddRow = () => {
    let newId = new Date().getTime()
    let defaultData = {
      key: newId,
      _id: null,
      price: 0,
      stock: 0,
      published: false,
      productId: productId
    };
    let result = defaultData;
    if (inventoryData.length > 0) {
      const {key, _id, published, ...rest} = inventoryData[inventoryData.length - 1];
      result = {...result, ...rest};
    }
    
    setInventoryData([...inventoryData, result]);
  };

  const handleSave = row => {
    const newData = [...inventoryData];
    const index = newData.findIndex(item => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, { ...item, ...row });
    setInventoryData(newData);
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };
  const columnsObj = getColumns().map(col => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: record => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        isVariant: col.isVariant,
        inputType: col.inputType,
        required: col.required,
        handleSave: handleSave,
      }),
    };
  });

  const onSelectChange = (selectedRowKeys,selectedRows) => {
    setSelectedRows(selectedRowKeys);
  };

  const rowSelection = {
    selectedRows,
    onChange: onSelectChange,
    fixed: true
  };

  return (
    <div className="inventoryTable-main">
      <Button
        onClick={handleAddRow}
        type="primary"
        style={{
          marginRight: 16,
          marginBottom: 16,
        }}
        disabled={inventoryData.length < maxInventory ? false : true}
        icon={<PlusOutlined/>}
      >
        Item
      </Button>
      
      <Table
        //rowKey={'_id'}
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        dataSource={inventoryData}
        columns={columnsObj}
        //rowSelection={rowSelection}
        size={"small"}
        pagination={false}
        scroll={{ x: (columnsObj.length - 5) * 150 }}
      />
        {/* footer={(currentPageData)=>{
          return (
            <div>Selecting {selectedRows.length} of {inventoryData.length}</div>
          )
        }} */}
      <Form form={form}>
      <Modal
        title="New Variant"
        width={300}
        bodyStyle={{paddingBottom: 0}}
        visible={newColModal}
        onOk={handleAddColumn}
        onCancel={()=>{setNewColModal(false)}}
        //forceRender
      >
       
          <Form.Item 
            name="variantName"
            rules={[
              {
                required: true,
                message: `Name is required.`,
              }
            ]}
          >
            <Input maxLength={8}/>
          </Form.Item>
      </Modal>
      </Form>
    </div>
  );
}


export default InventoryFormTable;