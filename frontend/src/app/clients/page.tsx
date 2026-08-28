'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
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

const { Title, Text } = Typography;

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Fetch Clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients-list', search],
    queryFn: async () => {
      const res = await apiClient.get('/clients', { params: { search } });
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
      message.error(err.response?.data?.message || 'Ошибка создания клиента');
    },
  });

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
      title: 'Telegram / Email',
      key: 'contacts',
      render: (_: any, record: any) => (
        <div>
          {record.telegram && <Tag color="blue">{record.telegram}</Tag>}
          {record.email && <span style={{ fontSize: 12, color: '#595959' }}>{record.email}</span>}
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
          <Tag color="success">0 сум (Долгов нет)</Tag>
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Button size="small" type="primary" ghost onClick={() => setSelectedClientId(record.id)}>
          Карточка клиента
        </Button>
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ borderRadius: 8 }}
          onClick={() => setIsCreateOpen(true)}
        >
          Добавить клиента
        </Button>
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

          <Form.Item label="Email" name="email">
            <Input placeholder="client@company.com" size="large" />
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

      {/* Client Detail Drawer */}
      <Drawer
        title="📋 Карточка Клиента"
        width={600}
        open={!!selectedClientId}
        onClose={() => setSelectedClientId(null)}
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
                        <p>
                          <strong>Telegram:</strong> {clientDetail.telegram || '—'}
                        </p>
                        <p>
                          <strong>Адрес:</strong> {clientDetail.address || '—'}
                        </p>
                        <p>
                          <strong>Источник:</strong> {clientDetail.source || '—'}
                        </p>
                        <p>
                          <strong>Текущий долг:</strong>{' '}
                          <Tag color={Number(clientDetail.debt) > 0 ? 'error' : 'success'}>
                            {Number(clientDetail.debt).toLocaleString()} сум
                          </Tag>
                        </p>
                        <p>
                          <strong>Комментарий:</strong> {clientDetail.comment || '—'}
                        </p>
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
