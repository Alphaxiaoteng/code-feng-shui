#!/usr/bin/env python3
"""
代码风水罗盘 (CodeFengShui) - 核心服务与 API 网关
支持 AST 实时堪舆、八卦生克计算、赛博化煞开光与镇宅灵符导出
"""

import http.server
import socketserver
import json
import os
import sys
import urllib.parse
from fengshui_ast import FengShuiAnalyzer

PORT = 8999
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
analyzer = FengShuiAnalyzer()

SAMPLE_CODES = [
    {
        "id": "silent_charge",
        "title": "除夕挤兑·双花阴煞案",
        "lang": "javascript",
        "omen_level": "破财大凶",
        "element": "金",
        "icon_type": "coin",
        "desc": "典型掩耳盗铃棺与破财败运星：并发无幂等、浮点算账、静默吞掉支付异常导致资损过亿",
        "story": "某跨国电商在除夕零点秒杀中，因空 catch 吞噬银行接口超时异常并返回 null，导致下游仓库疯狂发货，除夕夜产生数百万幽灵资损。",
        "code": """/**
 * 某跨国电商除夕零点秒杀结算中心核心服务
 * 缺陷：空 catch 吞异常返回 null、浮点数精度直接除算、无分布式幂等锁
 */
class PaymentSettlementGate {
  constructor(gatewayConfig) {
    this.merchantId = gatewayConfig.merchantId;
    this.secretApiKey = "DEMO_LEAKED_SECRET_KEY_EXPOSED_88888"; // 破财星：明文硬编码私钥
    this.retryCounters = {};
    this.inFlightCharges = [];
  }

  async executeDoubleSpendRiskCheckout(customerId, rawCartItems, promoRate) {
    // 1. 浮点直接计算，金气涣散
    let totalCents = 0;
    for (let i = 0; i < rawCartItems.length; i++) {
      const item = rawCartItems[i];
      totalCents += (item.unitPrice * item.quantity) * (1.0 - promoRate);
    }

    // 2. 无重入锁控制，并发秒杀极易导致同一订单被扣款多次
    this.inFlightCharges.push({ customerId, totalCents, timestamp: Date.now() });

    try {
      const chargeSession = await stripeClient.charges.create({
        customer: customerId,
        amount: Math.round(totalCents * 100) / 100,
        currency: 'cny',
        apiKey: this.secretApiKey,
        timeoutMs: 12000
      });

      return chargeSession;
    } catch (paymentException) {
      // 掩耳盗铃棺：极其恶劣的空 catch 吞噬异常，强制返回 null 假装一切安好
      // 导致前端展示扣款成功，下游仓库疯狂发货，除夕夜直接产生数百万幽灵资损！
      return null;
    }
  }

  async reconcileBatches(allUnsettledInvoices) {
    // 递归无休止扫表，极易将数据库连接池彻底打满挂死
    while (allUnsettledInvoices.length > 0) {
      const current = allUnsettledInvoices.shift();
      try {
        await this.executeDoubleSpendRiskCheckout(current.uid, current.items, 0.15);
      } catch (err) {
        // 又是静默吞噬
      }
    }
  }
}"""
    },
    {
        "id": "god_mode",
        "title": "万行巨石·邪神内存黑洞",
        "lang": "javascript",
        "omen_level": "绝凶恶煞",
        "element": "火",
        "icon_type": "blackhole",
        "desc": "典型祖坟冒黑烟与困龙绝命阵：强挂 window 全局邪神、每秒泄漏十万数组、死锁未释放",
        "story": "某大厂祖传微前端基座强行污染宿主 window 全局命名空间，定时器闭包无界吞食 10 万对象，上线半小时便引发宿主 OOM 崩溃。",
        "code": """/**
 * 祖传微前端基座全局神级对象：跨越 7 年维护史，遍布暗桩
 * 缺陷：强行侵入宿主 window、定时器内存黑洞暴食、DOM 监听器永久挂载泄漏
 */
window.god = {
  version: "9.9.9-cursed",
  omnipotent: true,
  diagnosticsCache: [],

  // 1. 祖坟冒黑烟：肆意污染全局 window 命名空间
  injectGlobalOverrides: function() {
    window.__superHook = (req) => {
      window.god.diagnosticsCache.push(req);
      return req;
    };
    window.bypassAllAuthTokens = () => true;
  },

  // 2. 困龙绝命阵：无界定时器内存暴食，每秒吞食 10 万对象从未释放
  startTelemetryLeakLoop: function() {
    setInterval(() => {
      const leakPayload = new Array(100000).fill({
        ts: Date.now(),
        leakType: "GHOST_ALLOCATION",
        snapshot: window.location.href
      });
      window.god.diagnosticsCache = window.god.diagnosticsCache.concat(leakPayload);
      console.log(`[邪神警报] 当前堆内存缓存膨胀至: ${window.god.diagnosticsCache.length}`);
    }, 1000);
  },

  // 3. 掩耳盗铃：吞噬浏览器全局未捕获异常，屏蔽真实警报
  silenceGlobalConsole: function() {
    window.addEventListener('error', function(event) {
      event.preventDefault();
      event.stopPropagation();
      // 静默吞噬所有 JS 运行时致命崩溃，SLA 假装达成 100%
      return false;
    });
  },

  fixEverything: function() {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '<h1>天灵灵地灵灵，全局刷新保平安</h1>';
  }
};

// 立即在主线程自执行注入
window.god.injectGlobalOverrides();
window.god.startTelemetryLeakLoop();
window.god.silenceGlobalConsole();"""
    },
    {
        "id": "callback_hell",
        "title": "九重深渊·同步阻塞爬虫录",
        "lang": "python",
        "omen_level": "九阴大凶",
        "element": "水",
        "icon_type": "abyss",
        "desc": "典型九阴穿心煞与龙脉淤塞煞：6 重嵌套深度、长函数 70+ 行、同步阻塞网络 IO",
        "story": "某数据中台巨石管道在一个函数内混合深达 6 层循环嵌套，同步网络调用卡死主事件循环，任何子节点失联均导致全中台僵死。",
        "code": """# -*- coding: utf-8 -*-
import time
import requests

def deeply_nested_heavy_crawler_pipeline(batch_targets, max_retry_depth=6):
    \"\"\"
    九阴穿心煞：6 重深渊控制流嵌套，龙脉严重淤塞
    在单个巨型函数中混合解析、重试、文件落盘与状态同步，凡人不可读。
    \"\"\"
    collected_harvest = []
    if batch_targets:
        for target in batch_targets:
            if target.get('is_active', False):
                retry_count = 0
                while retry_count < max_retry_depth:
                    try:
                        for cluster_node in target.get('cluster_nodes', []):
                            if cluster_node.get('healthy'):
                                for port in cluster_node.get('ports', [80, 443]):
                                    try:
                                        # 阻塞式同步网络调用，无超时控制，极易导致主事件循环卡死
                                        resp = requests.get(f"http://{cluster_node['ip']}:{port}", timeout=60)
                                        if resp.status_code == 200:
                                            collected_harvest.append({
                                                "target": target['name'],
                                                "ip": cluster_node['ip'],
                                                "body": resp.text[:200]
                                            })
                                    except Exception:
                                        # 掩耳盗铃：吞掉网络超时异常
                                        pass
                    except Exception as fatal_cluster_err:
                        # 再次无条件捕获并静默忽略
                        pass
                    retry_count += 1
                    time.sleep(0.5)

    return collected_harvest"""
    },
    {
        "id": "poverty_key",
        "title": "天机泄露·破财明密折",
        "lang": "javascript",
        "omen_level": "破财大凶",
        "element": "木",
        "icon_type": "key",
        "desc": "典型破财败运星：硬编码生产环境 AWS 密钥与明文 SQL 拼接，财运库房洞开",
        "story": "某金融 SaaS 系统将生产级 AWS 访问秘钥硬编码在前端脚本，且直接拼接用户输入执行 SQL，导致整库数据面临被一锅端的高危泄密隐患。",
        "code": """/**
 * 云基础设施核心配置与用户账务直查服务
 * 缺陷：硬编码高危 API 密钥、未鉴权外部暴露、明文拼接 SQL 注入漏洞
 */
const AWS_PROD_ACCESS_KEY = "AKIA_PROD_9981827461524352";
const AWS_PROD_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const DATABASE_MASTER_PASS = "RootAdminPass2026!#$";

async function queryCustomerSecretLedger(req, res) {
  const customerInputUid = req.query.uid;
  const rawDepartment = req.query.dept;

  // 破财败运星：明文拼接 SQL，无参数化防护，黑客单引号注入即可拉走全部明细
  const dangerousQuerySql = "SELECT * FROM financial_vault WHERE uid = '" + customerInputUid + "' AND dept = '" + rawDepartment + "'";

  try {
    const dbConnection = await pool.acquireConnection();
    const records = await dbConnection.rawQuery(dangerousQuerySql);

    // 甚至直接将底层主库密码反向吐给前端 debug header
    res.setHeader('X-Debug-Master-Secret', DATABASE_MASTER_PASS);
    res.json({ success: true, ledger: records });
  } catch (err) {
    // 掩耳盗铃：空 catch
    return null;
  }
}"""
    },
    {
        "id": "goroutine_deadlock",
        "title": "困龙绝命·并发死锁阵",
        "lang": "javascript",
        "omen_level": "绝凶死局",
        "element": "金",
        "icon_type": "lock",
        "desc": "典型困龙绝命阵：并发异步锁交叉争夺、无超时死等、回调永远无法敲定",
        "story": "某核心分布式交易订单管道同时争抢库存锁与资金锁，由于加锁顺序倒置且未设置 Context 抢锁超时，导致数十万并发协程全部死锁挂死。",
        "code": """/**
 * 分布式资源协调器：双锁争夺死局 (Deadlock Inversion)
 * 缺陷：加锁顺序错位、无超时撤回机制、相互等待导致线程池永久耗尽
 */
class DistributedDualLockPipeline {
  constructor() {
    this.inventoryLock = { locked: false, holder: null };
    this.balanceLock = { locked: false, holder: null };
    this.deadlockQueue = [];
  }

  async processTransactionBranchA(txId) {
    // 线程 A: 先抢库存锁，再抢资金锁
    while (this.inventoryLock.locked) {
      await new Promise(r => setTimeout(r, 50)); // 死等，无超时
    }
    this.inventoryLock.locked = true;
    this.inventoryLock.holder = txId;

    // 模拟耗时网络延迟
    await new Promise(r => setTimeout(r, 200));

    // 试图获取资金锁（此时已被分支 B 持有，陷入死锁）
    while (this.balanceLock.locked) {
      await new Promise(r => setTimeout(r, 50));
    }
    this.balanceLock.locked = true;
    return { status: "A_SUCCESS" };
  }

  async processTransactionBranchB(txId) {
    // 线程 B: 先抢资金锁，再抢库存锁（顺序倒置，必然撞车）
    while (this.balanceLock.locked) {
      await new Promise(r => setTimeout(r, 50));
    }
    this.balanceLock.locked = true;
    this.balanceLock.holder = txId;

    await new Promise(r => setTimeout(r, 200));

    // 试图获取库存锁（已被分支 A 持有，两两死锁！）
    while (this.inventoryLock.locked) {
      await new Promise(r => setTimeout(r, 50));
    }
    this.inventoryLock.locked = true;
    return { status: "B_SUCCESS" };
  }
}"""
    },
    {
        "id": "stack_overflow",
        "title": "狂风卷叶·万级递归爆栈篇",
        "lang": "python",
        "omen_level": "九阴大凶",
        "element": "木",
        "icon_type": "wind",
        "desc": "典型九阴穿心煞与困龙阵：无尾递归优化、缺失深度上限熔断、超大树遍历导致 RecursionError",
        "story": "某风控决策引擎在遍历复杂组织关联树时，未对环形图关系做去重与递归深度熔断，恶意用户输入导致主服务调用栈瞬间爆仓崩溃。",
        "code": """# -*- coding: utf-8 -*-
\"\"\"
风控关联图谱深度推演引擎
缺陷：缺少递归终止基线与深度上限熔断，遇环形依赖或深树必爆栈
\"\"\"

class DeepRiskGraphTraversal:
    def __init__(self):
        self.visited_nodes = [] # 错误：使用 list 而非 set，查找退化 O(n)

    def calculate_deep_reputation_score(self, current_node, parent_chain=None):
        if parent_chain is None:
            parent_chain = []

        # 九阴穿心煞：未设置最大深度熔断 (缺少 if len(parent_chain) > 50)
        # 且未对环形图形成闭环防御，导致死递归
        current_score = current_node.get('base_weight', 1.0)
        children = current_node.get('sub_entities', [])

        for child in children:
            try:
                # 无保护无限深层递归调用
                sub_score = self.calculate_deep_reputation_score(
                    child, 
                    parent_chain + [current_node.get('id')]
                )
                current_score += sub_score * 0.5
            except Exception:
                # 掩耳盗铃：吞掉栈溢出或内存耗尽警报
                pass

        return current_score"""
    },
    {
        "id": "silent_coffin",
        "title": "死盖暗棺·全链路静默黑洞",
        "lang": "javascript",
        "omen_level": "掩耳凶棺",
        "element": "土",
        "icon_type": "coffin",
        "desc": "典型掩耳盗铃棺：全局异常拦截强制吞噬、向客户端伪报 200 OK、致命错误完全失联",
        "story": "某医疗健康调度网关在全局拦截器中将一切内部致命异常全部封装为 HTTP 200 并吞掉堆栈，导致数据库断连 4 小时期间外部监控一直显示绿灯。",
        "code": """/**
 * 医疗健康任务网关全局异常拦截器
 * 缺陷：掩耳盗铃棺，将全部 500 严重系统级错误抹杀伪装成 200 OK
 */
class GatewayTombInterceptor {
  constructor(loggerService) {
    this.logger = loggerService;
    this.fakeSuccessPayload = { code: 0, msg: "OK", data: null };
  }

  async handleInboundDispatch(requestContext, nextHandler) {
    try {
      // 业务下游可能发生数据库断开、Kafka 堆积或 OOM
      const result = await nextHandler(requestContext);
      return result;
    } catch (unhandledCatastrophe) {
      // 掩耳盗铃棺：严禁返回真实 500，强行伪装 200，并完全不打日志！
      // 哨兵告警与 APM 链路全部失灵，线上已死外部却浑然不觉！
      try {
        metrics.recordSlaSuccess(); // 甚至向监控虚报成功！
      } catch (e) {}

      return this.fakeSuccessPayload;
    }
  }
}"""
    },
    {
        "id": "daji_clean",
        "title": "紫气东来·现代纯阳服务",
        "lang": "python",
        "omen_level": "纯阳大吉",
        "element": "纯阳",
        "icon_type": "pure_dao",
        "desc": "天德贵人吉象：纯函数无副作用、不可变类型约束、完备边界防御、单测全绿",
        "story": "采用纯阳不可变对象架构与 Decimal 高精度运算的现代化工业级结算模块，五行调和，阴阳平衡，线上连续运行千日零宕机。",
        "code": """# -*- coding: utf-8 -*-
from typing import Sequence, List, Optional
from dataclasses import dataclass
import decimal

@dataclass(frozen=True)
class OrderLineItem:
    item_id: str
    unit_price: decimal.Decimal
    quantity: int

    def calculate_subtotal(self) -> decimal.Decimal:
        return self.unit_price * decimal.Decimal(self.quantity)


def calculate_secure_order_total(
    items: Sequence[OrderLineItem], 
    discount_ratio: decimal.Decimal
) -> decimal.Decimal:
    \"\"\"
    【纯阳整洁领域函数】
    1. 不可变数据结构 (frozen dataclass) 规避状态突变
    2. 使用 Decimal 高精度运算杜绝浮点失真与资损
    3. 完备断言与明确异常边界，无全局副作用
    \"\"\"
    if not (decimal.Decimal('0.0') <= discount_ratio <= decimal.Decimal('1.0')):
        raise ValueError("折扣比例必须在 0.0 与 1.0 之间")

    subtotal = sum((item.calculate_subtotal() for item in items), decimal.Decimal('0.0'))
    multiplier = decimal.Decimal('1.0') - discount_ratio
    return (subtotal * multiplier).quantize(decimal.Decimal('0.01'))"""
    }
]

REMEDIED_CODES = {
    "silent_charge": """// 【太上玄门化煞重构版】建立分布式幂等锁、精确 Decimal 金额结算与严密事务补偿
import { Decimal } from 'decimal.js';
import { DistributedLock, TransactionMetrics, PaymentError } from '@core/resilience';

export class PaymentSettlementService {
  private readonly lockManager: DistributedLock;
  private readonly metrics: TransactionMetrics;

  constructor(lockManager: DistributedLock, metrics: TransactionMetrics) {
    this.lockManager = lockManager;
    this.metrics = metrics;
  }

  public async executeSecureCheckout(
    customerId: string, 
    cartItems: ReadonlyArray<CartItem>, 
    promoRate: number
  ): Promise<ChargeResult> {
    const idempotencyKey = `pay:${customerId}:${Date.now()}`;
    const acquiredLock = await this.lockManager.tryAcquire(idempotencyKey, 15000);

    if (!acquiredLock) {
      throw new PaymentError('并发重入风控拦截：同一账单正在结算中，请勿重复扣款');
    }

    try {
      // 1. 使用高精度 Decimal 彻底杜绝浮点资损
      let totalAmount = new Decimal(0);
      const discountRatio = new Decimal(1).minus(new Decimal(promoRate));

      for (const item of cartItems) {
        const itemSubtotal = new Decimal(item.unitPrice).times(item.quantity).times(discountRatio);
        totalAmount = totalAmount.plus(itemSubtotal);
      }

      // 2. 调用支付网关，带有完善的结构化日志与超时上下文
      const charge = await paymentGateway.createCharge({
        customerId,
        amountCents: totalAmount.times(100).round().toNumber(),
        idempotencyKey
      });

      this.metrics.increment('checkout.success');
      return charge;
    } catch (error) {
      // 3. 严密异常捕获与事务补偿，绝不静默吞噬！
      this.metrics.increment('checkout.failure');
      logger.error('结算异常，启动自动冲正流水补偿', { customerId, idempotencyKey, error });
      throw new PaymentError('扣款流程异常中断，已自动回滚订单并通知哨兵告警', { cause: error });
    } finally {
      await this.lockManager.release(acquiredLock);
    }
  }
}""",
    "god_mode": """// 【太清玄元重构版】全面移除 window 邪神，采用标准 ES 模块单例与生命周期资源释放
export class SystemDiagnostics {
  private static instance: SystemDiagnostics | null = null;
  private readonly maxCacheSize: number = 200;
  private cache: Array<DiagnosticPayload> = [];
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  private constructor() {
    this.startSafeBoundedTelemetry();
  }

  public static getInstance(): SystemDiagnostics {
    if (!SystemDiagnostics.instance) {
      SystemDiagnostics.instance = new SystemDiagnostics();
    }
    return SystemDiagnostics.instance;
  }

  private startSafeBoundedTelemetry(): void {
    // 设置有界队列与弱引用，绝无内存暴食黑洞
    this.cleanupTimer = setInterval(() => {
      if (this.isDestroyed) return;
      if (this.cache.length > this.maxCacheSize) {
        this.cache.splice(0, this.cache.length - this.maxCacheSize);
      }
    }, 5000);
  }

  public track(payload: DiagnosticPayload): void {
    if (this.isDestroyed) return;
    this.cache.push(payload);
  }

  public dispose(): void {
    this.isDestroyed = true;
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache = [];
    SystemDiagnostics.instance = null;
  }
}""",
    "callback_hell": """# -*- coding: utf-8 -*-
\"\"\"
【纯阳开经重构版】拆解深层嵌套，采用异步流水线与显式超时
\"\"\"
import asyncio
import httpx
from typing import List, Dict, Any

async def fetch_single_node(
    client: httpx.AsyncClient, 
    ip: str, 
    port: int, 
    target_name: str
) -> Dict[str, Any]:
    \"\"\"平铺单个节点采集逻辑，严格设定 5 秒超时\"\"\"
    url = f"http://{ip}:{port}"
    resp = await client.get(url, timeout=5.0)
    resp.raise_for_status()
    return {
        "target": target_name,
        "ip": ip,
        "body": resp.text[:200]
    }

async def crawler_pipeline(batch_targets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    \"\"\"平铺异步流水线：通过 asyncio.gather 并发拉取，九阴寒气尽散\"\"\"
    results = []
    async with httpx.AsyncClient() as client:
        tasks = []
        for target in batch_targets:
            if not target.get('is_active'):
                continue
            for node in target.get('cluster_nodes', []):
                if not node.get('healthy'):
                    continue
                for port in node.get('ports', [80, 443]):
                    tasks.append(fetch_single_node(client, node['ip'], port, target['name']))

        responses = await asyncio.gather(*tasks, return_exceptions=True)
        for r in responses:
            if isinstance(r, dict):
                results.append(r)
    return results""",
    "poverty_key": """// 【金玉满堂化煞重构版】密钥注入环境变量，全链路参数化防 SQL 注入
import { config } from '@core/env';
import { db } from '@core/database';
import { z } from 'zod';

const RequestSchema = z.object({
  uid: z.string().uuid(),
  dept: z.string().min(1).max(32)
});

export async function queryCustomerSecretLedger(req, res) {
  // 1. 严格输入校验
  const parseResult = RequestSchema.safeParse(req.query);
  if (!parseResult.success) {
    return res.status(400).json({ error: '无效请求参数' });
  }

  const { uid, dept } = parseResult.data;

  try {
    // 2. 参数化预编译查询，彻底封死 SQL 注入漏洞
    const records = await db.query(
      'SELECT id, amount, currency, created_at FROM financial_vault WHERE uid = $1 AND dept = $2',
      [uid, dept]
    );

    // 3. 密钥从服务端环境变量动态读取，严禁泄露至前端
    res.json({ success: true, ledger: records });
  } catch (error) {
    logger.error('账务查询失败', { uid, error });
    res.status(500).json({ error: '系统处理异常，请稍后重试' });
  }
}""",
    "goroutine_deadlock": """// 【太上解困化煞版】统一锁获取层级序，引入带超时的 tryAcquire 机制
export class DeadlockFreeCoordinator {
  private resourceHierarchy = ['inventory', 'balance'];

  async acquireOrderedLocksWithTimeout(txId, timeoutMs = 3000) {
    const startTime = Date.now();
    // 强制全局严格按同一字典序申请锁，彻底消除环形等待
    for (const res of this.resourceHierarchy) {
      const remainingTime = timeoutMs - (Date.now() - startTime);
      if (remainingTime <= 0) {
        throw new Error(`抢锁超时熔断 [${res}]，自动释放已有资源避让死锁`);
      }
      await this.tryAcquireSingleLock(res, txId, remainingTime);
    }
    return { acquired: true, txId };
  }
}""",
    "stack_overflow": """# -*- coding: utf-8 -*-
\"\"\"
【纯阳通络化煞版】将递归重构为迭代循环 + 显式栈，并引入深度上限与访问集合熔断
\"\"\"
class SafeIterativeGraphTraversal:
    def calculate_deep_reputation_score(self, root_node, max_depth_limit=20):
        total_score = 0.0
        visited_ids = set()
        stack = [(root_node, 0, 1.0)] # (node, current_depth, decay_factor)

        while stack:
            curr, depth, decay = stack.pop()
            node_id = curr.get('id')
            if node_id in visited_ids or depth > max_depth_limit:
                continue
            visited_ids.add(node_id)

            total_score += curr.get('base_weight', 1.0) * decay
            for child in curr.get('sub_entities', []):
                stack.append((child, depth + 1, decay * 0.5))

        return total_score""",
    "silent_coffin": """// 【明察秋毫化煞版】健全异常透传，保留错误堆栈与精准 HTTP 错误码
export class TransparentErrorInterceptor {
  async handleInboundDispatch(requestContext, nextHandler) {
    try {
      return await nextHandler(requestContext);
    } catch (catastrophe) {
      // 1. 记录结构化错误日志与哨兵追踪 ID
      const traceId = requestContext.traceId || crypto.randomUUID();
      logger.error('网关调度严重故障', { traceId, error: catastrophe.message, stack: catastrophe.stack });

      // 2. 严正返回标准 RFC 7807 错误体与 503 状态码，绝不粉饰太平！
      return {
        status: 503,
        error: "SERVICE_UNAVAILABLE",
        message: "底层服务暂时不可用，运维告警已触发",
        traceId
      };
    }
  }
}"""
}


class FengShuiRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/samples':
            self._send_json(SAMPLE_CODES)
            return

        if path in ('/favicon.ico', '/favicon.svg'):
            favicon_path = os.path.join(DIRECTORY, 'favicon.svg')
            if os.path.exists(favicon_path):
                self.send_response(200)
                self.send_header('Content-Type', 'image/svg+xml')
                self.end_headers()
                with open(favicon_path, 'rb') as f:
                    self.wfile.write(f.read())
                return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'

        try:
            data = json.loads(body)
        except Exception:
            data = {}

        if path == '/api/analyze':
            code = data.get('code', '')
            lang = data.get('lang', 'javascript')
            if lang == 'python':
                report = analyzer.analyze_python_ast(code)
            else:
                report = analyzer.analyze_javascript(code)
            self._send_json(report)
            return

        elif path == '/api/consecrate':
            sample_id = data.get('sample_id', '')
            remedy = REMEDIED_CODES.get(sample_id, "// 经三清法水洗练，已拔除一切阴煞暗桩，代码纯净如玉。")
            result = {
                "consecrated_code": remedy,
                "taoist_blessing": "敕令：天圆地方，律令九章。吾今重构，万恶潜藏。Bug尽灭，单测全绿！急急如律令！",
                "merit_gained": 88
            }
            self._send_json(result)
            return

        self.send_error(404, "Endpoint not found")

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)


def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), FengShuiRequestHandler) as httpd:
        print(f"CodeFengShui Server running at http://localhost:{PORT}")
        httpd.serve_forever()


if __name__ == '__main__':
    run_server()
