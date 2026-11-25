export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string; // ex: 'un', 'pct', 'kg', 'cx'
  price: number;
  costPrice?: number;
  currentStock: number;
  minStock: number;
  lastMovementDate: string; // YYYY-MM-DD
  barcode?: string;
  supplierId?: string;
  supplierName?: string;
}

export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'restock' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  date: string; // ISO String
  unitValue: number;
  totalValue: number;
  paymentMethod?: PaymentMethod;
  note?: string;
  actorId?: string;
  actorName?: string;
}

export function calculateDaysSince(dateString: string): number {
  if (!dateString) return 999;
  const parts = dateString.split('-');
  if (parts.length !== 3) return 999;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const past = new Date(year, month, day);
  const now = new Date();
  
  // Zera horas para contar dias corridos
  past.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = now.getTime() - past.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function isStockCritical(currentStock: number, minStock: number): boolean {
  return currentStock <= minStock;
}

export function isStagnant(days: number): boolean {
  return days >= 45;
}

export function getStagnantStatus(days: number): {
  isStagnant: boolean;
  level: 'normal' | 'warning' | 'urgent';
  label: string;
  action: string;
} {
  if (days >= 60) {
    return {
      isStagnant: true,
      level: 'urgent',
      label: `Parado há ${days} dias (Mais de 2 meses!)`,
      action: 'Criar Kit Promocional com Desconto Máximo ou Leve 2 Pague 1'
    };
  }
  if (days >= 45) {
    return {
      isStagnant: true,
      level: 'warning',
      label: `Sem vendas há ${days} dias`,
      action: 'Criar Kit de Festa ou Fazer Promoção com Desconto'
    };
  }
  return {
    isStagnant: false,
    level: 'normal',
    label: `Movimentado há ${days} dias`,
    action: 'Giro regular'
  };
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Arroz Branco Tipo 1 (5kg)',
    category: 'Alimentos',
    unit: 'pct',
    price: 28.90,
    currentStock: 4,
    minStock: 10,
    barcode: '7891000100011',
    lastMovementDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
  },
  {
    id: 'prod-2',
    name: 'Feijão Carioca Especial (1kg)',
    category: 'Alimentos',
    unit: 'pct',
    price: 8.50,
    currentStock: 18,
    minStock: 12,
    barcode: '7891000100028',
    lastMovementDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
  },
  {
    id: 'prod-3',
    name: 'Óleo de Soja 900ml',
    category: 'Alimentos',
    unit: 'un',
    price: 6.90,
    currentStock: 3,
    minStock: 15,
    barcode: '7891000100035',
    lastMovementDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
  },
  {
    id: 'prod-4',
    name: 'Pratos Descartáveis Festa (10 un)',
    category: 'Descartáveis & Festas',
    unit: 'pct',
    price: 4.50,
    currentStock: 25,
    minStock: 8,
    barcode: '7891000100042',
    // 52 dias atrás -> Alerta Amarelo (45-60 dias)
    lastMovementDate: new Date(Date.now() - 52 * 86400000).toISOString().split('T')[0],
  },
  {
    id: 'prod-5',
    name: 'Copos Plásticos 200ml (100 un)',
    category: 'Descartáveis & Festas',
    unit: 'pct',
    price: 7.20,
    currentStock: 30,
    minStock: 10,
    barcode: '7891000100059',
    // 64 dias atrás -> Alerta Urgente (>60 dias)
    lastMovementDate: new Date(Date.now() - 64 * 86400000).toISOString().split('T')[0],
  },
  {
    id: 'prod-6',
    name: 'Guardanapo de Papel Folha Dupla',
    category: 'Descartáveis & Festas',
    unit: 'pct',
    price: 3.80,
    currentStock: 40,
    minStock: 15,
    barcode: '7891000100066',
    // 48 dias atrás -> Alerta Amarelo
    lastMovementDate: new Date(Date.now() - 48 * 86400000).toISOString().split('T')[0],
  },
  {
    id: 'prod-7',
    name: 'Detergente Líquido Neutro 500ml',
    category: 'Limpeza',
    unit: 'un',
    price: 2.70,
    currentStock: 2,
    minStock: 12,
    barcode: '7891000100073',
    lastMovementDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
  },
  {
    id: 'prod-8',
    name: 'Café Torrado e Moído Tradicional 500g',
    category: 'Alimentos',
    unit: 'pct',
    price: 18.90,
    currentStock: 7,
    minStock: 10,
    barcode: '7891000100080',
    lastMovementDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
  }
];
