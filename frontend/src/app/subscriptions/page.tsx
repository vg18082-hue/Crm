'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api-client';

const { Title, Text } = Typography;
const { Option } = Select;

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [paySub, setPaySub] = useState<any>(null);
  const [form] = Form.useForm();
  const [payForm] = Form.useForm();

  // Fetch Dashboard and Subscriptions list
  const { data: dashData, isLoading: isDashLoading } = useQuery({
    queryKey: ['subscriptions-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/subscriptions');
      return res.data;
    },
  });

  const { data: clientsList } = useQuery({
    queryKey: ['clients-list-select'],
    queryFn: async () => {
      const res = await apiClient.get('/clients');
      return res.data;
    },
  });

  // Create Subscription mutation
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        nextPaymentDate: values.nextPaymentDate ? values.nextPaymentDate.toISOString() : undefined,
      };
      return apiClient.post('/subscriptions', payload);
    },
    onSuccess: () => {
      message.success('Абонентская подписка успешно создана');
      setIsCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['subscriptions-dashboard'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка создания подписки');
    },
  });

  // Pay Subscription mutation (Auto-renewal)
  const payMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      return apiClient.post(`/subscriptions/${id}/pay`, values);
    },
    onSuccess: () => {
      message.success('Оплата зафиксирована! Дата следующего платежа успешно продлена на 1 месяц.');
      setPaySub(null);
      payForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['subscriptions-dashboard'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка проведения оплаты');
    },
  });

  if (isDashLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" tip="Загрузка подписок и абонентских платежей..." />
      </div>
    );
  }

  const kpi = dashData?.kpi || {};
  const subscriptions = dashData?.subscriptions || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Tag color="success">🟢 Активна</Tag>;
      case 'DUE_SOON':
        return <Tag color="warning">🟡 Скоро оплата</Tag>;
      case 'OVERDUE':
        return <Tag color="error">🔴 Просрочена</Tag>;
      case 'PAUSED':
        return <Tag color="default">⏸ Приостановлена</Tag>;
      case 'CANCELLED':
        return <Tag color="magenta">❌ Отменена</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Клиент',
      dataIndex: ['client', 'name'],
      key: 'clientName',
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text || 'Клиент'}</span>,
    },
    {
      title: 'Тариф',
      dataIndex: 'planName',
      key: 'planName',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Сумма в месяц',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: any) => (
        <span style={{ fontWeight: 700 }}>
          {Number(val).toLocaleString()} сум
        </span>
      ),
    },
    {
      title: 'Следующая оплата',
      dataIndex: 'nextPaymentDate',
      key: 'nextPaymentDate',
      render: (date: string) => (
        <span style={{ fontWeight: 500 }}>
          {dayjs(date).format('DD.MM.YYYY')}
        </span>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: 'Действия',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          icon={<DollarOutlined />}
          size="small"
          style={{ borderRadius: 6 }}
          onClick={() => {
            setPaySub(record);
            payForm.setFieldsValue({ amount: Number(record.amount), paymentMethod: 'TRANSFER' });
          }}
        >
          Принять оплату (Продлить)
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            🚀 Абонентские платежи и Подписки
          </Title>
          <Text type="secondary">Учет регулярной оплаты клиентов за CRM, серверы и сопровождение</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ borderRadius: 8 }}
          onClick={() => setIsCreateOpen(true)}
        >
          Создать подписку
        </Button>
      </div>

      {/* KPI Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary">Активные подписки</Text>
                <Title level={3} style={{ margin: '4px 0 0 0', color: '#52c41a' }}>
                  {kpi.activeCount || 0}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Сумма: {Number(kpi.activeAmountSum || 0).toLocaleString()} сум
                </Text>
              </div>
              <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary">Скоро оплата (7 дней)</Text>
                <Title level={3} style={{ margin: '4px 0 0 0', color: '#faad14' }}>
                  {kpi.dueSoonCount || 0}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Сумма: {Number(kpi.dueSoonAmountSum || 0).toLocaleString()} сум
                </Text>
              </div>
              <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14' }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary">Просроченные подписки</Text>
                <Title level={3} style={{ margin: '4px 0 0 0', color: '#ff4d4f' }}>
                  {kpi.overdueCount || 0}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Сумма: {Number(kpi.overdueAmountSum || 0).toLocaleString()} сум
                </Text>
              </div>
              <ExclamationCircleOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary">Собрано за месяц</Text>
                <Title level={3} style={{ margin: '4px 0 0 0', color: '#1677ff' }}>
                  {Number(kpi.receivedThisMonth || 0).toLocaleString()} сум
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Из ожидаемых {Number(kpi.expectedThisMonthSum || 0).toLocaleString()} сум
                </Text>
              </div>
              <RocketOutlined style={{ fontSize: 32, color: '#1677ff' }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Subscriptions Table */}
      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={subscriptions} rowKey="id" columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create Subscription Modal */}
      <Modal
        title="✨ Создать регулярную подписку"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item label="Клиент" name="clientId" rules={[{ required: true, message: 'Выберите клиента' }]}>
            <Select placeholder="Выберите клиента из базы" size="large">
              {clientsList?.map((c: any) => (
                <Option key={c.id} value={c.id}>
                  {c.name} ({c.phone || c.email || 'Без телефона'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Название тарифа"
            name="planName"
            rules={[{ required: true, message: 'Введите название тарифа' }]}
          >
            <Input placeholder="Например: Business 300K" size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Сумма (сум)"
                name="amount"
                rules={[{ required: true, message: 'Введите сумму' }]}
              >
                <InputNumber style={{ width: '100%' }} size="large" min={0} step={50000} placeholder="300000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Период (в месяцах)" name="periodMonths" initialValue={1}>
                <InputNumber style={{ width: '100%' }} size="large" min={1} max={12} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Дата первого / следующего платежа"
            name="nextPaymentDate"
            rules={[{ required: true, message: 'Выберите дату' }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" format="DD.MM.YYYY" />
          </Form.Item>

          <Form.Item label="Способ оплаты" name="paymentMethod" initialValue="TRANSFER">
            <Select size="large">
              <Option value="CASH">Наличные</Option>
              <Option value="CARD">Карта</Option>
              <Option value="TRANSFER">Перевод / Расчетный счет</Option>
            </Select>
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Button onClick={() => setIsCreateOpen(false)} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Создать подписку
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Pay Subscription Modal */}
      <Modal
        title="💳 Фиксация оплаты и автопродление"
        open={!!paySub}
        onCancel={() => setPaySub(null)}
        footer={null}
      >
        {paySub && (
          <div>
            <Alert
              message={`Принятие оплаты от клиента ${paySub.client?.name}`}
              description={`При фиксации оплаты статус изменится на АКТИВНА, а дата следующего платежа автоматически передвинется на +1 месяц (до ${dayjs(paySub.nextPaymentDate).add(1, 'month').format('DD.MM.YYYY')}).`}
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Form layout="vertical" form={payForm} onFinish={(values) => payMutation.mutate({ id: paySub.id, values })}>
              <Form.Item label="Сумма оплаты (сум)" name="amount" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} size="large" />
              </Form.Item>

              <Form.Item label="Способ оплаты" name="paymentMethod" rules={[{ required: true }]}>
                <Select size="large">
                  <Option value="CASH">Наличные</Option>
                  <Option value="CARD">Банковская карта</Option>
                  <Option value="TRANSFER">Перевод на расчетный счет</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Комментарий к платежу" name="comment">
                <Input.TextArea placeholder="Оплата за текущий месяц" rows={2} />
              </Form.Item>

              <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Button onClick={() => setPaySub(null)} style={{ marginRight: 8 }}>
                  Отмена
                </Button>
                <Button type="primary" htmlType="submit" loading={payMutation.isPending}>
                  Подтвердить оплату и Продлить
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
