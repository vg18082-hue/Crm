'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreditCardOutlined,
  DollarOutlined,
  DownloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export-csv';

const { Title, Text } = Typography;
const { Option } = Select;

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
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
      queryClient.invalidateQueries({ queryKey: ['clients-list'] });
      queryClient.invalidateQueries({ queryKey: ['sales-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка проведения платежа');
    },
  });

  const filteredPayments = (payments || []).filter((p: any) => {
    if (methodFilter === 'ALL') return true;
    return p.paymentMethod === methodFilter;
  });

  const totalCollected = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const cashCollected = (payments || []).filter((p: any) => p.paymentMethod === 'CASH').reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const cardCollected = (payments || []).filter((p: any) => p.paymentMethod === 'CARD').reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const transferCollected = (payments || []).filter((p: any) => p.paymentMethod === 'TRANSFER').reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const handleExport = () => {
    if (!filteredPayments || filteredPayments.length === 0) return;
    exportToCSV(
      'payments_export',
      filteredPayments.map((p: any) => ({
        paymentDate: dayjs(p.paymentDate).format('DD.MM.YYYY HH:mm'),
        clientName: p.client?.name || '—',
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        comment: p.comment || '—',
      })),
      [
        { key: 'paymentDate', title: 'Дата и время' },
        { key: 'clientName', title: 'Клиент' },
        { key: 'amount', title: 'Сумма платежа (сум)' },
        { key: 'paymentMethod', title: 'Способ оплаты' },
        { key: 'comment', title: 'Комментарий' },
      ],
    );
  };

  const columns = [
    {
      title: 'Дата платежа',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
      sorter: (a: any, b: any) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime(),
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
      render: (amount: any) => (
        <span style={{ fontWeight: 700, color: '#52c41a', fontSize: 15 }}>
          +{Number(amount).toLocaleString()} сум
        </span>
      ),
      sorter: (a: any, b: any) => Number(a.amount || 0) - Number(b.amount || 0),
    },
    {
      title: 'Способ оплаты',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => {
        const icons: any = { CASH: '💵 Наличные', CARD: '💳 Карта', TRANSFER: '🏦 Перевод' };
        return <Tag color="blue">{icons[method] || method}</Tag>;
      },
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
        <Space>
          <Select
            value={methodFilter}
            onChange={setMethodFilter}
            style={{ width: 170 }}
            size="large"
          >
            <Option value="ALL">Все способы</Option>
            <Option value="CASH">💵 Наличные</Option>
            <Option value="CARD">💳 Карта</Option>
            <Option value="TRANSFER">🏦 Перевод</Option>
          </Select>
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
            Принять платеж
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Text type="secondary">Всего собрано</Text>
            <Title level={3} style={{ margin: '6px 0', color: '#52c41a' }}>
              {totalCollected.toLocaleString()} сум
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Text type="secondary">💵 Наличными</Text>
            <Title level={4} style={{ margin: '6px 0', color: '#1677ff' }}>
              {cashCollected.toLocaleString()} сум
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Text type="secondary">💳 Картой</Text>
            <Title level={4} style={{ margin: '6px 0', color: '#722ed1' }}>
              {cardCollected.toLocaleString()} сум
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Text type="secondary">🏦 Расчетный счет</Text>
            <Title level={4} style={{ margin: '6px 0', color: '#fa8c16' }}>
              {transferCollected.toLocaleString()} сум
            </Title>
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={filteredPayments}
          rowKey="id"
          columns={columns}
          loading={isLoading}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      {/* Create Payment Modal */}
      <Modal title="💳 Принять платеж от клиента" open={isCreateOpen} onCancel={() => setIsCreateOpen(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item label="Клиент" name="clientId" rules={[{ required: true, message: 'Выберите клиента' }]}>
            <Select placeholder="Выберите клиента из базы" size="large" showSearch optionFilterProp="children">
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
              <Option value="CASH">💵 Наличные</Option>
              <Option value="CARD">💳 Банковская карта</Option>
              <Option value="TRANSFER">🏦 Перевод / Расчетный счет</Option>
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
