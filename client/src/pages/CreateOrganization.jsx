import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import useOrgStore from '../store/orgStore';

const CreateOrganization = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { createOrganization } = useOrgStore();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [serverError, setServerError] = useState(null);

  const onSubmit = async (data) => {
    setIsCreating(true);
    setServerError(null);

    try {
      const response = await createOrganization(data);
      // Navigate to the newly created org dashboard
      navigate(`/app/org/${response.organization.id}/dashboard`);
    } catch (error) {
      if (error.message) {
        setServerError(error.message);
      } else {
        setServerError('An unexpected error occurred.');
      }
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create Organization
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Set up a workspace for your team
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {serverError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                id="name"
                type="text"
                {...register('name', { 
                  required: 'Organization name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  maxLength: { value: 100, message: 'Name cannot exceed 100 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="description"
                rows="3"
                {...register('description', {
                  maxLength: { value: 500, message: 'Description cannot exceed 500 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            <div className="flex flex-col space-y-3">
              <button
                type="submit"
                disabled={isCreating}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating organization...' : 'Create Organization'}
              </button>
              
              <Link
                to="/onboarding"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrganization;
