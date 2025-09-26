import React, { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchTransactions } from "@/store/transactionSlice";
import api from "@/lib/axios";

const useTransactions = () => {
  const dispatch = useDispatch();
  const { items: transactions, loading, error } = useSelector((state) => state.transactions);
  const [hasFetched, setHasFetched] = React.useState(false);

  const fetchTransactionsData = useCallback(async (force = false) => {
    if (hasFetched && !force) return; // Shmang kërkesat e përsëritura, por lejo force refresh
    try {
      setHasFetched(true);
      await dispatch(fetchTransactions());
    } catch (error) {
      setHasFetched(false); // Reset nëse ka gabim
      console.error("Gabim gjatë marrjes së transaksioneve:", error);
    }
  }, [dispatch, hasFetched]);

  const refetch = useCallback(() => {
    setHasFetched(false); // Reset për të lejuar refetch
    fetchTransactionsData(true);
  }, [fetchTransactionsData]);

  useEffect(() => {
    // Vetëm nëse nuk ka transaksione të ngarkuara dhe nuk po ngarkohet
    if (transactions.length === 0 && !loading && !hasFetched) {
      fetchTransactionsData();
    }
  }, [transactions.length, loading, hasFetched, fetchTransactionsData]);

  return { 
    transactions, 
    loading, 
    error, 
    refetch 
  };
};

export default useTransactions;
