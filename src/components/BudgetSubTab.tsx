import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Edit3, 
  Receipt, 
  PieChart, 
  X,
  Coins,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { 
  BudgetCategory, 
  BudgetItem, 
  BudgetType, 
  CommitteeMember, 
  WorkAndBudget 
} from '../types';

interface BudgetSubTabProps {
  workAndBudget: WorkAndBudget;
  eventTitle: string;
  activeMember: CommitteeMember;
  onSaveBudget: (updatedWork: WorkAndBudget) => Promise<void>;
}

export const BudgetSubTab: React.FC<BudgetSubTabProps> = ({
  workAndBudget,
  eventTitle,
  activeMember,
  onSaveBudget,
}) => {
  const canManageBudget = 
    activeMember?.name === 'Joshua Peiris' || 
    activeMember?.name === 'Dion Fernando' || 
    activeMember?.name === 'Devsith' ||
    activeMember?.name === 'Devsith Mortier' ||
    activeMember?.role === 'Treasurer' ||
    activeMember?.role === 'Vice Treasurer';

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  const [form, setForm] = useState({
    description: '',
    category: 'Music & Scores' as BudgetCategory,
    type: 'expense' as BudgetType,
    budgetedAmount: 5000,
    actualAmount: 5000,
    status: 'Estimated' as 'Estimated' | 'Approved' | 'Paid' | 'Reimbursed',
    receiptRef: '',
    notes: '',
  });

  const categories: BudgetCategory[] = [
    'Music & Scores',
    'Musician Honorarium',
    'Vestments & Robes',
    'Sound & Equipment',
    'Printing & Booklets',
    'Decorations & Flowers',
    'Refreshments & Hospitality',
    'Donations & Sponsorship',
    'Other',
  ];

  // Financial calculations in LKR
  const totalBudgetedExpenses = workAndBudget.budget
    .filter((b) => b.type === 'expense')
    .reduce((acc, curr) => acc + (Number(curr.budgetedAmount) || 0), 0);

  const totalActualExpenses = workAndBudget.budget
    .filter((b) => b.type === 'expense')
    .reduce((acc, curr) => acc + (Number(curr.actualAmount) || 0), 0);

  const totalIncome = workAndBudget.budget
    .filter((b) => b.type === 'income')
    .reduce((acc, curr) => acc + (Number(curr.actualAmount) || Number(curr.budgetedAmount) || 0), 0);

  const netBalance = totalIncome - totalActualExpenses;

  const handleOpenModal = (item?: BudgetItem) => {
    if (item) {
      setEditingItem(item);
      setForm({
        description: item.description,
        category: item.category,
        type: item.type,
        budgetedAmount: item.budgetedAmount,
        actualAmount: item.actualAmount,
        status: item.status,
        receiptRef: item.receiptRef || '',
        notes: item.notes || '',
      });
    } else {
      setEditingItem(null);
      setForm({
        description: '',
        category: 'Music & Scores',
        type: 'expense',
        budgetedAmount: 5000,
        actualAmount: 0,
        status: 'Estimated',
        receiptRef: '',
        notes: '',
      });
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) return;

    let updatedBudget = [...workAndBudget.budget];
    if (editingItem) {
      updatedBudget = updatedBudget.map((b) =>
        b.id === editingItem.id ? { ...b, ...form } : b
      );
    } else {
      const newItem: BudgetItem = {
        id: `budget-${Date.now()}`,
        ...form,
      };
      updatedBudget.push(newItem);
    }

    await onSaveBudget({
      ...workAndBudget,
      budget: updatedBudget,
    });

    setIsItemModalOpen(false);
  };

  const handleDeleteItem = async (id: string) => {
    const updatedBudget = workAndBudget.budget.filter((b) => b.id !== id);
    await onSaveBudget({
      ...workAndBudget,
      budget: updatedBudget,
    });
  };

  return (
    <div className="space-y-6">
      {/* Financial metrics summary cards in LKR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Allocated Target */}
        <div className="bg-[#141414] p-4 rounded-2xl border border-[#222222] shadow-md">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Budget</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            LKR {workAndBudget.targetBudget.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Authorized ceiling for {eventTitle}
          </div>
        </div>

        {/* Total Actual Expenses */}
        <div className="bg-[#141414] p-4 rounded-2xl border border-[#222222] shadow-md">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400">
            LKR {totalActualExpenses.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Budgeted: LKR {totalBudgetedExpenses.toLocaleString()}
          </div>
        </div>

        {/* Total Income / Sponsorships */}
        <div className="bg-[#141414] p-4 rounded-2xl border border-[#222222] shadow-md">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Income & Grants</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            LKR {totalIncome.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Parish grants & benefactors
          </div>
        </div>

        {/* Net Balance */}
        <div className={`p-4 rounded-2xl border shadow-md ${
          netBalance >= 0 ? 'bg-[#141414] border-emerald-500/30' : 'bg-[#141414] border-rose-500/30'
        }`}>
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Position</span>
            <PieChart className={`w-4 h-4 ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-black ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netBalance >= 0 ? `+LKR ${netBalance.toLocaleString()}` : `-LKR ${Math.abs(netBalance).toLocaleString()}`}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {netBalance >= 0 ? 'Surplus funds balance' : 'Budget deficit alert'}
          </div>
        </div>
      </div>

      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121212] p-4 rounded-2xl border border-[#222222] shadow-xl">
        <div>
          <h3 className="font-bold text-white text-sm">
            Itemized Event Financing Ledger (LKR)
          </h3>
          <p className="text-xs text-neutral-400">
            Track scores, instrument repairs, honorariums, vestment care, sound equipment, and benefactions in Sri Lankan Rupees.
          </p>
        </div>

        {canManageBudget ? (
          <button
            id="add-budget-item-btn"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Financing Entry</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1A1A1A] text-neutral-400 border border-[#2D2D2D] self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>View-Only Access (Managed by Dion, Devsith & Joshua)</span>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-[#121212] rounded-2xl border border-[#222222] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-[#171717] border-b border-[#242424] text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Budgeted (LKR)</th>
                <th className="py-3 px-4 text-right">Actual (LKR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Receipt Ref</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {workAndBudget.budget.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    <Coins className="w-7 h-7 mx-auto mb-1.5 text-neutral-600" />
                    <p className="font-medium text-sm text-neutral-300">No financing items recorded</p>
                    <p className="text-xs text-neutral-500">Click "Add Financing Entry" to record income or expenses in LKR.</p>
                  </td>
                </tr>
              ) : (
                workAndBudget.budget.map((item) => (
                  <tr key={item.id} className="hover:bg-[#161616] transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      <div>{item.description}</div>
                      {item.notes && (
                        <div className="text-[10px] text-neutral-400 font-normal italic">
                          {item.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1C1C1C] text-neutral-300 border border-[#2E2E2E]">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.type === 'income' 
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}>
                        {item.type === 'income' ? '+ Income' : '- Expense'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-neutral-400">
                      LKR {Number(item.budgetedAmount).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-white">
                      LKR {Number(item.actualAmount).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.status === 'Paid'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : item.status === 'Approved'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : 'bg-[#1C1C1C] text-neutral-400 border border-[#2C2C2C]'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-400">
                      {item.receiptRef ? (
                        <span className="flex items-center gap-1">
                          <Receipt className="w-3 h-3 text-neutral-500" />
                          {item.receiptRef}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {canManageBudget ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#202020] transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-500 italic">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] w-full max-w-md rounded-2xl border border-[#2A2A2A] shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-[#0D0D0D] text-white px-5 py-4 flex items-center justify-between border-b border-[#222222]">
              <h3 className="font-bold text-sm">
                {editingItem ? 'Edit Financing Entry' : 'Add Event Financing Entry'}
              </h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Feast Day instrumentalist honorarium"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Entry Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as BudgetType })}
                    className="w-full px-2.5 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl text-white focus:outline-none"
                  >
                    <option value="expense" className="bg-[#181818] text-white">Expense (-)</option>
                    <option value="income" className="bg-[#181818] text-white">Income / Grant (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as BudgetCategory })}
                    className="w-full px-2.5 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl text-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-[#181818] text-white">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Budgeted Amount (LKR) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    required
                    value={form.budgetedAmount}
                    onChange={(e) => setForm({ ...form, budgetedAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Actual Amount (LKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={form.actualAmount}
                    onChange={(e) => setForm({ ...form, actualAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Approval Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-2.5 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl text-white focus:outline-none"
                  >
                    <option value="Estimated" className="bg-[#181818] text-white">Estimated</option>
                    <option value="Approved" className="bg-[#181818] text-white">Approved by President</option>
                    <option value="Paid" className="bg-[#181818] text-white">Paid</option>
                    <option value="Reimbursed" className="bg-[#181818] text-white">Reimbursed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Receipt Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REC-2026-09"
                    value={form.receiptRef}
                    onChange={(e) => setForm({ ...form, receiptRef: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                  Ledger Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Approved at committee meeting on Sept 3; voucher issued"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-[#202020] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl shadow-sm"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
