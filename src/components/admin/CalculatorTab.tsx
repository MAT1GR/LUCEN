import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RotateCcw, Save, Clock, BookOpen } from 'lucide-react';

interface CalculatorRow {
  id: string;
  productName: string;
  costMercaderia: number;
  packaging: number;
  shippingCost: number;
  salePrice: number;
  conversionRate: number;
}

interface SavedCalculation extends CalculatorRow {
  savedAt: string;
  metrics: {
    marginMP: number;
    netProfitMP: number;
    roi: number;
    maxCPA: number;
    minROAS: number;
    maxCPC: number;
  };
}

export const CalculatorTab: React.FC = () => {
  // --- ESTADOS ---
  const [showDefinitions, setShowDefinitions] = useState(false);
  
  const [rows, setRows] = useState<CalculatorRow[]>(() => {
    try {
      const saved = localStorage.getItem('calculator_rows');
      return saved ? JSON.parse(saved) : [{ 
        id: '1', productName: '', costMercaderia: 0, packaging: 0, shippingCost: 0, salePrice: 0, conversionRate: 1.5 
      }];
    } catch (e) {
      return [{ id: '1', productName: '', costMercaderia: 0, packaging: 0, shippingCost: 0, salePrice: 0, conversionRate: 1.5 }];
    }
  });

  const [history, setHistory] = useState<SavedCalculation[]>(() => {
    try {
      const saved = localStorage.getItem('calculator_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Persistencia
  useEffect(() => { localStorage.setItem('calculator_rows', JSON.stringify(rows)); }, [rows]);
  useEffect(() => { localStorage.setItem('calculator_history', JSON.stringify(history)); }, [history]);

  // --- FUNCIONES ---
  const addRow = () => {
    setRows([...rows, {
      id: Date.now().toString(),
      productName: '', costMercaderia: 0, packaging: 0, shippingCost: 0, salePrice: 0, conversionRate: 1.5
    }]);
  };

  const updateRow = (id: string, field: keyof CalculatorRow, value: string | number) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) setRows(rows.filter(r => r.id !== id));
    else setRows([{ id: Date.now().toString(), productName: '', costMercaderia: 0, packaging: 0, shippingCost: 0, salePrice: 0, conversionRate: 1.5 }]);
  };

  const clearAll = () => {
    if(window.confirm('¿Borrar cálculos activos?')) {
        setRows([{ id: Date.now().toString(), productName: '', costMercaderia: 0, packaging: 0, shippingCost: 0, salePrice: 0, conversionRate: 1.5 }]);
    }
  };

  // --- EL CEREBRO MATEMÁTICO ---
  const calculateMetrics = (row: CalculatorRow) => {
    const totalCost = (row.costMercaderia || 0) + (row.packaging || 0) + (row.shippingCost || 0);
    const mpCommission = (row.salePrice || 0) * 0.04;
    const netProfitMP = (row.salePrice || 0) - totalCost - mpCommission;
    const marginMP = row.salePrice > 0 ? netProfitMP / row.salePrice : 0;
    const roi = totalCost > 0 ? (netProfitMP / totalCost) : 0;
    const maxCPA = netProfitMP;
    const minROAS = maxCPA > 0 ? (row.salePrice || 0) / maxCPA : 0;
    const maxCPC = maxCPA * ((row.conversionRate || 0) / 100);

    return { totalCost, mpCommission, netProfitMP, marginMP, roi, maxCPA, minROAS, maxCPC };
  };

  const saveToHistory = (row: CalculatorRow) => {
    if (!row.productName) { alert('Ingresa un nombre para el producto.'); return; }
    const m = calculateMetrics(row);
    const newEntry: SavedCalculation = {
        ...row,
        id: Date.now().toString(),
        savedAt: new Date().toLocaleString('es-AR'),
        metrics: { 
            marginMP: m.marginMP, netProfitMP: m.netProfitMP, 
            roi: m.roi, maxCPA: m.maxCPA, minROAS: m.minROAS, maxCPC: m.maxCPC 
        }
    };
    setHistory([newEntry, ...history]);
  };

  const deleteFromHistory = (id: string) => setHistory(history.filter(item => item.id !== id));

  // --- FORMATO SEGURO (CORRECCIÓN AQUÍ) ---
  const getMarginColor = (val: number) => {
    const safeVal = val || 0;
    if (safeVal < 0.30) return 'bg-red-100 text-red-800 font-bold';
    if (safeVal >= 0.30 && safeVal <= 0.50) return 'bg-yellow-100 text-yellow-800 font-bold';
    return 'bg-green-100 text-green-800 font-bold';
  };

  const formatCurrency = (val: number | undefined | null) => {
    // Si el valor es undefined, null o NaN, usamos 0
    const value = (val === undefined || val === null || isNaN(val)) ? 0 : val;
    return `$${value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatPercent = (val: number | undefined | null) => {
    const value = (val === undefined || val === null || isNaN(val)) ? 0 : val;
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
                Calculadora de Rentabilidad & Ads
            </h2>
            <p className="text-gray-500 text-sm">Planifica precios, costos y objetivos para tus campañas publicitarias.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setShowDefinitions(!showDefinitions)} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors">
                <BookOpen size={16} /> {showDefinitions ? 'Ocultar' : 'Ver'} Diccionario
            </button>
            <button onClick={clearAll} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 transition-colors">
                <RotateCcw size={16} /> Limpiar
            </button>
            <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-black hover:bg-gray-800 rounded-md shadow-sm transition-colors">
                <Plus size={16} /> Fila
            </button>
        </div>
      </div>

      {/* DICCIONARIO DE MÉTRICAS */}
      {showDefinitions && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 animate-fade-in-up">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><BookOpen size={20}/> Diccionario de Métricas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div>
                    <h4 className="font-bold text-blue-800 mb-1">CPA (Costo por Adquisición)</h4>
                    <p className="text-blue-700 mb-2">Es el costo máximo que puedes pagar en publicidad para conseguir 1 venta sin perder dinero.</p>
                    <p className="text-xs text-blue-600 bg-blue-100 p-2 rounded"><strong>Fórmula:</strong> Precio Venta - Costos Totales</p>
                </div>
                <div>
                    <h4 className="font-bold text-blue-800 mb-1">ROAS (Return On Ad Spend)</h4>
                    <p className="text-blue-700 mb-2">El retorno mínimo que debe tener tu campaña. Si es 3.0, significa que por cada $1 que pones en Ads, deben entrar $3 de venta.</p>
                    <p className="text-xs text-blue-600 bg-blue-100 p-2 rounded"><strong>Fórmula:</strong> Precio Venta / Ganancia Neta</p>
                </div>
                <div>
                    <h4 className="font-bold text-blue-800 mb-1">CPC (Costo Por Clic)</h4>
                    <p className="text-blue-700 mb-2">Cuánto puedes pagar por cada clic en tu anuncio. Depende de qué tan buena sea tu web convirtiendo visitas en ventas (Conv. Rate).</p>
                    <p className="text-xs text-blue-600 bg-blue-100 p-2 rounded"><strong>Fórmula:</strong> CPA Máximo * (Tasa Conv. / 100)</p>
                </div>
                <div>
                    <h4 className="font-bold text-blue-800 mb-1">Margen vs. ROI</h4>
                    <p className="text-blue-700"><strong>Margen:</strong> Cuánto ganas sobre el precio de venta.<br/><strong>ROI:</strong> Cuánto ganas sobre el costo invertido.</p>
                </div>
                <div>
                    <h4 className="font-bold text-blue-800 mb-1">Tasa de Conversión (CR)</h4>
                    <p className="text-blue-700">El % de gente que entra a tu web y compra. Un e-commerce promedio tiene entre 1% y 2%.</p>
                </div>
            </div>
        </div>
      )}

      {/* TABLA PRINCIPAL */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto pb-4">
          <table className="min-w-full text-xs md:text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider border-b">
              <tr>
                <th className="p-3 border-r min-w-[150px] sticky left-0 bg-gray-100 z-10">Producto</th>
                <th className="p-3 border-r bg-red-50 text-red-900 text-center" colSpan={3}>Costos Unitarios</th>
                <th className="p-3 border-r bg-gray-200 text-gray-800">Total</th>
                <th className="p-3 border-r bg-blue-50 text-blue-900">Precio Venta</th>
                <th className="p-3 border-r bg-blue-50 text-gray-500">MP (4%)</th>
                <th className="p-3 border-r bg-green-50 text-green-900 text-center" colSpan={3}>Rentabilidad</th>
                <th className="p-3 border-r bg-purple-50 text-purple-900 text-center" colSpan={4}>Métricas Meta Ads</th>
                <th className="p-3 text-center bg-gray-100"></th>
              </tr>
              <tr className="text-xs text-gray-500 bg-gray-50 border-b">
                <th className="sticky left-0 bg-gray-50 border-r"></th>
                <th className="p-2 border-r text-center font-normal">Mercadería</th>
                <th className="p-2 border-r text-center font-normal">Pack</th>
                <th className="p-2 border-r text-center font-normal">Envío</th>
                <th className="p-2 border-r text-center font-normal bg-gray-100">Costo Total</th>
                <th className="p-2 border-r text-center font-normal bg-blue-50/50">Lista</th>
                <th className="p-2 border-r text-center font-normal bg-blue-50/50">Comisión</th>
                <th className="p-2 border-r text-center font-normal bg-green-50/50">Ganancia</th>
                <th className="p-2 border-r text-center font-normal bg-green-50/50">Margen %</th>
                <th className="p-2 border-r text-center font-normal bg-green-50/50">ROI %</th>
                <th className="p-2 border-r text-center font-normal bg-purple-50/50">Conv. Rate %</th>
                <th className="p-2 border-r text-center font-normal bg-purple-50/50">CPA Máx</th>
                <th className="p-2 border-r text-center font-normal bg-purple-50/50">ROAS Mín</th>
                <th className="p-2 border-r text-center font-normal bg-purple-50/50">CPC Máx</th>
                <th className="p-2 text-center">Guardar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => {
                const m = calculateMetrics(row);
                return (
                  <tr key={row.id} className="hover:bg-gray-50 group">
                    <td className="p-2 border-r sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-gray-50">
                      <input className="w-full p-1 border border-gray-300 rounded focus:ring-1 focus:ring-black" type="text" placeholder="Nombre..." value={row.productName} onChange={(e) => updateRow(row.id, 'productName', e.target.value)} />
                    </td>
                    <td className="p-2 border-r"><input className="w-20 p-1 border border-gray-300 rounded text-right" type="number" placeholder="0" value={row.costMercaderia || ''} onChange={(e) => updateRow(row.id, 'costMercaderia', parseFloat(e.target.value))} /></td>
                    <td className="p-2 border-r"><input className="w-16 p-1 border border-gray-300 rounded text-right" type="number" placeholder="0" value={row.packaging || ''} onChange={(e) => updateRow(row.id, 'packaging', parseFloat(e.target.value))} /></td>
                    <td className="p-2 border-r"><input className="w-20 p-1 border border-gray-300 rounded text-right" type="number" placeholder="0" value={row.shippingCost || ''} onChange={(e) => updateRow(row.id, 'shippingCost', parseFloat(e.target.value))} /></td>
                    <td className="p-2 border-r text-right bg-gray-100 font-medium text-gray-700">{formatCurrency(m.totalCost)}</td>
                    <td className="p-2 border-r bg-blue-50/30"><input className="w-24 p-1 border border-blue-300 bg-white rounded text-right font-bold" type="number" placeholder="0" value={row.salePrice || ''} onChange={(e) => updateRow(row.id, 'salePrice', parseFloat(e.target.value))} /></td>
                    <td className="p-2 border-r text-right text-gray-500 bg-blue-50/30">{formatCurrency(m.mpCommission)}</td>
                    <td className="p-2 border-r text-right font-bold bg-green-50/30">{formatCurrency(m.netProfitMP)}</td>
                    <td className={`p-2 border-r text-center ${getMarginColor(m.marginMP)}`}>{formatPercent(m.marginMP)}</td>
                    <td className="p-2 border-r text-center font-medium bg-green-50/30 text-green-800">{formatPercent(m.roi)}</td>
                    <td className="p-2 border-r bg-purple-50/30">
                        <input className="w-14 p-1 border border-purple-300 bg-white rounded text-center text-purple-900 font-medium" type="number" step="0.1" value={row.conversionRate || ''} onChange={(e) => updateRow(row.id, 'conversionRate', parseFloat(e.target.value))} />
                    </td>
                    <td className="p-2 border-r text-right bg-purple-50/30 font-bold text-purple-900">{formatCurrency(m.maxCPA)}</td>
                    <td className="p-2 border-r text-center bg-purple-50/30 font-bold text-purple-900">{m.minROAS.toFixed(2)}</td>
                    <td className="p-2 border-r text-right bg-purple-50/30 font-black text-purple-900">{formatCurrency(m.maxCPC)}</td>
                    <td className="p-2 flex gap-1 justify-center">
                        <button onClick={() => saveToHistory(row)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition-colors" title="Guardar"><Save size={18} /></button>
                        <button onClick={() => removeRow(row.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" title="Eliminar"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* HISTORIAL */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Clock size={24} className="text-gray-500" /> Historial Guardado
        </h2>
        
        {history.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                Aún no has guardado cálculos. Usa el botón <Save className="inline w-4 h-4"/> para guardar simulaciones importantes.
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((item) => (
                    <div key={item.id} className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow relative text-sm">
                        <div className="flex justify-between items-start mb-3 pb-3 border-b">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{item.productName}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10}/> {item.savedAt}</p>
                            </div>
                            <button onClick={() => deleteFromHistory(item.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Precio Venta:</span>
                                <span className="font-medium">{formatCurrency(item.salePrice)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Costo Total:</span>
                                <span className="font-medium text-red-500">-{formatCurrency((item.costMercaderia||0) + (item.packaging||0) + (item.shippingCost||0))}</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span className="font-bold text-gray-800">Ganancia Neta:</span>
                                <span className="font-bold text-green-600 text-lg">{formatCurrency(item.metrics?.netProfitMP)}</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                <div className={`rounded p-1 ${getMarginColor(item.metrics?.marginMP)}`}>
                                    <div className="text-[10px] uppercase font-normal opacity-80">Margen</div>
                                    {formatPercent(item.metrics?.marginMP)}
                                </div>
                                <div className="bg-blue-50 text-blue-800 rounded p-1 font-bold">
                                    <div className="text-[10px] uppercase font-normal opacity-80 text-blue-600">ROI</div>
                                    {formatPercent(item.metrics?.roi)}
                                </div>
                                <div className="bg-purple-50 text-purple-900 rounded p-1 font-bold">
                                    <div className="text-[10px] uppercase font-normal opacity-80 text-purple-700">ROAS Mín</div>
                                    {item.metrics?.minROAS ? item.metrics.minROAS.toFixed(2) : '0.00'}
                                </div>
                            </div>

                            <div className="border-t pt-2 mt-2">
                                <p className="text-xs text-center text-gray-500 mb-1 uppercase tracking-wide">Límites para Publicidad</p>
                                <div className="flex justify-between items-center text-purple-900 bg-purple-50 px-3 py-1.5 rounded">
                                    <div className="text-center">
                                        <div className="text-[10px] text-purple-600">CPA Máx</div>
                                        <div className="font-bold">{formatCurrency(item.metrics?.maxCPA)}</div>
                                    </div>
                                    <div className="w-px h-6 bg-purple-200"></div>
                                    <div className="text-center">
                                        <div className="text-[10px] text-purple-600">CPC Máx ({(item.conversionRate||0)}%)</div>
                                        <div className="font-bold">{formatCurrency(item.metrics?.maxCPC)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};