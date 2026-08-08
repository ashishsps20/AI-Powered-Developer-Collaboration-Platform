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
import { registerSchema } from '../../lib/schemas';
import { useAuthStore } from '../../store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'DEVELOPER',
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await registerUser(values);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join DevCollab and start collaborating"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormAlert message={serverError} />

        <FormField label="Full name" error={errors.name?.message}>
          <input
            type="text"
            autoComplete="name"
            className={inputClassName(!!errors.name)}
            placeholder="Ashish Kumar"
            {...register('name')}
          />
        </FormField>

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
            autoComplete="new-password"
            className={inputClassName(!!errors.password)}
            placeholder="At least 8 characters"
            {...register('password')}
          />
        </FormField>

        <FormField label="I am a" error={errors.role?.message}>
          <select
            className={inputClassName(!!errors.role)}
            {...register('role')}
          >
            <option value="DEVELOPER">Developer</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
          </select>
        </FormField>

        <p className="text-xs text-slate-500">
          The first registered user becomes platform admin. Admin role cannot be self-assigned
          afterward.
        </p>

        <SubmitButton loading={isSubmitting}>Create account</SubmitButton>
      </form>
    </AuthLayout>
  );
}
