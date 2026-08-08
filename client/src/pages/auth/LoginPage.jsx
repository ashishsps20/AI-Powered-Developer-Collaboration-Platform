import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  AuthLayout,
  FormField,
  FormAlert,
  SubmitButton,
  inputClassName,
} from '../../components/layout/AuthLayout';
import { loginSchema } from '../../lib/schemas';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await login(values);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your DevCollab workspace"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormAlert message={serverError} />

        <FormField label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            className={inputClassName(!!errors.email)}
            placeholder="you@company.com"
            {...register('email')}
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            className={inputClassName(!!errors.password)}
            placeholder="••••••••"
            {...register('password')}
          />
        </FormField>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Forgot password?
          </Link>
        </div>

        <SubmitButton loading={isSubmitting}>Sign in</SubmitButton>
      </form>
    </AuthLayout>
  );
}
