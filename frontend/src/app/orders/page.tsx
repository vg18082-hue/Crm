'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusOutlined, ShoppingOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api-client';

const { Title, Text } = Typography;
const { Option } = Select;

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders-list'],
    queryFn: async () => {
      const res = await apiClient.get('/orders');
      return res.data;
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-orders-select'],
    queryFn: async () => {
      const res = await apiClient.get('/clients');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiClient.post('/orders', values);
    },
    onSuccess: () => {
      message.success('Заказ успешно создан');
      setIsCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка создания заказа');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiClient.patch(`/orders/${id}`, { status });
    },
    onSuccess: () => {
      message.success('Статус заказа обновлен');
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
    },
  });

  const columns = [
    {
      title: 'Номер заказа',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (num: string) => <Tag color="purple">{num || 'ORD-001'}</Tag>,
    },
    {
      title: 'Клиент',
      dataIndex: ['client', 'name'],
      key: 'client',
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: 'Сумма заказа',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: any) => <span style={{ fontWeight: 700, color: '#52c41a' }}>{Number(amount).toLocaleString()} сум</span>,
    },
    {
      title: 'Статус выполнения',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => (
        <Select
          value={status}
          size="small"
          style={{ width: 140 }}
          onChange={(newStatus) => updateStatusMutation.mutate({ id: record.id, status: newStatus })}
        >
          <Option value="PENDING">🟡 В обработке</Option>
          <Option value="PROCESSING">⚡ Выполняется</Option>
          <Option value="SHIPPED">🚚 Отправлен</Option>
          <Option value="DELIVERED">🟢 Доставлен</Option>
          <Option value="CANCELLED">🔴 Отменен</Option>
        </Select>
      ),
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            🛍 Заказы
          </Title>
          <Text type="secondary">Отслеживание статусов сборки, доставки и выполнения заказов</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ borderRadius: 8 }}
          onClick={() => setIsCreateOpen(true)}
        >
          Создать заказ
        </Button>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={orders} rowKey="id" columns={columns} loading={isLoading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create Order Modal */}
      <Modal title="🛍 Новый заказ" open={isCreateOpen} onCancel={() => setIsCreateOpen(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item label="Клиент" name="clientId" rules={[{ required: true, message: 'Выберите клиента' }]}>
            <Select placeholder="Выберите клиента из базы" size="large">
              {clients?.map((c: any) => (
                <Option key={c.id} value={c.id}>
                  {c.name} ({c.phone || 'Без телефона'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Номер заказа (опционально)" name="orderNumber">
            <Input placeholder="ORD-2026-001" size="large" />
          </Form.Item>

          <Form.Item label="Сумма заказа (сум)" name="amount" rules={[{ required: true, message: 'Введите сумму' }]}>
            <InputNumber style={{ width: '100%' }} size="large" min={0} placeholder="850000" />
          </Form.Item>

          <Form.Item label="Способ оплаты" name="paymentMethod" initialValue="CASH">
            <Select size="large">
              <Option value="CASH">Наличные</Option>
              <Option value="CARD">Карта</Option>
              <Option value="TRANSFER">Перевод</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Комментарий / Доставка" name="comment">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setIsCreateOpen(false)} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Создать заказ
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
