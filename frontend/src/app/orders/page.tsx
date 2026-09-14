'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
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
import { showApiError } from '@/lib/error-handler';

const { Title, Text } = Typography;
const { Option } = Select;

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [form] = Form.useForm();
  const items: any[] = Form.useWatch('items', form) || [];

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders-list', statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await apiClient.get('/orders', { params });
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

  const { data: products } = useQuery({
    queryKey: ['products-select'],
    queryFn: async () => {
      const res = await apiClient.get('/products');
      return res.data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data;
    },
  });

  // Calculate total amount from items
  const subtotal = items.reduce((sum: number, item: any) => {
    const qty = Number(item?.quantity) || 0;
    const price = Number(item?.price) || 0;
    const disc = Number(item?.discount) || 0;
    return sum + qty * price - disc;
  }, 0);
  const globalDiscount = Number(form.getFieldValue('discount')) || 0;
  const total = Math.max(0, subtotal - globalDiscount);

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { amount: _amount, ...rest } = values;
      return apiClient.post('/orders', {
        ...rest,
        amount: total,
      });
    },
    onSuccess: () => {
      message.success('Заказ успешно создан');
      setIsCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка создания заказа');
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
    onError: (err: any) => {
      showApiError(err, 'Ошибка обновления статуса заказа');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/orders/${id}`);
    },
    onSuccess: () => {
      message.success('Заказ удален');
      setSelectedOrder(null);
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка удаления заказа');
    },
  });

  const handleProductSelect = (productId: string, fieldName: number) => {
    const product = products?.find((p: any) => p.id === productId);
    if (!product) return;
    const current = form.getFieldValue('items') || [];
    current[fieldName] = {
      ...current[fieldName],
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      discount: 0,
    };
    form.setFieldsValue({ items: current });
  };

  const handleExport = () => {
    if (!orders || orders.length === 0) return;
    exportToCSV(
      'orders_export',
      orders.map((o: any) => ({
        orderNumber: o.orderNumber || '—',
        createdAt: dayjs(o.createdAt).format('DD.MM.YYYY'),
        clientName: o.client?.name,
        amount: o.amount,
        status: o.status,
        paymentMethod: o.paymentMethod,
        managerName: o.assignedTo?.name || '—',
        comment: o.comment || '—',
      })),
      [
        { key: 'orderNumber', title: 'Номер заказа' },
        { key: 'createdAt', title: 'Дата создания' },
        { key: 'clientName', title: 'Клиент' },
        { key: 'amount', title: 'Сумма (сум)' },
        { key: 'status', title: 'Статус' },
        { key: 'paymentMethod', title: 'Метод оплаты' },
        { key: 'managerName', title: 'Менеджер' },
        { key: 'comment', title: 'Комментарий' },
      ],
    );
  };

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
      render: (amount: any) => (
        <span style={{ fontWeight: 700, color: '#52c41a' }}>
          {Number(amount).toLocaleString()} сум
        </span>
      ),
      sorter: (a: any, b: any) => Number(a.amount || 0) - Number(b.amount || 0),
    },
    {
      title: 'Статус выполнения',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => (
        <Select
          value={status}
          size="small"
          style={{ width: 145 }}
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
      title: 'Менеджер',
      key: 'manager',
      render: (_: any, r: any) => r.assignedTo?.name || '—',
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Действия',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedOrder(record)}>
            Детали
          </Button>
          <Popconfirm
            title="Удалить заказ?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Да"
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
            🛍 Заказы
          </Title>
          <Text type="secondary">Отслеживание статусов сборки, доставки и выполнения заказов</Text>
        </div>
        <Space>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            size="large"
          >
            <Select.Option value="ALL">Все статусы</Select.Option>
            <Select.Option value="PENDING">🟡 В обработке</Select.Option>
            <Select.Option value="PROCESSING">⚡ Выполняется</Select.Option>
            <Select.Option value="SHIPPED">🚚 Отправлен</Select.Option>
            <Select.Option value="DELIVERED">🟢 Доставлен</Select.Option>
            <Select.Option value="CANCELLED">🔴 Отменен</Select.Option>
          </Select>
          <Button icon={<DownloadOutlined />} size="large" onClick={handleExport}>
            Экспорт
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{ borderRadius: 8 }}
            onClick={() => setIsCreateOpen(true)}
          >
            Создать заказ
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={orders} rowKey="id" columns={columns} loading={isLoading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create Order Modal */}
      <Modal
        title="🛍 Новый заказ"
        open={isCreateOpen}
        onCancel={() => { setIsCreateOpen(false); form.resetFields(); }}
        footer={null}
        width={720}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={(values) => createMutation.mutate(values)}
          initialValues={{ items: [{ quantity: 1, price: 0, discount: 0 }], paymentMethod: 'CASH', status: 'PENDING' }}
        >
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item label="Клиент" name="clientId" rules={[{ required: true, message: 'Выберите клиента' }]}>
                <Select placeholder="Выберите клиента" size="large" showSearch optionFilterProp="children">
                  {clients?.map((c: any) => (
                    <Option key={c.id} value={c.id}>
                      {c.name} ({c.phone || 'Без телефона'})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label="Номер заказа" name="orderNumber">
                <Input placeholder="ORD-2026-001" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ответственный сотрудник" name="assignedToId">
                <Select placeholder="Выберите сотрудника" size="large" allowClear>
                  {users?.map((u: any) => (
                    <Option key={u.id} value={u.id}>
                      {u.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Способ оплаты" name="paymentMethod">
                <Select size="large">
                  <Option value="CASH">💵 Наличные</Option>
                  <Option value="CARD">💳 Банковская карта</Option>
                  <Option value="TRANSFER">🏦 Банковский перевод</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ fontSize: 13, marginBottom: 8 }}>
            📦 Состав заказа
          </Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 10, background: '#fafafa', borderRadius: 8 }}
                    extra={
                      fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        />
                      )
                    }
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'productId']}
                      label="Выбрать из каталога"
                      style={{ marginBottom: 8 }}
                    >
                      <Select
                        placeholder="Товар из каталога"
                        allowClear
                        showSearch
                        optionFilterProp="children"
                        onChange={(val) => handleProductSelect(val, name)}
                      >
                        {products?.map((p: any) => (
                          <Option key={p.id} value={p.id}>
                            {p.name} ({Number(p.price).toLocaleString()} сум)
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      label="Наименование"
                      rules={[{ required: true, message: 'Укажите название' }]}
                      style={{ marginBottom: 8 }}
                    >
                      <Input placeholder="Название товара/услуги" />
                    </Form.Item>

                    <Space style={{ width: '100%' }} styles={{ item: { flex: 1 } }}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label="Кол-во"
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'price']}
                        label="Цена (сум)"
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Space>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add({ quantity: 1, price: 0, discount: 0 })}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 16 }}
                >
                  Добавить позицию в заказ
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item label="Комментарий / Инструкция к доставке" name="comment">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">Итоговая стоимость заказа:</Text>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#389e0d' }}>
                {total.toLocaleString()} сум
              </div>
            </div>
          </Card>

          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => { setIsCreateOpen(false); form.resetFields(); }} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Создать заказ
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Order Detail Drawer */}
      <Drawer
        title="🛍 Карточка заказа"
        width={560}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <Text type="secondary">Заказ:</Text>
                <Title level={4} style={{ margin: 0 }}>{selectedOrder.orderNumber || 'Без номера'}</Title>
              </div>
              <Tag color="purple" style={{ fontSize: 13, padding: '4px 8px' }}>
                {selectedOrder.status}
              </Tag>
            </div>

            <p><strong>Клиент:</strong> {selectedOrder.client?.name}</p>
            <p><strong>Сумма заказа:</strong> <Text strong style={{ color: '#52c41a', fontSize: 16 }}>{Number(selectedOrder.amount).toLocaleString()} сум</Text></p>
            <p><strong>Метод оплаты:</strong> {selectedOrder.paymentMethod}</p>
            <p><strong>Менеджер:</strong> {selectedOrder.assignedTo?.name || '—'}</p>
            <p><strong>Дата создания:</strong> {dayjs(selectedOrder.createdAt).format('DD.MM.YYYY HH:mm')}</p>
            {selectedOrder.comment && <p><strong>Комментарий:</strong> {selectedOrder.comment}</p>}

            {selectedOrder.orderItems?.length > 0 && (
              <>
                <Divider>Позиции в заказе</Divider>
                <Table
                  dataSource={selectedOrder.orderItems}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Товар', dataIndex: 'name' },
                    { title: 'Кол-во', dataIndex: 'quantity' },
                    { title: 'Цена', dataIndex: 'price', render: (p) => `${Number(p).toLocaleString()} сум` },
                    { title: 'Итого', dataIndex: 'total', render: (t) => `${Number(t).toLocaleString()} сум` },
                  ]}
                />
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
