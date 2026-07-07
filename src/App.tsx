import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type LinkStatus = '使用中' | '已禁用'
type PageMode = 'list' | 'create' | 'detail'

type RechargeLink = {
  id: string
  rechargeUrl: string
  recordUrl: string
  status: LinkStatus
  createdAt: string
  lastUsed: string
  orderCount: number
}

type CreateOrder = {
  id: string
  target: string
  sids: string[]
  country: string
  creator: string
  createdAt: string
  links: RechargeLink[]
}

const initialOrders: CreateOrder[] = [
  {
    id: 'FORM-240701-003',
    target: '越南代理 A 组',
    sids: ['8301124', '8301188', '8301299'],
    country: 'VN',
    creator: 'Mia',
    createdAt: '2026-07-01 13:42',
    links: [
      {
        id: 'NS-240701-018',
        rechargeUrl: 'https://pay.example.com/nonstandard/VN/x7Kp19',
        recordUrl: 'https://ops.example.com/recharge/records/NS-240701-018',
        status: '使用中',
        createdAt: '2026-07-01 13:42',
        lastUsed: '6 分钟前',
        orderCount: 24,
      },
      {
        id: 'NS-240701-019',
        rechargeUrl: 'https://pay.example.com/nonstandard/VN/f2Lx80',
        recordUrl: 'https://ops.example.com/recharge/records/NS-240701-019',
        status: '使用中',
        createdAt: '2026-07-01 13:45',
        lastUsed: '22 分钟前',
        orderCount: 8,
      },
    ],
  },
  {
    id: 'FORM-240701-002',
    target: '巴西活动白名单',
    sids: ['7620100', '7620123'],
    country: 'BR',
    creator: 'Kai',
    createdAt: '2026-07-01 11:18',
    links: [
      {
        id: 'NS-240701-014',
        rechargeUrl: 'https://pay.example.com/nonstandard/BR/N2vma8',
        recordUrl: 'https://ops.example.com/recharge/records/NS-240701-014',
        status: '使用中',
        createdAt: '2026-07-01 11:18',
        lastUsed: '31 分钟前',
        orderCount: 13,
      },
    ],
  },
  {
    id: 'FORM-240630-009',
    target: '测试回归账号',
    sids: ['9000101'],
    country: 'ID',
    creator: 'Chen',
    createdAt: '2026-06-30 20:07',
    links: [
      {
        id: 'NS-240630-221',
        rechargeUrl: 'https://pay.example.com/nonstandard/ID/Qc443e',
        recordUrl: 'https://ops.example.com/recharge/records/NS-240630-221',
        status: '已禁用',
        createdAt: '2026-06-30 20:07',
        lastUsed: '昨天',
        orderCount: 2,
      },
    ],
  },
]

const countryOptions = ['VN', 'BR', 'ID', 'TH', 'PH', 'MY', 'MX', 'TR']

function normalizeSids(raw: string) {
  return raw
    .split(/[,，\s]+/)
    .map((sid) => sid.trim())
    .filter(Boolean)
}

function makeToken() {
  return Math.random().toString(36).slice(2, 8)
}

function App() {
  const [orders, setOrders] = useState(initialOrders)
  const [pageMode, setPageMode] = useState<PageMode>('list')
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrders[0]?.id ?? '')
  const [target, setTarget] = useState('')
  const [sidInput, setSidInput] = useState('')
  const [country, setCountry] = useState('ID')
  const [quantity, setQuantity] = useState(1)
  const [appendQuantity, setAppendQuantity] = useState(1)
  const [editingSids, setEditingSids] = useState(false)
  const [editSidInput, setEditSidInput] = useState('')
  const [filter, setFilter] = useState<'全部' | LinkStatus>('全部')
  const [copied, setCopied] = useState('')

  const sidPreview = useMemo(() => normalizeSids(sidInput), [sidInput])
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? orders[0]
  const allLinks = orders.flatMap((order) => order.links)
  const activeCount = allLinks.filter((link) => link.status === '使用中').length
  const disabledCount = allLinks.length - activeCount
  const totalOrders = allLinks.reduce((sum, link) => sum + link.orderCount, 0)
  const filteredOrders = orders
    .map((order) => ({
      ...order,
      links: order.links.filter((link) => filter === '全部' || link.status === filter),
    }))
    .filter((order) => order.links.length > 0)

  function makeStamp() {
    return new Date()
      .toLocaleString('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(',', '')
  }

  function createLinkBatch(countryCode: string, count: number, startFrom: number, stamp: string) {
    return Array.from({ length: count }, (_, index) => {
      const sequence = String(startFrom + index).padStart(3, '0')
      const id = `NS-260701-${sequence}`

      return {
        id,
        rechargeUrl: `https://pay.example.com/nonstandard/${countryCode}/${makeToken()}`,
        recordUrl: `https://ops.example.com/recharge/records/${id}`,
        status: '使用中' as LinkStatus,
        createdAt: stamp,
        lastUsed: '未使用',
        orderCount: 0,
      }
    })
  }

  function startCreate() {
    setTarget('')
    setSidInput('')
    setCountry('ID')
    setQuantity(1)
    setPageMode('create')
  }

  function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const sids = normalizeSids(sidInput)
    if (!target.trim() || sids.length === 0 || !country.trim()) return

    const stamp = makeStamp()
    const orderId = `FORM-260701-${String(orders.length + 1).padStart(3, '0')}`
    const nextOrder: CreateOrder = {
      id: orderId,
      target: target.trim(),
      sids,
      country: country.trim().toUpperCase(),
      creator: '当前用户',
      createdAt: stamp,
      links: createLinkBatch(country.trim().toUpperCase(), quantity, allLinks.length + 1, stamp),
    }

    setOrders((current) => [nextOrder, ...current])
    setSelectedOrderId(orderId)
    setAppendQuantity(1)
    setFilter('全部')
    setPageMode('detail')
  }

  function openDetail(orderId: string) {
    const order = orders.find((item) => item.id === orderId)
    setSelectedOrderId(orderId)
    setAppendQuantity(1)
    setEditingSids(false)
    setEditSidInput(order?.sids.join(', ') ?? '')
    setPageMode('detail')
  }

  function startEditSids() {
    if (!selectedOrder) return
    setEditSidInput(selectedOrder.sids.join(', '))
    setEditingSids(true)
  }

  function saveSids(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrder) return

    const nextSids = normalizeSids(editSidInput)
    if (nextSids.length === 0) return

    setOrders((current) =>
      current.map((order) =>
        order.id === selectedOrder.id ? { ...order, sids: nextSids } : order,
      ),
    )
    setEditingSids(false)
  }

  function appendLinks(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrder) return

    const stamp = makeStamp()
    const nextLinks = createLinkBatch(
      selectedOrder.country,
      appendQuantity,
      allLinks.length + 1,
      stamp,
    )

    setOrders((current) =>
      current.map((order) =>
        order.id === selectedOrder.id ? { ...order, links: [...nextLinks, ...order.links] } : order,
      ),
    )
  }

  function toggleStatus(linkId: string) {
    setOrders((current) =>
      current.map((order) => ({
        ...order,
        links: order.links.map((link) =>
          link.id === linkId
            ? { ...link, status: link.status === '使用中' ? '已禁用' : '使用中' }
            : link,
        ),
      })),
    )
  }

  async function copyText(text: string, label: string) {
    await navigator.clipboard?.writeText(text)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1600)
  }

  function renderLinkTable(order: CreateOrder, compact = false) {
    return (
      <div className={compact ? 'nestedLinkTable compactTable' : 'nestedLinkTable'}>
        <div className="linkTableHead">
          <span>链接编号</span>
          <span>充值链接</span>
          <span>流水记录</span>
          <span>状态</span>
          <span>操作</span>
        </div>
        {order.links.map((link) => (
          <article className="linkItemRow" key={link.id}>
            <div>
              <code>{link.id}</code>
              <small>{link.createdAt}</small>
            </div>
            <div className="urlCell">
              <a href={link.rechargeUrl} target="_blank">
                {link.rechargeUrl}
              </a>
              <button type="button" onClick={() => copyText(link.rechargeUrl, `${link.id} 充值链接`)}>
                复制
              </button>
            </div>
            <div className="urlCell">
              <a href={link.recordUrl} target="_blank">
                {link.recordUrl}
              </a>
              <button type="button" onClick={() => copyText(link.recordUrl, `${link.id} 流水链接`)}>
                复制
              </button>
              <small>{link.orderCount} 笔 · {link.lastUsed}</small>
            </div>
            <div>
              <span className={`status ${link.status === '使用中' ? 'activeStatus' : ''}`}>
                {link.status}
              </span>
            </div>
            <div>
              <button type="button" className="statusButton" onClick={() => toggleStatus(link.id)}>
                {link.status === '使用中' ? '禁用' : '启用'}
              </button>
            </div>
          </article>
        ))}
      </div>
    )
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">N</span>
          <div>
            <strong>运营管理台</strong>
            <span>Payment Ops</span>
          </div>
        </div>

        <nav className="menu" aria-label="主菜单">
          <button type="button">概览</button>
          <button type="button">用户</button>
          <button type="button" className="active">
            非标
          </button>
          <button type="button">订单</button>
          <button type="button">审计</button>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">
              菜单目录 / 非标
              {pageMode === 'create' ? ' / 新增创建单' : pageMode === 'detail' ? ' / 创建单详情' : ''}
            </span>
            <h1>
              {pageMode === 'create'
                ? '新增非标充值创建单'
                : pageMode === 'detail'
                  ? '创建单详情'
                  : '非标充值链接管理'}
            </h1>
          </div>
          <div className="topActions">
            {pageMode === 'list' ? (
              <>
                <button type="button" className="ghostButton">
                  导出
                </button>
                <button type="button" className="primaryButton" onClick={startCreate}>
                  新增
                </button>
              </>
            ) : (
              <>
                <button type="button" className="ghostButton" onClick={() => setPageMode('list')}>
                  返回列表
                </button>
                {pageMode === 'create' && (
                  <button type="submit" form="createForm" className="primaryButton">
                    生成链接
                  </button>
                )}
              </>
            )}
          </div>
        </header>

        <section className="metrics" aria-label="链接概况">
          <div>
            <span>创建单数</span>
            <strong>{orders.length}</strong>
          </div>
          <div>
            <span>链接总数</span>
            <strong>{allLinks.length}</strong>
          </div>
          <div>
            <span>使用中 / 已禁用</span>
            <strong>
              {activeCount} / {disabledCount}
            </strong>
          </div>
          <div>
            <span>流水笔数</span>
            <strong>{totalOrders}</strong>
          </div>
        </section>

        {pageMode === 'create' && (
          <section className="createFlow">
            <form id="createForm" className="createPanel" onSubmit={createOrder}>
              <div className="panelHeader">
                <div>
                  <h2>新增创建单</h2>
                  <p>同一个创建单下可以一次生成多条充值链接。</p>
                </div>
                <span className="badge">默认使用中</span>
              </div>

              <label>
                使用对象
                <input
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  placeholder="例如：越南代理 A 组"
                  required
                />
              </label>

              <label>
                账户 SID
                <textarea
                  value={sidInput}
                  onChange={(event) => setSidInput(event.target.value)}
                  placeholder="多个 SID 用逗号分开"
                  rows={4}
                  required
                />
              </label>

              <div className="sidPreview">
                {sidPreview.length ? (
                  sidPreview.map((sid) => <span key={sid}>{sid}</span>)
                ) : (
                  <em>输入后会在这里预览 SID</em>
                )}
              </div>

              <div className="formGrid">
                <label>
                  指定充值商品国家
                  <select value={country} onChange={(event) => setCountry(event.target.value)}>
                    {countryOptions.map((item) => (
                      <option key={item} value={item}>
                        {item} 国家码
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  生成数量
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
                  />
                </label>
              </div>

              <div className="formActions">
                <button type="button" className="ghostButton" onClick={() => setPageMode('list')}>
                  取消
                </button>
                <button type="submit" className="wideButton">
                  创建单并生成链接
                </button>
              </div>
            </form>

            <aside className="previewPanel">
              <div className="panelHeader">
                <div>
                  <h2>生成预览</h2>
                  <p>创建后会进入这个创建单详情。</p>
                </div>
              </div>
              <div className="previewCard">
                <span className="status activeStatus">使用中</span>
                <strong>{target || '未填写使用对象'}</strong>
                <dl>
                  <div>
                    <dt>国家</dt>
                    <dd>{country} 国家码</dd>
                  </div>
                  <div>
                    <dt>账户 SID</dt>
                    <dd>{sidPreview.length} 个</dd>
                  </div>
                  <div>
                    <dt>本次生成</dt>
                    <dd>{quantity} 条链接</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </section>
        )}

        {pageMode === 'detail' && selectedOrder && (
          <section className="detailLayout">
            <section className="orderPanel">
              <div className="panelHeader">
                <div>
                  <h2>{selectedOrder.target}</h2>
                  <p>
                    {selectedOrder.id} · 创建人 {selectedOrder.creator} · {selectedOrder.createdAt}
                  </p>
                </div>
                <span className="badge">{selectedOrder.links.length} 条链接</span>
              </div>

              <div className="orderSummary">
                <div>
                  <div className="summaryTitle">
                    <span>账户 SID</span>
                    {!editingSids && (
                      <button type="button" onClick={startEditSids}>
                        编辑 SID
                      </button>
                    )}
                  </div>
                  {editingSids ? (
                    <form className="sidEditForm" onSubmit={saveSids}>
                      <textarea
                        value={editSidInput}
                        onChange={(event) => setEditSidInput(event.target.value)}
                        rows={3}
                        required
                      />
                      <div className="inlineActions">
                        <button type="button" className="ghostButton" onClick={() => setEditingSids(false)}>
                          取消
                        </button>
                        <button type="submit" className="primaryButton">
                          保存 SID
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="sidLine">
                      {selectedOrder.sids.map((sid) => (
                        <span key={sid}>{sid}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <span>指定国家</span>
                  <strong>{selectedOrder.country}</strong>
                </div>
              </div>

              {renderLinkTable(selectedOrder)}
            </section>

            <aside className="appendPanel">
              <div className="panelHeader">
                <div>
                  <h2>继续生成链接</h2>
                  <p>复用当前创建单的对象、SID 和国家码。</p>
                </div>
              </div>
              <form onSubmit={appendLinks}>
                <label>
                  本次新增数量
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={appendQuantity}
                    onChange={(event) => setAppendQuantity(Math.max(1, Number(event.target.value)))}
                  />
                </label>
                <button type="submit" className="wideButton">
                  在此创建单中继续生成
                </button>
              </form>
            </aside>
          </section>
        )}

        {pageMode === 'list' && (
          <section className="listPanel">
            <div className="panelHeader">
              <div>
                <h2>非标渠道列表</h2>
                <p>每个创建单集中管理它生成的多条充值链接。</p>
              </div>
              <div className="segmented" aria-label="状态筛选">
                {(['全部', '使用中', '已禁用'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={filter === item ? 'selected' : ''}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="orderTable">
              <div className="orderTableHead">
                <span>使用对象</span>
                <span>账户 SID</span>
                <span>国家</span>
                <span>链接数</span>
                <span>充值链接</span>
                <span>流水记录</span>
                <span>状态</span>
                <span>操作</span>
              </div>

              {filteredOrders.map((order) => {
                const firstLink = order.links[0]
                const activeLinks = order.links.filter((link) => link.status === '使用中').length

                return (
                  <article className="orderTableRow" key={order.id}>
                    <div className="targetCell">
                      <strong>{order.target}</strong>
                      <code>{order.id}</code>
                      <small>
                        创建人 {order.creator} · {order.createdAt}
                      </small>
                    </div>

                    <div className="sidLine">
                      {order.sids.map((sid) => (
                        <span key={sid}>{sid}</span>
                      ))}
                    </div>

                    <div className="countryCell">{order.country}</div>
                    <div className="countCell">
                      <strong>{order.links.length}</strong>
                      <small>条链接</small>
                    </div>

                    <div className="urlCell">
                      <a href={firstLink.rechargeUrl} target="_blank">
                        {firstLink.rechargeUrl}
                      </a>
                      <button
                        type="button"
                        onClick={() => copyText(firstLink.rechargeUrl, `${firstLink.id} 充值链接`)}
                      >
                        复制
                      </button>
                      {order.links.length > 1 && <small>另有 {order.links.length - 1} 条</small>}
                    </div>

                    <div className="urlCell">
                      <a href={firstLink.recordUrl} target="_blank">
                        {firstLink.recordUrl}
                      </a>
                      <button
                        type="button"
                        onClick={() => copyText(firstLink.recordUrl, `${firstLink.id} 流水链接`)}
                      >
                        复制
                      </button>
                      <small>
                        {firstLink.orderCount} 笔 · {firstLink.lastUsed}
                      </small>
                    </div>

                    <div>
                      <span className="status activeStatus">
                        {activeLinks} 使用中
                      </span>
                      {activeLinks < order.links.length && (
                        <small className="mutedLine">{order.links.length - activeLinks} 已禁用</small>
                      )}
                    </div>

                    <div>
                      <button type="button" className="statusButton" onClick={() => openDetail(order.id)}>
                        编辑
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {copied && <div className="toast">已复制：{copied}</div>}
      </main>
    </div>
  )
}

export default App
