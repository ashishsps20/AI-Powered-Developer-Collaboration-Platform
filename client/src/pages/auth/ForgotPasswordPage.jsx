import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../../lib/api';
import {
  AuthLayout,
  FormField,
  FormAlert,
  FormSuccess,
  SubmitButton,
  inputClassName,
} from '../../components/layout/AuthLayout';
import { forgotPasswordSchema } from '../../lib/schemas';

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    setSuccessMessage('');
    try {
      const { data } = await api.post('/auth/forgot-password', values);
      setSuccessMessage(data.data.message);
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="We will send reset instructions when email is configured"
      footer={
        <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormAlert message={serverError} />
        <FormSuccess message={successMessage} />

        <FormField label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            className={inputClassName(!!errors.email)}
            placeholder="you@company.com"
            {...register('email')}
          />
        </FormField>

        <SubmitButton loading={isSubmitting}>Send reset link</SubmitButton>
      </form>
    </AuthLayout>
  );
}
