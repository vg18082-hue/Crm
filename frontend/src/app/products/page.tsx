'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AppstoreOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
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
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export-csv';
import { showApiError } from '@/lib/error-handler';

const { Title, Text } = Typography;
const { Option } = Select;

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products-list', search],
    queryFn: async () => {
      const res = await apiClient.get('/products', { params: { search } });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiClient.post('/products', values);
    },
    onSuccess: () => {
      message.success('Товар / услуга успешно добавлена');
      setIsCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка при добавлении товара/услуги');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      return apiClient.patch(`/products/${id}`, values);
    },
    onSuccess: () => {
      message.success('Данные товара обновлены');
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка при сохранении товара');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      message.success('Позиция удалена из каталога');
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка при удалении товара');
    },
  });

  const handleExport = () => {
    if (!products || products.length === 0) return;
    exportToCSV(
      'products_catalog_export',
      products,
      [
        { key: 'name', title: 'Название' },
        { key: 'type', title: 'Тип (PRODUCT/SERVICE)' },
        { key: 'category', title: 'Категория' },
        { key: 'sku', title: 'Артикул (SKU)' },
        { key: 'price', title: 'Продажная цена (сум)' },
        { key: 'costPrice', title: 'Себестоимость (сум)' },
        { key: 'stock', title: 'Остаток' },
        { key: 'unit', title: 'Ед. изм.' },
      ],
    );
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'PRODUCT' ? 'blue' : 'purple'}>
          {type === 'PRODUCT' ? '📦 Товар' : '⚙️ Услуга'}
        </Tag>
      ),
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => (cat ? <Tag color="cyan">{cat}</Tag> : '—'),
    },
    {
      title: 'Артикул (SKU)',
      dataIndex: 'sku',
      key: 'sku',
      render: (sku: string) => (sku ? <code>{sku}</code> : '—'),
    },
    {
      title: 'Продажная цена',
      dataIndex: 'price',
      key: 'price',
      render: (price: any) => (
        <span style={{ fontWeight: 700, color: '#52c41a' }}>
          {Number(price).toLocaleString()} сум
        </span>
      ),
      sorter: (a: any, b: any) => Number(a.price || 0) - Number(b.price || 0),
    },
    {
      title: 'Остаток на складе',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: any) =>
        record.type === 'SERVICE' ? (
          <Text type="secondary">Не ограничено</Text>
        ) : (
          <Tag color={stock > 5 ? 'green' : stock > 0 ? 'orange' : 'red'}>
            {stock} {record.unit || 'шт'}
          </Tag>
        ),
      sorter: (a: any, b: any) => Number(a.stock || 0) - Number(b.stock || 0),
    },
    {
      title: 'Действия',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingProduct(record);
              editForm.setFieldsValue({
                ...record,
                price: Number(record.price),
                costPrice: record.costPrice ? Number(record.costPrice) : undefined,
              });
            }}
          />
          <Popconfirm
            title="Удалить из каталога?"
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
            📦 Товары и Услуги
          </Title>
          <Text type="secondary">Каталог товаров, остатки на складе и прайс-лист услуг</Text>
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
            Добавить позицию
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 20 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="Поиск по названию, артикулу (SKU), категории..."
          size="large"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 450 }}
        />
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={products} rowKey="id" columns={columns} loading={isLoading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create Product Modal */}
      <Modal title="✨ Добавить позицию в каталог" open={isCreateOpen} onCancel={() => setIsCreateOpen(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item label="Название" name="name" rules={[{ required: true, message: 'Введите название' }]}>
            <Input placeholder="Серверный модуль Pro" size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Тип" name="type" initialValue="PRODUCT">
                <Select size="large">
                  <Option value="PRODUCT">📦 Товар (Физический)</Option>
                  <Option value="SERVICE">⚙️ Услуга</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Единица измерения" name="unit" initialValue="шт">
                <Input placeholder="шт, час, мес, кг" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Категория" name="category">
                <Input placeholder="IT-Оборудование / Услуги" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Артикул (SKU)" name="sku">
                <Input placeholder="SKU-10029" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Продажная цена (сум)" name="price" rules={[{ required: true, message: 'Введите цену' }]}>
                <InputNumber style={{ width: '100%' }} size="large" min={0} placeholder="350000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Себестоимость (сум)" name="costPrice">
                <InputNumber style={{ width: '100%' }} size="large" min={0} placeholder="200000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Остаток на складе" name="stock" initialValue={10}>
            <InputNumber style={{ width: '100%' }} size="large" min={0} />
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

      {/* Edit Product Modal */}
      <Modal title="✏️ Редактировать позицию" open={!!editingProduct} onCancel={() => setEditingProduct(null)} footer={null}>
        <Form
          layout="vertical"
          form={editForm}
          onFinish={(values) => updateMutation.mutate({ id: editingProduct.id, values })}
        >
          <Form.Item label="Название" name="name" rules={[{ required: true, message: 'Введите название' }]}>
            <Input size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Тип" name="type">
                <Select size="large">
                  <Option value="PRODUCT">📦 Товар</Option>
                  <Option value="SERVICE">⚙️ Услуга</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Единица измерения" name="unit">
                <Input size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Категория" name="category">
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Артикул (SKU)" name="sku">
                <Input size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Продажная цена (сум)" name="price" rules={[{ required: true, message: 'Введите цену' }]}>
                <InputNumber style={{ width: '100%' }} size="large" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Себестоимость (сум)" name="costPrice">
                <InputNumber style={{ width: '100%' }} size="large" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Остаток на складе" name="stock">
            <InputNumber style={{ width: '100%' }} size="large" min={0} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setEditingProduct(null)} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              Сохранить
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
