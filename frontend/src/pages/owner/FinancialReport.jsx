import { useState, useEffect, useCallback } from "react";
import ownerService from "../../services/ownerService";
import FilterSection from "./financial-report/FilterSection";
import SummarySection from "./financial-report/SummarySection";
import BreakdownSection from "./financial-report/BreakdownSection";
import StockSummarySection from "./financial-report/StockSummarySection";
import DetailTableSection from "./financial-report/DetailTableSection";

const FinancialReport = () => {
  // ==================== STATE ====================
  const [filters, setFilters] = useState({
    period: "monthly",
    start_date: "",
    end_date: "",
  });
  const [page, setPage] = useState(1);

  const [summaryData, setSummaryData] = useState(null);
  const [breakdownData, setBreakdownData] = useState(null);
  const [transactionsData, setTransactionsData] = useState([]);
  const [transactionsMeta, setTransactionsMeta] = useState(null);
  const [stockData, setStockData] = useState(null);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ==================== HELPERS ====================

  const buildParams = useCallback(
    (extraParams = {}) => {
      const params = { period: filters.period };
      if (filters.period === "custom") {
        if (filters.start_date) params.start_date = filters.start_date;
        if (filters.end_date) params.end_date = filters.end_date;
      }
      return { ...params, ...extraParams };
    },
    [filters],
  );

  // ==================== FETCH FUNCTIONS ====================

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await ownerService.getReportSummary(buildParams());
      if (res.success) setSummaryData(res.data);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    } finally {
      setLoadingSummary(false);
    }
  }, [buildParams]);

  const fetchBreakdown = useCallback(async () => {
    setLoadingBreakdown(true);
    try {
      const res = await ownerService.getReportBreakdown(buildParams());
      if (res.success) setBreakdownData(res.data);
    } catch (err) {
      console.error("Failed to fetch breakdown:", err);
    } finally {
      setLoadingBreakdown(false);
    }
  }, [buildParams]);

  const fetchTransactions = useCallback(
    async (targetPage = 1) => {
      setLoadingTransactions(true);
      try {
        const res = await ownerService.getReportTransactions(
          buildParams({ page: targetPage, per_page: 10 }),
        );
        if (res.success) {
          setTransactionsData(res.data || []);
          setTransactionsMeta(res.meta || null);
        }
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      } finally {
        setLoadingTransactions(false);
      }
    },
    [buildParams],
  );

  const fetchStock = useCallback(async () => {
    setLoadingStock(true);
    try {
      const res = await ownerService.getReportStockSummary(buildParams());
      if (res.success) setStockData(res.data);
    } catch (err) {
      console.error("Failed to fetch stock summary:", err);
    } finally {
      setLoadingStock(false);
    }
  }, [buildParams]);

  // ==================== FETCH ALL ====================

  const fetchAll = useCallback(() => {
    fetchSummary();
    fetchBreakdown();
    fetchTransactions(1);
    fetchStock();
  }, [fetchSummary, fetchBreakdown, fetchTransactions, fetchStock]);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (
      filters.period === "custom" &&
      (!filters.start_date || !filters.end_date)
    ) {
      return;
    }
    setPage(1);
    fetchAll();
  }, [filters, fetchAll]);

  // ==================== HANDLERS ====================

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchTransactions(newPage);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await ownerService.exportReportExcel(buildParams());
    } catch (err) {
      console.error("Failed to export Excel:", err);
    } finally {
      setExporting(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Laporan Keuangan
      </h1>

      <FilterSection filters={filters} onFilterChange={handleFilterChange} />

      <SummarySection data={summaryData} loading={loadingSummary} />

      <BreakdownSection data={breakdownData} loading={loadingBreakdown} />

      <StockSummarySection data={stockData} loading={loadingStock} />

      <DetailTableSection
        key={`${filters.period}-${filters.start_date}-${filters.end_date}-${page}`}
        data={transactionsData}
        meta={transactionsMeta}
        loading={loadingTransactions}
        page={page}
        onPageChange={handlePageChange}
        onExport={handleExport}
        exporting={exporting}
      />
    </div>
  );
};

export default FinancialReport;
