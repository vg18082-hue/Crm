'use client';

import React, { useState, useEffect } from 'react';
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
  LineChartOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  QrcodeOutlined,
  RocketOutlined,
  SearchOutlined,
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
  List,
  Menu,
  Modal,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
  theme,
} from 'antd';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { apiClient } from '@/lib/api-client';
import { showApiError } from '@/lib/error-handler';

const { Header, Sider, Content } = Layout;
const { Text, Title, Paragraph } = Typography;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isTgModalOpen, setIsTgModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [tgForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const isDark = mode === 'dark';

  // Global search shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick Search Query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['global-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        return null;
      }
      const res = await apiClient.get('/dashboard/search', { params: { q: searchQuery } });
      return res.data;
    },
    enabled: isSearchOpen && searchQuery.trim().length >= 2,
  });

  // Fetch Telegram Config
  const { data: tgConfig, isLoading: isTgLoading } = useQuery({
    queryKey: ['telegram-config'],
    queryFn: async () => {
      if (!user) return null;
      const res = await apiClient.get('/notifications/telegram-config');
      return res.data;
    },
    enabled: !!user,
    refetchInterval: isTgModalOpen ? 3000 : false,
  });

  useEffect(() => {
    if (tgConfig) {
      tgForm.setFieldsValue(tgConfig);
    }
  }, [tgConfig, tgForm]);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({ name: user.name });
    }
  }, [user, profileForm]);

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
      showApiError(err, 'Ошибка сохранения настроек Telegram');
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
      showApiError(err, 'Ошибка отключения Telegram');
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
      showApiError(err, 'Ошибка отправки тестового сообщения');
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
      showApiError(err, 'Ошибка запуска фоновых задач');
    },
  });

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: { name: string }) => {
      const res = await apiClient.patch('/auth/profile', values);
      return res.data;
    },
    onSuccess: (updated) => {
      message.success('Профиль успешно обновлен');
      if (user) {
        const newUser = { ...user, name: updated.name };
        localStorage.setItem('user', JSON.stringify(newUser));
      }
      setIsProfileModalOpen(false);
      window.location.reload();
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка обновления профиля');
    },
  });

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await apiClient.post('/auth/change-password', values);
      return res.data;
    },
    onSuccess: () => {
      message.success('Пароль успешно изменен');
      passwordForm.resetFields();
      setIsProfileModalOpen(false);
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка смены пароля');
    },
  });

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Главный Dashboard',
    },
    {
      key: '/reports',
      icon: <LineChartOutlined />,
      label: 'Отчеты & Аналитика',
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
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Настройки CRM',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile-header',
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
      key: 'my-profile',
      icon: <UserOutlined style={{ color: '#1677ff' }} />,
      label: 'Мой профиль и пароль',
      onClick: () => setIsProfileModalOpen(true),
    },
    {
      key: 'settings-link',
      icon: <SettingOutlined style={{ color: '#722ed1' }} />,
      label: 'Настройки компании',
      onClick: () => router.push('/settings'),
    },
    {
      key: 'telegram-settings',
      icon: <SendOutlined style={{ color: '#52c41a' }} />,
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
            <Space size="middle">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px', width: 40, height: 40 }}
              />

              {/* Quick Search trigger button */}
              <Button
                type="dashed"
                icon={<SearchOutlined />}
                onClick={() => setIsSearchOpen(true)}
                style={{
                  width: 240,
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: isDark ? '#8c8c8c' : '#595959',
                }}
              >
                <span>Быстрый поиск...</span>
                <Tag color="default" style={{ marginRight: 0, fontSize: 11 }}>
                  ⌘K
                </Tag>
              </Button>
            </Space>

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

      {/* Global Quick Search Modal */}
      <Modal
        title={
          <Space>
            <SearchOutlined style={{ color: '#1677ff' }} />
            <span>Глобальный поиск по CRM</span>
          </Space>
        }
        open={isSearchOpen}
        onCancel={() => {
          setIsSearchOpen(false);
          setSearchQuery('');
        }}
        footer={null}
        width={650}
      >
        <Input
          size="large"
          placeholder="Введите имя клиента, лид, товар, телефон или номер заказа..."
          prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          autoFocus
          style={{ marginBottom: 16 }}
        />

        {isSearching ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <Spin tip="Поиск по всем сущностям..." />
          </div>
        ) : searchResults ? (
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {searchResults.clients?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ color: '#1677ff' }}>
                  👥 Клиенты ({searchResults.clients.length})
                </Text>
                <List
                  size="small"
                  dataSource={searchResults.clients}
                  renderItem={(item: any) => (
                    <List.Item
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setIsSearchOpen(false);
                        router.push(`/clients?search=${encodeURIComponent(item.name)}`);
                      }}
                    >
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <div>
                          <Text strong>{item.name}</Text>
                          {item.phone && <Text type="secondary" style={{ marginLeft: 8 }}>📞 {item.phone}</Text>}
                        </div>
                        {Number(item.debt) > 0 && <Tag color="red">Долг: {Number(item.debt).toLocaleString()} сум</Tag>}
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {searchResults.leads?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ color: '#722ed1' }}>
                  🎯 Лиды ({searchResults.leads.length})
                </Text>
                <List
                  size="small"
                  dataSource={searchResults.leads}
                  renderItem={(item: any) => (
                    <List.Item
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setIsSearchOpen(false);
                        router.push(`/leads?search=${encodeURIComponent(item.name)}`);
                      }}
                    >
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <div>
                          <Text strong>{item.name}</Text>
                          {item.company && <Text type="secondary" style={{ marginLeft: 8 }}>🏢 {item.company}</Text>}
                        </div>
                        <Tag color="blue">{item.status}</Tag>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {searchResults.products?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ color: '#fa8c16' }}>
                  📦 Товары & Услуги ({searchResults.products.length})
                </Text>
                <List
                  size="small"
                  dataSource={searchResults.products}
                  renderItem={(item: any) => (
                    <List.Item
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setIsSearchOpen(false);
                        router.push(`/products?search=${encodeURIComponent(item.name)}`);
                      }}
                    >
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <div>
                          <Text strong>{item.name}</Text>
                          {item.sku && <Text type="secondary" style={{ marginLeft: 8 }}>[{item.sku}]</Text>}
                        </div>
                        <Text strong style={{ color: '#52c41a' }}>{Number(item.price).toLocaleString()} сум</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {searchResults.sales?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ color: '#52c41a' }}>
                  💰 Продажи ({searchResults.sales.length})
                </Text>
                <List
                  size="small"
                  dataSource={searchResults.sales}
                  renderItem={(item: any) => (
                    <List.Item
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setIsSearchOpen(false);
                        router.push(`/sales`);
                      }}
                    >
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text strong>Клиент: {item.client?.name}</Text>
                        <Space>
                          <Tag color={item.status === 'PAID' ? 'green' : 'orange'}>{item.status}</Tag>
                          <Text strong>{Number(item.amount).toLocaleString()} сум</Text>
                        </Space>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {(!searchResults.clients?.length &&
              !searchResults.leads?.length &&
              !searchResults.products?.length &&
              !searchResults.sales?.length) && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#8c8c8c' }}>
                По запросу «{searchQuery}» ничего не найдено
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#8c8c8c' }}>
            Начните ввод (минимум 2 символа) для поиска по всей CRM
          </div>
        )}
      </Modal>

      {/* User Profile & Password Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined style={{ color: '#1677ff' }} />
            <span>Мой профиль и безопасность</span>
          </Space>
        }
        open={isProfileModalOpen}
        onCancel={() => setIsProfileModalOpen(false)}
        footer={null}
        width={500}
      >
        <Tabs
          defaultActiveKey="profile"
          items={[
            {
              key: 'profile',
              label: 'Данные профиля',
              children: (
                <Form form={profileForm} layout="vertical" onFinish={(values) => updateProfileMutation.mutate(values)}>
                  <Form.Item label="Email">
                    <Input value={user?.email} disabled />
                  </Form.Item>
                  <Form.Item label="Роль">
                    <Input value={user?.role} disabled />
                  </Form.Item>
                  <Form.Item label="ФИО сотрудника" name="name" rules={[{ required: true, message: 'Укажите ФИО' }]}>
                    <Input placeholder="Иван Иванов" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={updateProfileMutation.isPending} block>
                      Сохранить изменения
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'password',
              label: 'Смена пароля',
              children: (
                <Form form={passwordForm} layout="vertical" onFinish={(values) => changePasswordMutation.mutate(values)}>
                  <Form.Item
                    label="Текущий пароль"
                    name="currentPassword"
                    rules={[{ required: true, message: 'Введите текущий пароль' }]}
                  >
                    <Input.Password placeholder="Текущий пароль" />
                  </Form.Item>
                  <Form.Item
                    label="Новый пароль"
                    name="newPassword"
                    rules={[{ required: true, min: 6, message: 'Минимум 6 символов' }]}
                  >
                    <Input.Password placeholder="Новый пароль" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={changePasswordMutation.isPending} block>
                      Обновить пароль
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Modal>

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
        width={640}
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
              layout="vertical"
            >
              <Title level={5} style={{ marginTop: 10, marginBottom: 15 }}>
                ⚙️ Настройка типов уведомлений:
              </Title>

              <Form.Item name="isEnabled" valuePropName="checked" label="Включить отправку всех уведомлений">
                <Switch />
              </Form.Item>

              <Divider style={{ margin: '12px 0' }} />

              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Form.Item style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>🎯 Новые Лиды</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Оповещение при создании нового лида или заявки с сайта
                      </Text>
                    </div>
                    <Form.Item name="notifyLeads" valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>📦 Новые Заказы</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Оповещение при оформлении нового заказа клиентом
                      </Text>
                    </div>
                    <Form.Item name="notifyOrders" valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>💳 Оплаты и Чеки</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Оповещение о поступлении денежных средств и оплат
                      </Text>
                    </div>
                    <Form.Item name="notifyPayments" valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>🚀 Абонентские подписки</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Оповещение о продлении, оплате и скором сроке платежа
                      </Text>
                    </div>
                    <Form.Item name="notifySubscriptions" valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Form.Item>
              </Space>

              <Divider style={{ margin: '20px 0' }} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Button
                  danger
                  icon={<DisconnectOutlined />}
                  loading={disconnectMutation.isPending}
                  onClick={() => disconnectMutation.mutate()}
                >
                  Отключить бота
                </Button>

                <Space>
                  <Button
                    icon={<SendOutlined />}
                    loading={testTgMutation.isPending}
                    onClick={() => testTgMutation.mutate()}
                  >
                    Тестовое сообщение
                  </Button>
                  <Button type="primary" htmlType="submit" loading={saveTgMutation.isPending}>
                    Сохранить настройки
                  </Button>
                </Space>
              </Space>
            </Form>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
            <Title level={4} style={{ marginBottom: 8 }}>
              Подключите Telegram-бота в 1 клик!
            </Title>
            <Paragraph type="secondary" style={{ maxWidth: 460, margin: '0 auto 24px' }}>
              Получайте мгновенные уведомления о новых заказах, заявках, оплатах и напоминания по подпискам прямо в ваш Telegram.
            </Paragraph>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                href={tgConfig?.deepLinkUrl || `https://t.me/${tgConfig?.botUsername || 'mycrm_notification_bot'}`}
                target="_blank"
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  padding: '0 32px',
                  borderRadius: 24,
                  backgroundColor: '#229ED9',
                }}
              >
                Открыть бота и нажать Start 🚀
              </Button>

              <Alert
                message="Окно можно не закрывать"
                description="После нажатия кнопки «Запустить» в Telegram страница автоматически обновится и бот будет привязан к вашей компании!"
                type="info"
                showIcon
                style={{ textAlign: 'left' }}
              />
            </Space>
          </div>
        )}

        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>⏰ Фоновые Cron-задачи (Очереди Bull)</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Проверка дедлайнов задач и просроченных подписок каждые 3 часа
            </Text>
          </div>
          <Button
            icon={<SyncOutlined />}
            loading={triggerCronMutation.isPending}
            onClick={() => triggerCronMutation.mutate()}
          >
            Запустить проверку сейчас
          </Button>
        </div>
      </Modal>
    </ConfigProvider>
  );
}
