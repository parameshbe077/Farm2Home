import { useToast } from '../context/ToastContext';

export default function Toast() {
  const { message, visible } = useToast();
  return (
    <div className={`toast ${visible ? 'show' : ''}`}>{message}</div>
  );
}
