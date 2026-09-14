'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreditCardOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export-csv';
import { showApiError } from '@/lib/error-handler';

const { Title, Text } = Typography;

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentClientId, setPaymentClientId] = useState<string | null>(null);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  // Fetch Clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients-list', search],
    queryFn: async () => {
      const res = await apiClient.get('/clients', { params: { search } });
      return res.data;
    },
  });

  // Fetch Team Users for Assignee
  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data;
    },
  });

  // Fetch Single Client details for Drawer
  const { data: clientDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['client-detail', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;
      const res = await apiClient.get(`/clients/${selectedClientId}`);
      return res.data;
    },
    enabled: !!selectedClientId,
  });

  // Create Client Mutation
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiClient.post('/clients', values);
    },
    onSuccess: () => {
      message.success('Клиент успешно добавлен');
      setIsCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['clients-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка при добавлении клиента');
    },
  });

  // Edit Client Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      return apiClient.patch(`/clients/${id}`, values);
    },
    onSuccess: () => {
      message.success('Данные клиента обновлены');
      setEditingClient(null);
      queryClient.invalidateQueries({ queryKey: ['clients-list'] });
      queryClient.invalidateQueries({ queryKey: ['client-detail', selectedClientId] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка при сохранении клиента');
    },
  });

  // Delete Client Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      message.success('Клиент удален');
      setSelectedClientId(null);
      queryClient.invalidateQueries({ queryKey: ['clients-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка при удалении клиента');
    },
  });

  // Quick Payment Mutation
  const paymentMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiClient.post('/payments', {
        ...values,
        clientId: paymentClientId,
      });
    },
    onSuccess: () => {
      message.success('Оплата успешно принята и зачислена');
      setIsPaymentModalOpen(false);
      paymentForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['clients-list'] });
      queryClient.invalidateQueries({ queryKey: ['client-detail', selectedClientId] });
      queryClient.invalidateQueries({ queryKey: ['payments-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка при проведении платежа');
    },
  });

  const handleExport = () => {
    if (!clients || clients.length === 0) return;
    exportToCSV(
      'clients_export',
      clients,
      [
        { key: 'name', title: 'Клиент / Компания' },
        { key: 'phone', title: 'Телефон' },
        { key: 'email', title: 'Email' },
        { key: 'telegram', title: 'Telegram' },
        { key: 'source', title: 'Источник' },
        { key: 'debt', title: 'Задолженность (сум)' },
        { key: 'address', title: 'Адрес' },
        { key: 'comment', title: 'Комментарий' },
      ],
    );
  };

  const columns = [
    {
      title: 'Клиент',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />}>
            {text?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.phone || 'Нет телефона'}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Контакты',
      key: 'contacts',
      render: (_: any, record: any) => (
        <div>
          {record.telegram && <Tag color="blue">{record.telegram}</Tag>}
          {record.email && <span style={{ fontSize: 12, color: '#595959', display: 'block' }}>{record.email}</span>}
        </div>
      ),
    },
    {
      title: 'Источник',
      dataIndex: 'source',
      key: 'source',
      render: (text: string) => (text ? <Tag color="geekblue">{text}</Tag> : '—'),
    },
    {
      title: 'Менеджер',
      key: 'assignedTo',
      render: (_: any, record: any) => record.assignedTo?.name || '—',
    },
    {
      title: 'Задолженность',
      dataIndex: 'debt',
      key: 'debt',
      render: (debt: any) => {
        const val = Number(debt || 0);
        return val > 0 ? (
          <Tag color="error" style={{ fontWeight: 700 }}>
            {val.toLocaleString()} сум
          </Tag>
        ) : (
          <Tag color="success">0 сум (Оплачено)</Tag>
        );
      },
      sorter: (a: any, b: any) => Number(a.debt || 0) - Number(b.debt || 0),
    },
    {
      title: 'Действия',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          {Number(record.debt || 0) > 0 && (
            <Button
              size="small"
              type="primary"
              style={{ backgroundColor: '#52c41a' }}
              icon={<CreditCardOutlined />}
              onClick={() => {
                setPaymentClientId(record.id);
                paymentForm.setFieldsValue({ amount: Number(record.debt) });
                setIsPaymentModalOpen(true);
              }}
            >
              Оплата
            </Button>
          )}
          <Button
            size="small"
            type="default"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingClient(record);
              editForm.setFieldsValue(record);
            }}
          />
          <Button size="small" type="primary" ghost onClick={() => setSelectedClientId(record.id)}>
            Карточка
          </Button>
          <Popconfirm
            title="Удалить клиента?"
            description="Все связанные заказы и история сохранятся."
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Да, удалить"
            cancelText="Отмена"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            🤝 База Клиентов
          </Title>
          <Text type="secondary">История взаимодействий, покупок, долгов и подписок клиентов</Text>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />} size="large" onClick={handleExport}>
            Экспорт в CSV
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{ borderRadius: 8 }}
            onClick={() => setIsCreateOpen(true)}
          >
            Добавить клиента
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 20 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="Поиск клиентов по имени, телефону, email или telegram..."
          size="large"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 450 }}
        />
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={clients} rowKey="id" columns={columns} loading={isLoading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create Client Modal */}
      <Modal title="✨ Добавить клиента" open={isCreateOpen} onCancel={() => setIsCreateOpen(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item label="ФИО / Название компании" name="name" rules={[{ required: true, message: 'Введите название' }]}>
            <Input placeholder="ООО Инновация" size="large" />
          </Form.Item>

          <Form.Item label="Телефон" name="phone">
            <Input placeholder="+998901234567" size="large" />
          </Form.Item>

          <Form.Item label="Telegram" name="telegram">
            <Input placeholder="@client_tg" size="large" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: 'email', message: 'Введите корректный email (например, name@mail.com)' }]}
          >
            <Input placeholder="client@company.com" size="large" />
          </Form.Item>

          <Form.Item label="Ответственный менеджер" name="assignedToId">
            <Select placeholder="Выберите менеджера" allowClear>
              {(users || []).map((u: any) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Источник клиента" name="source">
            <Input placeholder="Instagram / Telegram / Рекомендация" size="large" />
          </Form.Item>

          <Form.Item label="Адрес" name="address">
            <Input placeholder="г. Ташкент" size="large" />
          </Form.Item>

          <Form.Item label="Комментарий" name="comment">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setIsCreateOpen(false)} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Сохранить
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        title="✏️ Редактировать клиента"
        open={!!editingClient}
        onCancel={() => setEditingClient(null)}
        footer={null}
      >
        <Form
          layout="vertical"
          form={editForm}
          onFinish={(values) => updateMutation.mutate({ id: editingClient.id, values })}
        >
          <Form.Item label="ФИО / Название компании" name="name" rules={[{ required: true, message: 'Введите название' }]}>
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Телефон" name="phone">
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Telegram" name="telegram">
            <Input size="large" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: 'email', message: 'Введите корректный email (например, name@mail.com)' }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Ответственный менеджер" name="assignedToId">
            <Select placeholder="Выберите менеджера" allowClear>
              {(users || []).map((u: any) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Источник" name="source">
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Адрес" name="address">
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Комментарий" name="comment">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setEditingClient(null)} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              Сохранить
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Quick Payment Modal */}
      <Modal
        title="💳 Принять оплату от клиента"
        open={isPaymentModalOpen}
        onCancel={() => setIsPaymentModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical" form={paymentForm} onFinish={(values) => paymentMutation.mutate(values)}>
          <Form.Item label="Сумма оплаты (сум)" name="amount" rules={[{ required: true, message: 'Укажите сумму' }]}>
            <Input type="number" size="large" />
          </Form.Item>

          <Form.Item label="Способ оплаты" name="paymentMethod" initialValue="CASH">
            <Select size="large">
              <Select.Option value="CASH">💵 Наличные</Select.Option>
              <Select.Option value="CARD">💳 Банковская карта</Select.Option>
              <Select.Option value="TRANSFER">🏦 Банковский перевод</Select.Option>
              <Select.Option value="OTHER">⚡ Другое</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Комментарий к платежу" name="comment">
            <Input placeholder="Погашение долга / частичная оплата" size="large" />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setIsPaymentModalOpen(false)} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={paymentMutation.isPending}>
              Зачислить оплату
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Client Detail Drawer */}
      <Drawer
        title="📋 Карточка Клиента"
        width={680}
        open={!!selectedClientId}
        onClose={() => setSelectedClientId(null)}
        extra={
          clientDetail && (
            <Button
              type="primary"
              style={{ backgroundColor: '#52c41a' }}
              icon={<CreditCardOutlined />}
              onClick={() => {
                setPaymentClientId(clientDetail.id);
                paymentForm.setFieldsValue({ amount: Number(clientDetail.debt || 0) });
                setIsPaymentModalOpen(true);
              }}
            >
              Принять оплату
            </Button>
          )
        }
      >
        {isDetailLoading ? (
          <Spin size="large" />
        ) : (
          clientDetail && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                <Avatar size={54} style={{ backgroundColor: '#1677ff', marginRight: 16 }}>
                  {clientDetail.name?.charAt(0)}
                </Avatar>
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {clientDetail.name}
                  </Title>
                  <Text type="secondary">{clientDetail.phone || clientDetail.email || 'Контакты не указаны'}</Text>
                </div>
              </div>

              <Tabs
                items={[
                  {
                    key: 'info',
                    label: 'Общая инфо',
                    children: (
                      <div>
                        <p><strong>Telegram:</strong> {clientDetail.telegram || '—'}</p>
                        <p><strong>Адрес:</strong> {clientDetail.address || '—'}</p>
                        <p><strong>Источник:</strong> {clientDetail.source || '—'}</p>
                        <p><strong>Ответственный менеджер:</strong> {clientDetail.assignedTo?.name || '—'}</p>
                        <p>
                          <strong>Текущий долг:</strong>{' '}
                          <Tag color={Number(clientDetail.debt) > 0 ? 'error' : 'success'}>
                            {Number(clientDetail.debt).toLocaleString()} сум
                          </Tag>
                        </p>
                        <p><strong>Комментарий:</strong> {clientDetail.comment || '—'}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'sales',
                    label: `Сделки (${clientDetail.sales?.length || 0})`,
                    children: (
                      <Table
                        dataSource={clientDetail.sales}
                        rowKey="id"
                        pagination={false}
                        columns={[
                          { title: 'Дата', dataIndex: 'createdAt', render: (d) => dayjs(d).format('DD.MM.YYYY') },
                          { title: 'Сумма', dataIndex: 'amount', render: (a) => `${Number(a).toLocaleString()} сум` },
                          { title: 'Статус', dataIndex: 'status', render: (s) => <Tag color={s === 'PAID' ? 'success' : 'warning'}>{s}</Tag> },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'payments',
                    label: `Платежи (${clientDetail.payments?.length || 0})`,
                    children: (
                      <Table
                        dataSource={clientDetail.payments}
                        rowKey="id"
                        pagination={false}
                        columns={[
                          { title: 'Дата', dataIndex: 'paymentDate', render: (d) => dayjs(d).format('DD.MM.YYYY HH:mm') },
                          { title: 'Сумма', dataIndex: 'amount', render: (a) => `${Number(a).toLocaleString()} сум` },
                          { title: 'Метод', dataIndex: 'paymentMethod' },
                          { title: 'Комментарий', dataIndex: 'comment', render: (c) => c || '—' },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'subscriptions',
                    label: `Подписки (${clientDetail.subscriptions?.length || 0})`,
                    children: (
                      <Table
                        dataSource={clientDetail.subscriptions}
                        rowKey="id"
                        pagination={false}
                        columns={[
                          { title: 'Тариф', dataIndex: 'planName' },
                          { title: 'Сумма', dataIndex: 'amount', render: (a) => `${Number(a).toLocaleString()} сум` },
                          { title: 'Сл. оплата', dataIndex: 'nextPaymentDate', render: (d) => dayjs(d).format('DD.MM.YYYY') },
                          { title: 'Статус', dataIndex: 'status', render: (s) => <Tag color={s === 'ACTIVE' ? 'green' : 'red'}>{s}</Tag> },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'tasks',
                    label: `Задачи (${clientDetail.tasks?.length || 0})`,
                    children: (
                      <Table
                        dataSource={clientDetail.tasks}
                        rowKey="id"
                        pagination={false}
                        columns={[
                          { title: 'Задача', dataIndex: 'title' },
                          { title: 'Срок', dataIndex: 'dueDate', render: (d) => d ? dayjs(d).format('DD.MM.YYYY') : '—' },
                          { title: 'Приоритет', dataIndex: 'priority', render: (p) => <Tag color="blue">{p}</Tag> },
                          { title: 'Статус', dataIndex: 'status', render: (s) => <Tag color={s === 'COMPLETED' ? 'green' : 'orange'}>{s}</Tag> },
                        ]}
                      />
                    ),
                  },
                ]}
              />
            </div>
          )
        )}
      </Drawer>
    </div>
  );
}
