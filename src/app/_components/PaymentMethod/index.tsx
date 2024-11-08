interface PaymentMethodRadioProps {
  label: string;
  icon: React.ReactNode;
  value: 'stripe' | 'paypal'; // Make sure the value is of the correct type
  selectedPaymentMethod: 'stripe' | 'paypal'; // Same here
  onChange: (value: 'stripe' | 'paypal') => void; // Update onChange type
}

const PaymentMethodRadio: React.FC<PaymentMethodRadioProps> = ({
  label,
  icon,
  value,
  selectedPaymentMethod,
  onChange,
}) => {
  return (
    <label className='flex items-center gap-3'>
      <input
        type='radio'
        name='paymentMethod'
        value={value}
        checked={selectedPaymentMethod === value}
        onChange={() => onChange(value)}
        className='w-5 h-5'
      />
      <span className='flex items-center gap-2'>
        {icon}
        <span>{label}</span>
      </span>
    </label>
  );
};

export default PaymentMethodRadio;