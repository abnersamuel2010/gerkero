import React from 'react';
import { Printer, X } from 'lucide-react';
import { ThermalReceiptData } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ThermalPrintModalProps {
  receipt: ThermalReceiptData | null;
  nomeRestaurante: string;
  cnpjRestaurante?: string;
  enderecoRestaurante?: string;
  telefoneRestaurante?: string;
  onClose: () => void;
}

export const ThermalPrintModal: React.FC<ThermalPrintModalProps> = ({
  receipt,
  nomeRestaurante,
  cnpjRestaurante,
  enderecoRestaurante,
  telefoneRestaurante,
  onClose,
}) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Impressão Térmica (80mm)
            </h3>
            <p className="text-xs text-slate-500">
              Layout otimizado para impressora térmica de cupom
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
            aria-label="Fechar janela de impressão"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-slate-100 flex justify-center max-h-[70vh] overflow-y-auto">
          <div
            id="thermal-print-area"
            className="w-[302px] bg-amber-50/40 border border-dashed border-slate-300 p-4 font-mono text-xs text-slate-900 space-y-2.5"
          >
            <div className="text-center border-b border-dashed border-slate-400 pb-2 space-y-0.5">
              <div className="font-bold text-sm uppercase">{nomeRestaurante}</div>
              {enderecoRestaurante && (
                <div className="text-[11px] text-slate-700">{enderecoRestaurante}</div>
              )}
              {cnpjRestaurante && (
                <div className="text-[11px] text-slate-700">CNPJ: {cnpjRestaurante}</div>
              )}
              {telefoneRestaurante && (
                <div className="text-[11px] text-slate-700">Tel: {telefoneRestaurante}</div>
              )}
            </div>

            <div className="text-center border-b border-dashed border-slate-400 pb-2 space-y-0.5">
              <div className="font-bold text-xs uppercase">{receipt.titulo}</div>
              {receipt.subtitulo && <div>{receipt.subtitulo}</div>}
              {receipt.numeroDocumento && (
                <div className="font-bold text-sm">{receipt.numeroDocumento}</div>
              )}
              <div className="text-[11px] text-slate-600">{receipt.dataHora}</div>
            </div>

            {(receipt.clienteOuMesa || receipt.telefone || receipt.endereco) && (
              <div className="border-b border-dashed border-slate-400 pb-2 space-y-0.5 text-[11px]">
                {receipt.clienteOuMesa && (
                  <div>
                    <span className="font-semibold">ID/Cliente:</span> {receipt.clienteOuMesa}
                  </div>
                )}
                {receipt.telefone && (
                  <div>
                    <span className="font-semibold">Fone:</span> {receipt.telefone}
                  </div>
                )}
                {receipt.endereco && (
                  <div>
                    <span className="font-semibold">End:</span> {receipt.endereco}
                  </div>
                )}
              </div>
            )}

            <div className="border-b border-dashed border-slate-400 pb-2 space-y-1.5">
              <div className="flex justify-between font-semibold text-[11px] border-b border-slate-300 pb-1">
                <span>QTD / DESCRIÇÃO</span>
                <span>VALOR</span>
              </div>
              {receipt.linhas.map((linha, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="leading-tight">
                      {linha.qtd !== undefined ? `${linha.qtd}x ` : ''}
                      {linha.descricao}
                    </span>
                    {linha.valor !== undefined && (
                      <span className="shrink-0 tabular-nums">
                        {formatCurrency(linha.valor)}
                      </span>
                    )}
                  </div>
                  {linha.observacao && (
                    <div className="text-[10px] text-slate-700 pl-2">
                      * Obs: {linha.observacao}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(receipt.subtotal !== undefined ||
              receipt.taxaEntrega !== undefined ||
              receipt.total !== undefined) && (
              <div className="border-b border-dashed border-slate-400 pb-2 space-y-1 text-xs">
                {receipt.subtotal !== undefined && (
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="tabular-nums">{formatCurrency(receipt.subtotal)}</span>
                  </div>
                )}
                {receipt.taxaEntrega !== undefined && receipt.taxaEntrega > 0 && (
                  <div className="flex justify-between">
                    <span>Taxa de Entrega:</span>
                    <span className="tabular-nums">{formatCurrency(receipt.taxaEntrega)}</span>
                  </div>
                )}
                {receipt.total !== undefined && (
                  <div className="flex justify-between font-bold text-sm pt-1">
                    <span>TOTAL:</span>
                    <span className="tabular-nums">{formatCurrency(receipt.total)}</span>
                  </div>
                )}
              </div>
            )}

            {(receipt.formaPagamento || receipt.troco || receipt.observacoesGerais) && (
              <div className="border-b border-dashed border-slate-400 pb-2 space-y-1 text-[11px]">
                {receipt.formaPagamento && (
                  <div>
                    <span className="font-semibold">Pagamento:</span> {receipt.formaPagamento}
                  </div>
                )}
                {receipt.troco && (
                  <div>
                    <span className="font-semibold">Troco:</span> {receipt.troco}
                  </div>
                )}
                {receipt.observacoesGerais && (
                  <div>
                    <span className="font-semibold">Obs:</span> {receipt.observacoesGerais}
                  </div>
                )}
              </div>
            )}

            <div className="text-center text-[10px] text-slate-600 pt-1">
              {receipt.rodape || 'Obrigado pela preferência! Volte sempre.'}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir Cupom (80mm)
          </button>
        </div>
      </div>
    </div>
  );
};
