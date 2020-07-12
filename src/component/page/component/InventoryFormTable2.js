import React, { useState, useEffect } from 'react';
import { Form, Space, Input, InputNumber, Button, List, Checkbox, Switch } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useLazyQuery, useQuery, useMutation } from "@apollo/react-hooks";
import { useConfigCache ,useInventoryQuery } from '../../../utils/customHook';

// const fixedVariants = [
//   {
//     name: 'Price',
//     value: 'price',
//     type: 'decimal',
//     required: true
//   },
//   {
//     name: '',
//     value: 'onSale',
//     type: 'boolean',
//     required: false
//   },
//   {
//     name: 'Sale Price',
//     value: 'salePrice',
//     type: 'decimal',
//     required: false
//   },
//   {
//     name: 'Stock',
//     value: 'stock',
//     type: 'integer',
//     required: true
//   },
//   {
//     name: 'Weight',
//     value: 'weight',
//     type: 'decimal',
//     required: false
//   }
// ]

// const getColumns = (fixedVariants, productVariants) => {
//   let result = [];
//   let variantColKeys = Object.keys(productVariants);

//   let fixedColumns = fixedVariants.map((aVariant)=>{
//     return {
//       title: aVariant.name,
//       dataIndex: aVariant.value,
//       width: '100px',
//       inputType: aVariant.type,
//       required: aVariant.required
//     }
//   });

//   let defaultColumns = [
//     {
//       title: 'Published',
//       dataIndex: 'published',
//       width: 100,
//       fixed: 'right',
//       align: 'center',
//       render: (text, record) => {
//         return (
//             <div style={{width: '100%', textAlign: 'center', cursor: 'pointer'}}>
//               <Switch checkedChildren="Active" unCheckedChildren="Inactive" checked={record.published} onChange={(checked, e)=>{handleUpdatePublished(record, checked, e)}} />
//             </div>
//         )
//       } 
//     },
//     {
//       title: (
//         <Tooltip title="New Variant">
//           <Button
//             onClick={()=>{setNewColModal(true)}}
//             block
//             type='link'
//             icon={(<PlusOutlined/>)}
//             disabled={variantColKeys.length < maxCustomVariants ? false : true}
//           />
//         </Tooltip>
//       ),
//       dataIndex: 'operation',
//       width: 50,
//       align: 'center',
//       fixed: 'right',
//       render: (text, record) =>
//         inventoryData.length >= 1 ? (
//           <Popconfirm title="Sure to delete?" onConfirm={() => handleDeleteRow(record.key)}>
//             <div style={{width: '100%', textAlign: 'center', cursor: 'pointer'}}><DeleteOutlined /></div>
//           </Popconfirm>
//         ) : null,
//     }
//   ];



//   // result.push(
//   //   {
//   //     title: 'SKU',
//   //     dataIndex: 'sku',
//   //     width: 150,
//   //     editable: true,
//   //   }
//   // );

//   if (variantColKeys && variantColKeys.length > 0) {
//     variantColKeys.map((aColKey)=>{
//       result.push(
//         {
//           title: productVariants[aColKey],
//           dataIndex: aColKey,
//           editable: true,
//           isVariant: true,
//           width: 150,
//           ellipsis: true,
//           sorter: (a, b) => {
//             if (a[aColKey] > b[aColKey]) {
//                 return -1;
//             }
//             if (b[aColKey] > a[aColKey]) {
//                 return 1;
//             }
//             return 0;
//             // return a[aColKey] > b[aColKey]
//           },
//           filterIcon: (<EditOutlined />),
//           filterDropdown: (props) => {
//             const editVariant = (value) => {
//               props.confirm();
//               setProductVariants({...productVariants, [aColKey]: value});
//             }
//             const removeVariant = () => {
//               props.confirm();
//               handleRemoveColumn(aColKey)
//             }
//             return (
//               <div style={{padding: '10px', display: 'flex'}}>
//                 {
//                   props.visible ? 
//                   <React.Fragment>
//                     <Search
//                       enterButton={(<CheckOutlined />)}
//                       defaultValue={productVariants[aColKey]}
//                       onSearch={value => editVariant(value)}
//                       //size="small"
//                     />
//                     <Popconfirm title="Sure to delete?" onConfirm={removeVariant}>
//                       <Button type="danger" icon={<DeleteOutlined/>} style={{marginLeft: '5px'}} />
//                     </Popconfirm>
//                   </React.Fragment>
//                   : null
//                 }
//               </div>
//             )
//           }, 
//           onFilter: () => {
//             console.log("on filter ok")
//           }
//         }
//       )
//     })
//   }
  
//   return result.concat(fixedColumns).concat(defaultColumns);
// }
// const inputs = {
//   decimal: (key, name, label) => {
//     return (
//       <Form.Item
//         key={key}
//         name={name}
//         fieldKey={key}
//         style={{marginBottom: 0}}
//       >
//         <InputNumber  
//           min={0} 
//           step={1} 
//           formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//           parser={value => value.replace(/\$\s?|(,*)/g, '')}
//         />
//       </Form.Item>
//     )
//   },
//   integer: (key, name, label) => {
//     return (
//       <Form.Item
//         key={key}
//         name={name}
//         fieldKey={key}
//         style={{marginBottom: 0}}
//       >
//         <InputNumber  
//           min={0} 
//           step={1} 
//         />
//       </Form.Item>
//     )
//   },
//   boolean: (key, name, label) => {
//     return (
//       <Form.Item
//         key={key}
//         name={name}
//         fieldKey={key}
//         style={{marginBottom: 0}}
//         valuePropName={'checked'}
//       >
//         <Checkbox>{label}</Checkbox>
//       </Form.Item>
//     )
//   },
//   string: (key, name, label) => {
//     return (
//       <Input />
//     )
//   }
// }

let fixedVariantColumns = [
  {
    title: 'No.',
    dataIndex: 'index',
    width: '40px',
    render: (text, record, rowIndex) => {
      return (rowIndex + 1) + '.';
    }
  },
  {
    title: 'Price',
    dataIndex: 'price',
    width: '100px',
    render: (text, record, rowIndex, columnIndex, fieldSetting) => {
      let { name, key } = fieldSetting;
      return (
        <Form.Item
          key={`row${rowIndex}col${columnIndex}`}
          name={name}
          fieldKey={key}
          style={{marginBottom: 0}}
        >
          <InputNumber  
            min={0} 
            step={1} 
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>
      )
    }
  },
  {
    title: '',
    dataIndex: 'onSale',
    width: '100px',
    render: (text, record, rowIndex, columnIndex, fieldSetting) => {
      let { name, key } = fieldSetting;
      return (
        <Form.Item
          key={`row${rowIndex}col${columnIndex}`}
          name={name}
          fieldKey={key}
          style={{marginBottom: 0}}
          valuePropName={'checked'}
        >
          <Checkbox><span style={{userSelect: 'none'}}>{'on Sale'}</span></Checkbox>
        </Form.Item>
      )
    }
  },
  {
    title: 'Sale Price',
    dataIndex: 'salePrice',
    width: '100px',
    render: (text, record, rowIndex, columnIndex, fieldSetting) => {
      let { name, key } = fieldSetting;

      return (
        <Form.Item
          key={`row${rowIndex}col${columnIndex}`}
          name={name}
          fieldKey={key}
          style={{marginBottom: 0}}
        >
          <InputNumber  
            min={0} 
            step={1} 
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>
      )
    }
  },
  {
    title: 'Stock',
    dataIndex: 'stock',
    width: '100px',
    render: (text, record, rowIndex, columnIndex, fieldSetting) => {
      let { name, key } = fieldSetting;
      return (
        <Form.Item
          key={`row${rowIndex}col${columnIndex}`}
          name={name}
          fieldKey={key}
          style={{marginBottom: 0}}
        >
          <InputNumber  
            min={0} 
            step={1} 
          />
        </Form.Item>
      )
    }
  },
  {
    title: 'Weight',
    dataIndex: 'weight',
    width: '100px',
    render: (text, record, rowIndex, columnIndex, fieldSetting) => {
      let { name, key } = fieldSetting;
      return (
        <Form.Item
          key={`row${rowIndex}col${columnIndex}`}
          name={name}
          fieldKey={key}
          style={{marginBottom: 0}}
        >
          <InputNumber  
            min={0} 
            step={1} 
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>
      )
    }
  },
  {
    title: 'Published',
    dataIndex: 'published',
    width: '100px',
    render: (text, record, rowIndex, columnIndex, fieldSetting) => {
      let { name, key } = fieldSetting;
      return (
        <Form.Item
          key={`row${rowIndex}col${columnIndex}`}
          name={name}
          fieldKey={key}
          style={{marginBottom: 0}}
          valuePropName={'checked'}
        >
          <Switch checkedChildren="On" unCheckedChildren="Off" />
        </Form.Item>
      )
    } 
  },
  {
    title: (<Button type="link" icon={(<PlusOutlined/>)} />),
    dataIndex: 'action',
    width: '50px',
    style: {
      textAlign: 'center'
    },
    render: (text, record, rowIndex, columnIndex, fieldSetting) => {
      return (<Button onClick={()=>{fieldSetting.removeRow(rowIndex)}} type={'link'} icon={<DeleteOutlined />}/>)
    }
  }
  // {
  //   title: (
  //     <Tooltip title="New Variant">
  //       <Button
  //         onClick={()=>{setNewColModal(true)}}
  //         block
  //         type='link'
  //         icon={(<PlusOutlined/>)}
  //         disabled={variantColKeys.length < maxCustomVariants ? false : true}
  //       />
  //     </Tooltip>
  //   ),
  //   dataIndex: 'operation',
  //   width: '50px',
  //   render: (text, record) =>
  //     inventoryData.length >= 1 ? (
  //       <Popconfirm title="Sure to delete?" onConfirm={() => handleDeleteRow(record.key)}>
  //         <div style={{width: '100%', textAlign: 'center', cursor: 'pointer'}}><DeleteOutlined /></div>
  //       </Popconfirm>
  //     ) : null,
  // }
]

const getAllColumns = (fixedVariantColumns, productVariants) => {
  let result = [];
  // let variantColKeys = Object.keys(productVariants);

  // if (variantColKeys && variantColKeys.length > 0) {
  //   variantColKeys.map((aColKey)=>{
  //     result.push(
  //       {
  //         title: productVariants[aColKey],
  //         dataIndex: aColKey,
  //         editable: true,
  //         isVariant: true,
  //         width: 150,
  //         ellipsis: true,
  //         sorter: (a, b) => {
  //           if (a[aColKey] > b[aColKey]) {
  //               return -1;
  //           }
  //           if (b[aColKey] > a[aColKey]) {
  //               return 1;
  //           }
  //           return 0;
  //           // return a[aColKey] > b[aColKey]
  //         },
  //         filterIcon: (<EditOutlined />),
  //         filterDropdown: (props) => {
  //           const editVariant = (value) => {
  //             props.confirm();
  //             setProductVariants({...productVariants, [aColKey]: value});
  //           }
  //           const removeVariant = () => {
  //             props.confirm();
  //             handleRemoveColumn(aColKey)
  //           }
  //           return (
  //             <div style={{padding: '10px', display: 'flex'}}>
  //               {
  //                 props.visible ? 
  //                 <React.Fragment>
  //                   <Search
  //                     enterButton={(<CheckOutlined />)}
  //                     defaultValue={productVariants[aColKey]}
  //                     onSearch={value => editVariant(value)}
  //                     //size="small"
  //                   />
  //                   <Popconfirm title="Sure to delete?" onConfirm={removeVariant}>
  //                     <Button type="danger" icon={<DeleteOutlined/>} style={{marginLeft: '5px'}} />
  //                   </Popconfirm>
  //                 </React.Fragment>
  //                 : null
  //               }
  //             </div>
  //           )
  //         }, 
  //         onFilter: () => {
  //           console.log("on filter ok")
  //         }
  //       }
  //     )
  //   })
  // }
  
  result.push(...fixedVariantColumns);

  return result;
}

const formFieldName = 'inventory';

let allColumns = getAllColumns(fixedVariantColumns);

const FormCell = (props) => {
  let cellStyle = {}
  if (props.width) {
    cellStyle = {
      width: props.width,
      //border: '1px solid blue'
    }
  }
  if (props.style) {
    cellStyle = {...cellStyle, ...props.style}
  }
  return (
    <div style={cellStyle}>
      {props.children}
    </div>
  )
}

const FormRow = (props) => {
  const { data: rowData, index: rowIndex, field: fieldSetting, form } = props;

  let result = allColumns.map((aColumnObj, columnIndex)=>{
    let columnData = rowData ? rowData[aColumnObj.dataIndex] : null;
    let cellResult = columnData;
    if (aColumnObj.render) {
      let fieldName = [fieldSetting.name, aColumnObj.dataIndex];
      let fieldKey = [fieldSetting.fieldKey, aColumnObj.dataIndex];
      cellResult = aColumnObj.render(columnData, rowData, rowIndex, columnIndex, {name: fieldName, key: fieldKey, removeRow: props.removeRow});
    }
    return (<FormCell key={columnIndex} width={aColumnObj.width} style={aColumnObj.style}>{cellResult}</FormCell>)
  })
  return (
    <div>
      <Space>
        {result}
      </Space>
    </div>
  )
  // return (
  //   <List.Item>
  //     <Space>
  //       {result}
  //     </Space>
  //   </List.Item>
  // )
}

const InventoryFormTable2 = (props) => {
  const { productId, inventoryData: xxxx, setInventoryData, productVariants, setProductVariants } = props;

  const configCache = useConfigCache();
  const [ form ] = Form.useForm();

  const { data: inventoryData, loading: loadingInventory, error } = useInventoryQuery({
    filter: {
      filter: {
        productId: productId
      },
      sorter: {
        createdAt: -1
      }
    },
    configId: configCache.configId
  });

  useEffect(()=>{
    if (inventoryData && inventoryData.inventory) {
      setFormValues({[formFieldName]:inventoryData.inventory})
    }
  },[inventoryData])

  const getFormValues = (name = null) => {
    if (name != null) {
      return form.getFieldValue(name);
    }
    return form.getFieldsValue();
  }

  const setFormValues = (values) => {
    let newValues = {...getFormValues(), ...values}
    form.setFieldsValue(newValues);
  }

  const onFormFinished = (values) => {
    console.log('onFormFinished', values)
  }

  return (
    <Form form={form} onFinish={onFormFinished}>
      <Form.List name={formFieldName}>
      {
        (fields, { add, remove, move }) => {
          let formValues = getFormValues(formFieldName);

          const addRow = (value) => {
            add()
          }
          const removeRow = (value) => {
            remove(value)
          }
          return (
            <div className="formList-wrapper">
              <List>
                <List.Item key={'header'}>
                  <Space direction="vertical">
                    <Button onClick={()=>{addRow()}}>New</Button>
                    <Space>
                    {
                      allColumns.map((aColumn, index)=>{
                        return <FormCell key={index} width={aColumn.width} style={aColumn.style}>{aColumn.title}</FormCell>
                      })
                    }
                    </Space>
                  </Space>
                </List.Item>

                
                {
                  fields.map((field,index)=>{
                    let fieldData = formValues[index];
                    return (
                      <List.Item key={index}>
                        <FormRow 
                          key={index}
                          index={index}
                          data={fieldData}
                          field={field}
                          removeRow={removeRow}
                        />
                      </List.Item>
                    )
                  })
                }
              </List>
            </div>
          )
        }
      }
      </Form.List>
      <Button onClick={()=>{form.submit()}}>Submit</Button>
    </Form>
  )
}

export default InventoryFormTable2