'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import type {
  BuyerAnswerSet,
  BuyerQuestionDefsByLine,
} from '../../../utilities/buyerQuestions';
import {
  areTicketBuyerAnswersComplete,
  cartLinesMissingBuyerQuestionMetadata,
  syncTicketBuyerAnswersWithCart,
} from '../../../utilities/checkoutCart';

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  customerNotes: string;
}

export type TicketBuyerAnswersState = Record<string, BuyerAnswerSet[]>;

interface CheckoutContextType {
  customerData: CustomerData | null;
  setCustomerData: (data: CustomerData | null) => void;
  clearCustomerData: () => void;
  hasCustomerData: () => boolean;
  ticketBuyerAnswers: TicketBuyerAnswersState;
  setTicketBuyerAnswers: (answers: TicketBuyerAnswersState) => void;
  syncTicketBuyerAnswersForCart: (
    cartDetails: Record<
      string,
      | {
          quantity?: number;
          product_data?: { metadata?: Record<string, unknown> };
        }
      | undefined
    > | null,
  ) => void;
  updateTicketBuyerAnswer: (
    lineId: string,
    unitIndex: number,
    key: string,
    label: string,
    value: string,
  ) => void;
  areTicketBuyerAnswersCompleteForCart: (
    cartDetails: Record<
      string,
      | {
          quantity?: number;
          product_data?: { metadata?: Record<string, unknown> };
        }
      | undefined
    > | null,
  ) => boolean;
  buyerQuestionDefsByLine: BuyerQuestionDefsByLine;
  hydrateBuyerQuestionsForCart: (
    cartDetails: Record<
      string,
      | {
          quantity?: number;
          product_data?: { metadata?: Record<string, unknown> };
        }
      | undefined
    > | null,
  ) => Promise<void>;
  isHydratingBuyerQuestions: boolean;
  clearTicketBuyerAnswers: () => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(
  undefined,
);

const defaultCustomerData: CustomerData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  postalCode: '',
  country: '',
  customerNotes: '',
};

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [customerData, setCustomerDataState] = useState<CustomerData | null>(
    null,
  );
  const [ticketBuyerAnswers, setTicketBuyerAnswersState] =
    useState<TicketBuyerAnswersState>({});
  const [buyerQuestionDefsByLine, setBuyerQuestionDefsByLine] =
    useState<BuyerQuestionDefsByLine>({});
  const [isHydratingBuyerQuestions, setIsHydratingBuyerQuestions] =
    useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('checkoutCustomerData');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        if (
          parsedData &&
          typeof parsedData === 'object' &&
          parsedData.firstName !== undefined
        ) {
          setCustomerDataState(parsedData);
        }
      } catch (error) {
        console.error('Error parsing saved customer data:', error);
        localStorage.removeItem('checkoutCustomerData');
      }
    }

    const savedAnswers = sessionStorage.getItem('ticketBuyerAnswers');
    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);
        if (parsed && typeof parsed === 'object') {
          setTicketBuyerAnswersState(parsed);
        }
      } catch {
        sessionStorage.removeItem('ticketBuyerAnswers');
      }
    }
  }, []);

  useEffect(() => {
    if (customerData) {
      localStorage.setItem(
        'checkoutCustomerData',
        JSON.stringify(customerData),
      );
    } else {
      localStorage.removeItem('checkoutCustomerData');
    }
  }, [customerData]);

  useEffect(() => {
    if (Object.keys(ticketBuyerAnswers).length > 0) {
      sessionStorage.setItem(
        'ticketBuyerAnswers',
        JSON.stringify(ticketBuyerAnswers),
      );
    } else {
      sessionStorage.removeItem('ticketBuyerAnswers');
    }
  }, [ticketBuyerAnswers]);

  const setCustomerData = (data: CustomerData | null) => {
    setCustomerDataState(data);
  };

  const clearCustomerData = () => {
    setCustomerDataState(null);
    localStorage.removeItem('checkoutCustomerData');
  };

  const hasCustomerData = () => {
    return (
      customerData !== null &&
      customerData.firstName !== '' &&
      customerData.email !== ''
    );
  };

  const setTicketBuyerAnswers = (answers: TicketBuyerAnswersState) => {
    setTicketBuyerAnswersState(answers);
  };

  const syncTicketBuyerAnswersForCart = useCallback(
    (
      cartDetails: Record<
        string,
        | {
            quantity?: number;
            product_data?: { metadata?: Record<string, unknown> };
          }
        | undefined
      > | null,
    ) => {
      setTicketBuyerAnswersState((prev) =>
        syncTicketBuyerAnswersWithCart(
          cartDetails,
          prev,
          buyerQuestionDefsByLine,
        ),
      );
    },
    [buyerQuestionDefsByLine],
  );

  const updateTicketBuyerAnswer = (
    lineId: string,
    unitIndex: number,
    key: string,
    label: string,
    value: string,
  ) => {
    setTicketBuyerAnswersState((prev) => {
      const lineSets = [...(prev[lineId] || [])];
      while (lineSets.length <= unitIndex) {
        lineSets.push([]);
      }
      const unitSet = [...(lineSets[unitIndex] || [])];
      const idx = unitSet.findIndex((e) => e.key === key);
      const entry = { key, label, value };
      if (idx >= 0) unitSet[idx] = entry;
      else unitSet.push(entry);
      lineSets[unitIndex] = unitSet;
      return { ...prev, [lineId]: lineSets };
    });
  };

  const areTicketBuyerAnswersCompleteForCart = useCallback(
    (
      cartDetails: Record<
        string,
        | {
            quantity?: number;
            product_data?: { metadata?: Record<string, unknown> };
          }
        | undefined
      > | null,
    ) =>
      areTicketBuyerAnswersComplete(
        cartDetails,
        ticketBuyerAnswers,
        buyerQuestionDefsByLine,
      ),
    [ticketBuyerAnswers, buyerQuestionDefsByLine],
  );

  const hydrateBuyerQuestionsForCart = useCallback(
    async (
      cartDetails: Record<
        string,
        | {
            quantity?: number;
            product_data?: { metadata?: Record<string, unknown> };
          }
        | undefined
      > | null,
    ) => {
      const lines = cartLinesMissingBuyerQuestionMetadata(
        cartDetails,
        buyerQuestionDefsByLine,
      );
      if (lines.length === 0) return;

      setIsHydratingBuyerQuestions(true);
      try {
        const res = await fetch('/api/checkout/ticket-buyer-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lines }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          questionsByLineId?: BuyerQuestionDefsByLine;
        };
        if (data.questionsByLineId) {
          setBuyerQuestionDefsByLine((prev) => ({
            ...prev,
            ...data.questionsByLineId,
          }));
        }
      } finally {
        setIsHydratingBuyerQuestions(false);
      }
    },
    [buyerQuestionDefsByLine],
  );

  const clearTicketBuyerAnswers = () => {
    setTicketBuyerAnswersState({});
    setBuyerQuestionDefsByLine({});
    sessionStorage.removeItem('ticketBuyerAnswers');
  };

  return (
    <CheckoutContext.Provider
      value={{
        customerData,
        setCustomerData,
        clearCustomerData,
        hasCustomerData,
        ticketBuyerAnswers,
        setTicketBuyerAnswers,
        syncTicketBuyerAnswersForCart,
        updateTicketBuyerAnswer,
        areTicketBuyerAnswersCompleteForCart,
        buyerQuestionDefsByLine,
        hydrateBuyerQuestionsForCart,
        isHydratingBuyerQuestions,
        clearTicketBuyerAnswers,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}

export { defaultCustomerData };
