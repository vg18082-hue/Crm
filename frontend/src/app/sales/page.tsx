'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api-client';

const { Title, Text } = Typography;
const { Option } = Select;

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales-list'],
    queryFn: async () => {
      const res = await apiClient.get('/sales');
      return res.data;
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-select'],
    queryFn: async () => {
      const res = await apiClient.get('/clients');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiClient.post('/sales', values);
    },
    onSuccess: () => {
      message.success('Продажа успешно оформлена');
      setIsCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['sales-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка оформления продажи');
    },
  });

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Клиент',
      dataIndex: ['client', 'name'],
      key: 'client',
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: 'Сумма сделки',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: any) => <span style={{ fontWeight: 700, color: '#52c41a' }}>{Number(amount).toLocaleString()} сум</span>,
    },
    {
      title: 'Способ оплаты',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => <Tag color="blue">{method}</Tag>,
    },
    {
      title: 'Статус оплаты',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'PAID' ? 'success' : 'warning'}>
          {status === 'PAID' ? '🟢 Оплачено' : '🟡 Ожидает оплаты'}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            💰 Модуль Продаж
          </Title>
          <Text type="secondary">Оформление сделок, расчет стоимости и статус платежей</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ borderRadius: 8 }}
          onClick={() => setIsCreateOpen(true)}
        >
          Новая продажа
        </Button>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={sales} rowKey="id" columns={columns} loading={isLoading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create Sale Modal */}
      <Modal title="💰 Оформить продажу" open={isCreateOpen} onCancel={() => setIsCreateOpen(false)} footer={null}>
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

          <Form.Item label="Сумма сделки (сум)" name="amount" rules={[{ required: true, message: 'Введите сумму' }]}>
            <InputNumber style={{ width: '100%' }} size="large" min={0} placeholder="1500000" />
          </Form.Item>

          <Form.Item label="Скидка (сум)" name="discount" initialValue={0}>
            <InputNumber style={{ width: '100%' }} size="large" min={0} />
          </Form.Item>

          <Form.Item label="Способ оплаты" name="paymentMethod" initialValue="CASH">
            <Select size="large">
              <Option value="CASH">Наличные</Option>
              <Option value="CARD">Банковская карта</Option>
              <Option value="TRANSFER">Перевод на расчетный счет</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Статус оплаты" name="status" initialValue="PENDING">
            <Select size="large">
              <Option value="PENDING">🟡 Ожидает оплаты (Добавить в задолженность)</Option>
              <Option value="PAID">🟢 Оплачено полностью</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Комментарий к продаже" name="comment">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setIsCreateOpen(false)} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Оформить продажу
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
