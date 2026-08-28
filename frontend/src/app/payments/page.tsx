'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCardOutlined, PlusOutlined } from '@ant-design/icons';
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

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments-list'],
    queryFn: async () => {
      const res = await apiClient.get('/payments');
      return res.data;
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-payments-select'],
    queryFn: async () => {
      const res = await apiClient.get('/clients');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiClient.post('/payments', values);
    },
    onSuccess: () => {
      message.success('Платеж зафиксирован. Задолженность клиента пересчитана!');
      setIsCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['payments-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка проведения платежа');
    },
  });

  const columns = [
    {
      title: 'Дата платежа',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Клиент',
      dataIndex: ['client', 'name'],
      key: 'client',
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text || 'Клиент'}</span>,
    },
    {
      title: 'Сумма',
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
      title: 'Комментарий',
      dataIndex: 'comment',
      key: 'comment',
      render: (c: string) => c || '—',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            💳 История Оплат
          </Title>
          <Text type="secondary">Реестр поступивших платежей от клиентов</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ borderRadius: 8 }}
          onClick={() => setIsCreateOpen(true)}
        >
          Принять платеж
        </Button>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={payments} rowKey="id" columns={columns} loading={isLoading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create Payment Modal */}
      <Modal title="💳 Принять платеж от клиента" open={isCreateOpen} onCancel={() => setIsCreateOpen(false)} footer={null}>
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

          <Form.Item label="Сумма платежа (сум)" name="amount" rules={[{ required: true, message: 'Введите сумму' }]}>
            <InputNumber style={{ width: '100%' }} size="large" min={0.01} placeholder="500000" />
          </Form.Item>

          <Form.Item label="Способ оплаты" name="paymentMethod" initialValue="CASH">
            <Select size="large">
              <Option value="CASH">Наличные</Option>
              <Option value="CARD">Банковская карта</Option>
              <Option value="TRANSFER">Перевод / Расчетный счет</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Комментарий" name="comment">
            <Input.TextArea placeholder="Оплата по договору" rows={2} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setIsCreateOpen(false)} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Провести платеж
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
