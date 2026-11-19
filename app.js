'use strict';
/* ==================== 轻卡日记 ====================
   饮食 · 步数 · 热量 · 体重 私人记录工具
   数据只存在本机浏览器 localStorage，不联网。 */

/* ==================== 常量 ==================== */
const LS_KEY = 'qk_data_v1';
const STEP_KCAL_PER_KG = 0.0005;  // 每步每公斤体重消耗（估算）
const KCAL_PER_KG_FAT = 7700;     // 减 1kg 脂肪约需的热量缺口
const MIN_TARGET = 1200;          // 目标摄入下限，防止过度节食

const MEAL_TYPES = [
  { id: 'breakfast', name: '早餐', icon: '🌅' },
  { id: 'lunch',     name: '午餐', icon: '☀️' },
  { id: 'dinner',    name: '晚餐', icon: '🌙' },
  { id: 'snack',     name: '加餐', icon: '🍪' },
];

/* 食物库格式：[名称, 每100克热量, 蛋白质g, 碳水g, 脂肪g, 膳食纤维g, 默认份量克数, 份量说明]
   饮料类按每100ml计（≈每100克）。营养素数值参考《中国食物成分表》常见熟重数据，
   家常菜/复合菜为常见做法的估算值，油盐多少影响很大，仅作参考。 */
const FOOD_LIB = [
  { cat: '主食', items: [
    ['米饭', 116, 2.6, 25.9, 0.3, 0.3, 150, '1碗(150g)'], ['糙米饭', 112, 2.6, 24, 0.8, 1.8, 150, '1碗(150g)'],
    ['馒头', 223, 7, 47, 1.1, 1.3, 100, '1个(100g)'], ['花卷', 217, 6.4, 45.6, 1, 1.5, 100, '1个(100g)'],
    ['面条', 110, 3.9, 22.9, 0.4, 0.9, 250, '1碗(250g)'], ['白粥', 46, 1.1, 9.9, 0.3, 0.1, 200, '1碗(200g)'],
    ['小米粥', 46, 1.4, 8.4, 0.7, 0.5, 200, '1碗(200g)'], ['八宝粥', 52, 1.7, 10.6, 0.5, 0.8, 250, '1碗(250g)'],
    ['燕麦片', 377, 15, 66.9, 6.7, 10.6, 40, '1碗(40g干)'], ['全麦面包', 250, 8.5, 46, 3.6, 6, 35, '1片(35g)'],
    ['包子（猪肉）', 200, 7.4, 25, 8, 1.2, 115, '1个(115g)'], ['饺子', 200, 8, 22, 9, 1, 200, '10个(200g)'],
    ['烧麦', 180, 7, 22, 7, 0.8, 25, '1个(25g)'], ['油条', 388, 6.9, 51, 18.1, 0.9, 70, '1根(70g)'],
    ['烧饼', 300, 8, 40, 12, 2, 85, '1个(85g)'], ['馅饼', 320, 9, 35, 16, 2, 90, '1个(90g)'],
    ['煎饼果子', 220, 8, 30, 7, 2, 170, '1套(170g)'], ['手抓饼', 350, 7, 38, 19, 1.5, 115, '1个(115g)'],
    ['三明治', 250, 10, 30, 10, 2, 120, '1个(120g)'], ['蛋炒饭', 180, 5, 26, 6.5, 0.6, 330, '1盘(330g)'],
    ['兰州拉面', 130, 5, 22, 3, 1, 400, '1碗(400g)'], ['热干面', 170, 6, 25, 6, 1.2, 340, '1碗(340g)'],
    ['凉皮', 150, 3, 25, 4, 0.8, 360, '1份(360g)'], ['米线', 120, 2.5, 24, 1.5, 0.5, 400, '1碗(400g)'],
    ['意大利面', 158, 5.8, 30.9, 0.9, 1.8, 220, '1份(220g)'], ['方便面', 118, 3.5, 18, 4, 0.8, 400, '1包(泡好400g)'],
    ['红薯', 90, 1.1, 21, 0.2, 2, 150, '1个(150g)'], ['紫薯', 82, 1.2, 19, 0.1, 2.3, 150, '1个(150g)'],
    ['土豆泥', 120, 2, 20, 3.5, 1.2, 170, '1份(170g)'], ['玉米', 112, 4, 22.8, 1.2, 2.9, 150, '1根(可食150g)'],
  ]},
  { cat: '蛋白', items: [
    ['水煮蛋', 144, 13.1, 1.5, 8.6, 0, 50, '1个(50g)'], ['煎蛋', 180, 12, 2, 14, 0, 60, '1个(60g)'],
    ['鸭蛋', 180, 12.6, 3.1, 13, 0, 70, '1个(70g)'], ['皮蛋', 170, 14, 4.5, 10.7, 0, 65, '1个(65g)'],
    ['鸡胸肉', 133, 19.4, 2.5, 5, 0, 100, '100g'], ['鸡腿', 181, 16, 0, 13, 0, 120, '1个(可食120g)'],
    ['瘦猪肉', 143, 20.3, 1.5, 6.2, 0, 100, '100g'], ['五花肉', 508, 7.7, 0, 52, 0, 100, '100g'],
    ['排骨', 278, 16.7, 0, 23, 0, 100, '100g'], ['猪蹄', 260, 22.6, 0, 18.8, 0, 100, '100g'],
    ['牛肉', 125, 19.9, 2, 4.2, 0, 100, '100g'], ['卤牛肉', 200, 25, 1, 10, 0, 100, '100g'],
    ['羊肉', 200, 19, 0, 13, 0, 100, '100g'], ['清蒸鱼', 105, 18, 0, 3.5, 0, 100, '100g'],
    ['三文鱼', 139, 17.2, 0, 7.8, 0, 100, '100g'], ['带鱼', 127, 17.7, 3.1, 4.9, 0, 100, '100g'],
    ['虾', 93, 18.6, 2.8, 0.8, 0, 100, '100g'], ['鱿鱼', 75, 15, 3, 1, 0, 100, '100g'],
    ['螃蟹', 103, 17.5, 2.3, 2.6, 0, 100, '可食100g'], ['烤鸭', 340, 15, 0, 30, 0, 100, '100g'],
    ['白切鸡', 165, 25, 0, 7, 0, 100, '100g'], ['火腿肠', 212, 10, 6, 16, 0, 80, '1根(80g)'],
    ['培根', 180, 12, 1, 14, 0, 30, '1片(30g)'],
    ['豆腐', 82, 8.1, 4.2, 3.7, 0.4, 100, '100g'], ['腐竹', 461, 44.6, 22.3, 21.7, 1, 50, '50g(干)'],
    ['毛豆', 123, 13.1, 10.5, 5, 4, 100, '100g'],
    ['豆浆（无糖）', 16, 1.8, 1.1, 0.7, 0.5, 250, '1杯(250ml)'], ['牛奶', 54, 3, 3.4, 3.2, 0, 250, '1盒(250ml)'],
    ['酸奶', 72, 2.5, 9.3, 2.7, 0, 100, '100g'],
  ]},
  { cat: '果蔬', items: [
    ['苹果', 52, 0.2, 13.7, 0.2, 1.7, 200, '1个(200g)'], ['香蕉', 93, 1.4, 22, 0.2, 1.2, 120, '1根(120g)'],
    ['橙子', 48, 0.8, 11.1, 0.2, 1.7, 130, '1个(130g)'], ['梨', 51, 0.4, 13.1, 0.1, 3.1, 200, '1个(200g)'],
    ['桃子', 42, 0.9, 10.1, 0.1, 1.3, 150, '1个(150g)'], ['葡萄', 45, 0.4, 10.3, 0.3, 1, 400, '1串(400g)'],
    ['草莓', 32, 1, 7.1, 0.2, 2, 100, '100g'], ['蓝莓', 57, 0.7, 14.5, 0.3, 2.4, 100, '100g'],
    ['芒果', 35, 0.6, 8.3, 0.2, 1.6, 350, '1个(350g)'], ['火龙果', 55, 1.1, 13.3, 0.2, 3, 200, '1个(200g)'],
    ['猕猴桃', 61, 0.8, 14.5, 0.6, 2.6, 100, '1个(100g)'], ['柚子', 42, 0.8, 9.6, 0.2, 1.6, 300, '半个(300g)'],
    ['荔枝', 70, 0.9, 16.6, 0.2, 0.5, 100, '10颗(100g)'], ['榴莲', 147, 2.6, 28.3, 3.3, 3.8, 100, '100g'],
    ['牛油果', 160, 2, 8.5, 14.7, 6.7, 100, '1个(100g)'], ['西瓜', 28, 0.6, 6.8, 0.1, 0.3, 500, '500g'],
    ['黄瓜', 15, 0.8, 2.9, 0.2, 0.5, 100, '1根(100g)'], ['西红柿', 15, 0.9, 3.3, 0.2, 1, 150, '1个(150g)'],
    ['胡萝卜', 39, 1, 8.8, 0.2, 2.8, 100, '1根(100g)'], ['西兰花', 36, 4.1, 4.3, 0.6, 1.6, 100, '100g'],
    ['菠菜', 28, 2.6, 4.5, 0.3, 1.7, 100, '100g'], ['南瓜', 26, 0.7, 6.5, 0.1, 0.8, 100, '100g'],
    ['莲藕', 70, 1.9, 16.4, 0.2, 1.2, 100, '100g'], ['蘑菇', 25, 2.7, 4.1, 0.1, 2.1, 100, '100g'],
    ['清炒蔬菜', 40, 2, 4, 2, 1.5, 200, '1盘(200g)'], ['蔬菜沙拉（无酱）', 30, 1.5, 5, 0.6, 1.8, 200, '1份(200g)'],
  ]},
  { cat: '家常菜（估算）', items: [
    ['西红柿炒鸡蛋', 150, 6, 7, 11, 1, 130, '1份(130g)'], ['青椒土豆丝', 120, 2.5, 16, 5, 1.8, 150, '1份(150g)'],
    ['炒青菜', 40, 2, 4, 2, 1.5, 150, '1份(150g)'], ['麻婆豆腐', 130, 8, 6, 8, 0.8, 190, '1份(190g)'],
    ['地三鲜', 130, 2, 15, 7, 2, 210, '1份(210g)'], ['干煸豆角', 130, 3, 10, 8, 2.5, 200, '1份(200g)'],
    ['红烧肉', 480, 9, 10, 44, 0.2, 100, '100g'], ['回锅肉', 260, 12, 8, 20, 1, 185, '1份(185g)'],
    ['糖醋里脊', 250, 12, 22, 12, 0.5, 180, '1份(180g)'], ['锅包肉', 280, 10, 25, 16, 0.5, 180, '1份(180g)'],
    ['鱼香肉丝', 150, 8, 10, 9, 1.2, 210, '1份(210g)'], ['宫保鸡丁', 160, 10, 10, 9, 1, 175, '1份(175g)'],
    ['水煮鱼', 200, 14, 4, 15, 0.5, 200, '1份(200g)'], ['酸菜鱼', 140, 11, 4, 9, 0.5, 250, '1份(250g)'],
    ['烤鱼', 200, 15, 6, 13, 1, 300, '1份(300g)'], ['剁椒鱼头', 150, 12, 4, 10, 0.3, 330, '1份(330g)'],
    ['羊肉串', 200, 15, 2, 15, 0, 50, '1串(50g)'], ['番茄蛋汤', 30, 1.5, 2, 2, 0.3, 200, '1碗(200g)'],
    ['紫菜蛋花汤', 25, 1.5, 1.5, 1.5, 0.5, 200, '1碗(200g)'], ['排骨汤', 60, 4, 2, 4, 0.2, 330, '1碗(330g)'],
    ['酸辣汤', 50, 2, 6, 2, 0.5, 200, '1碗(200g)'],
  ]},
  { cat: '饮品（每100ml）', items: [
    ['白开水', 0, 0, 0, 0, 0, 250, '不限'], ['可乐', 42, 0, 10.6, 0, 0, 330, '1罐(330ml)'],
    ['冰红茶', 26, 0, 6.5, 0, 0, 500, '1瓶(500ml)'], ['橙汁', 44, 0.5, 10.5, 0.2, 0.2, 250, '1杯(250ml)'],
    ['椰汁', 45, 0.5, 8, 1.5, 0, 330, '1罐(330ml)'], ['鲜榨果汁', 45, 0.5, 10.5, 0.2, 0.3, 270, '1杯(270ml)'],
    ['奶茶', 75, 1, 11, 3, 0, 530, '1杯(中,530ml)'], ['美式咖啡', 2, 0.1, 0.4, 0, 0, 300, '1杯(300ml)'],
    ['拿铁', 45, 2.2, 3.8, 2.3, 0, 420, '1杯(420ml)'], ['卡布奇诺', 40, 2, 4, 1.8, 0, 300, '1杯(300ml)'],
    ['甜豆浆', 32, 1.8, 4, 1, 0.5, 250, '1杯(250ml)'], ['运动饮料', 24, 0, 6, 0, 0, 500, '1瓶(500ml)'],
    ['啤酒', 32, 0.5, 3, 0, 0, 500, '1瓶(500ml)'], ['红酒', 75, 0.1, 2.5, 0, 0, 150, '1杯(150ml)'],
    ['白酒', 300, 0, 0, 0, 0, 50, '1两(50ml)'],
  ]},
  { cat: '快餐零食', items: [
    ['汉堡', 280, 13, 27, 14, 1.5, 180, '1个(180g)'], ['薯条', 300, 3.4, 40, 14, 3.8, 110, '中份(110g)'],
    ['炸鸡', 280, 18, 10, 19, 0.5, 110, '1块(110g)'], ['韩式炸鸡', 350, 16, 25, 21, 0.5, 170, '1份(170g)'],
    ['披萨', 250, 11, 30, 10, 1.5, 110, '1片(110g)'], ['寿司', 140, 5, 25, 2, 0.5, 210, '8个(210g)'],
    ['黄焖鸡米饭', 150, 8, 16, 6, 0.8, 530, '1份(530g)'], ['麻辣烫', 100, 6, 8, 5, 1.2, 600, '1份(600g)'],
    ['火锅', 150, 9, 6, 10, 1, 800, '1顿(800g参考)'], ['螺蛳粉', 160, 6, 20, 6, 1.5, 440, '1碗(440g)'],
    ['酸辣粉', 140, 3, 24, 3, 1, 360, '1碗(360g)'], ['牛肉面', 130, 7, 19, 3, 1, 430, '1碗(430g)'],
    ['石锅拌饭', 160, 6, 24, 4.5, 1.5, 440, '1份(440g)'], ['蛋挞', 320, 4.5, 25, 22, 0.5, 55, '1个(55g)'],
    ['蛋糕', 350, 6, 45, 16, 0.8, 100, '1块(100g)'], ['甜甜圈', 400, 5, 50, 20, 1, 75, '1个(75g)'],
    ['月饼', 400, 7, 55, 17, 2, 100, '1个(100g)'], ['汤圆', 240, 4, 42, 6, 0.5, 100, '4个(100g)'],
    ['粽子', 200, 6, 38, 4, 1, 175, '1个(175g)'], ['肉松饼', 430, 7, 50, 22, 1, 35, '1个(35g)'],
    ['饼干', 450, 7, 65, 18, 1.2, 35, '3块(35g)'], ['巧克力', 550, 5, 60, 32, 3, 10, '1小块(10g)'],
    ['薯片', 540, 6, 50, 35, 4, 30, '1小包(30g)'], ['辣条', 350, 8, 30, 22, 2, 28, '1小包(28g)'],
    ['爆米花', 400, 8, 60, 15, 10, 30, '1小袋(30g)'], ['果冻', 80, 0.5, 20, 0, 0, 50, '1个(50g)'],
    ['布丁', 120, 2.5, 22, 3, 0, 100, '1个(100g)'], ['冰淇淋', 200, 3.5, 24, 10, 0.3, 100, '1支(100g)'],
    ['雪糕', 230, 3, 27, 12, 0.3, 110, '1支(110g)'], ['坚果', 600, 20, 18, 50, 8, 30, '1把(30g)'],
    ['瓜子', 600, 21, 15, 49, 6, 20, '1把(20g)'], ['花生', 560, 24, 16, 44, 6, 30, '1把(30g)'],
  ]},
];

const GOALS = [
  { v: 300, label: '温和 · 每周约减 0.3 kg' },
  { v: 500, label: '标准 · 每周约减 0.45 kg' },
  { v: 700, label: '激进 · 每周约减 0.6 kg' },
];

const EMPTY_DAY = () => ({ meals: [], steps: 0, extra: 0, weight: null, water: 0 });

/* ==================== 状态 ==================== */
let state = null;
let currentKey = todayKey();
let selectedMealType = 'breakfast';
let formSex = 'male';

function defaultState() {
  return { settings: null, days: {}, customFoods: {}, combos: {}, barcodes: {}, recent: [] };
}
function loadState() {
  try {
    const obj = JSON.parse(localStorage.getItem(LS_KEY));
    if (obj && typeof obj === 'object' && obj.days && typeof obj.days === 'object') return obj;
  } catch (e) { /* 忽略损坏数据 */ }
  return null;
}
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
  catch (e) { toast('保存失败：浏览器存储不可用'); }
}

/* ==================== 工具 ==================== */
const $ = (id) => document.getElementById(id);
function dateKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function todayKey() { return dateKey(new Date()); }
function parseKey(key) {
  const p = key.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}
function fmtInt(n) { return Math.round(n).toLocaleString('zh-CN'); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const WEEK_CHARS = ['日', '一', '二', '三', '四', '五', '六'];
function weekLabel(key) { return WEEK_CHARS[parseKey(key).getDay()]; }
function niceCeil(v) {
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1))));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (m * mag >= v) return m * mag;
  }
  return 10 * mag;
}
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function mdKey(k) { const p = k.split('-'); return (+p[1]) + '/' + (+p[2]); }
function hexMix(h1, h2, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(h1), b = p(h2);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
function dayOf(key) { return state.days[key]; }
function getDay(key) {
  if (!state.days[key]) state.days[key] = EMPTY_DAY();
  return state.days[key];
}

/* ==================== 计算 ==================== */
function bmr(s) {
  if (!s) return 0;
  const base = 10 * s.weight + 6.25 * s.height - 5 * s.age;
  return Math.max(0, Math.round(s.sex === 'male' ? base + 5 : base - 161));
}
function stepBurnOf(steps, s) {
  if (!s) return 0;
  return Math.round(steps * s.weight * STEP_KCAL_PER_KG);
}
function dayData(key) {
  const day = state.days[key] || EMPTY_DAY();
  const s = state.settings;
  const eaten = day.meals.reduce((a, m) => a + (Number(m.kcal) || 0), 0);
  const bmrV = bmr(s);
  const burnV = stepBurnOf(day.steps || 0, s);
  const extraV = Number(day.extra) || 0;
  const totalOut = bmrV + burnV + extraV;
  const target = s ? Math.max(MIN_TARGET, totalOut - (Number(s.deficit) || 500)) : 0;
  return { day, eaten, target, remaining: target - eaten, bmrV, burnV, extraV, totalOut, net: eaten - totalOut };
}
function calcStreak() {
  let n = 0;
  const d = new Date();
  let k = dateKey(d);
  if (!(state.days[k] && state.days[k].meals.length)) {
    d.setDate(d.getDate() - 1);
    k = dateKey(d);
  }
  while (state.days[k] && state.days[k].meals.length) {
    n++;
    d.setDate(d.getDate() - 1);
    k = dateKey(d);
  }
  return n;
}
function allFoods() {
  const m = {};
  for (const c of FOOD_LIB) for (const [n, k100, p100, c100, f100, fib100, defG, label] of c.items) {
    m[n] = { name: n, kcal100: k100, p100, c100, f100, fib100, defG, label };
  }
  for (const f of Object.values(state.customFoods || {})) {
    m[f.name] = {
      name: f.name,
      kcal100: f.kcal100 != null ? f.kcal100 : f.kcal,
      p100: f.p100, c100: f.c100, f100: f.f100, fib100: f.fib100,
      defG: f.defG || 100, label: f.label || '1份',
    };
  }
  return m;
}

/* ==================== 渲染 ==================== */
function render() {
  renderHeader();
  renderSummary();
  renderSteps();
  renderWater();
  renderMeals();
  renderDailySummary();
  renderMacros();
  renderWeight();
  renderTrend();
  renderMeta();
  renderWeekSummary();
  drawCharts();
}

function renderHeader() {
  const isToday = currentKey === todayKey();
  const d = parseKey(currentKey);
  $('dateText').textContent = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + weekLabel(currentKey);
  $('todayChip').classList.toggle('hidden', isToday);
  $('btnNext').disabled = isToday;
  $('summaryTitle').textContent = isToday ? '今日热量' : '当天热量';
  $('stepsTitle').textContent = isToday ? '今日步数' : '当天步数';
  const n = calcStreak();
  $('streak').classList.toggle('hidden', n < 1);
  $('streakN').textContent = n;
}

function renderSummary() {
  const s = state.settings;
  const { eaten, target, remaining, bmrV, burnV, extraV, totalOut, net } = dayData(currentKey);
  $('eatenKcal').textContent = fmtInt(eaten);

  if (!s) {
    $('targetLine').textContent = '先点右上角 ⚙️ 设置身高体重';
    $('meterFill').style.width = '0%';
    $('statusLine').innerHTML = '<span class="neutral">设置后会自动计算目标摄入和热量缺口</span>';
    ['bmrVal', 'stepBurnVal', 'extraVal', 'totalOutVal'].forEach((id) => { $(id).textContent = '–'; });
    return;
  }

  $('targetLine').textContent = target > 0
    ? '目标摄入 ' + fmtInt(target) + ' 千卡 · ' + (remaining >= 0 ? '还可吃 ' + fmtInt(remaining) + ' 千卡' : '已超出 ' + fmtInt(-remaining) + ' 千卡')
    : '';

  const pct = target > 0 ? Math.min(eaten / target, 1.4) : 0;
  const fill = $('meterFill');
  fill.style.width = Math.min(pct * 100, 100) + '%';
  fill.style.background = pct < 0.85 ? cssVar('--accent') : (pct <= 1 ? cssVar('--warning') : cssVar('--critical'));

  let statusHtml;
  if (eaten === 0) {
    statusHtml = '<span class="neutral">今天还没记录饮食，从第一口开始 💪</span>';
  } else if (net < 0) {
    const perWeek = (-net / KCAL_PER_KG_FAT * 7).toFixed(2);
    statusHtml = '<span class="good">✓ 热量缺口 ' + fmtInt(-net) + ' 千卡 · 约每周减 ' + perWeek + ' kg</span>';
  } else {
    statusHtml = '<span class="bad">⚠ 热量盈余 ' + fmtInt(net) + ' 千卡 · 下一顿少吃一点点</span>';
  }
  $('statusLine').innerHTML = statusHtml;

  $('bmrVal').textContent = fmtInt(bmrV);
  $('stepBurnVal').textContent = fmtInt(burnV);
  $('extraVal').textContent = fmtInt(extraV);
  $('totalOutVal').textContent = fmtInt(totalOut);
}

function renderSteps() {
  const { day, burnV } = dayData(currentKey);
  $('stepsN').textContent = fmtInt(day.steps || 0);
  $('stepsSub').textContent = state.settings
    ? (day.steps ? '约消耗 ' + fmtInt(burnV) + ' 千卡' : '点击填写步数，自动估算消耗')
    : '点击填写步数（可从微信运动查看）';
}

/* ---- 喝水 ---- */
function renderWater() {
  const day = state.days[currentKey] || EMPTY_DAY();
  const w = Math.max(0, Math.round(Number(day.water) || 0));
  $('waterN').textContent = w;
  $('waterDots').innerHTML = Array.from({ length: 8 }, (_, i) =>
    '<span class="water-dot' + (i < w ? ' on' : '') + (w > 8 && i === 7 ? ' over' : '') + '"></span>').join('');
  $('waterSub').textContent = w > 0
    ? '已喝 ' + fmtInt(w * 250) + ' ml · 目标 2000 ml'
    : '目标 8 杯（2000 ml），喝水不计热量';
}
function changeWater(delta) {
  const day = getDay(currentKey);
  day.water = Math.max(0, Math.round(Number(day.water) || 0) + delta);
  save(); renderWater();
}
function clearWater() {
  const day = getDay(currentKey);
  day.water = 0;
  save(); renderWater();
}

/* ---- 再吃一次 ---- */
function repeatSourceKey(typeId) {
  const keys = Object.keys(state.days).filter((k) => k < currentKey).sort();
  for (let i = keys.length - 1; i >= 0; i--) {
    if (state.days[keys[i]].meals.some((m) => m.type === typeId)) return keys[i];
  }
  return null;
}
function repeatMeal(typeId) {
  const src = repeatSourceKey(typeId);
  if (!src) { toast('没有找到可复制的记录'); return; }
  const items = state.days[src].meals.filter((m) => m.type === typeId);
  const day = getDay(currentKey);
  items.forEach((m) => day.meals.push({
    id: uid(), name: m.name, kcal: Number(m.kcal) || 0, kcal100: m.kcal100,
    p100: m.p100, c100: m.c100, f100: m.f100, fib100: m.fib100,
    p: m.p, c: m.c, f: m.f, fib: m.fib, grams: m.grams, type: typeId, ts: Date.now(),
  }));
  items.forEach((m) => { state.recent = [m.name, ...(state.recent || []).filter((x) => x !== m.name)].slice(0, 10); });
  save(); render();
  toast('已复制 ' + MEAL_TYPES.find((t) => t.id === typeId).name + ' ' + items.length + ' 项');
}

function renderMeals() {
  const day = state.days[currentKey] || EMPTY_DAY();
  const total = day.meals.reduce((a, m) => a + (Number(m.kcal) || 0), 0);
  $('mealsTotal').textContent = total > 0 ? '共 ' + fmtInt(total) + ' 千卡' : '还没有记录';

  $('mealSections').innerHTML = MEAL_TYPES.map((t) => {
    const items = day.meals.filter((m) => m.type === t.id);
    const sub = items.reduce((a, m) => a + (Number(m.kcal) || 0), 0);
    const src = repeatSourceKey(t.id);
    return '<div class="meal-sec">'
      + '<div class="meal-head"><span class="meal-name">' + t.icon + ' ' + t.name + '</span>'
      + '<span class="meal-head-right">'
      + (src ? '<button class="repeat-btn" data-repeat="' + t.id + '">↻ 再吃一次</button>' : '')
      + '<span class="meal-sub">' + (items.length ? fmtInt(sub) + ' 千卡' : '') + '</span></span></div>'
      + items.map((m) =>
          '<div class="meal-item" data-edit="' + m.id + '">'
          + '<span class="meal-item-name">' + escapeHtml(m.name) + '</span>'
          + '<span class="meal-item-kcal">' + fmtInt(m.kcal) + (m.grams ? ' · ' + m.grams + 'g' : '') + '</span>'
          + '<button class="del-btn" data-del="' + m.id + '" aria-label="删除">✕</button>'
          + '</div>').join('')
      + '<button class="add-row" data-add="' + t.id + '">＋ 添加</button>'
      + '</div>';
  }).join('');
}

function renderWeight() {
  const series = getWeightSeries();
  if (!series.length) {
    $('weightNow').textContent = '–';
    $('weightDeltas').innerHTML = '<span>记录体重，看到趋势曲线</span>';
    $('weightGoal').classList.add('hidden');
    return;
  }
  const latest = series[0];
  $('weightNow').textContent = latest.w.toFixed(1);
  const parts = [];
  if (series.length >= 2) {
    const d = latest.w - series[1].w;
    parts.push('<span class="' + (d <= 0 ? 'delta-down' : 'delta-up') + '">较上次 ' + (d > 0 ? '+' : '') + d.toFixed(1) + ' kg</span>');
  }
  if (series.length >= 2) {
    const total = latest.w - series[series.length - 1].w;
    parts.push('<span class="' + (total <= 0 ? 'delta-down' : 'delta-up') + '">累计 ' + (total > 0 ? '+' : '') + total.toFixed(1) + ' kg</span>');
  } else {
    parts.push('<span>从今天开始记录</span>');
  }
  $('weightDeltas').innerHTML = parts.join('');

  // 目标体重进度
  const gw = state.settings && state.settings.goalWeight;
  if (gw != null) {
    const start = series[series.length - 1].w;
    $('weightGoal').classList.remove('hidden');
    const remain = latest.w - gw;
    let pct = start === gw ? 100 : (start - latest.w) / (start - gw);
    pct = Math.min(100, Math.max(0, pct * 100));
    $('weightGoalFill').style.width = pct + '%';
    $('weightGoalText').textContent = remain > 0.05
      ? '距目标还有 ' + remain.toFixed(1) + ' kg · 已完成 ' + Math.round(pct) + '%'
      : (remain < -0.05 ? '已比目标轻 ' + Math.abs(remain).toFixed(1) + ' kg 🎉' : '已经达到目标体重 🎉');
  } else {
    $('weightGoal').classList.add('hidden');
  }
}

/* ---- 本周小结 ---- */
function weekKeysEnd(endKey, n) {
  const end = parseKey(endKey);
  const start = new Date(end);
  start.setDate(end.getDate() - ((end.getDay() + 6) % 7));
  const keys = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const k = dateKey(d);
    if (k > endKey) break;
    keys.push(k);
  }
  return n ? keys.slice(0, n) : keys;
}
function weekAvg(keys, pick, filter) {
  const vals = [];
  keys.forEach((k) => {
    const dd = dayData(k);
    if (filter && !filter(dd)) return;
    vals.push(pick(dd));
  });
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
function deltaText(cur, prev, goodDir) {
  if (cur == null || prev == null) return '';
  const diff = Math.round(cur - prev);
  if (!diff) return '';
  const good = goodDir === 'down' ? diff < 0 : diff > 0;
  return '<span class="' + (good ? 'delta-down' : 'delta-up') + '">较上周 ' + (diff > 0 ? '+' : '') + fmtInt(diff) + '</span>';
}
function renderWeekSummary() {
  const grid = $('weekGrid');
  const wkKeys = weekKeysEnd(currentKey);
  const n = wkKeys.length;
  const prevEnd = new Date(parseKey(wkKeys[0]));
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevKeys = weekKeysEnd(dateKey(prevEnd), n);
  $('weekTitle').textContent = '本周小结 · ' + mdKey(wkKeys[0]) + ' – ' + mdKey(wkKeys[n - 1]);

  const hasMeals = (d) => d.day.meals.length > 0;
  const avgIn = weekAvg(wkKeys, (d) => d.eaten, hasMeals);
  const avgInPrev = weekAvg(prevKeys, (d) => d.eaten, hasMeals);
  const hasSteps = (d) => (d.day.steps || 0) > 0;
  const avgSteps = weekAvg(wkKeys, (d) => d.day.steps || 0, hasSteps);
  const avgStepsPrev = weekAvg(prevKeys, (d) => d.day.steps || 0, hasSteps);
  const logged = wkKeys.filter((k) => dayData(k).day.meals.length > 0);
  const okDays = logged.filter((k) => { const d = dayData(k); return d.target > 0 && d.eaten <= d.target; }).length;
  const avgNet = weekAvg(wkKeys, (d) => d.net, (d) => hasMeals(d) && state.settings);

  const tiles = [
    { label: '日均摄入', val: avgIn != null ? fmtInt(avgIn) + ' 千卡' : '–', delta: deltaText(avgIn, avgInPrev, 'down') },
    { label: '日均步数', val: avgSteps != null ? fmtInt(avgSteps) : '–', delta: deltaText(avgSteps, avgStepsPrev, 'up') },
    { label: '达标天数', val: !state.settings ? '–' : (logged.length ? okDays + '/' + logged.length : '–'), delta: '' },
    { label: '日均净差', val: avgNet != null ? (avgNet <= 0 ? '−' + fmtInt(Math.abs(avgNet)) : '+' + fmtInt(avgNet)) + ' 千卡' : '–', delta: '' },
  ];
  grid.innerHTML = tiles.map((t) =>
    '<div class="week-tile"><div class="week-tile-label">' + t.label + '</div>'
    + '<div class="week-tile-val">' + t.val + '</div>'
    + '<div class="week-tile-delta">' + t.delta + '</div></div>').join('');
}

/* ---- 每日小结 ---- */
function factTile(label, val, sub) {
  return '<div class="week-tile"><div class="week-tile-label">' + label + '</div>'
    + '<div class="week-tile-val">' + val + '</div>'
    + '<div class="week-tile-delta">' + sub + '</div></div>';
}
function renderDailySummary() {
  const s = state.settings;
  const { day, eaten, target, net, burnV } = dayData(currentKey);
  $('dailyTitle').textContent = (currentKey === todayKey() ? '今日小结' : '当天小结') + ' · ' + mdKey(currentKey);

  // 三餐构成条
  const mealsByType = MEAL_TYPES.map((t) => ({
    t,
    sum: day.meals.filter((m) => m.type === t.id).reduce((a, m) => a + (Number(m.kcal) || 0), 0),
  }));
  const total = mealsByType.reduce((a, x) => a + x.sum, 0);
  const seg = $('mealSegBar');
  if (!total) {
    seg.innerHTML = '<div class="empty-note" style="padding:8px 0">今天还没有记录饮食</div>';
    $('mealSegLegend').innerHTML = '';
  } else {
    seg.innerHTML = mealsByType.map((m, i) => {
      if (!m.sum) return '';
      const share = m.sum / total * 100;
      const label = share >= 12 ? Math.round(share) + '%' : '';
      const txtColor = i === 3 ? '#0b0b0b' : '#fff';
      return '<div class="seg-part" style="flex:' + m.sum + ' 0 0;background:' + cssVar('--meal-' + (i + 1)) + ';color:' + txtColor + '">' + label + '</div>';
    }).join('');
    $('mealSegLegend').innerHTML = mealsByType.map((m, i) => m.sum
      ? '<span class="legend-item"><span class="swatch" style="background:' + cssVar('--meal-' + (i + 1)) + '"></span>'
        + m.t.name + ' ' + fmtInt(m.sum) + '（' + Math.round(m.sum / total * 100) + '%）</span>'
      : '').join('');
  }

  // 数字卡片
  const w = Math.max(0, Math.round(Number(day.water) || 0));
  $('dailyFacts').innerHTML =
    factTile('摄入', fmtInt(eaten) + ' 千卡', s ? '目标 ' + fmtInt(target) + ' 千卡' : '')
    + factTile('步数', fmtInt(day.steps || 0), day.steps ? '约消耗 ' + fmtInt(burnV) + ' 千卡' : '')
    + factTile('喝水', w + ' 杯', w ? fmtInt(w * 250) + ' ml' : '')
    + factTile('净差', s ? ((net <= 0 ? '−' : '+') + fmtInt(Math.abs(net)) + ' 千卡') : '–', '');

  // 结语
  let verdict;
  if (!s) {
    verdict = '<span class="neutral">设置基本信息后，这里会生成每天的小结</span>';
  } else if (!eaten) {
    verdict = '<span class="neutral">今天还没有记录，从第一口开始 💪</span>';
  } else if (eaten <= target) {
    verdict = '<span class="good">✓ 今天摄入 ' + fmtInt(eaten) + ' 千卡，没有超出目标，做得很棒 🎉</span>';
  } else {
    verdict = '<span class="bad">⚠ 今天超出目标 ' + fmtInt(eaten - target) + ' 千卡，没关系，明天找回节奏就好</span>';
  }
  $('dailyVerdict').innerHTML = verdict;
}
function copySummary() {
  const { day, eaten, target, net } = dayData(currentKey);
  const lines = ['📋 轻卡日记 · ' + currentKey + ' 小结'];
  lines.push('摄入 ' + fmtInt(eaten) + ' 千卡' + (state.settings ? '（目标 ' + fmtInt(target) + '）' : ''));
  const parts = MEAL_TYPES.map((t) => {
    const sum = day.meals.filter((m) => m.type === t.id).reduce((a, m) => a + (Number(m.kcal) || 0), 0);
    return sum ? t.name + ' ' + fmtInt(sum) : null;
  }).filter(Boolean);
  if (parts.length) lines.push(parts.join(' · '));
  let p = 0, c = 0, f = 0;
  day.meals.forEach((m) => { p += Number(m.p) || 0; c += Number(m.c) || 0; f += Number(m.f) || 0; });
  if (p + c + f > 0) lines.push('蛋白质 ' + fmtInt(p) + 'g · 碳水 ' + fmtInt(c) + 'g · 脂肪 ' + fmtInt(f) + 'g');
  if (day.steps) lines.push('步数 ' + fmtInt(day.steps) + '（约消耗 ' + fmtInt(stepBurnOf(day.steps, state.settings)) + ' 千卡）');
  if (day.water) lines.push('喝水 ' + day.water + ' 杯（' + fmtInt(day.water * 250) + ' ml）');
  if (state.settings && eaten) {
    lines.push('净差 ' + (net <= 0 ? '−' : '+') + fmtInt(Math.abs(net)) + ' 千卡 ' + (eaten <= target ? '✓ 达标' : '⚠ 超出目标'));
  }
  const text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => toast('小结已复制，可以粘贴分享'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); toast('小结已复制，可以粘贴分享'); }
  catch (e) { toast('复制失败'); }
  ta.remove();
}

/* ---- 三大营养素 ---- */
function renderMacros() {
  const s = state.settings;
  const { day, target } = dayData(currentKey);
  let p = 0, c = 0, f = 0, fib = 0;
  day.meals.forEach((m) => { p += Number(m.p) || 0; c += Number(m.c) || 0; f += Number(m.f) || 0; fib += Number(m.fib) || 0; });

  if (!s) {
    $('macroBar').innerHTML = '';
    $('macroRows').innerHTML = '';
    $('macroNote').textContent = '设置身高体重后，这里会按你的目标热量自动给出三大营养素目标';
    return;
  }

  const protT = Math.round(s.weight * 1.2);
  const fatT = Math.max(20, Math.round(target * 0.3 / 9));
  const carbT = Math.max(0, Math.round((target - protT * 4 - fatT * 9) / 4));
  const fibT = 25;
  const kcalP = p * 4, kcalC = c * 4, kcalF = f * 9;
  const tot = kcalP + kcalC + kcalF;

  if (tot > 0) {
    const parts = [[kcalP, '--macro-p'], [kcalC, '--macro-c'], [kcalF, '--macro-f']];
    $('macroBar').innerHTML = parts.map(([v, col]) => {
      const share = v / tot * 100;
      return '<div class="seg-part" style="flex:' + v + ' 0 0;background:' + cssVar(col) + ';color:#fff">' + (share >= 12 ? Math.round(share) + '%' : '') + '</div>';
    }).join('');
  } else {
    $('macroBar').innerHTML = '<div class="empty-note" style="padding:6px 0">今天还没有记录</div>';
  }

  const rows = [
    ['蛋白质', p, protT, '--macro-p'],
    ['碳水', c, carbT, '--macro-c'],
    ['脂肪', f, fatT, '--macro-f'],
    ['膳食纤维', fib, fibT, ''],
  ];
  $('macroRows').innerHTML = rows.map(([label, v, tgt, col]) => {
    const pct = tgt > 0 ? Math.min(v / tgt * 100, 100) : 0;
    return '<div class="macro-row"><div class="macro-row-head"><span class="macro-label">' + label + '</span>'
      + '<span class="macro-val">' + fmtInt(v) + ' / ' + fmtInt(tgt) + ' g</span></div>'
      + '<div class="meter mini"><div class="meter-fill" style="width:' + pct + '%;background:' + (col ? cssVar(col) : cssVar('--accent')) + '"></div></div></div>';
  }).join('');
  $('macroNote').textContent = '目标：蛋白质 1.2g/kg（减脂期建议 1.2–1.6g/kg，中国营养学会 2023）· 脂肪 30% 目标热量 · 膳食纤维 25g/天。';
}

/* ---- 代谢评估 ---- */
function nearestWeight(key) {
  for (let off = 0; off <= 3; off++) {
    for (const sgn of (off === 0 ? [0] : [-1, 1])) {
      const d = parseKey(key); d.setDate(d.getDate() + sgn * off);
      const day = state.days[dateKey(d)];
      if (day && day.weight != null) return day.weight;
    }
  }
  return null;
}
function renderMeta() {
  const box = $('metaBody');
  const s = state.settings;
  if (!s) {
    box.innerHTML = '<div class="empty-note" style="padding:6px 0">设置基本信息并记录一段时间后，这里会评估你的代谢状态</div>';
    return;
  }
  const loggedKeys = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = dateKey(d);
    if (dayData(k).day.meals.length > 0) loggedKeys.push(k);
  }
  if (loggedKeys.length < 14) {
    box.innerHTML = '<div class="empty-note" style="padding:6px 0">连续记录饮食满 14 天（最好同时记录体重），这里会评估你的代谢状态</div>';
    return;
  }
  loggedKeys.sort();
  const first = loggedKeys[0], last = loggedKeys[loggedKeys.length - 1];
  const daysCount = Math.round((parseKey(last) - parseKey(first)) / 86400000) + 1;
  let totalIntake = 0, totalPred = 0;
  loggedKeys.forEach((k) => { const dd = dayData(k); totalIntake += dd.eaten; totalPred += dd.totalOut; });

  const lines = [];
  const wFirst = nearestWeight(first), wLast = nearestWeight(last);
  if (wFirst != null && wLast != null) {
    const observed = (totalIntake - (wLast - wFirst) * KCAL_PER_KG_FAT) / daysCount;
    const predicted = totalPred / loggedKeys.length;
    const ratio = observed / predicted;
    const gapPct = Math.round((1 - ratio) * 100);
    lines.push('<div class="trend-line">实测日均消耗 <b>' + fmtInt(observed) + '</b> 千卡 · 公式预测 <b>' + fmtInt(predicted) + '</b> 千卡</div>');
    if (ratio >= 0.85) {
      lines.push('<div class="trend-line"><span class="delta-down">✓ 代谢正常：实测与预测差距 ' + Math.abs(gapPct) + '%，在 ±15% 范围内</span></div>');
    } else {
      lines.push('<div class="trend-line"><span class="delta-up">⚠ 代谢偏低：实测比预测低 ' + gapPct + '%，可能存在代谢适应（长期节食的常见反应）</span></div>');
      lines.push('<div class="trend-note" style="margin-top:4px">建议：① 每天多摄入 100–200 千卡，逐步恢复（反向节食）② 蛋白质吃到 1.2–1.6g/kg ③ 每周 2–3 次力量训练保住肌肉 ④ 睡眠 7–9 小时 ⑤ 不要长期低于 1200 千卡</div>');
    }
  } else {
    lines.push('<div class="trend-line">记录体重后，这里会对比「实测 vs 公式预测」的每日消耗</div>');
  }

  let sum7 = 0, n7 = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dd = dayData(dateKey(d));
    if (dd.day.meals.length > 0) { sum7 += dd.eaten; n7++; }
  }
  if (n7 >= 4 && sum7 / n7 < 1200) {
    lines.push('<div class="trend-line"><span class="delta-up">⚠ 近7天日均摄入仅 ' + fmtInt(sum7 / n7) + ' 千卡，长期低于基础代谢可能压低代谢、流失肌肉</span></div>');
  }

  lines.push('<div class="trend-note">实测消耗用「摄入 + 体重变化」反推（自适应TDEE法，与 MacroFactor 同思路），数据越多越准。基础代谢随体重下降而下降是正常现象；比同体重者的预测值还低很多，才是代谢适应。</div>');
  box.innerHTML = lines.join('');
}

/* ---- 趋势推测 ---- */
function renderTrend() {
  const box = $('trendBody');
  const now = new Date();
  const series = getWeightSeries();
  const pts = [];
  for (const p of series) {
    const daysAgo = Math.floor((now.getTime() - parseKey(p.k).getTime()) / 86400000);
    if (daysAgo >= 0 && daysAgo <= 30) pts.push({ x: daysAgo, y: p.w });
  }
  pts.reverse(); // 按时间升序

  // 体重走势：近30天记录做线性回归（≥3个点且跨度≥7天），否则首尾估算法
  let wMonthly = null;
  if (pts.length >= 3 && (pts[pts.length - 1].x - pts[0].x) >= 7) {
    let sx = 0, sy = 0, sxy = 0, sxx = 0;
    pts.forEach((p) => { sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; });
    const slope = (pts.length * sxy - sx * sy) / (pts.length * sxx - sx * sx);
    if (isFinite(slope)) wMonthly = slope * 30.44;
  } else if (pts.length >= 2 && (pts[pts.length - 1].x - pts[0].x) >= 5) {
    const a = pts[0], b = pts[pts.length - 1];
    wMonthly = (b.y - a.y) / (b.x - a.x) * 30.44;
  }

  // 热量缺口：近7天有记录日的净差均值，理论推算
  let cMonthly = null;
  if (state.settings) {
    const nets = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dd = dayData(dateKey(d));
      if (dd.day.meals.length > 0) nets.push(dd.net);
    }
    if (nets.length) cMonthly = nets.reduce((a, b) => a + b, 0) / nets.length * 30.44 / KCAL_PER_KG_FAT;
  }

  const lines = [];
  const bandCls = (v) => (v <= -0.05 ? 'delta-down' : (v >= 0.05 ? 'delta-up' : ''));
  if (wMonthly != null && isFinite(wMonthly)) {
    const arrow = wMonthly <= -0.05 ? '📉 会瘦' : (wMonthly >= 0.05 ? '📈 会胖' : '➖ 基本持平');
    lines.push('<div class="trend-line">按体重走势（近30天实测）：' + arrow + ' 每月约 <b class="' + bandCls(wMonthly) + '">' + (wMonthly <= 0 ? '−' : '+') + Math.abs(wMonthly).toFixed(1) + ' kg</b></div>');
  }
  if (cMonthly != null && isFinite(cMonthly)) {
    const arrow = cMonthly <= -0.05 ? '📉 会瘦' : (cMonthly >= 0.05 ? '📈 会胖' : '➖ 基本持平');
    lines.push('<div class="trend-line">按热量缺口（近7天均值）：' + arrow + ' 每月约 <b class="' + bandCls(cMonthly) + '">' + (cMonthly <= 0 ? '−' : '+') + Math.abs(cMonthly).toFixed(1) + ' kg</b></div>');
  }
  if (state.settings && state.settings.goalWeight != null && wMonthly != null && wMonthly < -0.05 && series.length) {
    const remain = series[0].w - state.settings.goalWeight;
    if (remain > 0) {
      lines.push('<div class="trend-line">🎯 按这个速度，减到目标 ' + state.settings.goalWeight + ' kg 还需约 <b>' + Math.max(1, Math.round(remain / -wMonthly)) + ' 个月</b></div>');
    }
  }

  if (!lines.length) {
    box.innerHTML = '<div class="empty-note" style="padding:6px 0">连续记录体重和饮食几天后，这里会推测你一个月能瘦/胖多少</div>';
    return;
  }
  lines.push('<div class="trend-note">体重走势来自真实称重，更可靠；热量缺口是理论推算，两者接近说明记录得准。体重会因水分、盐分波动，看趋势别盯单日。</div>');
  box.innerHTML = lines.join('');
}

function getWeightSeries() {
  const out = [];
  for (const k of Object.keys(state.days).sort().reverse()) {
    const w = state.days[k].weight;
    if (w != null) out.push({ k, w });
  }
  return out;
}

/* ==================== 图表 ==================== */
function setupCanvas(cv) {
  const rect = cv.getBoundingClientRect();
  if (rect.width < 10) return null;
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(rect.width * dpr);
  cv.height = Math.round(rect.height * dpr);
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  return { ctx, W: rect.width, H: rect.height };
}
function drawBar(ctx, x, yTop, w, baselineY, color, dataEnd) {
  const h = baselineY - yTop;
  if (h <= 0) return;
  const r = Math.min(4, w / 2, h);
  ctx.fillStyle = color;
  ctx.beginPath();
  if (dataEnd === 'bottom') {
    // 数据端在下方：下端圆角，基线端方角
    ctx.moveTo(x, yTop);
    ctx.lineTo(x + w, yTop);
    ctx.lineTo(x + w, baselineY - r);
    ctx.arcTo(x + w, baselineY, x + w - r, baselineY, r);
    ctx.arcTo(x, baselineY, x, baselineY - r, r);
    ctx.lineTo(x, baselineY - r);
  } else {
    ctx.moveTo(x, yTop + r);
    ctx.arcTo(x, yTop, x + r, yTop, r);
    ctx.arcTo(x + w, yTop, x + w, yTop + r, r);
    ctx.lineTo(x + w, baselineY);
    ctx.lineTo(x, baselineY);
  }
  ctx.closePath();
  ctx.fill();
}

/* 近7天净差图：一天一根柱子，零线为界，向下蓝=有缺口，向上红=有盈余 */
function drawWeekly() {
  const cv = $('weeklyChart');
  const setup = setupCanvas(cv);
  if (!setup) return;
  const { ctx, W, H } = setup;
  const s = state.settings;
  const blue = cssVar('--heat-blue'), red = cssVar('--heat-red');
  const ink = cssVar('--ink'), ink2 = cssVar('--ink2'), muted = cssVar('--muted'), hair = cssVar('--hair'), axis = cssVar('--axis');

  const keys = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); keys.push(dateKey(d)); }
  const data = keys.map((k) => {
    const dd = dayData(k);
    return { k, inV: dd.eaten, outV: dd.totalOut, net: dd.net, hasData: dd.day.meals.length > 0 };
  });
  const deficit = s ? (Number(s.deficit) || 500) : null;
  let loV = 0, hiV = 0;
  data.forEach((d) => { if (d.hasData) { loV = Math.min(loV, d.net); hiV = Math.max(hiV, d.net); } });
  if (deficit) loV = Math.min(loV, -deficit * 1.15);
  const loN = -niceCeil(Math.max(200, -loV));
  const hiN = niceCeil(Math.max(300, hiV));
  const padL = 40, padR = 8, padT = 16, padB = 22;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const y = (v) => padT + plotH * (1 - (v - loN) / (hiN - loN));
  const zeroY = y(0);

  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  [loN, loN / 2, 0, hiN / 2, hiN].forEach((v) => {
    const yy = y(v);
    ctx.strokeStyle = v === 0 ? axis : hair;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(W - padR, yy); ctx.stroke();
    ctx.fillStyle = v === 0 ? ink2 : muted;
    ctx.fillText(fmtInt(v), padL - 6, yy);
  });

  // 目标缺口参考线
  if (deficit) {
    const goalY = y(-deficit);
    ctx.strokeStyle = axis;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, goalY); ctx.lineTo(W - padR, goalY); ctx.stroke();
    ctx.fillStyle = muted;
    ctx.textAlign = 'left';
    ctx.fillText('目标 −' + fmtInt(deficit), padL + 2, goalY - 7);
  }

  const groupW = plotW / 7;
  const barW = Math.min(18, groupW * 0.5);
  const isToday = keys[6] === todayKey();
  data.forEach((d, i) => {
    const cx = padL + groupW * i + groupW / 2;
    const x = cx - barW / 2;
    if (!d.hasData) {
      // 未记录：淡色小横线
      ctx.strokeStyle = hair;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - 3, zeroY); ctx.lineTo(cx + 3, zeroY); ctx.stroke();
    } else if (d.net === 0) {
      ctx.fillStyle = muted;
      ctx.beginPath(); ctx.arc(cx, zeroY, 3, 0, Math.PI * 2); ctx.fill();
    } else {
      const v = d.net;
      const top = v < 0 ? zeroY : y(v);
      const bottom = v < 0 ? y(v) : zeroY;
      drawBar(ctx, x, top, barW, bottom, v < 0 ? blue : red, v < 0 ? 'bottom' : 'top');
      if (i === 6 && isToday) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillStyle = ink2;
        const labelY = v < 0 ? Math.min(y(v) + 14, H - padB - 4) : Math.max(y(v) - 3, padT + 10);
        ctx.fillText(fmtInt(v), cx, labelY);
      }
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = (i === 6 && isToday ? '700 ' : '') + '11px system-ui, sans-serif';
    ctx.fillStyle = (i === 6 && isToday) ? ink : muted;
    ctx.fillText(i === 6 && isToday ? '今' : weekLabel(d.k), cx, H - padB + 6);
  });
  cv._layout = { padL, plotW, groupW, data };
}

function drawWeight() {
  const cv = $('weightChart');
  const setup = setupCanvas(cv);
  if (!setup) return;
  const { ctx, W, H } = setup;
  const outC = cssVar('--series-out');
  const ink2 = cssVar('--ink2'), muted = cssVar('--muted'), hair = cssVar('--hair'), axis = cssVar('--axis'), surface = cssVar('--card');

  const pts = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const day = state.days[dateKey(d)];
    if (day && day.weight != null) pts.push({ k: dateKey(d), w: day.weight });
  }
  cv._layout = null;
  if (pts.length < 2) {
    ctx.fillStyle = muted;
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('连续记录几天，这里会出现你的体重曲线', W / 2, H / 2);
    return;
  }

  const ws = pts.map((p) => p.w);
  const min = Math.min(...ws), max = Math.max(...ws);
  let span = max - min;
  if (span < 0.4) span = 0.4;
  const step = niceCeil(span / 3);
  const lo = Math.floor((min - (span * 0.15)) / step) * step;
  const hi = lo + step * 3 + step; // 4 条网格线
  const padL = 38, padR = 48, padT = 12, padB = 22;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const x = (i) => padL + (pts.length === 1 ? plotW / 2 : plotW * i / (pts.length - 1));
  const y = (v) => padT + plotH * (1 - (v - lo) / (hi - lo));

  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 3; i++) {
    const v = lo + step * i;
    if (v < lo - step / 2 || v > hi + step / 2) continue;
    ctx.strokeStyle = v === lo ? axis : hair;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, y(v)); ctx.lineTo(W - padR, y(v)); ctx.stroke();
    ctx.fillStyle = muted;
    ctx.fillText(v.toFixed(1), padL - 6, y(v));
  }

  ctx.strokeStyle = outC;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => { i === 0 ? ctx.moveTo(x(i), y(p.w)) : ctx.lineTo(x(i), y(p.w)); });
  ctx.stroke();

  // 端点标记：8px 圆点 + 2px 表面色描边
  const ex = x(pts.length - 1), ey = y(pts[pts.length - 1].w);
  ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2);
  ctx.fillStyle = outC; ctx.fill();
  ctx.strokeStyle = surface; ctx.lineWidth = 2; ctx.stroke();

  // 端点数值直接标注
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillStyle = ink2;
  const label = pts[pts.length - 1].w.toFixed(1) + ' kg';
  if (ex + 60 < W) { ctx.textAlign = 'left'; ctx.fillText(label, ex + 8, ey + 4); }
  else { ctx.textAlign = 'right'; ctx.fillText(label, ex - 8, ey + 4); }

  // 首尾日期
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = muted;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText(mdKey(pts[0].k), padL, H - padB + 6);
  ctx.textAlign = 'right';
  ctx.fillText(mdKey(pts[pts.length - 1].k), W - padR, H - padB + 6);

  cv._layout = { pts, x, padL, padR, plotW };
}

/* 近12周热量缺口热力图：蓝=有缺口（减脂），红=有盈余，灰=持平，越深偏离越大 */
function drawHeatmap() {
  const cv = $('heatChart');
  const setup = setupCanvas(cv);
  if (!setup) return;
  const { ctx, W, H } = setup;
  const s = state.settings;
  cv._layout = null;
  if (!s) {
    ctx.fillStyle = cssVar('--muted');
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('设置基本信息后，这里会显示每天的热量缺口热力图', W / 2, H / 2);
    return;
  }
  const surface = cssVar('--card');
  const blue = cssVar('--heat-blue'), red = cssVar('--heat-red'), mid = cssVar('--heat-mid');
  const hair = cssVar('--hair'), muted = cssVar('--muted'), ink = cssVar('--ink');
  const blueSteps = [0.35, 0.7, 1].map((t) => hexMix(surface, blue, t));
  const redSteps = [0.35, 0.7, 1].map((t) => hexMix(surface, red, t));

  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const weeks = [];
  for (let w = 11; w >= 0; w--) {
    const start = new Date(now);
    start.setDate(now.getDate() - dow - w * 7);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      days.push(dateKey(d));
    }
    weeks.push(days);
  }
  const today = todayKey();
  const padL = 26, padT = 4, padR = 8, padB = 18, gap = 2;
  const cell = Math.min(13, Math.floor((H - padT - padB - gap * 6) / 7), Math.floor((W - padL - padR - gap * 11) / 12));
  if (cell < 4) return;
  const gridW = cell * 12 + gap * 11;
  const x0 = padL + (W - padL - padR - gridW) / 2;
  const y0 = padT;

  const colorFor = (k) => {
    const day = state.days[k];
    if (!day || !day.meals.length || day.meals.every((m) => !(Number(m.kcal) > 0))) return null;
    const dd = dayData(k);
    const r = dd.target > 0 ? dd.net / dd.target : 0;
    const a = Math.abs(r);
    if (a <= 0.05) return mid;
    const idx = a <= 0.15 ? 0 : (a <= 0.3 ? 1 : 2);
    return r < 0 ? blueSteps[idx] : redSteps[idx];
  };

  weeks.forEach((days, col) => {
    days.forEach((k, row) => {
      if (k > today) return;
      const x = x0 + col * (cell + gap);
      const y = y0 + row * (cell + gap);
      const c = colorFor(k);
      ctx.fillStyle = c || hair;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, cell, cell, 3);
      else ctx.rect(x, y, cell, cell);
      ctx.fill();
    });
  });

  // 左侧星期标注
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillStyle = muted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  [0, 2, 4, 6].forEach((row) => {
    ctx.fillText(['一', '二', '三', '四', '五', '六', '日'][row], x0 - 5, y0 + row * (cell + gap) + cell / 2);
  });
  // 底部日期标注
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  [0, 4, 8, 11].forEach((col) => {
    ctx.fillStyle = col === 11 ? ink : muted;
    ctx.fillText(mdKey(weeks[col][0]), x0 + col * (cell + gap) + cell / 2, y0 + 7 * (cell + gap) - gap + 4);
  });
  cv._layout = { x0, y0, cell, weeks };
}

function drawCharts() { drawWeekly(); drawWeight(); drawHeatmap(); }

function showTooltip(cx, cy, text) {
  const t = $('tooltip');
  t.textContent = text;
  t.classList.remove('hidden');
  t.style.left = Math.min(Math.max(cx, 70), window.innerWidth - 70) + 'px';
  t.style.top = Math.max(cy - 10, 40) + 'px';
}
function hideTooltip() { $('tooltip').classList.add('hidden'); }

/* ==================== 弹层 ==================== */
let sheetHideTimer = null;
function openSheet(html) {
  clearTimeout(sheetHideTimer);
  $('sheet').innerHTML = html;
  $('sheet').classList.remove('hidden');
  void $('sheet').offsetHeight; // 强制重排，保证滑入动画生效
  $('sheet').classList.add('open');
  $('backdrop').classList.remove('hidden');
}
function closeSheet() {
  $('sheet').classList.remove('open');
  $('backdrop').classList.add('hidden');
  sheetHideTimer = setTimeout(() => $('sheet').classList.add('hidden'), 260);
}
function sheetHead(title, extra) {
  return '<div class="sheet-head"><div class="sheet-title">' + title + '</div>'
    + '<div class="sheet-head-right">' + (extra || '')
    + '<button class="sheet-close" data-action="close" aria-label="关闭">✕</button></div></div>';
}

/* ---- 首次设置 ---- */
function openSetupSheet() {
  if (!state.settings) formSex = 'male';
  const s = state.settings || { sex: 'male', height: 170, weight: 80, age: 30, deficit: 500 };
  openSheet(
    sheetHead('先设置基本信息')
    + '<div class="setting-note" style="margin-top:0">用来计算基础代谢和每日目标，之后随时可在 ⚙️ 设置里修改。</div>'
    + '<div class="field-label">性别</div>'
    + '<div class="seg-row">'
    + '<button class="seg-btn' + (s.sex === 'male' ? ' active' : '') + '" data-action="sex" data-sex="male">男</button>'
    + '<button class="seg-btn' + (s.sex === 'female' ? ' active' : '') + '" data-action="sex" data-sex="female">女</button>'
    + '</div>'
    + '<div class="field-label">身高（cm）</div>'
    + '<input class="field" id="setHeight" type="number" inputmode="decimal" value="' + s.height + '" min="100" max="250">'
    + '<div class="field-label">体重（kg）</div>'
    + '<input class="field" id="setWeight" type="number" inputmode="decimal" value="' + s.weight + '" min="30" max="300" step="0.1">'
    + '<div class="field-label">年龄</div>'
    + '<input class="field" id="setAge" type="number" inputmode="numeric" value="' + s.age + '" min="10" max="100">'
    + '<div class="field-label">减重节奏（每日热量缺口目标）</div>'
    + '<select class="field" id="setGoal">'
    + GOALS.map((g) => '<option value="' + g.v + '"' + (s.deficit === g.v ? ' selected' : '') + '>' + g.label + '</option>').join('')
    + '</select>'
    + '<button class="primary-btn" data-action="setup-save">开始使用 💪</button>'
  );
  formSex = s.sex;
}

function setupSave() {
  const height = clampNum($('setHeight').value, 100, 250, 170);
  const weight = clampNum($('setWeight').value, 30, 300, 80);
  const age = clampNum($('setAge').value, 10, 100, 30);
  const deficit = Number($('setGoal').value) || 500;
  state.settings = { sex: formSex, height, weight, age, goalWeight: null, deficit, theme: 'auto', stepKcal: STEP_KCAL_PER_KG };
  save();
  closeSheet();
  render();
  toast('设置好了，今天就开始记录吧 💪');
}

/* ---- 添加食物 ---- */
function foodChipHTML(name, kcal, label) {
  return '<button class="food-chip" data-action="add-food" data-food="' + escapeHtml(name) + '">'
    + '<span>' + escapeHtml(name) + '</span>'
    + '<span class="chip-kcal">' + kcal + ' 千卡' + (label ? ' · ' + escapeHtml(label) : '') + '</span></button>';
}
function renderFoodCats(q) {
  const box = $('foodCats');
  const cats = [];
  for (const c of FOOD_LIB) {
    const items = c.items.filter((it) => !q || it[0].includes(q));
    if (items.length) cats.push({ cat: c.cat, items });
  }
  const custom = Object.values(state.customFoods || {}).filter((f) => !q || f.name.includes(q));
  if (custom.length) cats.push({ cat: '自定义', items: custom.map((f) => [f.name, f.kcal100 != null ? f.kcal100 : f.kcal, 0, 0, 0, 0, f.defG || 100, f.label || '1份']) });
  if (!cats.length) {
    box.innerHTML = '<div class="empty-note">没有找到「' + escapeHtml(q) + '」，可以在下方自定义</div>';
    return;
  }
  box.innerHTML = cats.map((c) =>
    '<div class="chip-group-title">' + c.cat + '</div>'
    + '<div class="chip-wrap">' + c.items.map((it) => foodChipHTML(it[0], Math.round(it[1] * it[6] / 100), it[7])).join('') + '</div>'
  ).join('');
}
function openAddSheet(type) {
  selectedMealType = type;
  const t = MEAL_TYPES.find((x) => x.id === type);
  const recent = (state.recent || []).map((n) => allFoods()[n]).filter(Boolean);
  openSheet(
    sheetHead('添加 · ' + t.icon + t.name, '<button class="scan-btn" data-action="scan">📷 扫码</button>')
    + '<input class="field search-field" id="foodSearch" type="search" placeholder="搜索食物，比如：米饭" autocomplete="off">'
    + (recent.length
        ? '<div class="chip-group-title">最近</div><div class="chip-wrap">'
          + recent.map((f) => foodChipHTML(f.name, Math.round((f.kcal100 || 0) * (f.defG || 100) / 100), f.label)).join('') + '</div>'
        : '')
    + '<div id="comboBox"></div>'
    + '<div id="foodCats"></div>'
    + '<button class="secondary-btn" style="margin-top:14px" data-action="save-combo">💾 把今天这一餐存为套餐</button>'
    + '<div class="chip-group-title">自定义食物（按每100克）</div>'
    + '<div class="custom-row">'
    + '<input class="field" id="customName" placeholder="食物名称" maxlength="20">'
    + '<input class="field" id="customKcal" type="number" inputmode="decimal" placeholder="热量/100克" min="0">'
    + '</div>'
    + '<input class="field" id="customG" type="number" inputmode="decimal" placeholder="一份约多少克（选填，默认100）" min="1" style="margin-top:8px">'
    + '<div class="field-label">营养素（每100克，选填）</div>'
    + '<div class="custom-row">'
    + '<input class="field" id="customP" type="number" inputmode="decimal" placeholder="蛋白g" min="0">'
    + '<input class="field" id="customC" type="number" inputmode="decimal" placeholder="碳水g" min="0">'
    + '</div><div class="custom-row" style="margin-top:8px">'
    + '<input class="field" id="customF" type="number" inputmode="decimal" placeholder="脂肪g" min="0">'
    + '<input class="field" id="customFib" type="number" inputmode="decimal" placeholder="纤维g" min="0">'
    + '</div>'
    + '<button class="primary-btn" data-action="custom-add">添加并记录</button>'
  );
  renderFoodCats('');
  renderCombos();
  $('foodSearch').addEventListener('input', (e) => renderFoodCats(e.target.value.trim()));
}

/* ---- 克数确认 ---- */
let formKcal100 = 0;
let formDefG = 100;
function openPortionSheet(name) {
  const f = allFoods()[name];
  if (!f) return;
  formKcal100 = Number(f.kcal100) || 0;
  formDefG = f.defG || 100;
  const t = MEAL_TYPES.find((x) => x.id === selectedMealType);
  openSheet(
    sheetHead('记录 · ' + t.icon + t.name)
    + '<div class="portion-food">' + escapeHtml(f.name) + ' <span class="chip-kcal">' + formKcal100 + ' 千卡/100克</span></div>'
    + '<div class="field-label">吃了多少克</div>'
    + '<div class="custom-row"><input class="field" id="gramsInput" type="number" inputmode="decimal" value="' + formDefG + '" min="0">'
    + '<span class="grams-unit">克</span></div>'
    + '<div class="field-label">常用份量</div>'
    + '<div class="quick-chips">'
    + [['0.5', '半份'], ['1', '一份' + (f.label ? ' ' + f.label : '')], ['1.5', '一份半'], ['2', '两份']].map((p) => '<button class="quick-chip" data-action="mult" data-m="' + p[0] + '">×' + p[0] + ' ' + p[1] + '</button>').join('')
    + '</div>'
    + '<div class="portion-result" id="portionResult"></div>'
    + '<div class="setting-note">估重小抄：一拳主食（熟）≈150g · 一掌心瘦肉≈50g · 鸡蛋1个≈50g · 一捧蔬菜≈100g · 一拇指油≈10g。饮料可以直接按毫升填。</div>'
    + '<button class="primary-btn" data-action="confirm-add" data-food="' + escapeHtml(name) + '">添加并记录</button>'
  );
  updatePortionResult();
  $('gramsInput').addEventListener('input', updatePortionResult);
}
function updatePortionResult() {
  const g = Math.max(0, Number($('gramsInput').value) || 0);
  $('portionResult').textContent = fmtInt(Math.round(formKcal100 * g / 100)) + ' 千卡';
}

/* ---- 扫码（本地条码库，识别后离线可用） ---- */
let scanStream = null;
let scanActive = false;
async function startScan() {
  if (!('BarcodeDetector' in window)) {
    toast('此浏览器不支持扫码（需要 Chrome/Edge 较新版本 + HTTPS）');
    return;
  }
  closeSheet();
  try {
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  } catch (e) {
    toast('无法打开摄像头：需要 HTTPS（部署到网上后可用）');
    return;
  }
  scanActive = true;
  $('scanWrap').classList.remove('hidden');
  const video = $('scanVideo');
  video.srcObject = scanStream;
  await video.play();
  const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'] });
  const loop = async () => {
    if (!scanActive) return;
    try {
      const codes = await detector.detect(video);
      if (codes.length) {
        stopScan();
        onBarcode(codes[0].rawValue);
        return;
      }
    } catch (e) { /* 继续扫 */ }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function stopScan() {
  scanActive = false;
  if (scanStream) { scanStream.getTracks().forEach((t) => t.stop()); scanStream = null; }
  $('scanWrap').classList.add('hidden');
  const v = $('scanVideo');
  if (v) v.srcObject = null;
}
function onBarcode(code) {
  const name = state.barcodes && state.barcodes[code];
  if (name && allFoods()[name]) {
    toast('已识别：' + name);
    openPortionSheet(name);
    return;
  }
  openScanForm(code);
}
function openScanForm(code) {
  openSheet(
    sheetHead('登记包装食品')
    + '<div class="setting-note" style="margin-top:0">条码 ' + escapeHtml(code) + ' 是第一次扫到，按包装背面的「营养成分表」填一次（每100克数值），以后扫同款直接识别。数据只存本机。</div>'
    + '<div class="field-label">食物名称</div>'
    + '<input class="field" id="scanName" placeholder="比如：某品牌无糖酸奶" maxlength="30">'
    + '<div class="field-label">热量（千卡/100克）</div>'
    + '<input class="field" id="scanKcal" type="number" inputmode="decimal" min="0">'
    + '<div class="field-label">营养素（每100克，选填）</div>'
    + '<div class="custom-row">'
    + '<input class="field" id="scanP" type="number" inputmode="decimal" placeholder="蛋白质g" min="0">'
    + '<input class="field" id="scanC" type="number" inputmode="decimal" placeholder="碳水g" min="0">'
    + '</div><div class="custom-row" style="margin-top:8px">'
    + '<input class="field" id="scanF" type="number" inputmode="decimal" placeholder="脂肪g" min="0">'
    + '<input class="field" id="scanFib" type="number" inputmode="decimal" placeholder="纤维g" min="0">'
    + '</div>'
    + '<div class="field-label">一份约多少克（选填，默认100）</div>'
    + '<input class="field" id="scanG" type="number" inputmode="decimal" placeholder="比如 100" min="1">'
    + '<button class="primary-btn" data-action="scan-save" data-code="' + escapeHtml(code) + '">保存并记录</button>'
  );
}
function scanSave(code) {
  const name = $('scanName').value.trim();
  const kcal100 = Math.max(0, Math.round(Number($('scanKcal').value) || 0));
  if (!name) { toast('先填写食物名称'); return; }
  if (!kcal100) { toast('请填写每100克热量（包装营养成分表里有）'); return; }
  const num = (id) => Math.max(0, Number($(id).value) || 0);
  const defG = Math.max(1, Math.round(Number($('scanG').value) || 100));
  if (!state.customFoods) state.customFoods = {};
  state.customFoods[name] = { name, kcal100, p100: num('scanP'), c100: num('scanC'), f100: num('scanF'), fib100: num('scanFib'), defG, label: '1份(' + defG + 'g)' };
  if (!state.barcodes) state.barcodes = {};
  state.barcodes[code] = name;
  save();
  openPortionSheet(name);
  toast('已保存，以后扫同款条码直接识别');
}

/* ---- 套餐 ---- */
function comboName(items) {
  const names = items.map((m) => m.name);
  return names.slice(0, 3).join('+') + (names.length > 3 ? ' 等' : '');
}
function renderCombos() {
  const box = $('comboBox');
  if (!box) return;
  const combos = Object.entries(state.combos || {});
  if (!combos.length) { box.innerHTML = ''; return; }
  box.innerHTML = '<div class="chip-group-title">套餐（一键记录整餐）</div><div class="chip-wrap">'
    + combos.map(([name, items]) => {
      const total = (items || []).reduce((a, it) => a + (Number(it.kcal) || 0), 0);
      return '<div class="food-chip combo-chip" data-action="apply-combo" data-combo="' + escapeHtml(name) + '">'
        + '<span>' + escapeHtml(name) + '</span>'
        + '<span class="chip-kcal">' + fmtInt(total) + ' 千卡 · ' + (items || []).length + ' 样</span>'
        + '<button class="combo-del" data-action="del-combo" data-combo="' + escapeHtml(name) + '" aria-label="删除套餐">✕</button>'
        + '</div>';
    }).join('') + '</div>';
}
function saveCurrentMealAsCombo() {
  const day = state.days[currentKey];
  const items = day ? day.meals.filter((m) => m.type === selectedMealType) : [];
  if (!items.length) { toast('这一餐还没有记录，先去记录再存套餐'); return; }
  if (!state.combos) state.combos = {};
  const name = comboName(items);
  state.combos[name] = items.map((m) => ({
    name: m.name, kcal: Number(m.kcal) || 0, kcal100: m.kcal100,
    p100: m.p100, c100: m.c100, f100: m.f100, fib100: m.fib100,
    p: m.p, c: m.c, f: m.f, fib: m.fib, grams: m.grams,
  }));
  save();
  renderCombos();
  toast('已存为套餐：' + name);
}
function applyCombo(name) {
  const items = state.combos && state.combos[name];
  if (!items || !items.length) return;
  const day = getDay(currentKey);
  items.forEach((it) => day.meals.push({
    id: uid(), name: it.name, kcal: Number(it.kcal) || 0, kcal100: it.kcal100,
    p100: it.p100, c100: it.c100, f100: it.f100, fib100: it.fib100,
    p: it.p, c: it.c, f: it.f, fib: it.fib, grams: it.grams, type: selectedMealType, ts: Date.now(),
  }));
  items.forEach((it) => { state.recent = [it.name, ...(state.recent || []).filter((x) => x !== it.name)].slice(0, 10); });
  save();
  closeSheet();
  render();
  toast('已记录套餐：' + name + '（' + items.length + ' 样）');
}

function addFoodByName(name, grams) {
  const f = allFoods()[name];
  if (!f) return;
  const g = grams || f.defG || 100;
  const mk = (v) => Math.round((Number(v) || 0) * g / 100 * 10) / 10;
  const kcal = Math.round((Number(f.kcal100) || 0) * g / 100);
  const day = getDay(currentKey);
  day.meals.push({
    id: uid(), name: f.name, kcal, kcal100: f.kcal100,
    p100: f.p100, c100: f.c100, f100: f.f100, fib100: f.fib100,
    p: mk(f.p100), c: mk(f.c100), f: mk(f.f100), fib: mk(f.fib100),
    grams: g, type: selectedMealType, ts: Date.now(),
  });
  state.recent = [name, ...(state.recent || []).filter((x) => x !== name)].slice(0, 10);
  save();
  closeSheet();
  render();
  toast('已记录：' + f.name + ' ' + g + '克 · ' + fmtInt(kcal) + ' 千卡');
}
function customAdd() {
  const name = $('customName').value.trim();
  const kcal100 = Math.max(0, Math.round(Number($('customKcal').value) || 0));
  const defG = Math.max(1, Math.round(Number($('customG').value) || 100));
  if (!name) { toast('先填写食物名称'); return; }
  if (!kcal100) { toast('请填写每100克热量'); return; }
  const num = (id) => Math.max(0, Number($(id).value) || 0);
  if (!state.customFoods) state.customFoods = {};
  state.customFoods[name] = { name, kcal100, p100: num('customP'), c100: num('customC'), f100: num('customF'), fib100: num('customFib'), defG, label: '1份(' + defG + 'g)' };
  addFoodByName(name, defG);
}

/* ---- 修改 / 删除 ---- */
function openEditSheet(id) {
  const day = state.days[currentKey];
  if (!day) return;
  const m = day.meals.find((x) => x.id === id);
  if (!m) return;
  let body;
  if (m.kcal100 != null) {
    body = '<div class="field-label">食物名称</div>'
      + '<input class="field" id="editName" value="' + escapeHtml(m.name) + '" maxlength="30">'
      + '<div class="field-label">克数</div>'
      + '<input class="field" id="editGrams" type="number" inputmode="decimal" value="' + (m.grams || '') + '" min="1">'
      + '<div class="setting-note">热量按 ' + m.kcal100 + ' 千卡/100克 自动计算</div>';
  } else {
    body = '<div class="field-label">食物名称</div>'
      + '<input class="field" id="editName" value="' + escapeHtml(m.name) + '" maxlength="30">'
      + '<div class="field-label">热量（千卡）</div>'
      + '<input class="field" id="editKcal" type="number" inputmode="decimal" value="' + m.kcal + '" min="0">';
  }
  openSheet(
    sheetHead('修改记录')
    + body
    + '<div class="btn-row">'
    + '<button class="danger-btn" data-action="edit-del" data-id="' + m.id + '">删除</button>'
    + '<button class="primary-btn" style="margin-top:0" data-action="edit-save" data-id="' + m.id + '">保存</button>'
    + '</div>'
  );
}
function saveEdit(id) {
  const day = state.days[currentKey];
  const m = day && day.meals.find((x) => x.id === id);
  if (!m) return;
  const name = $('editName').value.trim();
  if (!name) { toast('名称不能为空'); return; }
  m.name = name;
  const gInp = $('editGrams');
  if (gInp && m.kcal100 != null) {
    const g = Number(gInp.value);
    if (!g || g <= 0) { toast('请输入有效克数'); return; }
    m.grams = Math.round(g);
    m.kcal = Math.round(m.kcal100 * m.grams / 100);
    const mk = (v) => Math.round((Number(v) || 0) * m.grams / 100 * 10) / 10;
    m.p = mk(m.p100); m.c = mk(m.c100); m.f = mk(m.f100); m.fib = mk(m.fib100);
  } else {
    m.kcal = Math.max(0, Math.round(Number($('editKcal').value) || 0));
  }
  save(); closeSheet(); render();
  toast('已保存');
}
function deleteMeal(id) {
  const day = state.days[currentKey];
  if (!day) return;
  day.meals = day.meals.filter((m) => m.id !== id);
  save(); render();
  toast('已删除');
}

/* ---- 步数 ---- */
function openStepsSheet() {
  const day = state.days[currentKey] || EMPTY_DAY();
  openSheet(
    sheetHead('步数 · ' + $('stepsTitle').textContent)
    + '<div class="field-label">步数</div>'
    + '<input class="field" id="stepsInput" type="number" inputmode="numeric" value="' + (day.steps || '') + '" placeholder="0" min="0">'
    + '<div class="field-label">快速填写</div>'
    + '<div class="quick-chips">'
    + '<button class="quick-chip" data-action="steps-quick" data-v="1000">+1,000</button>'
    + '<button class="quick-chip" data-action="steps-quick" data-v="2000">+2,000</button>'
    + '<button class="quick-chip" data-action="steps-quick" data-v="5000">+5,000</button>'
    + '<button class="quick-chip" data-action="steps-quick" data-v="0">清零</button>'
    + '</div>'
    + '<div class="field-label">其他运动消耗（千卡，选填）</div>'
    + '<input class="field" id="extraInput" type="number" inputmode="decimal" value="' + (day.extra || '') + '" placeholder="比如跑步 300" min="0">'
    + '<div class="setting-note">步数消耗按「步数 × 体重 × 0.0005」估算。当天步数可以在微信运动或手机自带的健康 App 里查看。</div>'
    + '<button class="primary-btn" data-action="save-steps">保存</button>'
  );
}
function stepsQuick(v) {
  const inp = $('stepsInput');
  if (v === 0) { inp.value = '0'; return; }
  inp.value = String(Math.round(Number(inp.value) || 0) + v);
}
function saveSteps() {
  const day = getDay(currentKey);
  day.steps = Math.max(0, Math.round(Number($('stepsInput').value) || 0));
  day.extra = Math.max(0, Math.round(Number($('extraInput').value) || 0));
  save(); closeSheet(); render();
  toast('步数已保存');
}

/* ---- 体重 ---- */
function openWeightSheet() {
  const day = state.days[currentKey] || EMPTY_DAY();
  openSheet(
    sheetHead('记录体重')
    + '<div class="field-label">体重（kg）</div>'
    + '<input class="field" id="weightInput" type="number" inputmode="decimal" step="0.1" value="' + (day.weight != null ? day.weight : '') + '" placeholder="比如 82.5" min="20" max="400">'
    + '<div class="setting-note">建议每天早上空腹称一次。保存后会自动同步用于热量消耗计算。</div>'
    + '<button class="primary-btn" data-action="save-weight">保存</button>'
  );
}
function saveWeight() {
  const w = Number($('weightInput').value);
  if (!w || w < 20 || w > 400) { toast('请输入有效体重'); return; }
  const day = getDay(currentKey);
  day.weight = Math.round(w * 10) / 10;
  if (state.settings) state.settings.weight = day.weight;
  save(); closeSheet(); render();
  toast('体重已记录');
}

/* ---- 设置 ---- */
function openSettingsSheet() {
  const s = state.settings || { sex: 'male', height: 170, weight: 80, age: 30, deficit: 500, theme: 'auto', stepKcal: STEP_KCAL_PER_KG };
  formSex = s.sex;
  openSheet(
    sheetHead('设置')
    + '<div class="field-label">性别</div>'
    + '<div class="seg-row">'
    + '<button class="seg-btn' + (s.sex === 'male' ? ' active' : '') + '" data-action="sex" data-sex="male">男</button>'
    + '<button class="seg-btn' + (s.sex === 'female' ? ' active' : '') + '" data-action="sex" data-sex="female">女</button>'
    + '</div>'
    + '<div class="field-label">身高（cm）</div>'
    + '<input class="field" id="setHeight" type="number" inputmode="decimal" value="' + s.height + '" min="100" max="250">'
    + '<div class="field-label">体重（kg）</div>'
    + '<input class="field" id="setWeight" type="number" inputmode="decimal" value="' + s.weight + '" min="30" max="300" step="0.1">'
    + '<div class="field-label">目标体重（kg，选填）</div>'
    + '<input class="field" id="setGoalW" type="number" inputmode="decimal" step="0.1" value="' + (s.goalWeight != null ? s.goalWeight : '') + '" placeholder="不设置" min="20" max="400">'
    + '<div class="field-label">年龄</div>'
    + '<input class="field" id="setAge" type="number" inputmode="numeric" value="' + s.age + '" min="10" max="100">'
    + '<div class="field-label">减重节奏</div>'
    + '<select class="field" id="setGoal">'
    + GOALS.map((g) => '<option value="' + g.v + '"' + (s.deficit === g.v ? ' selected' : '') + '>' + g.label + '</option>').join('')
    + '</select>'
    + '<div class="field-label">外观</div>'
    + '<select class="field" id="setTheme">'
    + '<option value="auto"' + (s.theme === 'auto' ? ' selected' : '') + '>跟随系统</option>'
    + '<option value="light"' + (s.theme === 'light' ? ' selected' : '') + '>浅色</option>'
    + '<option value="dark"' + (s.theme === 'dark' ? ' selected' : '') + '>深色</option>'
    + '</select>'
    + '<div class="setting-note">当前基础代谢约 ' + fmtInt(bmr(s)) + ' 千卡/天（Mifflin-St Jeor 公式）</div>'
    + '<button class="primary-btn" data-action="settings-save">保存设置</button>'
    + '<button class="secondary-btn" data-action="export">📤 导出备份（JSON 文件）</button>'
    + '<button class="secondary-btn" data-action="import">📥 导入备份</button>'
    + '<input type="file" id="importFile" accept=".json,application/json" class="hidden">'
    + '<button class="danger-btn" style="width:100%" data-action="clear">清空全部记录</button>'
    + '<div class="setting-note">轻卡日记 v1.5 · 数据只存在本机，请定期导出备份。营养素为估算值，仅作参考。</div>'
  );
  $('importFile').addEventListener('change', onImportFile);
}
function settingsSave() {
  const height = clampNum($('setHeight').value, 100, 250, 170);
  const weight = clampNum($('setWeight').value, 30, 300, 80);
  const age = clampNum($('setAge').value, 10, 100, 30);
  const theme = $('setTheme').value;
  const gwRaw = $('setGoalW').value.trim();
  state.settings = {
    sex: formSex, height, weight, age,
    goalWeight: gwRaw === '' ? null : clampNum(gwRaw, 20, 400, null),
    deficit: Number($('setGoal').value) || 500,
    theme, stepKcal: STEP_KCAL_PER_KG,
  };
  applyTheme(theme);
  save(); closeSheet(); render();
  toast('已保存');
}
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '轻卡日记备份-' + todayKey() + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('备份文件已下载');
}
function onImportFile(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const obj = JSON.parse(r.result);
      if (!obj || typeof obj !== 'object' || !obj.days || typeof obj.days !== 'object') {
        toast('备份文件格式不对'); return;
      }
      const n = Object.keys(obj.days).length;
      if (!confirm('将用备份覆盖当前数据（共 ' + n + ' 天记录），确定继续？')) return;
      state = Object.assign(defaultState(), obj);
      save(); closeSheet(); render();
      toast('导入成功');
    } catch (err) { toast('读取失败，文件可能损坏'); }
  };
  r.readAsText(file);
}
function clearData() {
  if (!confirm('确定清空全部记录？此操作无法撤销，建议先导出备份。')) return;
  state.days = {};
  state.customFoods = {};
  state.recent = [];
  save(); closeSheet(); render();
  toast('已清空记录');
}

function clampNum(v, min, max, fallback) {
  const n = Number(v);
  if (!isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
function applyTheme(t) {
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

/* ==================== 弹层事件 ==================== */
function onSheetClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  switch (a) {
    case 'close': closeSheet(); break;
    case 'add-food': openPortionSheet(el.dataset.food); break;
    case 'mult': {
      const m = Number(el.dataset.m);
      $('gramsInput').value = String(Math.round(formDefG * m));
      updatePortionResult();
      break;
    }
    case 'confirm-add': {
      const g = Math.round(Number($('gramsInput').value));
      if (!g || g <= 0) { toast('请输入克数'); return; }
      addFoodByName(el.dataset.food, g);
      break;
    }
    case 'save-combo': saveCurrentMealAsCombo(); break;
    case 'scan': startScan(); break;
    case 'scan-save': scanSave(el.dataset.code); break;
    case 'apply-combo': applyCombo(el.dataset.combo); break;
    case 'del-combo': {
      if (state.combos) delete state.combos[el.dataset.combo];
      save();
      renderCombos();
      break;
    }
    case 'custom-add': customAdd(); break;
    case 'save-steps': saveSteps(); break;
    case 'save-weight': saveWeight(); break;
    case 'edit-save': saveEdit(el.dataset.id); break;
    case 'edit-del': deleteMeal(el.dataset.id); closeSheet(); break;
    case 'steps-quick': stepsQuick(Number(el.dataset.v)); break;
    case 'setup-save': setupSave(); break;
    case 'settings-save': settingsSave(); break;
    case 'sex': {
      formSex = el.dataset.sex;
      $('sheet').querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.sex === formSex));
      break;
    }
    case 'export': exportData(); break;
    case 'import': $('importFile').click(); break;
    case 'clear': clearData(); break;
  }
}

/* ==================== 提示 ==================== */
let toastTimer = null;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  requestAnimationFrame(() => { t.style.opacity = '1'; });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.classList.add('hidden'), 300);
  }, 2000);
}

/* ==================== 事件绑定 ==================== */
function bindEvents() {
  $('btnPrev').addEventListener('click', () => {
    const d = parseKey(currentKey); d.setDate(d.getDate() - 1);
    currentKey = dateKey(d); render();
  });
  $('btnNext').addEventListener('click', () => {
    const d = parseKey(currentKey); d.setDate(d.getDate() + 1);
    currentKey = dateKey(d); render();
  });
  $('dateLabel').addEventListener('click', () => {
    if (currentKey !== todayKey()) { currentKey = todayKey(); render(); }
  });
  $('btnSettings').addEventListener('click', openSettingsSheet);
  $('btnCopySummary').addEventListener('click', copySummary);
  $('cardSteps').addEventListener('click', openStepsSheet);
  $('waterPlus').addEventListener('click', () => changeWater(1));
  $('waterMinus').addEventListener('click', () => changeWater(-1));
  $('waterClear').addEventListener('click', clearWater);
  $('btnWeight').addEventListener('click', openWeightSheet);
  $('backdrop').addEventListener('click', closeSheet);
  $('sheet').addEventListener('click', onSheetClick);
  $('scanCancel').addEventListener('click', stopScan);

  $('mealSections').addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) { openAddSheet(add.dataset.add); return; }
    const rep = e.target.closest('[data-repeat]');
    if (rep) { repeatMeal(rep.dataset.repeat); return; }
    const del = e.target.closest('[data-del]');
    if (del) { deleteMeal(del.dataset.del); return; }
    const edit = e.target.closest('[data-edit]');
    if (edit && !e.target.closest('[data-del]')) openEditSheet(edit.dataset.edit);
  });

  // 图表点击提示
  $('weeklyChart').addEventListener('pointerdown', (e) => {
    const L = $('weeklyChart')._layout;
    if (!L) return;
    const rect = $('weeklyChart').getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.floor((px - L.padL) / L.groupW);
    if (i < 0 || i > 6 || px < L.padL || px > L.padL + L.plotW) return;
    const d = L.data[i];
    if (!d.hasData) {
      showTooltip(e.clientX, e.clientY, d.k + ' 周' + weekLabel(d.k) + '\n未记录');
      return;
    }
    showTooltip(e.clientX, e.clientY,
      d.k + ' 周' + weekLabel(d.k) + '\n摄入 ' + fmtInt(d.inV) + ' 千卡\n消耗 ' + fmtInt(d.outV) + ' 千卡\n净差 ' + (d.net <= 0 ? '−' : '+') + fmtInt(Math.abs(d.net)) + ' 千卡');
  });
  $('weightChart').addEventListener('pointerdown', (e) => {
    const L = $('weightChart')._layout;
    if (!L) return;
    const rect = $('weightChart').getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best = 0, bestD = Infinity;
    L.pts.forEach((p, i) => {
      const d = Math.abs(L.x(i) - px);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (bestD > 40) return;
    const p = L.pts[best];
    showTooltip(e.clientX, e.clientY, p.k + '\n体重 ' + p.w.toFixed(1) + ' kg');
  });
  $('heatChart').addEventListener('pointerdown', (e) => {
    const L = $('heatChart')._layout;
    if (!L) return;
    const rect = $('heatChart').getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const col = Math.floor((px - L.x0) / (L.cell + 2));
    const row = Math.floor((py - L.y0) / (L.cell + 2));
    if (col < 0 || col > 11 || row < 0 || row > 6) return;
    const k = L.weeks[col][row];
    const day = state.days[k];
    let text;
    if (!day || !day.meals.length) {
      text = k + ' 周' + weekLabel(k) + '\n未记录';
    } else {
      const dd = dayData(k);
      text = k + ' 周' + weekLabel(k) + '\n摄入 ' + fmtInt(dd.eaten) + ' 千卡\n目标 ' + fmtInt(dd.target) + ' 千卡\n净差 ' + (dd.net <= 0 ? '−' : '+') + fmtInt(Math.abs(dd.net)) + ' 千卡';
    }
    showTooltip(e.clientX, e.clientY, text);
  });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('canvas')) hideTooltip();
  });

  // 主题变化 / 尺寸变化时重绘图表
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', drawCharts);
  new MutationObserver(drawCharts).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('resize', drawCharts);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) drawCharts(); });
}

/* ==================== 安装到桌面 ==================== */
let deferredPrompt = null;
function bindInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    $('installBtn').classList.remove('hidden');
  });
  $('installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $('installBtn').classList.add('hidden');
  });
  window.addEventListener('appinstalled', () => {
    $('installBtn').classList.add('hidden');
    toast('已安装，可在桌面打开 🎉');
  });
}

/* ==================== 启动 ==================== */
function init() {
  state = loadState() || defaultState();
  currentKey = todayKey();
  bindEvents();
  bindInstall();
  applyTheme(state.settings && state.settings.theme ? state.settings.theme : 'auto');
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  render();
  if (!state.settings) openSetupSheet();
}

init();
