import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, TrendingUp, Receipt, Calendar, Plus, Upload, Tag, X, FileText, Trash2, Edit2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createPortal } from 'react-dom';
import CustomSelect from '../components/CustomSelect';

// Hook to calculate dropdown position
function useDropdownPosition(triggerRef, isOpen) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, triggerRef]);

  return coords;
}

// Custom Date Picker Component
const CustomDatePicker = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const triggerRef = useRef(null);
  const coords = useDropdownPosition(triggerRef, isOpen);

  useEffect(() => {
    if (value) setViewDate(new Date(value));
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event) {
      if (triggerRef.current && !triggerRef.current.contains(event.target)) {
        if (!event.target.closest('.portal-datepicker')) {
          setIsOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(newDate.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${d}`);
    setIsOpen(false);
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const startDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => i);

  const monthName = viewDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
  const displayValue = value ? new Date(value).toLocaleDateString('pl-PL') : '';

  return (
    <div className="relative w-full">
      {label && <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">{label}</label>}
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm cursor-pointer flex justify-between items-center transition-all
          ${isOpen
            ? 'border-pink-500 ring-2 ring-pink-500/20 dark:border-pink-400'
            : 'border-gray-200/50 dark:border-gray-700/50 hover:border-pink-300 dark:hover:border-pink-600'
          }
        `}
      >
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={16} className="text-gray-400" />
          <span className={displayValue ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
            {displayValue || 'Wybierz datę'}
          </span>
        </div>
      </div>

      {isOpen && coords.width > 0 && createPortal(
        <div
          className="portal-datepicker fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: coords.top,
            left: coords.left,
            width: '280px'
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400"><ChevronLeft size={18}/></button>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 capitalize">{monthName}</span>
            <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400"><ChevronRight size={18}/></button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {blanks.map(b => <div key={`blank-${b}`} />)}
            {days.map(day => {
              const currentDayStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isSelected = value === currentDayStr;
              const isToday = new Date().toDateString() === new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toDateString();

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition flex items-center justify-center
                    ${isSelected
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-500/30'
                      : isToday
                        ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-800'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const FinanceModule = () => {
  const [activeTab, setActiveTab] = useState('budget');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [budgetItems, setBudgetItems] = useState([]);
  const [incomeTransactions, setIncomeTransactions] = useState([]);
  const [expenseTransactions, setExpenseTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Forms
  const [budgetForm, setBudgetForm] = useState({
    category: '',
    description: '',
    planned_amount: ''
  });

  const [incomeForm, setIncomeForm] = useState({
    date: '',
    amount: '',
    type: 'Kolekta',
    source: '',
    notes: '',
    tags: []
  });

  const [expenseForm, setExpenseForm] = useState({
    payment_date: '',
    amount: '',
    contractor: '',
    category: '',
    description: '',
    detailed_description: '',
    responsible_person: '',
    documents: [], // Array of {url: string, name: string}
    tags: []
  });

  const [uploadingFile, setUploadingFile] = useState(false);
  const [expandedBudgetItems, setExpandedBudgetItems] = useState({}); // For expandable expense lists

  const [newTag, setNewTag] = useState('');

  // Filtry dla wpływów
  const [incomeFilters, setIncomeFilters] = useState({
    type: '',
    source: '',
    tag: '',
    dateFrom: '',
    dateTo: ''
  });

  // Filtry dla wydatków
  const [expenseFilters, setExpenseFilters] = useState({
    category: '',
    contractor: '',
    responsible: '',
    tag: '',
    dateFrom: '',
    dateTo: ''
  });

  // Fetch budget items
  useEffect(() => {
    if (activeTab === 'budget') {
      fetchBudgetItems();
    }
  }, [activeTab, selectedYear]);

  // Fetch income transactions
  useEffect(() => {
    if (activeTab === 'income') {
      fetchIncomeTransactions();
    }
  }, [activeTab, selectedYear]);

  // Fetch expense transactions
  useEffect(() => {
    if (activeTab === 'expenses' || activeTab === 'budget') {
      fetchExpenseTransactions();
    }
  }, [activeTab, selectedYear]);

  const fetchBudgetItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('year', selectedYear)
        .order('category');

      if (error) throw error;
      setBudgetItems(data || []);
    } catch (error) {
      console.error('Error fetching budget items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('income_transactions')
        .select('*')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`)
        .order('date', { ascending: false });

      if (error) throw error;
      setIncomeTransactions(data || []);
    } catch (error) {
      console.error('Error fetching income transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expense_transactions')
        .select('*')
        .gte('payment_date', `${selectedYear}-01-01`)
        .lte('payment_date', `${selectedYear}-12-31`)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setExpenseTransactions(data || []);
    } catch (error) {
      console.error('Error fetching expense transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBudgetItem = async () => {
    if (!budgetForm.category || !budgetForm.planned_amount) {
      alert('Wypełnij wymagane pola');
      return;
    }

    try {
      if (budgetForm.id) {
        // Update existing item
        const { error } = await supabase
          .from('budget_items')
          .update({
            category: budgetForm.category,
            description: budgetForm.description,
            planned_amount: parseFloat(budgetForm.planned_amount)
          })
          .eq('id', budgetForm.id);

        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase.from('budget_items').insert([{
          year: selectedYear,
          category: budgetForm.category,
          description: budgetForm.description,
          planned_amount: parseFloat(budgetForm.planned_amount)
        }]);

        if (error) throw error;
      }

      setShowBudgetModal(false);
      setBudgetForm({ category: '', description: '', planned_amount: '' });
      fetchBudgetItems();
    } catch (error) {
      console.error('Error saving budget item:', error);
      alert('Błąd zapisywania: ' + error.message);
    }
  };

  const deleteBudgetItem = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć tę pozycję budżetową?')) return;

    try {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchBudgetItems();
    } catch (error) {
      console.error('Error deleting budget item:', error);
      alert('Błąd usuwania: ' + error.message);
    }
  };

  const saveIncome = async () => {
    if (!incomeForm.date || !incomeForm.amount || !incomeForm.source) {
      alert('Wypełnij wymagane pola');
      return;
    }

    try {
      if (incomeForm.id) {
        // Update existing income
        const { error } = await supabase
          .from('income_transactions')
          .update({
            date: incomeForm.date,
            amount: parseFloat(incomeForm.amount),
            type: incomeForm.type,
            source: incomeForm.source,
            notes: incomeForm.notes,
            tags: incomeForm.tags
          })
          .eq('id', incomeForm.id);

        if (error) throw error;
      } else {
        // Insert new income
        const { error } = await supabase.from('income_transactions').insert([{
          date: incomeForm.date,
          amount: parseFloat(incomeForm.amount),
          type: incomeForm.type,
          source: incomeForm.source,
          notes: incomeForm.notes,
          tags: incomeForm.tags
        }]);

        if (error) throw error;
      }

      setShowIncomeModal(false);
      setIncomeForm({ date: '', amount: '', type: 'Kolekta', source: '', notes: '', tags: [] });
      fetchIncomeTransactions();
    } catch (error) {
      console.error('Error saving income:', error);
      alert('Błąd zapisywania: ' + error.message);
    }
  };

  const deleteIncome = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wpływ?')) return;

    try {
      const { error } = await supabase
        .from('income_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchIncomeTransactions();
    } catch (error) {
      console.error('Error deleting income:', error);
      alert('Błąd usuwania: ' + error.message);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingFile(true);
    try {
      const uploadedDocs = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `expense_documents/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('finance')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('finance')
          .getPublicUrl(filePath);

        uploadedDocs.push({
          url: publicUrl,
          name: file.name
        });
      }

      setExpenseForm({
        ...expenseForm,
        documents: [...expenseForm.documents, ...uploadedDocs]
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Błąd przesyłania pliku: ' + error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const removeDocument = (index) => {
    setExpenseForm({
      ...expenseForm,
      documents: expenseForm.documents.filter((_, i) => i !== index)
    });
  };

  const saveExpense = async () => {
    if (!expenseForm.payment_date || !expenseForm.amount || !expenseForm.contractor || !expenseForm.category || !expenseForm.description || !expenseForm.responsible_person) {
      alert('Wypełnij wymagane pola');
      return;
    }

    try {
      if (expenseForm.id) {
        // Update existing expense
        const { error } = await supabase
          .from('expense_transactions')
          .update({
            payment_date: expenseForm.payment_date,
            amount: parseFloat(expenseForm.amount),
            contractor: expenseForm.contractor,
            category: expenseForm.category,
            description: expenseForm.description,
            detailed_description: expenseForm.detailed_description,
            responsible_person: expenseForm.responsible_person,
            documents: expenseForm.documents,
            tags: expenseForm.tags
          })
          .eq('id', expenseForm.id);

        if (error) throw error;
      } else {
        // Insert new expense
        const { error } = await supabase.from('expense_transactions').insert([{
          payment_date: expenseForm.payment_date,
          amount: parseFloat(expenseForm.amount),
          contractor: expenseForm.contractor,
          category: expenseForm.category,
          description: expenseForm.description,
          detailed_description: expenseForm.detailed_description,
          responsible_person: expenseForm.responsible_person,
          documents: expenseForm.documents,
          tags: expenseForm.tags
        }]);

        if (error) throw error;
      }

      setShowExpenseModal(false);
      setExpenseForm({ payment_date: '', amount: '', contractor: '', category: '', description: '', detailed_description: '', responsible_person: '', documents: [], tags: [] });
      fetchExpenseTransactions();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Błąd zapisywania: ' + error.message);
    }
  };

  const deleteExpense = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wydatek?')) return;

    try {
      const { error } = await supabase
        .from('expense_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchExpenseTransactions();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Błąd usuwania: ' + error.message);
    }
  };

  const addTag = (form, setForm) => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm({ ...form, tags: [...form.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag, form, setForm) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
  };

  const calculateRealization = (category, description) => {
    const total = expenseTransactions
      .filter(exp => exp.category === category && exp.description === description)
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);
    return total;
  };

  const getProgressBarColor = (percentage) => {
    if (percentage < 80) return 'from-green-500 to-green-600';
    if (percentage <= 100) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  // Filtrowanie wpływów
  const filteredIncomeTransactions = incomeTransactions.filter(transaction => {
    if (incomeFilters.type && transaction.type !== incomeFilters.type) return false;
    if (incomeFilters.source && !transaction.source.toLowerCase().includes(incomeFilters.source.toLowerCase())) return false;
    if (incomeFilters.tag && (!transaction.tags || !transaction.tags.includes(incomeFilters.tag))) return false;
    if (incomeFilters.dateFrom && transaction.date < incomeFilters.dateFrom) return false;
    if (incomeFilters.dateTo && transaction.date > incomeFilters.dateTo) return false;
    return true;
  });

  // Filtrowanie wydatków
  const filteredExpenseTransactions = expenseTransactions.filter(transaction => {
    if (expenseFilters.category && transaction.category !== expenseFilters.category) return false;
    if (expenseFilters.contractor && !transaction.contractor.toLowerCase().includes(expenseFilters.contractor.toLowerCase())) return false;
    if (expenseFilters.responsible && !transaction.responsible_person.toLowerCase().includes(expenseFilters.responsible.toLowerCase())) return false;
    if (expenseFilters.tag && (!transaction.tags || !transaction.tags.includes(expenseFilters.tag))) return false;
    if (expenseFilters.dateFrom && transaction.payment_date < expenseFilters.dateFrom) return false;
    if (expenseFilters.dateTo && transaction.payment_date > expenseFilters.dateTo) return false;
    return true;
  });

  // Pobierz unikalne wartości dla filtrów
  const uniqueIncomeSources = [...new Set(incomeTransactions.map(t => t.source))];
  const uniqueIncomeTags = [...new Set(incomeTransactions.flatMap(t => t.tags || []))];
  const uniqueExpenseContractors = [...new Set(expenseTransactions.map(t => t.contractor))];
  const uniqueExpenseResponsible = [...new Set(expenseTransactions.map(t => t.responsible_person))];
  const uniqueExpenseTags = [...new Set(expenseTransactions.flatMap(t => t.tags || []))];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Get unique categories from budget items for expense category dropdown
  const budgetCategories = [...new Set(budgetItems.map(item => item.category))].map(cat => ({ value: cat, label: cat }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
            Finanse
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Zarządzanie budżetem i finansami kościoła</p>
        </div>
        <div className="flex items-center gap-3">
          <CustomSelect
            value={selectedYear}
            onChange={(val) => setSelectedYear(parseInt(val))}
            options={years.map(y => ({ value: y, label: y.toString() }))}
          />
        </div>
      </div>

      <div className="flex gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('budget')}
          className={`px-6 py-2.5 rounded-xl font-medium transition text-sm ${
            activeTab === 'budget'
              ? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <DollarSign size={16} className="inline mr-2" />
          Budżet
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`px-6 py-2.5 rounded-xl font-medium transition text-sm ${
            activeTab === 'income'
              ? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <TrendingUp size={16} className="inline mr-2" />
          Wpływy
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-6 py-2.5 rounded-xl font-medium transition text-sm ${
            activeTab === 'expenses'
              ? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Receipt size={16} className="inline mr-2" />
          Wydatki
        </button>
      </div>

      {activeTab === 'budget' && (
        <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Budżet {selectedYear}
            </h2>
            <button
              onClick={() => setShowBudgetModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2"
            >
              <Plus size={18} />
              Dodaj pozycję budżetową
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Ładowanie...
            </div>
          ) : budgetItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Brak pozycji budżetowych na rok {selectedYear}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Służba</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Opis kosztu</th>
                    <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Plan (PLN)</th>
                    <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Realizacja (PLN)</th>
                    <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">% Realizacji</th>
                    <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Pozostało</th>
                    <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Group items by category
                    const groupedItems = budgetItems.reduce((acc, item) => {
                      if (!acc[item.category]) {
                        acc[item.category] = [];
                      }
                      acc[item.category].push(item);
                      return acc;
                    }, {});

                    let grandTotalPlanned = 0;
                    let grandTotalRealization = 0;
                    let grandTotalRemaining = 0;

                    const rows = [];

                    Object.keys(groupedItems).forEach((category) => {
                      const items = groupedItems[category];
                      let categoryTotalPlanned = 0;
                      let categoryTotalRealization = 0;
                      let categoryTotalRemaining = 0;

                      // Calculate total rowspan including expanded rows
                      const totalRowSpan = items.reduce((sum, item) => {
                        return sum + 1 + (expandedBudgetItems[`${item.id}`] ? 1 : 0);
                      }, 0);

                      items.forEach((item, itemIndex) => {
                        const realization = calculateRealization(item.category, item.description);
                        const percentage = item.planned_amount > 0 ? (realization / item.planned_amount) * 100 : 0;
                        const remaining = item.planned_amount - realization;

                        categoryTotalPlanned += item.planned_amount;
                        categoryTotalRealization += realization;
                        categoryTotalRemaining += remaining;

                        rows.push(
                          <tr
                            key={item.id}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
                          >
                            {itemIndex === 0 && (
                              <td
                                className="py-4 px-4 text-gray-900 dark:text-white font-bold"
                                rowSpan={totalRowSpan}
                              >
                                {item.category}
                              </td>
                            )}
                            <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{item.description}</td>
                            <td className="py-4 px-4 text-right text-gray-900 dark:text-white font-medium">
                              {item.planned_amount.toLocaleString('pl-PL')} zł
                            </td>
                            <td
                              className="py-4 px-4 text-right text-gray-900 dark:text-white font-medium cursor-pointer hover:text-pink-600 dark:hover:text-pink-400 transition"
                              onClick={() => {
                                const key = `${item.id}`;
                                setExpandedBudgetItems(prev => ({
                                  ...prev,
                                  [key]: !prev[key]
                                }));
                              }}
                            >
                              {realization.toLocaleString('pl-PL')} zł
                              {expandedBudgetItems[`${item.id}`] ?
                                <ChevronUp size={16} className="inline ml-1" /> :
                                <ChevronDown size={16} className="inline ml-1" />
                              }
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-2">
                                <div className="text-center font-bold text-gray-900 dark:text-white">
                                  {percentage.toFixed(1)}%
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full bg-gradient-to-r ${getProgressBarColor(percentage)} transition-all`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className={`py-4 px-4 text-right font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {remaining.toLocaleString('pl-PL')} zł
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setBudgetForm(item);
                                    setShowBudgetModal(true);
                                  }}
                                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                  title="Edytuj"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => deleteBudgetItem(item.id)}
                                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                  title="Usuń"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );

                        // Add expandable expense list row
                        if (expandedBudgetItems[`${item.id}`]) {
                          const categoryExpenses = expenseTransactions.filter(
                            (exp) => exp.category === item.category && exp.description === item.description
                          );

                          rows.push(
                            <tr key={`expenses-${item.id}`} className="bg-gray-50 dark:bg-gray-800/50">
                              <td colSpan={7} className="py-4 px-4">
                                {categoryExpenses.length > 0 ? (
                                  <div className="space-y-2">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                      Wydatki: {item.category} - {item.description}
                                    </p>
                                    <div className="space-y-1">
                                      {categoryExpenses.map((expense) => (
                                        <div
                                          key={expense.id}
                                          className="grid grid-cols-5 gap-3 text-sm py-2 px-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                                        >
                                          <div className="flex flex-col">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Data</span>
                                            <span className="text-gray-900 dark:text-white">
                                              {new Date(expense.payment_date).toLocaleDateString('pl-PL')}
                                            </span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Kontrahent</span>
                                            <span className="text-gray-900 dark:text-white">{expense.contractor}</span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Kwota</span>
                                            <span className="font-bold text-gray-900 dark:text-white">
                                              {expense.amount.toLocaleString('pl-PL')} zł
                                            </span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Szczegółowy opis</span>
                                            <span className="text-gray-900 dark:text-white text-xs">{expense.detailed_description || '-'}</span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Odpowiedzialny</span>
                                            <span className="text-gray-900 dark:text-white">{expense.responsible_person}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        Suma: {categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString('pl-PL')} zł
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                                    Brak wydatków w tej pozycji budżetu
                                  </p>
                                )}
                              </td>
                            </tr>
                          );
                        }
                      });

                      grandTotalPlanned += categoryTotalPlanned;
                      grandTotalRealization += categoryTotalRealization;
                      grandTotalRemaining += categoryTotalRemaining;

                      const categoryPercentage = categoryTotalPlanned > 0 ? (categoryTotalRealization / categoryTotalPlanned) * 100 : 0;

                      // Subtotal row for this category
                      rows.push(
                        <tr key={`subtotal-${category}`} className="bg-pink-100 dark:bg-pink-900/40 border-b-2 border-pink-300 dark:border-pink-700 font-bold">
                          <td className="py-3 px-4 text-gray-900 dark:text-white" colSpan={2}>
                            Podsumowanie: {category}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            {categoryTotalPlanned.toLocaleString('pl-PL')} zł
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            {categoryTotalRealization.toLocaleString('pl-PL')} zł
                          </td>
                          <td className="py-3 px-4 text-center text-gray-900 dark:text-white">
                            {categoryPercentage.toFixed(1)}%
                          </td>
                          <td className={`py-3 px-4 text-right ${categoryTotalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {categoryTotalRemaining.toLocaleString('pl-PL')} zł
                          </td>
                          <td className="py-3 px-4"></td>
                        </tr>
                      );
                    });

                    const grandPercentage = grandTotalPlanned > 0 ? (grandTotalRealization / grandTotalPlanned) * 100 : 0;

                    // Grand total row
                    rows.push(
                      <tr key="grand-total" className="bg-gradient-to-r from-pink-200 to-orange-200 dark:from-pink-900/60 dark:to-orange-900/60 border-t-4 border-pink-500 dark:border-pink-400 font-bold text-lg">
                        <td className="py-4 px-4 text-gray-900 dark:text-white" colSpan={2}>
                          SUMA CAŁKOWITA
                        </td>
                        <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                          {grandTotalPlanned.toLocaleString('pl-PL')} zł
                        </td>
                        <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                          {grandTotalRealization.toLocaleString('pl-PL')} zł
                        </td>
                        <td className="py-4 px-4 text-center text-gray-900 dark:text-white">
                          {grandPercentage.toFixed(1)}%
                        </td>
                        <td className={`py-4 px-4 text-right ${grandTotalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {grandTotalRemaining.toLocaleString('pl-PL')} zł
                        </td>
                        <td className="py-4 px-4"></td>
                      </tr>
                    );

                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'income' && (
        <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Wpływy {selectedYear}
            </h2>
            <button
              onClick={() => setShowIncomeModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2"
            >
              <Plus size={18} />
              Dodaj wpływ
            </button>
          </div>

          {/* Filtry wpływów */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase">Filtry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <CustomSelect
                label="Typ"
                value={incomeFilters.type}
                onChange={(val) => setIncomeFilters({...incomeFilters, type: val})}
                options={[
                  { value: '', label: 'Wszystkie' },
                  { value: 'Kolekta', label: 'Kolekta' },
                  { value: 'Darowizny', label: 'Darowizny' },
                  { value: 'Inne', label: 'Inne' }
                ]}
                placeholder="Wszystkie"
              />
              <CustomSelect
                label="Źródło"
                value={incomeFilters.source}
                onChange={(val) => setIncomeFilters({...incomeFilters, source: val})}
                options={[
                  { value: '', label: 'Wszystkie' },
                  ...uniqueIncomeSources.map(s => ({ value: s, label: s }))
                ]}
                placeholder="Wszystkie"
              />
              <CustomSelect
                label="Tag"
                value={incomeFilters.tag}
                onChange={(val) => setIncomeFilters({...incomeFilters, tag: val})}
                options={[
                  { value: '', label: 'Wszystkie' },
                  ...uniqueIncomeTags.map(t => ({ value: t, label: t }))
                ]}
                placeholder="Wszystkie"
              />
              <CustomDatePicker
                label="Data od"
                value={incomeFilters.dateFrom}
                onChange={(val) => setIncomeFilters({...incomeFilters, dateFrom: val})}
              />
              <CustomDatePicker
                label="Data do"
                value={incomeFilters.dateTo}
                onChange={(val) => setIncomeFilters({...incomeFilters, dateTo: val})}
              />
            </div>
            {(incomeFilters.type || incomeFilters.source || incomeFilters.tag || incomeFilters.dateFrom || incomeFilters.dateTo) && (
              <button
                onClick={() => setIncomeFilters({ type: '', source: '', tag: '', dateFrom: '', dateTo: '' })}
                className="mt-3 text-sm text-pink-600 dark:text-pink-400 hover:underline"
              >
                Wyczyść filtry
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Ładowanie...
            </div>
          ) : filteredIncomeTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {incomeTransactions.length === 0 ? `Brak wpływów na rok ${selectedYear}` : 'Brak wpływów pasujących do filtrów'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Data</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Typ</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Źródło</th>
                    <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Kwota</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Notatka</th>
                    <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Tagi</th>
                    <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncomeTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <td className="py-4 px-4 text-gray-900 dark:text-white text-sm">
                        {new Date(transaction.date).toLocaleDateString('pl-PL')}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white text-sm">
                        {transaction.source}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-900 dark:text-white font-bold">
                        {transaction.amount.toLocaleString('pl-PL')} zł
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        {transaction.notes || '-'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {transaction.tags && transaction.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {transaction.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs flex items-center gap-1"
                              >
                                <Tag size={10} />
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setIncomeForm(transaction);
                              setShowIncomeModal(true);
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                            title="Edytuj"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteIncome(transaction.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            title="Usuń"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'expenses' && (
        <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Wydatki {selectedYear}
            </h2>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2"
            >
              <Plus size={18} />
              Dodaj wydatek
            </button>
          </div>

          {/* Filtry wydatków */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase">Filtry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <CustomSelect
                label="Kategoria"
                value={expenseFilters.category}
                onChange={(val) => setExpenseFilters({...expenseFilters, category: val})}
                options={[
                  { value: '', label: 'Wszystkie' },
                  ...budgetCategories
                ]}
                placeholder="Wszystkie"
              />
              <CustomSelect
                label="Kontrahent"
                value={expenseFilters.contractor}
                onChange={(val) => setExpenseFilters({...expenseFilters, contractor: val})}
                options={[
                  { value: '', label: 'Wszystkie' },
                  ...uniqueExpenseContractors.map(c => ({ value: c, label: c }))
                ]}
                placeholder="Wszystkie"
              />
              <CustomSelect
                label="Osoba odpowiedzialna"
                value={expenseFilters.responsible}
                onChange={(val) => setExpenseFilters({...expenseFilters, responsible: val})}
                options={[
                  { value: '', label: 'Wszystkie' },
                  ...uniqueExpenseResponsible.map(r => ({ value: r, label: r }))
                ]}
                placeholder="Wszystkie"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <CustomSelect
                label="Tag"
                value={expenseFilters.tag}
                onChange={(val) => setExpenseFilters({...expenseFilters, tag: val})}
                options={[
                  { value: '', label: 'Wszystkie' },
                  ...uniqueExpenseTags.map(t => ({ value: t, label: t }))
                ]}
                placeholder="Wszystkie"
              />
              <CustomDatePicker
                label="Data od"
                value={expenseFilters.dateFrom}
                onChange={(val) => setExpenseFilters({...expenseFilters, dateFrom: val})}
              />
              <CustomDatePicker
                label="Data do"
                value={expenseFilters.dateTo}
                onChange={(val) => setExpenseFilters({...expenseFilters, dateTo: val})}
              />
            </div>
            {(expenseFilters.category || expenseFilters.contractor || expenseFilters.responsible || expenseFilters.tag || expenseFilters.dateFrom || expenseFilters.dateTo) && (
              <button
                onClick={() => setExpenseFilters({ category: '', contractor: '', responsible: '', tag: '', dateFrom: '', dateTo: '' })}
                className="mt-3 text-sm text-pink-600 dark:text-pink-400 hover:underline"
              >
                Wyczyść filtry
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Ładowanie...
            </div>
          ) : filteredExpenseTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {expenseTransactions.length === 0 ? `Brak wydatków na rok ${selectedYear}` : 'Brak wydatków pasujących do filtrów'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Data</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Kategoria</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Opis</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Kontrahent</th>
                    <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Kwota</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Odpowiedzialny</th>
                    <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Załączniki</th>
                    <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenseTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <td className="py-4 px-4 text-gray-900 dark:text-white text-sm">
                        {new Date(transaction.payment_date).toLocaleDateString('pl-PL')}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white text-sm">
                        {transaction.description || '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        {transaction.contractor}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-900 dark:text-white font-bold">
                        {transaction.amount.toLocaleString('pl-PL')} zł
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        {transaction.responsible_person}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {transaction.documents && transaction.documents.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {transaction.documents.map((doc, idx) => (
                              <a
                                key={idx}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 justify-center"
                              >
                                <FileText size={12} />
                                {doc.name}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setExpenseForm(transaction);
                              setShowExpenseModal(true);
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                            title="Edytuj"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteExpense(transaction.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            title="Usuń"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* MODAL: Budget Item */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/20 dark:border-gray-700">
            <div className="flex justify-between mb-6">
              <h3 className="font-bold text-xl text-gray-800 dark:text-white">Nowa pozycja budżetowa</h3>
              <button onClick={() => setShowBudgetModal(false)} className="text-gray-500 dark:text-gray-400">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <CustomSelect
                label="Kategoria (Służba)"
                value={budgetForm.category}
                onChange={(val) => setBudgetForm({...budgetForm, category: val})}
                options={[
                  { value: 'Grupa Uwielbienia', label: 'Grupa Uwielbienia' },
                  { value: 'MediaTeam', label: 'MediaTeam' },
                  { value: 'Grupy domowe', label: 'Grupy domowe' },
                  { value: 'małe schWro', label: 'małe schWro' },
                  { value: 'AtmosferaTeam', label: 'AtmosferaTeam' }
                ]}
                placeholder="Wybierz służbę"
              />
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Opis</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  value={budgetForm.description}
                  onChange={(e) => setBudgetForm({...budgetForm, description: e.target.value})}
                  placeholder="Opis kosztów"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Planowana kwota (PLN)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={budgetForm.planned_amount}
                  onChange={(e) => setBudgetForm({...budgetForm, planned_amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Anuluj
                </button>
                <button
                  onClick={saveBudgetItem}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition font-medium"
                >
                  Zapisz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Income */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/20 dark:border-gray-700">
            <div className="flex justify-between mb-6">
              <h3 className="font-bold text-xl text-gray-800 dark:text-white">Nowy wpływ</h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-gray-500 dark:text-gray-400">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <CustomDatePicker
                label="Data wpływu"
                value={incomeForm.date}
                onChange={(val) => setIncomeForm({...incomeForm, date: val})}
              />
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Kwota (PLN)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({...incomeForm, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <CustomSelect
                label="Typ wpływu"
                value={incomeForm.type}
                onChange={(val) => setIncomeForm({...incomeForm, type: val})}
                options={[
                  { value: 'Kolekta', label: 'Kolekta' },
                  { value: 'Darowizny', label: 'Darowizny' },
                  { value: 'Inne', label: 'Inne' }
                ]}
              />
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Źródło</label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={incomeForm.source}
                  onChange={(e) => setIncomeForm({...incomeForm, source: e.target.value})}
                  placeholder="np. Kolekta niedzielna"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Notatka</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  rows={2}
                  value={incomeForm.notes}
                  onChange={(e) => setIncomeForm({...incomeForm, notes: e.target.value})}
                  placeholder="Dodatkowe informacje"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Tagi</label>
                <div className="flex gap-2 mb-2">
                  <input
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Dodaj tag"
                    onKeyPress={(e) => e.key === 'Enter' && addTag(incomeForm, setIncomeForm)}
                  />
                  <button
                    onClick={() => addTag(incomeForm, setIncomeForm)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {incomeForm.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-lg text-xs flex items-center gap-1"
                    >
                      <Tag size={12} />
                      {tag}
                      <button onClick={() => removeTag(tag, incomeForm, setIncomeForm)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowIncomeModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Anuluj
                </button>
                <button
                  onClick={saveIncome}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition font-medium"
                >
                  Zapisz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl p-6 border border-white/20 dark:border-gray-700 my-8">
            <div className="flex justify-between mb-6">
              <h3 className="font-bold text-xl text-gray-800 dark:text-white">Nowy wydatek</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-gray-500 dark:text-gray-400">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {/* Wiersz 1: Data i Kwota */}
              <div className="grid grid-cols-2 gap-4">
                <CustomDatePicker
                  label="Data dokumentu"
                  value={expenseForm.payment_date}
                  onChange={(val) => setExpenseForm({...expenseForm, payment_date: val})}
                />
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Kwota (PLN)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Wiersz 2: Kontrahent i Osoba odpowiedzialna */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Kontrahent</label>
                  <input
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    value={expenseForm.contractor}
                    onChange={(e) => setExpenseForm({...expenseForm, contractor: e.target.value})}
                    placeholder="Nazwa firmy/osoby"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Osoba odpowiedzialna</label>
                  <input
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    value={expenseForm.responsible_person}
                    onChange={(e) => setExpenseForm({...expenseForm, responsible_person: e.target.value})}
                    placeholder="Imię i nazwisko"
                  />
                </div>
              </div>

              {/* Wiersz 3: Kategoria i Opis kosztu */}
              <div className="grid grid-cols-2 gap-4">
                <CustomSelect
                  label="Kategoria (powiązana z budżetem)"
                  value={expenseForm.category}
                  onChange={(val) => setExpenseForm({...expenseForm, category: val, description: ''})}
                  options={budgetCategories.length > 0 ? budgetCategories : [{ value: '', label: 'Najpierw dodaj pozycje budżetowe' }]}
                  placeholder="Wybierz kategorię"
                />
                {expenseForm.category && (
                  <CustomSelect
                    label="Opis kosztu (z budżetu)"
                    value={expenseForm.description}
                    onChange={(val) => setExpenseForm({...expenseForm, description: val})}
                    options={budgetItems
                      .filter(item => item.category === expenseForm.category)
                      .map(item => ({ value: item.description, label: item.description }))}
                    placeholder="Wybierz opis kosztu"
                  />
                )}
              </div>

              {/* Wiersz 4: Szczegółowy opis (pełna szerokość) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Szczegółowy opis</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  rows={2}
                  value={expenseForm.detailed_description}
                  onChange={(e) => setExpenseForm({...expenseForm, detailed_description: e.target.value})}
                  placeholder="Dodatkowe informacje o wydatku..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Załączniki (opcjonalnie)</label>
                <div className="space-y-2">
                  <label className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer hover:border-pink-300 dark:hover:border-pink-600 transition flex items-center gap-2">
                    <Upload size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {uploadingFile ? 'Przesyłanie...' : 'Dodaj plik(i)'}
                    </span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                      disabled={uploadingFile}
                      multiple
                    />
                  </label>
                  {expenseForm.documents && expenseForm.documents.length > 0 && (
                    <div className="space-y-2">
                      {expenseForm.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                          <span className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1 truncate">
                            <FileText size={14} />
                            {doc.name}
                          </span>
                          <button
                            onClick={() => removeDocument(idx)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 ml-2 flex-shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Tagi</label>
                <div className="flex gap-2 mb-2">
                  <input
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Dodaj tag"
                    onKeyPress={(e) => e.key === 'Enter' && addTag(expenseForm, setExpenseForm)}
                  />
                  <button
                    onClick={() => addTag(expenseForm, setExpenseForm)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {expenseForm.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-lg text-xs flex items-center gap-1"
                    >
                      <Tag size={12} />
                      {tag}
                      <button onClick={() => removeTag(tag, expenseForm, setExpenseForm)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Anuluj
                </button>
                <button
                  onClick={saveExpense}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition font-medium"
                >
                  Zapisz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceModule;
