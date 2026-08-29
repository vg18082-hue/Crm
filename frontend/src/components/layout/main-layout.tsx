'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  DollarOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  QrcodeOutlined,
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
  Badge,
  Button,
  Card,
  ConfigProvider,
  Divider,
  Dropdown,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  Space,
  Spin,
  Switch,
  Tag,
  Tooltip,
  Typography,
  message,
  theme,
} from 'antd';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { apiClient } from '@/lib/api-client';

const { Header, Sider, Content } = Layout;
const { Text, Title, Paragraph } = Typography;

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

  // Fetch Telegram Config with automatic polling when modal is open
  const { data: tgConfig, isLoading: isTgLoading, refetch: refetchTg } = useQuery({
    queryKey: ['telegram-config'],
    queryFn: async () => {
      if (!user) return null;
      const res = await apiClient.get('/notifications/telegram-config');
      return res.data;
    },
    enabled: !!user,
    refetchInterval: isTgModalOpen ? 3000 : false,
  });

  React.useEffect(() => {
    if (tgConfig) {
      tgForm.setFieldsValue(tgConfig);
    }
  }, [tgConfig, tgForm]);

  // Save Telegram Toggles
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

  // Disconnect Telegram
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/notifications/telegram-disconnect');
    },
    onSuccess: () => {
      message.warning('Telegram-бот успешно отключен');
      queryClient.invalidateQueries({ queryKey: ['telegram-config'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка отключения');
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
              {/* Telegram Connect Button with status badge */}
              <Tooltip title="Настройки мгновенных Telegram-уведомлений">
                <Button
                  type={tgConfig?.isConnected ? 'default' : 'primary'}
                  ghost={!tgConfig?.isConnected}
                  shape="round"
                  icon={<SendOutlined style={{ color: tgConfig?.isConnected ? '#52c41a' : '#1677ff' }} />}
                  onClick={() => {
                    if (tgConfig) {
                      tgForm.setFieldsValue(tgConfig);
                    }
                    setIsTgModalOpen(true);
                  }}
                  style={{ fontWeight: 500 }}
                >
                  {tgConfig?.isConnected ? (
                    <Space size={4}>
                      <span>Telegram</span>
                      <Badge status="success" />
                    </Space>
                  ) : (
                    'Подключить Telegram'
                  )}
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

      {/* Telegram 1-Click Connect & Automation Modal */}
      <Modal
        title={
          <Space>
            <SendOutlined style={{ color: '#1677ff', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 600 }}>Telegram-уведомления для компании</span>
          </Space>
        }
        open={isTgModalOpen}
        onCancel={() => setIsTgModalOpen(false)}
        footer={null}
        width={580}
      >
        {isTgLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : tgConfig?.isConnected ? (
          <div>
            <Card
              style={{
                background: isDark ? '#162312' : '#f6ffed',
                borderColor: '#b7eb8f',
                marginBottom: 20,
              }}
            >
              <Space align="start">
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 28, marginTop: 4 }} />
                <div>
                  <Title level={5} style={{ margin: 0, color: '#389e0d' }}>
                    Telegram успешно подключен!
                  </Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Уведомления отправляются получателю: <b>{tgConfig.username || 'Пользователь'}</b> (Chat ID: {tgConfig.chatId})
                  </Text>
                </div>
              </Space>
            </Card>

            <Form
              form={tgForm}
              initialValues={tgConfig}
              onFinish={(values) => saveTgMutation.mutate(values)}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: isDark ? '#1f1f1f' : '#fafafa',
                  borderRadius: 8,
                  marginBottom: 16,
                  border: isDark ? '1px solid #303030' : '1px solid #f0f0f0',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>🔔 Уведомления активны</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Главный переключатель отправки сообщений
                  </Text>
                </div>
                <Form.Item name="isEnabled" valuePropName="checked" noStyle>
                  <Switch checkedChildren="Вкл" unCheckedChildren="Выкл" />
                </Form.Item>
              </div>

              <Divider orientation="left" style={{ fontSize: 13, margin: '16px 0 12px' }}>
                Какие события присылать в Telegram:
              </Divider>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: isDark ? '#191919' : '#fff',
                    border: isDark ? '1px solid #2a2a2a' : '1px solid #eee',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>🎯 Новые лиды и заявки</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Имя, телефон, компания, сумма и источник
                    </Text>
                  </div>
                  <Form.Item name="notifyLeads" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: isDark ? '#191919' : '#fff',
                    border: isDark ? '1px solid #2a2a2a' : '1px solid #eee',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>🛍 Новые заказы клиентов</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Номер заказа, сумма и состав товаров
                    </Text>
                  </div>
                  <Form.Item name="notifyOrders" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: isDark ? '#191919' : '#fff',
                    border: isDark ? '1px solid #2a2a2a' : '1px solid #eee',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>💳 Оплаты и продления</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Подтверждения платежей и чеки
                    </Text>
                  </div>
                  <Form.Item name="notifyPayments" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: isDark ? '#191919' : '#fff',
                    border: isDark ? '1px solid #2a2a2a' : '1px solid #eee',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>⏰ Напоминания о подписках и дедлайнах</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Авто-проверка за 7/3/0 дней и просрочки (Bull & Cron)
                    </Text>
                  </div>
                  <Form.Item name="notifySubscriptions" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </div>

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
                    Запустить Cron
                  </Button>
                  <Button
                    danger
                    type="text"
                    icon={<DisconnectOutlined />}
                    onClick={() => disconnectMutation.mutate()}
                    loading={disconnectMutation.isPending}
                  >
                    Отключить
                  </Button>
                </Space>

                <Button type="primary" htmlType="submit" loading={saveTgMutation.isPending}>
                  Сохранить
                </Button>
              </div>
            </Form>
          </div>
        ) : (
          <div>
            <Alert
              message="Мгновенные уведомления прямо в Telegram"
              description="Подключите бота в 1 клик, чтобы получать информацию о новых лидах, заказах, скорой оплате и просрочке подписок ваших клиентов."
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Card
              style={{
                textAlign: 'center',
                padding: '16px 0',
                background: isDark ? '#1a1a1a' : '#f9f9f9',
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <SendOutlined style={{ fontSize: 44, color: '#1677ff', marginBottom: 12 }} />
              <Title level={4} style={{ marginBottom: 8 }}>
                Подключение за 5 секунд
              </Title>
              <Paragraph type="secondary" style={{ maxWidth: 420, margin: '0 auto 20px' }}>
                Нажмите кнопку ниже, чтобы открыть официального бота <b>@{tgConfig?.botUsername || 'mycrm_notification_bot'}</b> и нажмите кнопку <b>START</b> в Telegram.
              </Paragraph>

              <Button
                type="primary"
                size="large"
                shape="round"
                icon={<SendOutlined />}
                href={tgConfig?.connectUrl}
                target="_blank"
                style={{
                  height: 48,
                  padding: '0 32px',
                  fontSize: 16,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
                  boxShadow: '0 4px 14px rgba(22, 119, 255, 0.4)',
                }}
              >
                📲 Подключить Telegram в 1 клик
              </Button>

              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Spin size="small" />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Ожидаем нажатия кнопки START в боте...
                </Text>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </ConfigProvider>
  );
}
