import React, { useState, useEffect } from 'react';
import { Select, Statistic, Form, Divider } from 'antd';
import { format, getYear, getWeek, isAfter, isBefore, isDate } from 'date-fns';
import { Line } from '@ant-design/charts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import Page_01 from './component/Page_01';
import { useConfigCache, useOrdersQuery } from '../../utils/customHook';

const DashBoard = (props) => {
  const configCache = useConfigCache();
  const [ orderFilter, setOrderFilter ] = useState({
    type: "all",
    startDate: null,
    endDate: new Date()
  });
  const [ orders, setOrders ] = useState([]);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(new Date());


  const { data, loading: loadingOrders, error, refetch: refetchOrders } = useOrdersQuery({
    filter: {
      //filter: orderFilter,
      // filter: {
      //   paid: true
      // },
      sorter: {
        createdAt: -1
      }
    },
    configId: configCache.configId
  });

  useEffect(() => {
    if (data && data.orders) {
      setOrders(data.orders)
    }
  }, [data])

  if (loadingOrders) {

  }

  if (error) {

  }

  // console.log('orders',orders)
  let chartSetting = {
    data: {
      type: '0'

    },
    show: 'by days/weeks/year',
    labelProperty: 'createdAt',
    valueProperty: 'total'
  }


  const getOrdersForChart = (orders = []) => {
    let result = [];
    orders.map((anOrder)=>{
      let dateValue = new Date(anOrder[chartSetting.labelProperty]);
      let label = getWeek(dateValue);
      let foundDataIndex = result.map((aData)=>aData.label).indexOf(label);
      if (foundDataIndex >= 0) {
        result[foundDataIndex][chartSetting.valueProperty] = result[foundDataIndex][chartSetting.valueProperty] + anOrder[chartSetting.valueProperty];
      }
      else {
        result.push({
          label: getWeek(dateValue),
          [chartSetting.valueProperty]: anOrder[chartSetting.valueProperty]
        })
      }
    });
    return result;
  }

  const data222 = [
    { year: '1991', value: 3 },
    { year: '1993', value: 3.5 },
    { year: '1992', value: 4 },
    { year: '1993', value: 5 },
    { year: '1995', value: 4.9 },
    { year: '1996', value: 6 },
    { year: '1997', value: 7 },
    { year: '1998', value: 9 },
    { year: '1999', value: 13 },
  ];
  const config = {
    data: getOrdersForChart(orders),
    title: {
      visible: true,
      text: '带数据点的折线图',
    },
    xField: 'label',
    yField: 'total',
    yAxis: { formatter: (v) => `RMB ${v.toFixed(2)}` },
    //animation: { appear: { animation: 'clipingWithData' } },
    point: {
      visible: true,
      size: 5,
      shape: 'diamond',
      style: {
        fill: 'white',
        stroke: '#2593fc',
        lineWidth: 2,
      },
    },
    interactions: [
      {
        type: 'slider',
        cfg: {
          start: 0,
          end: 999,
        },
      },
    ],
    // guideLine: [
    //   {
    //     start: ['2010-01-01', 100] || ['0%', '50%'],
    //     end: ['2010-01-10', 50] || ['100%', '80%'],
    //     lineStyle: {},
    //     text: {},
    //   },
    // ],
  };




  const getOrdersWithinRange = (orders, orderFilter) => {
    let result = [];
    let validStartDate = isDate(orderFilter.startDate);
    let validEndDate = isDate(orderFilter.endDate);

    orders.forEach((anOrder)=>{
      let isAfterStart = validStartDate ? isAfter(new Date(anOrder.createdAt), orderFilter.startDate) : true;
      let isBeforeEnd = validEndDate ? isBefore(new Date(anOrder.createdAt), orderFilter.endDate) : true;

      let passedDate = isAfterStart && isBeforeEnd;
      let passedType = false;
      let passedPaid = anOrder.paid;

      // type
      if (orderFilter.type == '1' && orderFilter.type == anOrder.type) {
        passedType = true;
      }
      else if (orderFilter.type == '0' && !anOrder.type) {
        passedType = true;
      }
      else if (orderFilter.type == 'all') {
        passedType = true;
      }

      // final
      if (passedDate && passedType && passedPaid) {
        result.push(anOrder);
      }
    });

    return result;
  }

  const getTotalFromOrders = (orders, property) => {

    let total = 0;
    let dutyTaxInsurance = 0;
    let deliveryFee = 0;
    let distinctCategory = [];
    let subTotal = 0;

    orders.forEach((anOrder)=>{
      total += anOrder.total;
      deliveryFee += anOrder.deliveryFee;
      if (anOrder.charges && anOrder.charges.length > 0) {
        anOrder.charges.forEach((aCharge)=>{
          if (aCharge.code == "dutyTaxInsurance") {
            dutyTaxInsurance += aCharge.value;
          }
        })
      }


      anOrder.items.forEach((anItem)=>{
        let foundCategoryIndex = distinctCategory.map((aCategory)=>aCategory.name).indexOf(anItem.product.category)
        if (foundCategoryIndex >= 0) {
          distinctCategory[foundCategoryIndex] = {
            ...distinctCategory[foundCategoryIndex],
            total: distinctCategory[foundCategoryIndex].total + (parseFloat(anItem.price)*parseInt(anItem.qty)),
            qty: distinctCategory[foundCategoryIndex].qty + parseInt(anItem.qty)
          }
        }
        else {
          distinctCategory.push({
            name: anItem.product.category,
            total: (parseFloat(anItem.price)*parseInt(anItem.qty)),
            qty: parseInt(anItem.qty)
          })
        }
        subTotal += parseFloat(anItem.price)*parseInt(anItem.qty);
      })
    });

    let grandTotal = dutyTaxInsurance + deliveryFee + subTotal;

    return {
      total,
      dutyTaxInsurance,
      deliveryFee,
      distinctCategory,
      subTotal,
      grandTotal
    };
  }

  let totalResult = getTotalFromOrders(getOrdersWithinRange(orders, orderFilter));

  if (configCache.configId != 'mananml') {
    return null
  }
  return (
    <Page_01
      title={"Dashboard"}
    >
    <Form.Item label={"Type"} >
      <Select options={[
          {
            label: "全部",
            value: 'all'
          },
          {
            label: "国内",
            value: '0'
          },
          {
            label: "国外",
            value: '1'
          }
        ]}
        defaultValue={"all"}
        onChange={(values)=>{
          setOrderFilter({
            ...orderFilter,
            type: values
          })
          {/* if (values == '0') {
            setOrderFilter({
              ...orderFilter,
              type: undefined
            })
          }
          else {
            setOrderFilter({
              ...orderFilter,
              type: values
            })
          } */}
        }} 
      />
    </Form.Item>
    <Form.Item label={"Date (From)"}>
      <DatePicker
        selected={orderFilter.startDate}
        onChange={date => setOrderFilter({...orderFilter, startDate: date})}
        selectsStart
        isClearable
        startDate={orderFilter.startDate}
        endDate={orderFilter.endDate}
      />
    </Form.Item>
    <Form.Item label={"Date (To)"}>
      <DatePicker
        selected={orderFilter.endDate}
        onChange={date => setOrderFilter({...orderFilter, endDate: date})}
        selectsEnd
        startDate={orderFilter.startDate}
        endDate={orderFilter.endDate}
        minDate={orderFilter.startDate}
      />
    </Form.Item>
      {/* <div>
        visitor count
        sales (by date/day/week/month/year, filterable by type/category)
        include/exclude delivery/dutyTaxInsurance
      </div> */}
      {/* <Line {...config} /> */}

      <Statistic title="Sub Total" value={totalResult.subTotal} />
      <Statistic title="总税险包 (RMB)" value={totalResult.dutyTaxInsurance} />
      <Statistic title="总邮费 (RMB)" value={totalResult.deliveryFee} />
      <Statistic title="总销售额 (RMB)" value={totalResult.total} />

      <Divider/>
      <div style={{display: 'flex', flexWrap: 'wrap'}}>
      {
        totalResult.distinctCategory.map((anItem, index)=>{
          let label = anItem.name;
          if (!label) {
            label = "Others"
          }
          label = label + " (RMB)"
          return (
            <Statistic style={{flex:'1 1 50%', marginBottom: '10px'}} key={index} title={label} value={anItem.total} 
              //prefix={"RMB "} 
              suffix={` / ${anItem.qty}个`} 
            />
          )
        })
      }
      </div>

    </Page_01>
  )
}

export default DashBoard;