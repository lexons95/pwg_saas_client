import React, {useState} from 'react';
import { Tabs, Table, Button, Input, Popconfirm } from 'antd';
import { format } from 'date-fns';
import gql from "graphql-tag";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { CheckOutlined, RedoOutlined } from '@ant-design/icons';

import Page_01 from './component/Page_01';
import OrderInfo from './component/OrderInfo';
import { useConfigCache } from '../../utils/Constants';
import Loading from '../../utils/component/Loading';

const { TabPane } = Tabs;
const { Search } = Input;

const GET_ORDERS_QUERY = gql`
  query orders($filter: JSONObject, $configId: String) {
    orders(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      items
      total
      customer
      paid
      sentOut
      trackingNum
      deliveryFee
      status
    }
  }
`;

const UPDATE_ORDER_PAYMENT_QUERY = gql`
  mutation updateOrderPayment($_id: String!, $paid: Boolean!) {
    updateOrderPayment(_id: $_id, paid: $paid) {
      success
      message
      data
    }
  }
`;

const UPDATE_ORDER_DELIVERY_QUERY = gql`
  mutation updateOrderDelivery($_id: String!, $trackingNum: String) {
    updateOrderDelivery(_id: $_id, trackingNum: $trackingNum) {
      success
      message
      data
    }
  }
`;

const UPDATE_ORDER_STATUS_QUERY = gql`
  mutation updateOrderStatus($_id: String!, $status: String!) {
    updateOrderStatus(_id: $_id, status: $status) {
      success
      message
      data
    }
  }
`;

const CANCEL_ORDER_QUERY = gql`
  mutation cancelOrder($_id: String!) {
    cancelOrder(_id: $_id) {
      success
      message
      data
    }
  }
`;
const Orders = (props) => {
  const configCache = useConfigCache();
  const [ orderModalDisplay, setOrderModalDisplay ] = useState(false);
  const [ selectedOrder, setSelectedOrder ] = useState(null);

  const { data, loading: loadingOrders, error, refetch: refetchOrders } = useQuery(GET_ORDERS_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: {
      filter: {
        sorter: {
          createdAt: -1
        },
      },
      configId: configCache.configId
    },
    onError: (error) => {
      console.log("products error", error)

    },
    onCompleted: (result) => {
      // console.log('Orders', result.orders)
    }
  });

  const [ updateOrderPayment , updateOrderPaymentResult ] = useMutation(UPDATE_ORDER_PAYMENT_QUERY,{
    onCompleted: (result) => {
      refetchOrders()
    }
  })

  const [ updateOrderDelivery , updateOrderDeliveryResult ] = useMutation(UPDATE_ORDER_DELIVERY_QUERY,{
    onCompleted: (result) => {
      refetchOrders()
    }
  })

  const [ updateOrderStatus , updateOrderStatusResult ] = useMutation(UPDATE_ORDER_STATUS_QUERY,{
    onCompleted: (result) => {
      refetchOrders()
    }
  })

  const [ cancelOrder , cancelOrderResult ] = useMutation(CANCEL_ORDER_QUERY,{
    onCompleted: (result) => {
      refetchOrders()
    }
  })

  let isLoading = updateOrderStatusResult.loading || 
                  updateOrderPaymentResult.loading ||
                  updateOrderDeliveryResult.loading ||
                  cancelOrderResult.loading ||
                  loadingOrders;

  const handleOrderModalDisplayOpen = (selectedOrder) => {
    setOrderModalDisplay(true);
    setSelectedOrder(selectedOrder)
  }
  const handleOrderModalDisplayClose = () => {
    setOrderModalDisplay(false);
  }

  const defaultColumns = [
    {
      title: "No.",
      dataIndex: 'index',
      key: 'index',
      width: 75,
      render: (text, record, index) => {
        return `${index + 1}.`;
      }
    },
    {
      title: "Order Date",
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (text, record) => {
        let dateTime = format(new Date(text), "MM/dd/yyyy hh:mm:ss aa")
        return dateTime;
      }
    },
    {
      title: "Order No.",
      dataIndex: '_id',
      key: '_id',
      render: (text, record) => {
        return (
          <a style={{whiteSpace:"pre-wrap", textDecoration:"underline"}} onClick={()=>{handleOrderModalDisplayOpen(record)}}>{record._id.toUpperCase()}</a>
        )
      }
    },
    {
      title: "Customer",
      dataIndex: 'customer',
      key: 'customer',
      sorter: (a, b) => a.name - b.name,
      render: (text, record) => {
        return text.name;
      }
    },
    {
      title: "Total",
      dataIndex: 'total',
      key: 'total',
      sorter: (a, b) => a.total - b.total
    }
  ]

  // {
  //   title: "货物状态",
  //   dataIndex: 'sentOut',
  //   key: 'sentOut',
  //   //width: 200,
  //   render: (text, record) => {
  //     return 'haha'
  //   }
  // },

  let emptyTablePlaceholder = (
      <div>空空如也</div>
  )

  const getColumnsByTable = () => {
    
    let tableCol1 = [...defaultColumns, ...[
      {
        title: "付款状态",
        dataIndex: 'paid',
        key: 'paid',
        render: (text, record) => {
          const handleUpdatePayment = () => {
            updateOrderPayment({
              variables: {
                _id: record._id,
                paid: !record.paid
              }
            })
          }
          return (<Button size="small" type={`${text ? "primary" : "danger"}`} onClick={handleUpdatePayment}>{text ? "已付款" : "未付款"}</Button>)
        }
      },
      {
        title: "",
        dataIndex: 'action',
        key: 'action',
        render: (text, record) => {
          const handleCancelOrder = () => {
            cancelOrder({
              variables: {
                _id: record._id
              }
            })
          }
          return (
            <Popconfirm title="Sure to delete?" onConfirm={handleCancelOrder}>
              {/* <div style={{width: '100%', textAlign: 'center', cursor: 'pointer'}}>取消</div> */}
          <Button type="danger" size="small">取消</Button>

          {/* <Button type="danger" size="small" onClick={handleCancelOrder}>取消</Button> */}
            </Popconfirm>
          )
        } 
      }
    ]];
    
    let tableCol2 = [...defaultColumns, ...[
      {
        title: "付款状态",
        dataIndex: 'paid',
        key: 'paid',
        render: (text, record) => {
          const handleUpdatePayment = () => {
            updateOrderPayment({
              variables: {
                _id: record._id,
                paid: !record.paid
              }
            })
          }
          return (<Button type={`${text ? "primary" : "danger"}`} size="small" onClick={handleUpdatePayment}>{text ? "已付款" : "未付款"}</Button>)
        }
      },
      {
        title: "Tracking No.",
        dataIndex: 'trackingNum',
        key: 'trackingNum',
        width: 200,
        render: (text, record) => {
          let result = null;
          const handleUpdateDelivery = (value) => {
            updateOrderDelivery({
              variables: {
                _id: record._id,
                trackingNum: value
              }
            })
          }
          result = (
            <Search
              placeholder="Enter tracking no."
              enterButton={(<CheckOutlined />)}
              defaultValue={text}
              size="small"
              onSearch={handleUpdateDelivery}
            />
          )
          return result;
        } 
      }
    ]]

    let tableCol3 = [...defaultColumns, ...[
      {
        title: "Last Updated",
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
        render: (text, record) => {
          let dateTime = format(new Date(text), "MM/dd/yyyy hh:mm:ss aa")
          return dateTime;
        }
      },
      {
        title: "Last Updated",
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
        render: (text, record) => {
          let dateTime = format(new Date(text), "MM/dd/yyyy hh:mm:ss aa")
          return dateTime;
        }
      },
      {
        title: "Tracking No.",
        dataIndex: 'trackingNum',
        key: 'trackingNum',
        width: 200,
        render: (text, record) => {
          let result = null;
          const handleUpdateDelivery = (value) => {
            updateOrderDelivery({
              variables: {
                _id: record._id,
                trackingNum: value
              }
            })
          }
          result = (
            <Search
              placeholder="Enter tracking no."
              enterButton={(<CheckOutlined />)}
              defaultValue={text}
              size="small"
              onSearch={handleUpdateDelivery}
            />
          )
          return result;
        } 
      },
      {
        title: "Action",
        dataIndex: 'status',
        key: 'status',
        render: (text, record) => {
          const handleUpdateStatus = () => {
            updateOrderStatus({
              variables: {
                _id: record._id,
                status: "3"
              }
            })
          }
          return (<Button type="primary" size="small" onClick={handleUpdateStatus} disabled={isLoading}>Completed</Button>)
        }
      },
    ]];

    let tableCol4 = [...defaultColumns, ...[
      {
        title: "Last Updated",
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
        render: (text, record) => {
          let dateTime = format(new Date(text), "MM/dd/yyyy hh:mm:ss aa")
          return dateTime;
        }
      },
      {
        title: "Tracking No.",
        dataIndex: 'trackingNum',
        key: 'trackingNum',
        render: (text, record) => {
          return text
        } 
      }
    ]]

    return {
      newOrders: tableCol1,
      paidOrders: tableCol2,
      pendingOrders: tableCol3,
      completedOrders: tableCol4
    }
  }

  const getFilteredOrders = () => {
    let allOrders = data ? data.orders : [];
    let orderList1 = [];
    let orderList2 = [];
    let orderList3 = [];
    let orderList4 = [];

    /*
    status
    0 new
    1 paid
    2 sent out
    3 completed
    4
    */
    allOrders.map((anOrder)=>{
      if (anOrder.status == null || anOrder.status == undefined) {
        if (!anOrder.paid && !anOrder.sentOut) {
          orderList1.push(anOrder);
        }
        else if (anOrder.paid && !anOrder.sentOut) {
          orderList2.push(anOrder);
        }
        else if (anOrder.paid && anOrder.sentOut) {
          orderList3.push(anOrder);
        }
      }
      else {
        switch(anOrder.status) {
          case "0": 
            orderList1.push(anOrder);
            break;
          case "1": 
            orderList2.push(anOrder);
            break;
          case "2": 
            orderList3.push(anOrder);
            break;
          case "3": 
            orderList4.push(anOrder);
            break;          
          default: break;
        }
      }
    });
    return {
      newOrders: orderList1,
      paidOrders: orderList2,
      pendingOrders: orderList3,
      completedOrders: orderList4
    }
  }

  let filteredColumns = getColumnsByTable();
  let filteredOrders = getFilteredOrders();

  const colWidth = 150;

  let pagination = {
    showSizeChanger: true,
    position: ['topRight'],
    showTotal: (total, range)=>{
      return `Showing ${range[0]}-${range[1]}/${total}`
    }
  }
  return (
    <Page_01
      title={"Orders"}
      extra={[
        <Button key="refresh" type="primary" icon={<RedoOutlined />} onClick={()=>{refetchOrders()}}/>
      ]}
    >
      <Tabs defaultActiveKey="1">
        <TabPane tab="New Orders" key="1">
          <Table
            rowKey={'_id'}
            columns={filteredColumns.newOrders} 
            dataSource={filteredOrders.newOrders} 
            pagination={pagination}
            size="small"
            scroll={{x: filteredColumns.newOrders.length * colWidth}}
            footer={null}
            //locale={{emptyText:emptyTablePlaceholder}}
          />
        </TabPane>
        <TabPane tab="Paid Orders" key="2">
          <Table
            rowKey={'_id'}
            columns={filteredColumns.paidOrders} 
            dataSource={filteredOrders.paidOrders} 
            pagination={pagination}
            size="small"
            scroll={{x: filteredColumns.paidOrders.length * colWidth}}
            footer={null}
            //locale={{emptyText:emptyTablePlaceholder}}
          />
        </TabPane>
        <TabPane tab="Pending Orders" key="3">
          <Table
            rowKey={'_id'}
            columns={filteredColumns.pendingOrders} 
            dataSource={filteredOrders.pendingOrders} 
            pagination={pagination}
            size="small"
            scroll={{x: filteredColumns.pendingOrders.length * colWidth}}
            footer={null}
            //locale={{emptyText:emptyTablePlaceholder}}
          />
        </TabPane>
        <TabPane tab="Completed Orders" key="4">
          <Table
            rowKey={'_id'}
            columns={filteredColumns.completedOrders} 
            dataSource={filteredOrders.completedOrders} 
            pagination={pagination}
            size="small"
            scroll={{x: filteredColumns.completedOrders.length * colWidth}}
            footer={null}
            //locale={{emptyText:emptyTablePlaceholder}}
          />
        </TabPane>
      </Tabs>
      <OrderInfo
        order={selectedOrder}
        visible={orderModalDisplay}
        closeModal={handleOrderModalDisplayClose}
      />

      {
        isLoading ? <Loading/> : null
      }
    </Page_01>
  )
}

export default Orders;