import { Product, Inventory, Order } from '../types/index.js';

// 模拟数据存储
let products: Product[] = [
  { id: 1, name: "华为智能手表", price: 1299, description: "健康监测，运动追踪，支持多种应用" },
  { id: 2, name: "无线蓝牙耳机Pro", price: 899, description: "主动降噪，30小时续航，IPX7防水" },
  { id: 3, name: "便携式移动电源", price: 299, description: "20000mAh大容量，支持快充，轻薄设计" },
  { id: 4, name: "华为MateBook X Pro", price: 1599, description: "14.2英寸全面屏，3:2比例，100% sRGB色域" },
  { id: 5, name: "智能音箱Echo Dot", price: 199, description: " Alexa语音助手，智能音乐播放，支持多设备同步" },
  { id: 6, name: "智能电视4K", price: 6999, description: "4K超高清，智能语音控制，智能家庭娱乐" },
  { id: 7, name: "智能路由器AX", price: 1499, description: "Wi-Fi 6，支持5G网络，支持智能控制" },
  { id: 8, name: "MacBook Pro M3", price: 19999, description: "14英寸Retina显示屏，8核CPU，16GB内存" },
  { id: 9, name: "小米智能摄像机Pro", price: 1999, description: "4K高清视频，运动追踪，支持AI智能分析" },
  { id: 10, name: "智能门锁Pro", price: 199, description: "人脸识别，远程控制，支持指纹解锁" },
  { id: 11, name: "智能音箱Echo Show", price: 299, description: " Alexa语音助手，智能音乐播放，支持多设备同步" },
  { id: 12, name: "海信智能电视5K", price: 4999, description: "5K超高清，智能语音控制，智能家庭娱乐" },
  { id: 13, name: "智能路由器AX Pro", price: 2499, description: "Wi-Fi 6，支持5G网络，支持智能控制" },
  { id: 14, name: "MacBook Air M3", price: 11999, description: "13英寸Retina显示屏，8核CPU，16GB内存" },
];

// 模拟库存数据
let inventory: Inventory[] = [
  { productId: 1, quantity: 100 },
  { productId: 2, quantity: 50 },
  { productId: 3, quantity: 200 },
  { productId: 4, quantity: 150 },
  { productId: 5, quantity: 75 },
  { productId: 6, quantity: 125 },
  { productId: 7, quantity: 80 },
  { productId: 8, quantity: 50 },
  { productId: 9, quantity: 100 },
  { productId: 10, quantity: 150 },
  { productId: 11, quantity: 75 },
  { productId: 12, quantity: 125 },
  { productId: 13, quantity: 80 },
  { productId: 14, quantity: 50 },
];

let orders: Order[] = [];

export async function getProducts(): Promise<Product[]> {
  return products;
}

export async function getInventory(): Promise<Inventory[]> {
  return inventory.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      product
    };
  });
}

export async function getOrders(): Promise<Order[]> {
  return [...orders].sort((a, b) =>
    new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
  );
}

export async function createPurchase(customerName: string, items: { productId: number, quantity: number }[]): Promise<Order> {
  if (!customerName || !items || items.length === 0) {
    throw new Error("请求无效：缺少客户名称或商品");
  }

  let totalAmount = 0;

  // 验证库存并计算总价
  for (const item of items) {
    const inventoryItem = inventory.find(i => i.productId === item.productId);
    const product = products.find(p => p.id === item.productId);

    if (!inventoryItem || !product) {
      throw new Error(`商品ID ${item.productId} 不存在`);
    }

    if (inventoryItem.quantity < item.quantity) {
      throw new Error(`商品 ${product.name} 库存不足. 可用: ${inventoryItem.quantity}`);
    }

    totalAmount += product.price * item.quantity;
  }

  // 创建订单
  const order: Order = {
    id: orders.length + 1,
    customerName,
    items,
    totalAmount,
    orderDate: new Date().toISOString()
  };

  // 更新库存
  items.forEach(item => {
    const inventoryItem = inventory.find(i => i.productId === item.productId)!;
    inventoryItem.quantity -= item.quantity;
  });

  orders.push(order);
  return order;
} 