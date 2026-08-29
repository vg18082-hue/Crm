'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  SendOutlined,
  SettingOutlined,
  ShoppingOutlined,
  SunOutlined,
  SyncOutlined,
  TeamOutlined,
  UserOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Button,
  ConfigProvider,
  Divider,
  Dropdown,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  Space,
  Switch,
  Tag,
  Tooltip,
  message,
  theme,
} from 'antd';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { apiClient } from '@/lib/api-client';

const { Header, Sider, Content } = Layout;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isTgModalOpen, setIsTgModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [tgForm] = Form.useForm();

  const isDark = mode === 'dark';

  // Fetch Telegram Config
  const { data: tgConfig } = useQuery({
    queryKey: ['telegram-config'],
    queryFn: async () => {
      if (!user) return null;
      const res = await apiClient.get('/notifications/telegram-config');
      return res.data;
    },
    enabled: !!user,
  });

  // Save Telegram Config
  const saveTgMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiClient.patch('/notifications/telegram-config', values);
    },
    onSuccess: () => {
      message.success('Настройки Telegram успешно сохранены');
      queryClient.invalidateQueries({ queryKey: ['telegram-config'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка сохранения настроек');
    },
  });

  // Test Telegram Message
  const testTgMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/notifications/telegram-test');
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        message.success(data.message);
      } else {
        message.error(data.message);
      }
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка отправки тестового сообщения');
    },
  });

  // Trigger Cron & Bull Jobs manually
  const triggerCronMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/jobs/trigger-cron-now');
      return res.data;
    },
    onSuccess: (data) => {
      message.success(data.message || 'Очереди Bull успешно запущены!');
      queryClient.invalidateQueries();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка запуска фоновых задач');
    },
  });

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
      key: 'telegram-settings',
      icon: <SendOutlined style={{ color: '#1677ff' }} />,
      label: 'Telegram & Очереди Bull',
      onClick: () => {
        if (tgConfig) {
          tgForm.setFieldsValue(tgConfig);
        }
        setIsTgModalOpen(true);
      },
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

  // For login or register page
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
              {/* Telegram & Bot Quick Setup Button */}
              <Tooltip title="Настройки Telegram уведомлений и Cron">
                <Button
                  type="primary"
                  ghost
                  shape="round"
                  icon={<SendOutlined style={{ color: '#1677ff' }} />}
                  onClick={() => {
                    if (tgConfig) {
                      tgForm.setFieldsValue(tgConfig);
                    }
                    setIsTgModalOpen(true);
                  }}
                  style={{ fontWeight: 500 }}
                >
                  Telegram Бот
                </Button>
              </Tooltip>

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

      {/* Telegram & Automation Settings Modal */}
      <Modal
        title="🤖 Настройки Telegram-бота и Очередей Bull"
        open={isTgModalOpen}
        onCancel={() => setIsTgModalOpen(false)}
        footer={null}
        width={560}
      >
        <Alert
          message="Автоматические уведомления и Cron"
          description="Бот автоматически присылает уведомления о новых лидах, заказах, дедлайнах задач, скорой оплате и просрочке подписок (за 7 дней, за 3 дня и в день платежа)."
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />

        <Form
          layout="vertical"
          form={tgForm}
          initialValues={tgConfig}
          onFinish={(values) => saveTgMutation.mutate(values)}
        >
          <Form.Item label="Включить Telegram-уведомления" name="isEnabled" valuePropName="checked">
            <Switch checkedChildren="Включено" unCheckedChildren="Выключено" />
          </Form.Item>

          <Form.Item label="Telegram Bot Token" name="botToken" tooltip="Получите у @BotFather в Telegram">
            <Input placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ" size="large" />
          </Form.Item>

          <Form.Item
            label="Chat ID / Group ID"
            name="chatId"
            tooltip="ID личного чата или рабочей группы (например: -1001234567890 или ваш user ID)"
          >
            <Input placeholder="-1001234567890" size="large" />
          </Form.Item>

          <Divider orientation="left" style={{ fontSize: 13 }}>
            Типы событий для отправки:
          </Divider>

          <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
            <Form.Item label="Новые лиды" name="notifyLeads" valuePropName="checked">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item label="Новые заказы" name="notifyOrders" valuePropName="checked">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item label="Оплаты и чеки" name="notifyPayments" valuePropName="checked">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item label="Абонплата и подписки" name="notifySubscriptions" valuePropName="checked">
              <Switch defaultChecked />
            </Form.Item>
          </Space>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <Space>
              <Button
                icon={<SendOutlined />}
                onClick={() => testTgMutation.mutate()}
                loading={testTgMutation.isPending}
              >
                Тест в Telegram
              </Button>
              <Button
                icon={<SyncOutlined />}
                onClick={() => triggerCronMutation.mutate()}
                loading={triggerCronMutation.isPending}
              >
                Запустить Cron сейчас
              </Button>
            </Space>

            <Button type="primary" htmlType="submit" loading={saveTgMutation.isPending}>
              Сохранить
            </Button>
          </div>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
