'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppstoreOutlined,
  CheckSquareOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  DollarOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  RocketOutlined,
  ShoppingOutlined,
  SunOutlined,
  TeamOutlined,
  UserOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { Avatar, Button, ConfigProvider, Dropdown, Layout, Menu, Space, Tag, Tooltip, theme } from 'antd';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';

const { Header, Sider, Content } = Layout;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();

  const isDark = mode === 'dark';

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Главный Dashboard',
    },
    {
      key: '/subscriptions',
      icon: <RocketOutlined />,
      label: 'Абонплата & Подписки',
    },
    {
      key: '/clients',
      icon: <UsergroupAddOutlined />,
      label: 'Клиенты',
    },
    {
      key: '/leads',
      icon: <TeamOutlined />,
      label: 'Воронка Лидов',
    },
    {
      key: '/products',
      icon: <AppstoreOutlined />,
      label: 'Товары & Услуги',
    },
    {
      key: '/sales',
      icon: <DollarOutlined />,
      label: 'Продажи',
    },
    {
      key: '/orders',
      icon: <ShoppingOutlined />,
      label: 'Заказы',
    },
    {
      key: '/payments',
      icon: <CreditCardOutlined />,
      label: 'Оплаты',
    },
    {
      key: '/tasks',
      icon: <CheckSquareOutlined />,
      label: 'Задачи',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Сотрудники',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <div>
          <div style={{ fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{user?.email}</div>
        </div>
      ),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти из аккаунта',
      danger: true,
      onClick: logout,
    },
  ];

  // For login or register page, render content with theme provider and header toggle button
  if (pathname === '/login' || pathname === '/register') {
    return (
      <ConfigProvider
        theme={{
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 8,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
        }}
      >
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
          <Tooltip title={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}>
            <Button
              shape="circle"
              size="large"
              icon={isDark ? <SunOutlined style={{ color: '#faad14' }} /> : <MoonOutlined style={{ color: '#722ed1' }} />}
              onClick={toggleTheme}
            />
          </Tooltip>
        </div>
        {children}
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={240}
          style={{
            background: isDark ? '#141414' : '#001529',
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              paddingLeft: collapsed ? 0 : 20,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, whiteSpace: 'nowrap' }}>
              ⚡ CRM SaaS {collapsed ? '' : <Tag color="blue" style={{ marginLeft: 8 }}>PRO</Tag>}
            </div>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
            style={{ marginTop: 8, background: isDark ? '#141414' : '#001529' }}
          />
        </Sider>

        <Layout>
          <Header
            style={{
              padding: '0 24px',
              background: isDark ? '#1f1f1f' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,21,41,0.08)',
              zIndex: 1,
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 40, height: 40 }}
            />

            <Space size="middle">
              {/* Theme Toggle Button */}
              <Tooltip title={isDark ? 'Включить Светлую тему' : 'Включить Тёмную тему'}>
                <Button
                  type="default"
                  shape="round"
                  icon={isDark ? <SunOutlined style={{ color: '#faad14' }} /> : <MoonOutlined style={{ color: '#722ed1' }} />}
                  onClick={toggleTheme}
                  style={{ fontWeight: 500 }}
                >
                  {isDark ? 'Светлая' : 'Тёмная'}
                </Button>
              </Tooltip>

              {user?.tenantName && (
                <Tag color="cyan" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 6 }}>
                  🏢 {user.tenantName}
                </Tag>
              )}
              {user?.role && (
                <Tag color="gold" style={{ fontSize: 12, borderRadius: 6 }}>
                  👑 {user.role}
                </Tag>
              )}
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />}>
                    {user?.name?.charAt(0)}
                  </Avatar>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{user?.name || 'Пользователь'}</span>
                </Space>
              </Dropdown>
            </Space>
          </Header>

          <Content
            style={{
              margin: '24px 16px',
              padding: 24,
              background: isDark ? '#141414' : '#f5f7fa',
              minHeight: 280,
              borderRadius: 8,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
