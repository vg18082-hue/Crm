'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AuditOutlined,
  CheckCircleOutlined,
  DisconnectOutlined,
  DownloadOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  SendOutlined,
  SettingOutlined,
  SyncOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export-csv';
import { showApiError } from '@/lib/error-handler';

const { Title, Text, Paragraph } = Typography;

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tenantForm] = Form.useForm();
  const [tgForm] = Form.useForm();

  // Tenant details Query
  const { data: tenant, isLoading: isTenantLoading } = useQuery({
    queryKey: ['tenant-details'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/tenant');
      return res.data;
    },
    enabled: !!user,
  });

  // Telegram config Query
  const { data: tgConfig, isLoading: isTgLoading } = useQuery({
    queryKey: ['telegram-config'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/telegram-config');
      return res.data;
    },
    enabled: !!user,
  });

  // Audit logs Query
  const { data: auditLogs, isLoading: isAuditLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await apiClient.get('/audit-logs');
      return res.data;
    },
    enabled: user?.role === 'ADMIN' || user?.role === 'MANAGER_HEAD',
  });

  // Update Tenant Mutation
  const updateTenantMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiClient.patch('/auth/tenant', values);
    },
    onSuccess: () => {
      message.success('Настройки компании успешно сохранены');
      queryClient.invalidateQueries({ queryKey: ['tenant-details'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка при сохранении настроек компании');
    },
  });

  // Save Telegram Toggles Mutation
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

  // Trigger Cron
  const triggerCronMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/jobs/trigger-cron-now');
      return res.data;
    },
    onSuccess: (data) => {
      message.success(data.message || 'Очереди Bull успешно запущены!');
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка запуска фоновых задач');
    },
  });

  const auditColumns = [
    {
      title: 'Дата и Время',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => new Date(val).toLocaleString('ru-RU'),
      width: 170,
    },
    {
      title: 'Пользователь',
      key: 'user',
      render: (_: any, r: any) => (
        <div>
          <Text strong>{r.user?.name || 'Система / Бот'}</Text>
          {r.user?.role && <Tag color="blue" style={{ marginLeft: 6 }}>{r.user.role}</Tag>}
        </div>
      ),
    },
    {
      title: 'Действие',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        let color = 'blue';
        if (action.includes('CREATE')) color = 'green';
        if (action.includes('DELETE')) color = 'red';
        if (action.includes('UPDATE')) color = 'orange';
        return <Tag color={color}>{action}</Tag>;
      },
    },
    {
      title: 'Сущность',
      dataIndex: 'entity',
      key: 'entity',
      render: (entity: string) => <Tag color="geekblue">{entity}</Tag>,
    },
    {
      title: 'Детали',
      dataIndex: 'details',
      key: 'details',
      render: (details: any) => (
        <span style={{ fontSize: 12, color: '#8c8c8c' }}>
          {details ? JSON.stringify(details).slice(0, 100) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          ⚙️ Настройки Компании & Системы
        </Title>
        <Text type="secondary">
          Управление профилем компании, интеграциями Telegram, фоновыми задачами и журналом действий
        </Text>
      </div>

      <Tabs
        defaultActiveKey="company"
        items={[
          {
            key: 'company',
            label: (
              <Space>
                <SafetyCertificateOutlined />
                <span>Профиль Компании</span>
              </Space>
            ),
            children: isTenantLoading ? (
              <Spin tip="Загрузка данных компании..." />
            ) : (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={14}>
                  <Card title="Информация о бизнесе" bordered={false}>
                    <Form
                      form={tenantForm}
                      initialValues={{ name: tenant?.name }}
                      layout="vertical"
                      onFinish={(values) => updateTenantMutation.mutate(values)}
                    >
                      <Form.Item
                        label="Название компании"
                        name="name"
                        rules={[{ required: true, message: 'Укажите название компании' }]}
                      >
                        <Input placeholder="ООО Название Компании" disabled={user?.role !== 'ADMIN'} />
                      </Form.Item>

                      <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
                        <Descriptions.Item label="ID Компании (Tenant ID)">
                          <code>{tenant?.id}</code>
                        </Descriptions.Item>
                        <Descriptions.Item label="Тарифный план CRM">
                          <Tag color="purple" style={{ fontSize: 13, fontWeight: 600 }}>
                            {tenant?.plan || 'FREE'}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Статус аккаунта">
                          <Tag color={tenant?.isActive ? 'green' : 'red'}>
                            {tenant?.isActive ? 'АКТИВЕН' : 'ДЕАКТИВИРОВАН'}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Лимит сотрудников">
                          {tenant?._count?.users || 0} из {tenant?.maxUsers || 5} пользователей
                        </Descriptions.Item>
                        <Descriptions.Item label="Дата регистрации">
                          {tenant?.createdAt ? new Date(tenant.createdAt).toLocaleDateString('ru-RU') : '—'}
                        </Descriptions.Item>
                      </Descriptions>

                      {user?.role === 'ADMIN' && (
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<SaveOutlined />}
                          loading={updateTenantMutation.isPending}
                        >
                          Сохранить изменения
                        </Button>
                      )}
                    </Form>
                  </Card>
                </Col>

                <Col xs={24} md={10}>
                  <Card title="Сводка базы данных" bordered={false}>
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>👥 Клиентов в базе:</span>
                        <Text strong>{tenant?._count?.clients || 0}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>🎯 Лидов в воронке:</span>
                        <Text strong>{tenant?._count?.leads || 0}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>💰 Продаж оформлено:</span>
                        <Text strong>{tenant?._count?.sales || 0}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>📦 Заказов:</span>
                        <Text strong>{tenant?._count?.orders || 0}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>📦 Номенклатура товаров:</span>
                        <Text strong>{tenant?._count?.products || 0}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>🚀 Абонентских подписок:</span>
                        <Text strong>{tenant?._count?.clientSubscriptions || 0}</Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'telegram',
            label: (
              <Space>
                <SendOutlined />
                <span>Telegram Интеграция</span>
              </Space>
            ),
            children: isTgLoading ? (
              <Spin tip="Загрузка настроек Telegram..." />
            ) : (
              <Card title="Управление Telegram-ботом" bordered={false}>
                {tgConfig?.isConnected ? (
                  <div>
                    <Alert
                      message={`Бот привязан к: ${tgConfig.username || 'Пользователь'} (Chat ID: ${tgConfig.chatId})`}
                      type="success"
                      showIcon
                      style={{ marginBottom: 20 }}
                    />
                    <Form
                      form={tgForm}
                      initialValues={tgConfig}
                      layout="vertical"
                      onFinish={(values) => saveTgMutation.mutate(values)}
                    >
                      <Form.Item name="isEnabled" valuePropName="checked" label="Включить отправку всех уведомлений">
                        <Switch />
                      </Form.Item>
                      <Form.Item name="notifyLeads" valuePropName="checked" label="Новые лиды">
                        <Switch />
                      </Form.Item>
                      <Form.Item name="notifyOrders" valuePropName="checked" label="Новые заказы">
                        <Switch />
                      </Form.Item>
                      <Form.Item name="notifyPayments" valuePropName="checked" label="Оплаты и чеки">
                        <Switch />
                      </Form.Item>
                      <Form.Item name="notifySubscriptions" valuePropName="checked" label="Абонентские подписки">
                        <Switch />
                      </Form.Item>

                      <Space style={{ marginTop: 16 }}>
                        <Button type="primary" htmlType="submit" loading={saveTgMutation.isPending}>
                          Сохранить настройки
                        </Button>
                        <Button
                          icon={<SendOutlined />}
                          loading={testTgMutation.isPending}
                          onClick={() => testTgMutation.mutate()}
                        >
                          Тестовое сообщение
                        </Button>
                        <Button
                          danger
                          icon={<DisconnectOutlined />}
                          loading={disconnectMutation.isPending}
                          onClick={() => disconnectMutation.mutate()}
                        >
                          Отключить
                        </Button>
                      </Space>
                    </Form>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <Title level={4}>Подключите Telegram бота в 1 клик</Title>
                    <Paragraph type="secondary">
                      Получайте мгновенные уведомления о лидах, заказах и оплатах прямо в ваш мессенджер.
                    </Paragraph>
                    <Button
                      type="primary"
                      size="large"
                      icon={<SendOutlined />}
                      href={tgConfig?.deepLinkUrl || `https://t.me/${tgConfig?.botUsername || 'mycrm_notification_bot'}`}
                      target="_blank"
                      style={{ height: 48, borderRadius: 24, padding: '0 32px', backgroundColor: '#229ED9' }}
                    >
                      Открыть бота и нажать Start 🚀
                    </Button>
                  </div>
                )}

                <Divider />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>Очереди фоновых задач (Bull + Redis)</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Автоматическая проверка дедлайнов и напоминаний
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
              </Card>
            ),
          },
          {
            key: 'audit',
            label: (
              <Space>
                <AuditOutlined />
                <span>Журнал Аудита (Audit Log)</span>
              </Space>
            ),
            children: isAuditLoading ? (
              <Spin tip="Загрузка журнала аудита..." />
            ) : (
              <Card title="История действий пользователей" bordered={false}>
                <Table
                  dataSource={auditLogs || []}
                  columns={auditColumns}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
