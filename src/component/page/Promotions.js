import React, {useState} from 'react';
import Page_01 from './component/Page_01';

const Promotions = (props) => {
  return (
    <Page_01
      title={"Promotions"}
      extra={[
        //<Button key="refresh" type="primary" icon={<RedoOutlined />} onClick={()=>{refetchData()}}/>,
        //<Button key="create" type="primary" icon={<PlusOutlined />} onClick={()=>{handleOnClickProduct(null)}} />
      ]}
    >
    PS: one order can only apply not more than 1 code
    promotion (add promotion code)
    code: XYZ
    qty: 10/unlimited
    expireAt: Date
    items: [product type == '1']
    conditions : formula
    </Page_01>
  )
}

export default Promotions;