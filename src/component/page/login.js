import React, { useEffect } from 'react';
import { useLazyQuery, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { Form, Input, Button, Checkbox } from 'antd';
import { useHistory } from "react-router-dom";

import Loading from '../../utils/component/Loading';
import { setUserCache, setConfigCache } from '../../utils/customHook';
import * as notification from '../../utils/component/notification';

const LOGIN_MUTATION = gql`
    mutation login($user: JSONObject) {
      login(user: $user) {
        success
        message
        data
      }
    }
`;

const GET_USER_CONFIG_QUERY = gql`
  query userConfig($configId: String!) {
    userConfig(configId: $configId) {
        success
        message
        data
    }
  }
`

const layout = {
  labelCol: {
    span: 8,
  },
  wrapperCol: {
    span: 16,
  },
};
const tailLayout = {
  wrapperCol: {
    offset: 8,
    span: 16,
  },
};

const Login = (props) => {
  let routeHistory = useHistory();
  const [login, { data, loading }] = useMutation(LOGIN_MUTATION,{
    onCompleted: (result)=>{
      if (result && result.login && result.login.success) {
        let redirectPath = '/';
        // if (routeHistory.location.state && routeHistory.location.state.from) {
        //   redirectPath = routeHistory.location.state.from.pathname
        // }
        fetchConfig({
          variables: {
            configId: result.login.data.configId
          }
        })
        // routeHistory.push(redirectPath)
      }
      else {
        notification.showMessage({type: 'error',message: "Failed to login"})
      }
    } 
  });

  const [ fetchConfig ] = useLazyQuery(GET_USER_CONFIG_QUERY,{
    fetchPolicy: 'cache-and-network',
    onCompleted: (result2) => {
      if (result2 && result2.userConfig && result2.userConfig.success) {
        setConfigCache(result2.userConfig.data)
        setUserCache(data.login)
      }
    }
  });

  // useEffect(()=>{

  // },[]);

  const onFinish = values => {
    login({
      variables: { user: values }
    });
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };



  return (
    <div id="page_login">
      <Form
        {...layout}
        name="basic"
        initialValues={{
          remember: true,
        }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item
          label="账号"
          name="username"
          rules={[
            {
              required: true,
              message: 'Please input your username!',
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[
            {
              required: true,
              message: 'Please input your password!',
            },
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item {...tailLayout} name="remember" valuePropName="checked">
          <Checkbox>Remember me</Checkbox>
        </Form.Item>

        <Form.Item {...tailLayout}>
          <Button type="primary" htmlType="submit">
            登入
          </Button>
        </Form.Item>
      </Form>
      {
        loading ? <Loading/> : null
      }
    </div>
  );
}

export default Login;