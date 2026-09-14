'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AppstoreOutlined,
  DownloadOutlined,
  FundProjectionScreenOutlined,
  LineChartOutlined,
  RocketOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export-csv';

const { Title, Text, Paragraph } = Typography;

const FUNNEL_COLORS = ['#1677ff', '#faad14', '#722ed1', '#52c41a', '#ff4d4f'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('funnel');

  // Funnel Report Query
  const { data: funnelData, isLoading: isFunnelLoading } = useQuery({
    queryKey: ['reports-funnel'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/reports/funnel');
      return res.data;
    },
  });

  // Managers Report Query
  const { data: managersData, isLoading: isManagersLoading } = useQuery({
    queryKey: ['reports-managers'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/reports/managers');
      return res.data;
    },
  });

  // Products Report Query
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['reports-products'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/reports/products');
      return res.data;
    },
  });

  // Subscriptions / MRR Query
  const { data: subsData, isLoading: isSubsLoading } = useQuery({
    queryKey: ['reports-subscriptions'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/subscriptions');
      return res.data;
    },
  });

  const exportManagers = () => {
    if (!managersData) return;
    exportToCSV(
      'managers_kpi_report',
      managersData,
      [
        { key: 'name', title: 'Менеджер' },
        { key: 'email', title: 'Email' },
        { key: 'role', title: 'Роль' },
        { key: 'totalLeads', title: 'Лидов всего' },
        { key: 'wonLeads', title: 'Успешных лидов' },
        { key: 'leadConversion', title: 'Конверсия лидов (%)' },
        { key: 'salesCount', title: 'Кол-во продаж' },
        { key: 'totalRevenue', title: 'Сумма продаж (сум)' },
        { key: 'avgDealSize', title: 'Средний чек (сум)' },
        { key: 'completedTasks', title: 'Выполнено задач' },
      ],
    );
  };

  const exportProducts = () => {
    if (!productsData) return;
    exportToCSV(
      'products_margin_report',
      productsData,
      [
        { key: 'name', title: 'Товар / Услуга' },
        { key: 'quantity', title: 'Продано (шт)' },
        { key: 'revenue', title: 'Выручка (сум)' },
        { key: 'cost', title: 'Себестоимость (сум)' },
        { key: 'margin', title: 'Маржинальная прибыль (сум)' },
        { key: 'marginPercent', title: 'Маржинальность (%)' },
      ],
    );
  };

  const managerColumns = [
    {
      title: 'Менеджер',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.email}
          </Text>
        </div>
      ),
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: 'Лиды (Всего / Выиграно)',
      key: 'leads',
      render: (_: any, r: any) => (
        <div>
          <span>
            {r.totalLeads} / <Text strong style={{ color: '#52c41a' }}>{r.wonLeads}</Text>
          </span>
          <Progress
            percent={r.leadConversion}
            size="small"
            format={(pct) => `${pct}%`}
            strokeColor="#52c41a"
          />
        </div>
      ),
    },
    {
      title: 'Продажи',
      dataIndex: 'salesCount',
      key: 'salesCount',
      render: (count: number) => <Text strong>{count} сделок</Text>,
    },
    {
      title: 'Выручка',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      render: (val: number) => (
        <Text strong style={{ color: '#52c41a', fontSize: 15 }}>
          {Number(val).toLocaleString()} сум
        </Text>
      ),
      sorter: (a: any, b: any) => a.totalRevenue - b.totalRevenue,
    },
    {
      title: 'Средний чек',
      dataIndex: 'avgDealSize',
      key: 'avgDealSize',
      render: (val: number) => <span>{Number(val).toLocaleString()} сум</span>,
    },
    {
      title: 'Задачи',
      key: 'tasks',
      render: (_: any, r: any) => (
        <Tag color="green">
          {r.completedTasks} / {r.tasksCount} выполнено
        </Tag>
      ),
    },
  ];

  const productColumns = [
    {
      title: 'Товар / Услуга',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Продано (шт)',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty: number) => <Text strong>{qty} шт</Text>,
      sorter: (a: any, b: any) => a.quantity - b.quantity,
    },
    {
      title: 'Выручка',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (rev: number) => (
        <Text strong style={{ color: '#1677ff' }}>
          {Number(rev).toLocaleString()} сум
        </Text>
      ),
      sorter: (a: any, b: any) => a.revenue - b.revenue,
    },
    {
      title: 'Себестоимость',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => <span>{Number(cost).toLocaleString()} сум</span>,
    },
    {
      title: 'Маржинальная прибыль',
      dataIndex: 'margin',
      key: 'margin',
      render: (margin: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          +{Number(margin).toLocaleString()} сум
        </Text>
      ),
      sorter: (a: any, b: any) => a.margin - b.margin,
    },
    {
      title: 'Маржинальность (%)',
      dataIndex: 'marginPercent',
      key: 'marginPercent',
      render: (pct: number) => (
        <Progress percent={pct} size="small" strokeColor={pct > 30 ? '#52c41a' : '#faad14'} />
      ),
      sorter: (a: any, b: any) => a.marginPercent - b.marginPercent,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            📊 Аналитические Отчеты & KPI
          </Title>
          <Text type="secondary">
            Глубокая аналитика воронки продаж, эффективности команды, MRR подписок и маржинальности товаров
          </Text>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'funnel',
            label: (
              <Space>
                <FundProjectionScreenOutlined />
                <span>Воронка Продаж</span>
              </Space>
            ),
            children: isFunnelLoading ? (
              <Spin tip="Загрузка воронки..." />
            ) : (
              <div>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={14}>
                    <Card title="Этапы Воронки Лидов" bordered={false}>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                          data={funnelData?.funnel || []}
                          layout="vertical"
                          margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="label" type="category" width={110} />
                          <RechartsTooltip
                            formatter={(value: any, name: string) => [
                              `${value} лидов`,
                              'Количество',
                            ]}
                          />
                          <Bar dataKey="count" fill="#1677ff" radius={[0, 8, 8, 0]}>
                            {(funnelData?.funnel || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>

                  <Col xs={24} lg={10}>
                    <Card title="Конверсия по этапам" bordered={false}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {(funnelData?.funnel || []).map((st: any, idx: number) => (
                          <div key={st.stage}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text strong>{st.label}</Text>
                              <Space>
                                <Tag color={FUNNEL_COLORS[idx % FUNNEL_COLORS.length]}>
                                  {st.count} лидов ({st.percentage}%)
                                </Tag>
                                <Text type="secondary">
                                  {Number(st.amount).toLocaleString()} сум
                                </Text>
                              </Space>
                            </div>
                            <Progress
                              percent={st.percentage}
                              strokeColor={FUNNEL_COLORS[idx % FUNNEL_COLORS.length]}
                              showInfo={false}
                            />
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            ),
          },
          {
            key: 'managers',
            label: (
              <Space>
                <TeamOutlined />
                <span>Эффективность Менеджеров</span>
              </Space>
            ),
            children: isManagersLoading ? (
              <Spin tip="Загрузка отчета по менеджерам..." />
            ) : (
              <Card
                title="KPI и Результативность Команды"
                bordered={false}
                extra={
                  <Button icon={<DownloadOutlined />} onClick={exportManagers}>
                    Экспорт в CSV
                  </Button>
                }
              >
                <Table
                  dataSource={managersData || []}
                  columns={managerColumns}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'products',
            label: (
              <Space>
                <AppstoreOutlined />
                <span>Маржинальность Товаров</span>
              </Space>
            ),
            children: isProductsLoading ? (
              <Spin tip="Загрузка маржинальности..." />
            ) : (
              <Card
                title="Рейтинг продаж и маржинальность"
                bordered={false}
                extra={
                  <Button icon={<DownloadOutlined />} onClick={exportProducts}>
                    Экспорт в CSV
                  </Button>
                }
              >
                <Table
                  dataSource={productsData || []}
                  columns={productColumns}
                  rowKey="name"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'mrr',
            label: (
              <Space>
                <RocketOutlined />
                <span>MRR & Абонентская база</span>
              </Space>
            ),
            children: isSubsLoading ? (
              <Spin tip="Загрузка данных подписок..." />
            ) : (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                  <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                      <Text type="secondary">Активных подписок (Клиентов)</Text>
                      <Title level={2} style={{ margin: '8px 0', color: '#1677ff' }}>
                        {subsData?.kpi?.activeCount || 0}
                      </Title>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                      <Text type="secondary">Ежемесячный доход (MRR)</Text>
                      <Title level={2} style={{ margin: '8px 0', color: '#52c41a' }}>
                        {Number(subsData?.kpi?.activeAmountSum || 0).toLocaleString()} сум
                      </Title>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                      <Text type="secondary">Скоро к оплате (в теч. 7 дней)</Text>
                      <Title level={2} style={{ margin: '8px 0', color: '#faad14' }}>
                        {Number(subsData?.kpi?.dueSoonAmountSum || 0).toLocaleString()} сум
                      </Title>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                      <Text type="secondary">Просрочено</Text>
                      <Title level={2} style={{ margin: '8px 0', color: '#ff4d4f' }}>
                        {Number(subsData?.kpi?.overdueAmountSum || 0).toLocaleString()} сум
                      </Title>
                    </Card>
                  </Col>
                </Row>

                <Card title="Распределение выручки по тарифам" bordered={false}>
                  <Row gutter={[16, 16]}>
                    {(subsData?.revenueByPlan || []).map((plan: any) => (
                      <Col xs={24} sm={12} md={8} key={plan.planName}>
                        <Card type="inner" title={plan.planName}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">Количество клиентов:</Text>
                            <Text strong>{plan.subscriptionsCount}</Text>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                            <Text type="secondary">Выручка:</Text>
                            <Text strong style={{ color: '#52c41a' }}>
                              {Number(plan.totalAmount).toLocaleString()} сум
                            </Text>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
